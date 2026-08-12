import Foundation
import UIKit
import UserNotifications

/// ZenFit 原生计时引擎
///
/// 解决 WebView (setInterval/requestAnimationFrame) 在 iOS 后台被冻结的问题：
/// - 计时基于 `Date` 时间戳计算，不依赖 JS 定时器，App 切后台后依然准确
/// - 计时结束时触发本地通知（声音 + 横幅），并回调给 Web 层与 Watch 层
/// - 支持多个并行休息计时器（以 exerciseId 为 key）
final class TimerEngine: NSObject {

    static let shared = TimerEngine()

    /// 计时器状态字典：exerciseId -> TimerEntry
    private(set) var timers: [String: TimerEntry] = [:]

    /// 事件回调（供 Web 桥接 / Watch 同步使用）
    var onTick: ((String, Int) -> Void)?          // exerciseId, remainingSeconds
    var onFinish: ((String, String) -> Void)?     // exerciseId, exerciseName

    private var displayTimer: Timer?
    private var completionTimer: Timer?

    struct TimerEntry {
        let exerciseId: String
        let exerciseName: String
        let duration: TimeInterval   // 总时长（秒）
        let endDate: Date            // 结束时间戳（绝对时间，后台依然有效）
    }

    private override init() {
        super.init()
    }

    /// 启动/重置一个休息计时器
    /// - Parameters:
    ///   - exerciseId: 动作唯一 ID
    ///   - exerciseName: 动作显示名
    ///   - duration: 休息时长（秒）
    func startRest(exerciseId: String, exerciseName: String, duration: Double) {
        let entry = TimerEntry(
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            duration: duration,
            endDate: Date().addingTimeInterval(duration)
        )
        timers[exerciseId] = entry

        // 启动 UI 刷新定时器（前台每秒回调一次）
        restartDisplayTimer()
        // 安排结束通知
        scheduleCompletionNotification(for: entry)

        // 立即回调一次当前状态
        onTick?(exerciseId, Int(duration))
        notifyStateChanged()
    }

    /// 手动结束某个计时器（用户点"结束休息"或手表回传）
    func finishRest(exerciseId: String) {
        guard let entry = timers[exerciseId] else { return }
        timers.removeValue(forKey: exerciseId)
        cancelCompletionNotification(for: entry)
        onFinish?(exerciseId, entry.exerciseName)
        notifyStateChanged()

        if timers.isEmpty {
            stopDisplayTimer()
        }
    }

    /// 主动结束全部计时器
    func finishAll() {
        let keys = Array(timers.keys)
        for key in keys {
            finishRest(exerciseId: key)
        }
    }

    /// 查询单个计时器剩余秒数（0 表示不存在或已结束）
    func remainingSeconds(for exerciseId: String) -> Int {
        guard let entry = timers[exerciseId] else { return 0 }
        let remaining = Int(ceil(entry.endDate.timeIntervalSinceNow))
        return max(0, remaining)
    }

    /// 当前所有计时器状态（供 Web 查询 / Watch 同步）
    func snapshot() -> [[String: Any]] {
        return timers.values.map { entry in
            return [
                "exerciseId": entry.exerciseId,
                "exerciseName": entry.exerciseName,
                "duration": entry.duration,
                "remaining": remainingSeconds(for: entry.exerciseId),
                "endDate": entry.endDate.timeIntervalSince1970
            ]
        }
    }

    // MARK: - 内部：前台刷新

    private func restartDisplayTimer() {
        stopDisplayTimer()
        displayTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            var finishedKeys: [String] = []
            for (id, entry) in self.timers {
                let remaining = Int(ceil(entry.endDate.timeIntervalSinceNow))
                if remaining <= 0 {
                    finishedKeys.append(id)
                } else {
                    self.onTick?(id, remaining)
                }
            }
            // 到期的计时器触发结束
            for key in finishedKeys {
                self.handleExpired(exerciseId: key)
            }
            self.notifyStateChanged()
        }
        RunLoop.main.add(displayTimer!, forMode: .common)
    }

    private func stopDisplayTimer() {
        displayTimer?.invalidate()
        displayTimer = nil
    }

    private func handleExpired(exerciseId: String) {
        guard let entry = timers[exerciseId] else { return }
        timers.removeValue(forKey: exerciseId)
        onFinish?(exerciseId, entry.exerciseName)
        if timers.isEmpty {
            stopDisplayTimer()
        }
    }

    // MARK: - 本地通知（后台提醒）

    private func scheduleCompletionNotification(for entry: TimerEntry) {
        let content = UNMutableNotificationContent()
        content.title = "休息结束"
        content.body = "\(entry.exerciseName) 的休息时间到了，开始下一组！"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: entry.duration, repeats: false)
        let request = UNNotificationRequest(identifier: "zenfit-rest-\(entry.exerciseId)", content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("⚡️ [TimerEngine] 通知调度失败: \(error)")
            }
        }
    }

    private func cancelCompletionNotification(for entry: TimerEntry) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["zenfit-rest-\(entry.exerciseId)"]
        )
    }

    func requestNotificationPermissionIfNeeded() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("⚡️ [TimerEngine] 通知权限申请失败: \(error)")
            }
        }
    }

    // MARK: - Watch 同步广播

    private func notifyStateChanged() {
        // 通知 WatchConnectivityManager 推送状态（由外部通过 onTick/onFinish 回调）
    }
}
