import SwiftUI
import WatchConnectivity

/// watchOS 端 WatchConnectivity 管理器（ObservableObject 供 SwiftUI 使用）
///
/// 职责：
/// - 通过 WCSession.applicationContext 接收 iPhone 推送的计时器状态
/// - 手表"结束休息"按钮 → 发送 finishRest 指令回 iPhone（sendMessage，需要可达）
/// - 内置原生计时器，每秒刷新剩余时间，不依赖 SwiftUI Timer.publish（避免后台挂起）
final class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {

    static let shared = WatchSessionManager()

    // 手表 UI 状态
    @Published var activeTimer: WatchTimerState?
    @Published var isConnected = false

    /// 每秒刷新一次剩余时间，驱动 SwiftUI 更新
    private var countdownTimer: Timer?

    struct WatchTimerState: Equatable {
        let exerciseId: String
        let exerciseName: String
        let duration: Double
        let endDate: Date

        /// 基于当前时间实时计算剩余秒数
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
            print("⚡️ [Watch] WCSession 不支持")
            return
        }
        let session = WCSession.default
        session.delegate = self
        session.activate()
        print("⚡️ [Watch] WCSession activate() 已调用")
    }

    // MARK: - 发送到 iPhone

    /// 手表点击"结束休息"
    func requestFinishRest() {
        guard let timer = activeTimer else { return }
        send(["type": "finishRest", "exerciseId": timer.exerciseId])
    }

    /// 手表请求同步当前状态（仅在 iPhone 可达时使用；Application Context 会自己到达）
    func requestStateSync() {
        // 优先读取已缓存的 Application Context
        let context = WCSession.default.receivedApplicationContext
        if !(context["timers"] as? [[String: Any]] ?? []).isEmpty {
            print("⚡️ [Watch] requestStateSync 使用已缓存 context")
            DispatchQueue.main.async {
                self.applyContext(context)
            }
            return
        }
        // 没有缓存且 iPhone 可达时才尝试主动请求
        guard WCSession.default.isReachable else {
            print("⚡️ [Watch] requestStateSync: context 为空且 iPhone 不可达，等待 Application Context")
            return
        }
        send(["type": "getState"])
    }

    private func send(_ message: [String: Any]) {
        guard WCSession.default.isReachable else {
            print("⚡️ [Watch] iPhone 当前不可达，跳过 sendMessage")
            return
        }
        WCSession.default.sendMessage(message, replyHandler: nil) { error in
            print("⚡️ [Watch] 发送失败: \(error.localizedDescription)")
        }
    }

    // MARK: - 接收来自 iPhone

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            print("⚡️ [Watch] 收到 applicationContext，timers=\((applicationContext["timers"] as? [[String: Any]])?.count ?? 0)")
            self.applyContext(applicationContext)
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            guard let type = message["type"] as? String else { return }
            switch type {
            case "stateSync":
                print("⚡️ [Watch] 收到 stateSync 消息")
                self.applyContext(message)
            default:
                break
            }
        }
    }

    private func applyContext(_ context: [String: Any]) {
        guard let timers = context["timers"] as? [[String: Any]], !timers.isEmpty else {
            print("⚡️ [Watch] applyContext: timers 为空，清空 activeTimer")
            stopCountdown()
            self.activeTimer = nil
            return
        }
        // 取第一个活跃计时器显示（目前业务场景下通常只有一个休息计时器）
        let timer = timers.first ?? [:]
        let endDateTimestamp = timer["endDate"] as? TimeInterval ?? Date().addingTimeInterval(90).timeIntervalSince1970
        let state = WatchTimerState(
            exerciseId: timer["exerciseId"] as? String ?? "",
            exerciseName: timer["exerciseName"] as? String ?? "休息",
            duration: timer["duration"] as? Double ?? 90,
            endDate: Date(timeIntervalSince1970: endDateTimestamp)
        )
        print("⚡️ [Watch] applyContext: 设置 activeTimer=\(state.exerciseName), endDate=\(state.endDate), remaining=\(state.remaining)")

        // 如果计时器已结束，直接清空
        if state.remaining <= 0 {
            stopCountdown()
            self.activeTimer = nil
            return
        }

        self.activeTimer = state
        startCountdown()
    }

    // MARK: - 原生倒计时驱动

    private func startCountdown() {
        stopCountdown()
        // 使用 Foundation Timer，在主 RunLoop 的 commonModes 下运行，SwiftUI 会随 @Published 更新
        countdownTimer = Timer(timeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self, let current = self.activeTimer else { return }
            let remaining = current.remaining
            if remaining <= 0 {
                // 计时结束，清空状态并停止计时器
                DispatchQueue.main.async {
                    self.stopCountdown()
                    self.activeTimer = nil
                }
            } else {
                // 触发 @Published 刷新（endDate 不变，但 remaining 计算属性会随时间变化）
                // 通过重新赋值同一个值来强制 objectWillChange 发送
                DispatchQueue.main.async {
                    self.activeTimer = current
                }
            }
        }
        RunLoop.main.add(countdownTimer!, forMode: .common)
    }

    private func stopCountdown() {
        countdownTimer?.invalidate()
        countdownTimer = nil
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isConnected = activationState == .activated
            if activationState == .activated {
                print("⚡️ [Watch] WCSession 激活完成，reachable=\(session.isReachable)")
                // 激活后立即读取缓存的 Application Context
                let context = session.receivedApplicationContext
                print("⚡️ [Watch] 激活后缓存 context timers=\((context["timers"] as? [[String: Any]])?.count ?? 0)")
                self.applyContext(context)
            } else if let error = error {
                print("⚡️ [Watch] WCSession 激活失败: \(error.localizedDescription)")
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
            print("⚡️ [Watch] reachable 变化: \(session.isReachable)")
            // iPhone 重新变为可达且当前没有计时数据时，主动请求一次
            if session.isReachable && self.activeTimer == nil {
                self.requestStateSync()
            }
        }
    }
}
