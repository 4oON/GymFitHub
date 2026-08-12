import Foundation
import WatchConnectivity

/// iPhone 端 WatchConnectivity 管理器
///
/// 职责：
/// - 与 watchOS App 建立会话（WCSession）
/// - 把倒计时状态（剩余秒数、动作名、总时长）实时推送到手表
/// - 接收手表发来的"结束休息"指令，转交 TimerEngine
public final class WatchSessionManager: NSObject, WCSessionDelegate {

    public static let shared = WatchSessionManager()

    /// 手表请求结束某个计时器
    public var onWatchFinishRequest: ((String) -> Void)?

    private var session: WCSession?

    private override init() {
        super.init()
    }

    /// 必须在 App 启动时调用（AppDelegate / BridgeViewController）
    public func activate() {
        guard WCSession.isSupported() else {
            print("⚡️ [WatchSession] 当前设备不支持 WatchConnectivity")
            return
        }
        let s = WCSession.default
        s.delegate = self
        s.activate()
        session = s
        print("⚡️ [WatchSession] WCSession activated, isPaired=\(s.isPaired), isWatchAppInstalled=\(s.isWatchAppInstalled)")
    }

    // MARK: - 发送到 Watch

    /// 推送单个计时器状态
    public func sendTimerState(exerciseId: String, exerciseName: String, remaining: Int, duration: Double) {
        guard let session = session, session.isReachable else { return }
        let message: [String: Any] = [
            "type": "timerState",
            "exerciseId": exerciseId,
            "exerciseName": exerciseName,
            "remaining": remaining,
            "duration": duration,
            "timestamp": Date().timeIntervalSince1970
        ]
        sendMessage(message)
    }

    /// 推送计时结束
    public func sendTimerFinished(exerciseId: String, exerciseName: String) {
        guard let session = session, session.isReachable else { return }
        let message: [String: Any] = [
            "type": "timerFinished",
            "exerciseId": exerciseId,
            "exerciseName": exerciseName,
            "timestamp": Date().timeIntervalSince1970
        ]
        sendMessage(message)
    }

    /// 推送清空状态（所有计时结束）
    public func sendAllFinished() {
        guard let session = session, session.isReachable else { return }
        sendMessage(["type": "allFinished", "timestamp": Date().timeIntervalSince1970])
    }

    private func sendMessage(_ message: [String: Any]) {
        session?.sendMessage(message, replyHandler: nil) { error in
            print("⚡️ [WatchSession] sendMessage 失败: \(error.localizedDescription)")
        }
    }

    // MARK: - 接收来自 Watch

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            guard let type = message["type"] as? String else { return }

            switch type {
            case "finishRest":
                if let exerciseId = message["exerciseId"] as? String {
                    self.onWatchFinishRequest?(exerciseId)
                }
            case "getState":
                // 手表请求当前状态：把全部计时器推过去
                for timer in TimerEngine.shared.snapshot() {
                    let id = timer["exerciseId"] as? String ?? ""
                    let name = timer["exerciseName"] as? String ?? ""
                    let remaining = timer["remaining"] as? Int ?? 0
                    let duration = timer["duration"] as? Double ?? 0
                    self.sendTimerState(exerciseId: id, exerciseName: name, remaining: remaining, duration: duration)
                }
            default:
                break
            }
        }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("⚡️ [WatchSession] 激活失败: \(error.localizedDescription)")
        } else {
            print("⚡️ [WatchSession] 激活完成: \(activationState.rawValue)")
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {
        print("⚡️ [WatchSession] 会话进入非活跃")
    }

    func sessionDidDeactivate(_ session: WCSession) {
        print("⚡️ [WatchSession] 会话失效，重新激活")
        session.activate()
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        print("⚡️ [WatchSession] 可达性变化: \(session.isReachable)")
        if session.isReachable {
            // 恢复可达后，把当前状态推送给手表
            for timer in TimerEngine.shared.snapshot() {
                let id = timer["exerciseId"] as? String ?? ""
                let name = timer["exerciseName"] as? String ?? ""
                let remaining = timer["remaining"] as? Int ?? 0
                let duration = timer["duration"] as? Double ?? 0
                self.sendTimerState(exerciseId: id, exerciseName: name, remaining: remaining, duration: duration)
            }
        }
    }
}
