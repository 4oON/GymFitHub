import Foundation
import Capacitor

/// ZenFit 计时器 Capacitor 插件
///
/// 供 Web 前端 (React) 调用原生计时引擎：
/// - startRest(exerciseId, exerciseName, duration)：启动休息计时
/// - finishRest(exerciseId)：手动结束
/// - finishAll()：结束全部
/// - getState()：查询当前所有计时器状态
/// - requestPermission()：申请通知权限
///
/// 事件（通过 PluginListener 回调 JS）：
/// - "timerTick"：每秒剩余秒数 { exerciseId, remaining }
/// - "timerFinish"：计时结束 { exerciseId, exerciseName }
@objc(WorkoutTimerPlugin)
public class WorkoutTimerPlugin: CAPPlugin, CAPBridgedPlugin {

    /// Capacitor 8 要求插件显式声明 JS 端注册的插件 ID。
    /// 必须与 frontend/src/services/WorkoutTimerService.ts 中 registerPlugin('WorkoutTimer') 一致。
    public let identifier = "WorkoutTimer"
    public let jsName = "WorkoutTimer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startRest", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishRest", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishAll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise)
    ]

    private var engine: TimerEngine { TimerEngine.shared }

    /// 供 App target 显式调用，强制链接器把本类保留在主二进制中。
    @objc public static func forceLink() {
        print("⚡️ [WorkoutTimerPlugin] forceLink() called – class is linked")
    }

    override public func load() {
        super.load()
        print("⚡️ [WorkoutTimerPlugin] load() 已注册")

        // 激活 WatchConnectivity（必须在主线程，异步完成）
        WatchSessionManager.shared.activate()
        WatchSessionManager.shared.onWatchFinishRequest = { exerciseId in
            // 结束计时器；finishRest 会触发 engine.onFinish，Plugin 已通过 onFinish 回调通知 JS
            TimerEngine.shared.finishRest(exerciseId: exerciseId)
        }

        // 订阅引擎事件，转发到 JS（Watch 同步由 TimerEngine 直接负责）
        engine.onTick = { [weak self] exerciseId, remaining in
            self?.notifyListeners("timerTick", data: [
                "exerciseId": exerciseId,
                "remaining": remaining
            ])
        }
        engine.onFinish = { [weak self] exerciseId, exerciseName in
            self?.notifyListeners("timerFinish", data: [
                "exerciseId": exerciseId,
                "exerciseName": exerciseName
            ])
        }
    }

    // MARK: - 方法

    @objc func startRest(_ call: CAPPluginCall) {
        guard let exerciseId = call.getString("exerciseId"), !exerciseId.isEmpty else {
            call.reject("exerciseId is required")
            return
        }
        let exerciseName = call.getString("exerciseName") ?? "休息"
        let duration = call.getDouble("duration") ?? 90.0

        engine.requestNotificationPermissionIfNeeded()
        engine.startRest(exerciseId: exerciseId, exerciseName: exerciseName, duration: duration)

        call.resolve([
            "exerciseId": exerciseId,
            "remaining": engine.remainingSeconds(for: exerciseId)
        ])
    }

    @objc func finishRest(_ call: CAPPluginCall) {
        guard let exerciseId = call.getString("exerciseId"), !exerciseId.isEmpty else {
            call.reject("exerciseId is required")
            return
        }
        engine.finishRest(exerciseId: exerciseId)
        call.resolve(["exerciseId": exerciseId, "finished": true])
    }

    @objc func finishAll(_ call: CAPPluginCall) {
        engine.finishAll()
        call.resolve(["finished": true])
    }

    @objc func getState(_ call: CAPPluginCall) {
        call.resolve([
            "timers": engine.snapshot()
        ])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        engine.requestNotificationPermissionIfNeeded()
        call.resolve(["granted": true])
    }
}
