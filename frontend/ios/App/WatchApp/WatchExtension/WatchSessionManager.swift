import SwiftUI
import WatchConnectivity

/// watchOS 端 WatchConnectivity 管理器（ObservableObject 供 SwiftUI 使用）
///
/// 职责：
/// - 接收 iPhone 推送的倒计时状态（timerState / timerFinished / allFinished）
/// - 手表"结束休息"按钮 → 发送 finishRest 指令回 iPhone
final class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {

    static let shared = WatchSessionManager()

    // 手表 UI 状态
    @Published var activeTimer: WatchTimerState?
    @Published var isConnected = false

    struct WatchTimerState {
        let exerciseId: String
        let exerciseName: String
        let remaining: Int
        let duration: Double
    }

    private override init() {
        super.init()
        activate()
    }

    func activate() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    // MARK: - 发送到 iPhone

    /// 手表点击"结束休息"
    func requestFinishRest() {
        guard let timer = activeTimer else { return }
        send(["type": "finishRest", "exerciseId": timer.exerciseId])
    }

    /// 手表请求同步当前状态（App 启动/回到前台时）
    func requestStateSync() {
        send(["type": "getState"])
    }

    private func send(_ message: [String: Any]) {
        guard WCSession.default.isReachable else { return }
        WCSession.default.sendMessage(message, replyHandler: nil) { error in
            print("⚡️ [Watch] 发送失败: \(error.localizedDescription)")
        }
    }

    // MARK: - 接收来自 iPhone

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            guard let type = message["type"] as? String else { return }

            switch type {
            case "timerState":
                self.activeTimer = WatchTimerState(
                    exerciseId: message["exerciseId"] as? String ?? "",
                    exerciseName: message["exerciseName"] as? String ?? "休息",
                    remaining: message["remaining"] as? Int ?? 0,
                    duration: message["duration"] as? Double ?? 90
                )
            case "timerFinished":
                self.activeTimer = nil
            case "allFinished":
                self.activeTimer = nil
            default:
                break
            }
        }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isConnected = activationState == .activated
        }
        if activationState == .activated {
            requestStateSync()
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
        }
        if session.isReachable {
            requestStateSync()
        }
    }
}
