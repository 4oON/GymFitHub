import SwiftUI
import WatchConnectivity
import WatchKit
import UserNotifications
import WidgetKit

/// Shared App Group ID for Watch App ↔ Widget data sharing
private let appGroupID = "group.com.gymfithub.app.timer"

/// watchOS WatchConnectivity manager (ObservableObject for SwiftUI)
///
/// Responsibilities:
/// - Receive timer state pushed from iPhone via WCSession.applicationContext
/// - Send "finish rest" command back to iPhone (sendMessage, requires reachable)
/// - Built-in native timer refreshes remaining time every second, independent of SwiftUI Timer.publish
/// - Haptic feedback when timer finishes
/// - Write timer state to App Group UserDefaults for Widget to read
final class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate, WKExtendedRuntimeSessionDelegate {

    static let shared = WatchSessionManager()

    // Watch UI state
    @Published var activeTimers: [WatchTimerState] = []
    @Published var isConnected = false

    /// Refresh remaining time every second to drive SwiftUI updates
    private var countdownTimer: Timer?

    /// Track which timers have already played haptic to avoid duplicates
    private var hapticPlayedFor: Set<String> = []

    /// Extended runtime session to keep app alive in background
    private var extendedRuntimeSession: WKExtendedRuntimeSession?

    struct WatchTimerState: Equatable, Identifiable {
        let exerciseId: String
        let exerciseName: String
        let duration: Double
        let endDate: Date

        var id: String { exerciseId }

        /// Compute remaining seconds based on current time
        var remaining: Int {
            max(0, Int(ceil(endDate.timeIntervalSinceNow)))
        }

        static func == (lhs: WatchTimerState, rhs: WatchTimerState) -> Bool {
            lhs.exerciseId == rhs.exerciseId &&
            lhs.exerciseName == rhs.exerciseName &&
            lhs.duration == rhs.duration &&
            lhs.endDate == rhs.endDate
        }
    }

    private override init() {
        super.init()
        activate()
        requestNotificationPermission()
    }

