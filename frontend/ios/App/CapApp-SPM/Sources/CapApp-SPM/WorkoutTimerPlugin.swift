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
public class WorkoutTimerPlugin: CAPPlugin {

    private var engine: TimerEngine { TimerEngine.shared }

    override public func load() {
        super.load()
        // 订阅引擎事件，转发到 JS 与 Watch
        engine.onTick = { [weak self] exerciseId, remaining in
            self?.notifyListeners("timerTick", data: [
                "exerciseId": exerciseId,
                "remaining": remaining
            ])
            WatchSessionManager.shared.sendTimerState(
                exerciseId: exerciseId,
                exerciseName: self?.engine.snapshot().first { $0["exerciseId"] as? String == exerciseId }?["exerciseName"] as? String ?? "",
                remaining: remaining,
                duration: self?.engine.snapshot().first { $0["exerciseId"] as? String == exerciseId }?["duration"] as? Double ?? 0
            )
        }
        engine.onFinish = { [weak self] exerciseId, exerciseName in
            self?.notifyListeners("timerFinish", data: [
                "exerciseId": exerciseId,
                "exerciseName": exerciseName
            ])
            WatchSessionManager.shared.sendTimerFinished(exerciseId: exerciseId, exerciseName: exerciseName)
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
