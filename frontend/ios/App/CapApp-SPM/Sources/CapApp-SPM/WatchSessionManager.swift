import Foundation
import WatchConnectivity

/// iPhone 端 WatchConnectivity 管理器
///
/// 职责：
/// - 与 watchOS App 建立会话（WCSession）
/// - 通过 updateApplicationContext 把计时器状态推送到手表（不需要手表当前可达）
/// - 接收手表发来的"结束休息"指令，转交 TimerEngine
public final class WatchSessionManager: NSObject, WCSessionDelegate {

    public static let shared = WatchSessionManager()

    /// 手表请求结束某个计时器
    public var onWatchFinishRequest: ((String) -> Void)?

    private var session: WCSession?
    /// 激活完成前如果已有计时状态，先暂存，激活后立即推送
    private var pendingContext: [String: Any]?

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
        print("⚡️ [WatchSession] WCSession activate() called, isPaired=\(s.isPaired), isWatchAppInstalled=\(s.isWatchAppInstalled)")
    }

    // MARK: - 推送到 Watch

    /// 把当前所有计时器状态通过 Application Context 推送给手表。
    /// 如果会话尚未激活，会先缓存，激活成功后自动补发。
    public func pushTimerState() {
        let snapshot = TimerEngine.shared.snapshot()
        print("⚡️ [WatchSession] pushTimerState: snapshot count=\(snapshot.count)")

        let context: [String: Any] = [
            "timers": snapshot,
            "timestamp": Date().timeIntervalSince1970
        ]

        guard let session = session else {
            print("⚡️ [WatchSession] session 尚未创建，缓存 context")
            pendingContext = context
            return
        }

        guard session.activationState == .activated else {
            print("⚡️ [WatchSession] 会话未激活 (state=\(session.activationState.rawValue))，缓存 context")
            pendingContext = context
            return
        }

        do {
            try session.updateApplicationContext(context)
            print("⚡️ [WatchSession] 已推送 context，timers=\(TimerEngine.shared.snapshot().count)")
            pendingContext = nil

            // 即时通道：sendMessage 直接送达（需要手表可达），作为 context 的补充
            // 解决蓝牙/后台下 updateApplicationContext 延迟导致的同步不同步问题
            if session.isReachable {
                session.sendMessage(["type": "stateSync", "timers": snapshot, "timestamp": Date().timeIntervalSince1970], replyHandler: nil) { error in
                    print("⚡️ [WatchSession] 即时推送失败(可忽略): \(error.localizedDescription)")
                }
            }
        } catch {
            print("⚡️ [WatchSession] updateApplicationContext 失败: \(error.localizedDescription)")
        }
    }

    private func flushPendingContext() {
        guard let pending = pendingContext else { return }
        print("⚡️ [WatchSession] 激活完成，补发缓存的 context")
        do {
            try session?.updateApplicationContext(pending)
            pendingContext = nil
        } catch {
            print("⚡️ [WatchSession] 补发 context 失败: \(error.localizedDescription)")
        }
    }

    // MARK: - 接收来自 Watch

    public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            guard let type = message["type"] as? String else { return }

            switch type {
            case "finishRest":
                if let exerciseId = message["exerciseId"] as? String {
                    self.onWatchFinishRequest?(exerciseId)
                }
            case "getState":
                print("⚡️ [WatchSession] 收到手表 getState 请求，立即推送 context")
                self.pushTimerState()
                let reply: [String: Any] = [
                    "type": "stateSync",
                    "timers": TimerEngine.shared.snapshot(),
                    "timestamp": Date().timeIntervalSince1970
                ]
                session.sendMessage(reply, replyHandler: nil) { error in
                    print("⚡️ [WatchSession] 回复 getState 失败: \(error.localizedDescription)")
                }
            default:
                break
            }
        }
    }

    /// 带 replyHandler 的消息接收：只有这个方法被调用时，发送方的 replyHandler 才会执行
    /// 这是握手确认的关键 — iPhone 必须调用 replyHandler() 才能让 Watch 知道 App 真的活着
    public func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async {
            guard let type = message["type"] as? String else {
                replyHandler(["error": "missing type"])
                return
            }

            switch type {
            case "handshake":
                // 收到手表握手请求，立即回复确认 — replyHandler 被调用 = iPhone App 活着
                print("⚡️ [WatchSession] 收到手表 handshake (with replyHandler)，立即回复")
                replyHandler(["type": "handshakeAck"])
                // 顺带把当前计时状态推给刚打开的手表
                self.pushTimerState()
            case "getState":
                print("⚡️ [WatchSession] 收到手表 getState (with replyHandler)，回复 + 推送")
                let reply: [String: Any] = [
                    "type": "stateSync",
                    "timers": TimerEngine.shared.snapshot(),
                    "timestamp": Date().timeIntervalSince1970
                ]
                replyHandler(reply)
                self.pushTimerState()
            case "finishRest":
                if let exerciseId = message["exerciseId"] as? String {
                    self.onWatchFinishRequest?(exerciseId)
                }
                replyHandler(["type": "finishRestAck"])
            default:
                replyHandler(["error": "unknown type"])
            }
        }
    }

    // MARK: - WCSessionDelegate

    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("⚡️ [WatchSession] 激活失败: \(error.localizedDescription)")
        } else {
            print("⚡️ [WatchSession] 激活完成: state=\(activationState.rawValue), reachable=\(session.isReachable), watchAppInstalled=\(session.isWatchAppInstalled)")
            if activationState == .activated {
                flushPendingContext()
            }
        }
    }

    public func sessionDidBecomeInactive(_ session: WCSession) {
        print("⚡️ [WatchSession] 会话进入非活跃")
    }

    public func sessionDidDeactivate(_ session: WCSession) {
        print("⚡️ [WatchSession] 会话失效，重新激活")
        session.activate()
    }

    public func sessionReachabilityDidChange(_ session: WCSession) {
        print("⚡️ [WatchSession] 可达性变化: \(session.isReachable)")
    }
}