    /// Request local notification permission for timer completion alerts
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
            if let error = error {
                print("⚡️ [Watch] Notification permission error: \(error.localizedDescription)")
            } else {
                print("⚡️ [Watch] Notification permission granted: \(granted)")
            }
        }
    }

    func activate() {
        guard WCSession.isSupported() else {
            print("⚡️ [Watch] WCSession not supported")
            return
        }
        let session = WCSession.default
        session.delegate = self
        session.activate()
        print("⚡️ [Watch] WCSession activate() called")
    }

    // MARK: - Send to iPhone

    /// User taps "Done" on watch
    func requestFinishRest(exerciseId: String) {
        send(["type": "finishRest", "exerciseId": exerciseId])
    }

    /// Request state sync from iPhone (only when reachable; Application Context arrives automatically)
    func requestStateSync() {
        // Prefer cached Application Context
        let context = WCSession.default.receivedApplicationContext
        if !(context["timers"] as? [[String: Any]] ?? []).isEmpty {
            print("⚡️ [Watch] requestStateSync using cached context")
            DispatchQueue.main.async {
                self.applyContext(context)
            }
            return
        }
        // Only actively request when no cache and iPhone is reachable
        guard WCSession.default.isReachable else {
            print("⚡️ [Watch] requestStateSync: context empty and iPhone unreachable, waiting for Application Context")
            return
        }
        send(["type": "getState"])
    }

    private func send(_ message: [String: Any]) {
        guard WCSession.default.isReachable else {
            print("⚡️ [Watch] iPhone currently unreachable, skipping sendMessage")
            return
        }
        WCSession.default.sendMessage(message, replyHandler: nil) { error in
            print("⚡️ [Watch] Send failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Receive from iPhone

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            print("⚡️ [Watch] Received applicationContext, timers=\((applicationContext["timers"] as? [[String: Any]])?.count ?? 0)")
            self.applyContext(applicationContext)
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            guard let type = message["type"] as? String else { return }
            switch type {
            case "stateSync":
                print("⚡️ [Watch] Received stateSync message")
                self.applyContext(message)
            case "handshakeAck":
                // iPhone App 已确认运行，握手成功
                print("⚡️ [Watch] Handshake ACK received - iPhone app is running")
                self.isConnected = true
            default:
                break
            }
        }
    }

    /// 主动与 iPhone 握手：确认手机 App 是否打开
    func sendHandshake() {
        guard WCSession.default.isReachable else {
            print("⚡️ [Watch] sendHandshake: iPhone unreachable, will retry on reachability change")
            self.isConnected = false
            return
        }
        WCSession.default.sendMessage(["type": "handshake"], replyHandler: nil) { error in
            DispatchQueue.main.async {
                self.isConnected = false
            }
            print("⚡️ [Watch] Handshake send failed: \(error.localizedDescription)")
        }
    }

    private func applyContext(_ context: [String: Any]) {
        guard let timers = context["timers"] as? [[String: Any]], !timers.isEmpty else {
            print("⚡️ [Watch] applyContext: timers empty, clearing activeTimers")
            stopCountdown()
            stopExtendedRuntimeSession()
            self.activeTimers = []
            self.hapticPlayedFor.removeAll()
            // Clear shared data for Widget
            self.saveTimersToAppGroup([])
            return
        }

        let states: [WatchTimerState] = timers.compactMap { timer in
            let endDateTimestamp = timer["endDate"] as? TimeInterval ?? Date().addingTimeInterval(90).timeIntervalSince1970
            let state = WatchTimerState(
                exerciseId: timer["exerciseId"] as? String ?? "",
                exerciseName: timer["exerciseName"] as? String ?? "Rest",
                duration: timer["duration"] as? Double ?? 90,
                endDate: Date(timeIntervalSince1970: endDateTimestamp)
            )
            // Filter out expired timers
            return state.remaining > 0 ? state : nil
        }

        print("⚡️ [Watch] applyContext: setting activeTimers count=\(states.count)")

        if states.isEmpty {
            stopCountdown()
            stopExtendedRuntimeSession()
            self.activeTimers = []
            self.hapticPlayedFor.removeAll()
            // Clear shared data for Widget
            self.saveTimersToAppGroup([])
            return
        }

        self.activeTimers = states
        // Save to App Group for Widget
        self.saveTimersToAppGroup(states)
        startCountdown()
        startExtendedRuntimeSession()
    }

    /// Write current timer states to App Group UserDefaults for Widget to read
    private func saveTimersToAppGroup(_ timers: [WatchTimerState]) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else {
            print("⚡️ [Watch] Failed to access App Group UserDefaults")
            return
        }
        let data: [[String: Any]] = timers.map { timer in
            return [
                "exerciseId": timer.exerciseId,
                "exerciseName": timer.exerciseName,
                "duration": timer.duration,
                "endDate": timer.endDate.timeIntervalSince1970
            ]
        }
        defaults.set(data, forKey: "activeTimers")
        defaults.synchronize()
        print("⚡️ [Watch] Saved \(timers.count) timers to App Group")

        // Force Widget to reload its timeline so it reads the fresh data immediately
        WidgetCenter.shared.reloadAllTimelines()
        print("⚡️ [Watch] Requested Widget timeline reload")
    }

    // MARK: - Native countdown driver

    private func startCountdown() {
        stopCountdown()
        // Use Foundation Timer on main RunLoop commonModes; SwiftUI updates via @Published
        countdownTimer = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            DispatchQueue.main.async {
                // Check each timer individually for haptic
                var updatedTimers: [WatchTimerState] = []
                for timer in self.activeTimers {
                    let remaining = timer.remaining
                    if remaining <= 0 {
                        // Play haptic for this specific timer if not already played
                        if !self.hapticPlayedFor.contains(timer.exerciseId) {
                            self.hapticPlayedFor.insert(timer.exerciseId)
                            self.playHaptic()
                            print("⚡️ [Watch] Timer expired: \(timer.exerciseName), haptic played")
                        }
                    } else {
                        updatedTimers.append(timer)
                    }
                }

                if updatedTimers.isEmpty {
                    self.stopCountdown()
                    self.stopExtendedRuntimeSession()
                    self.activeTimers = []
                    self.hapticPlayedFor.removeAll()
                    // Clear shared data for Widget
                    self.saveTimersToAppGroup([])
                } else if updatedTimers.count != self.activeTimers.count {
                    self.activeTimers = updatedTimers
                    // Update shared data for Widget when timers change
                    self.saveTimersToAppGroup(updatedTimers)
                } else {
                    // Force @Published refresh by reassigning
                    self.activeTimers = self.activeTimers
                    // Continuously update App Group so Widget reads fresh remaining time
                    self.saveTimersToAppGroup(self.activeTimers)
                }
            }
        }
        RunLoop.main.add(countdownTimer!, forMode: .common)
    }

    private func stopCountdown() {
        countdownTimer?.invalidate()
        countdownTimer = nil
    }

    /// Play haptic feedback when timer finishes
    private func playHaptic() {
        WKInterfaceDevice.current().play(.notification)
    }

    // MARK: - Extended Runtime Session

    /// Start extended runtime session to keep app running in background
    /// Use .smartAlarm session type (no special approval needed, designed for timers/alarms)
    private func startExtendedRuntimeSession() {
        guard extendedRuntimeSession == nil || extendedRuntimeSession?.state == .invalid else {
            return
        }
        let session = WKExtendedRuntimeSession()
        session.delegate = self
        // smartAlarm is designed for timer/alarm apps and doesn't require workout approval
        session.start(at: Date())
        extendedRuntimeSession = session
        print("⚡️ [Watch] Extended runtime session started")
    }

    /// Stop extended runtime session when no active timers
    private func stopExtendedRuntimeSession() {
        guard let session = extendedRuntimeSession, session.state != .invalid else {
            return
        }
        session.invalidate()
        extendedRuntimeSession = nil
        print("⚡️ [Watch] Extended runtime session stopped")
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isConnected = activationState == .activated && session.isReachable
            if activationState == .activated {
                print("⚡️ [Watch] WCSession activated, reachable=\(session.isReachable)")
                // Read cached Application Context immediately after activation
                let context = session.receivedApplicationContext
                print("⚡️ [Watch] Post-activation cached context timers=\((context["timers"] as? [[String: Any]])?.count ?? 0)")
                self.applyContext(context)
                // Actively handshake with iPhone to confirm app is running
                self.sendHandshake()
            } else if let error = error {
                print("⚡️ [Watch] WCSession activation failed: \(error.localizedDescription)")
            }
        }
    }

    #if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
    #endif

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isConnected = session.isReachable
            print("⚡️ [Watch] Reachability changed: \(session.isReachable)")
            // When iPhone becomes reachable, handshake + sync state
            if session.isReachable {
                self.sendHandshake()
                if self.activeTimers.isEmpty {
                    self.requestStateSync()
                }
            } else {
                self.isConnected = false
            }
        }
    }

    // MARK: - WKExtendedRuntimeSessionDelegate

    func extendedRuntimeSessionDidStart(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        print("⚡️ [Watch] Extended runtime session did start")
    }

    func extendedRuntimeSessionWillExpire(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        print("⚡️ [Watch] Extended runtime session will expire")
    }

    func extendedRuntimeSession(_ extendedRuntimeSession: WKExtendedRuntimeSession, didInvalidateWith reason: WKExtendedRuntimeSessionInvalidationReason, error: Error?) {
        print("⚡️ [Watch] Extended runtime session invalidated: \(reason.rawValue), error: \(String(describing: error))")
    }
}
