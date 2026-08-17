import SwiftUI
import WatchConnectivity
import WatchKit

/// watchOS WatchConnectivity manager (ObservableObject for SwiftUI)
///
/// Responsibilities:
/// - Receive timer state pushed from iPhone via WCSession.applicationContext
/// - Send "finish rest" command back to iPhone (sendMessage, requires reachable)
/// - Built-in native timer refreshes remaining time every second, independent of SwiftUI Timer.publish
/// - Haptic feedback when timer finishes
final class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {

    static let shared = WatchSessionManager()

    // Watch UI state
    @Published var activeTimers: [WatchTimerState] = []
    @Published var isConnected = false

    /// Refresh remaining time every second to drive SwiftUI updates
    private var countdownTimer: Timer?

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
            default:
                break
            }
        }
    }

    private func applyContext(_ context: [String: Any]) {
        guard let timers = context["timers"] as? [[String: Any]], !timers.isEmpty else {
            print("⚡️ [Watch] applyContext: timers empty, clearing activeTimers")
            stopCountdown()
            self.activeTimers = []
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
            self.activeTimers = []
            return
        }

        self.activeTimers = states
        startCountdown()
    }

    // MARK: - Native countdown driver

    private func startCountdown() {
        stopCountdown()
        // Use Foundation Timer on main RunLoop commonModes; SwiftUI updates via @Published
        countdownTimer = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            DispatchQueue.main.async {
                // Remove expired timers
                let validTimers = self.activeTimers.filter { $0.remaining > 0 }
                if validTimers.isEmpty {
                    self.stopCountdown()
                    self.activeTimers = []
                } else if validTimers.count != self.activeTimers.count {
                    // Timer just expired - play haptic
                    self.playHaptic()
                    self.activeTimers = validTimers
                } else {
                    // Force @Published refresh by reassigning
                    self.activeTimers = self.activeTimers
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

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isConnected = activationState == .activated
            if activationState == .activated {
                print("⚡️ [Watch] WCSession activated, reachable=\(session.isReachable)")
                // Read cached Application Context immediately after activation
                let context = session.receivedApplicationContext
                print("⚡️ [Watch] Post-activation cached context timers=\((context["timers"] as? [[String: Any]])?.count ?? 0)")
                self.applyContext(context)
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
            // When iPhone becomes reachable and no timer data, actively request once
            if session.isReachable && self.activeTimers.isEmpty {
                self.requestStateSync()
            }
        }
    }
}
