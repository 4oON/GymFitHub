import Foundation
import UIKit
import UserNotifications
import AudioToolbox
import ActivityKit

/// GymFitHub 原生计时引擎
///
/// 解决 WebView (setInterval/requestAnimationFrame) 在 iOS 后台被冻结的问题：
/// - 计时基于 `Date` 时间戳计算，不依赖 JS 定时器，App 切后台后依然准确
/// - 计时结束时触发本地通知（声音 + 横幅），并回调给 Web 层与 Watch 层
/// - 支持多个并行休息计时器（以 exerciseId 为 key）
public final class TimerEngine: NSObject {

    public static let shared = TimerEngine()

    /// 计时器状态字典：exerciseId -> TimerEntry
    private(set) public var timers: [String: TimerEntry] = [:]

    /// 事件回调（供 Web 桥接 / Watch 同步使用）
    public var onTick: ((String, Int) -> Void)?          // exerciseId, remainingSeconds
    public var onFinish: ((String, String) -> Void)?     // exerciseId, exerciseName

    private var displayTimer: Timer?
    private var completionTimer: Timer?
    /// Live Activity 实例（擦除为 Any 以兼容 iOS 15；仅 iOS 16.1+ 使用）
    private var liveActivity: Any?

    public struct TimerEntry {
        public let exerciseId: String
        public let exerciseName: String
        public let duration: TimeInterval   // 总时长（秒）
        public let endDate: Date            // 结束时间戳（绝对时间，后台依然有效）
        public let setNumber: Int           // 组号（1-based，休息后要做的组）

        public init(exerciseId: String, exerciseName: String, duration: TimeInterval, endDate: Date, setNumber: Int) {
            self.exerciseId = exerciseId
            self.exerciseName = exerciseName
            self.duration = duration
            self.endDate = endDate
            self.setNumber = setNumber
        }
    }

    private override init() {
        super.init()
    }

    /// 启动/重置一个休息计时器
    /// - Parameters:
    ///   - exerciseId: 动作唯一 ID
    ///   - exerciseName: 动作显示名
    ///   - duration: 休息时长（秒）
    public func startRest(exerciseId: String, exerciseName: String, duration: Double, setNumber: Int = 1) {
        // 如果该 exerciseId 已有旧计时器，先取消旧通知，防止重复弹窗
        if let oldEntry = timers[exerciseId] {
            cancelCompletionNotification(for: oldEntry)
        }

        let entry = TimerEntry(
            exerciseId: exerciseId,
            exerciseName: exerciseName,
            duration: duration,
            endDate: Date().addingTimeInterval(duration),
            setNumber: setNumber
        )
        timers[exerciseId] = entry

        // 启动 UI 刷新定时器（前台每秒回调一次）
        restartDisplayTimer()
        // 安排结束通知
        scheduleCompletionNotification(for: entry)
        // 同步锁屏 Live Activity
        syncLiveActivity()

        // 立即回调一次当前状态
        onTick?(exerciseId, Int(duration))
        notifyStateChanged()
    }

    /// 手动结束某个计时器（用户点"结束休息"或手表回传）
    public func finishRest(exerciseId: String) {
        guard let entry = timers[exerciseId] else { return }
        timers.removeValue(forKey: exerciseId)
        cancelCompletionNotification(for: entry)
        onFinish?(exerciseId, entry.exerciseName)
        syncLiveActivity()
        notifyStateChanged()

        if timers.isEmpty {
            stopDisplayTimer()
        }
    }

    /// 主动结束全部计时器
    public func finishAll() {
        let keys = Array(timers.keys)
        for key in keys {
            finishRest(exerciseId: key)
        }
    }

    /// 查询单个计时器剩余秒数（0 表示不存在或已结束）
    public func remainingSeconds(for exerciseId: String) -> Int {
        guard let entry = timers[exerciseId] else { return 0 }
        let remaining = Int(ceil(entry.endDate.timeIntervalSinceNow))
        return max(0, remaining)
    }

    /// 当前所有计时器状态（供 Web 查询 / Watch 同步）
    public func snapshot() -> [[String: Any]] {
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
        // 原生振动：前台 / 后台未挂起时立即触发，不依赖 JS（JS 在锁屏挂起时被冻结）
        vibrate()
        syncLiveActivity()
        notifyStateChanged()
        if timers.isEmpty {
            stopDisplayTimer()
        }
    }

    /// 原生振动提醒。注意：锁屏且 App 已被系统挂起时，本方法不会被调用，
    /// 此时振动依赖本地通知的 sound（受 iOS 静音键 / 专注模式控制）。
    private func vibrate() {
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
    }

    // MARK: - Live Activity（锁屏实时倒计时）

    /// 同步当前所有计时器到锁屏 Live Activity（多组并列）。
    /// 倒计时本身由系统组件（ProgressView timerInterval / Text timer）自动刷新，无需频繁 update。
    private func syncLiveActivity() {
        guard #available(iOS 16.1, *) else { return }

        let items = timers.values.map { entry in
            RestTimerAttributes.RestTimerItem(
                exerciseId: entry.exerciseId,
                exerciseName: entry.exerciseName,
                startDate: entry.endDate.addingTimeInterval(-entry.duration),
                endDate: entry.endDate,
                totalDuration: entry.duration,
                setNumber: entry.setNumber
            )
        }
        let contentState = RestTimerAttributes.ContentState(items: items)

        if let existing = liveActivity as? Activity<RestTimerAttributes> {
            if items.isEmpty {
                Task { await existing.end(using: contentState, dismissalPolicy: .immediate) }
                liveActivity = nil
            } else {
                Task { await existing.update(using: contentState) }
            }
        } else if !items.isEmpty {
            do {
                let activity = try Activity<RestTimerAttributes>.request(
                    attributes: RestTimerAttributes(),
                    contentState: contentState
                )
                liveActivity = activity
            } catch {
                print("⚡️ [TimerEngine] Live Activity 启动失败: \(error)")
            }
        }
    }

    // MARK: - 本地通知（后台提醒）

    private func scheduleCompletionNotification(for entry: TimerEntry) {
        let content = UNMutableNotificationContent()
        content.title = "休息结束"
        content.body = "\(entry.exerciseName) 的休息时间到了，开始下一组！"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: entry.duration, repeats: false)
        let request = UNNotificationRequest(identifier: "gymfithub-rest-\(entry.exerciseId)", content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("⚡️ [TimerEngine] 通知调度失败: \(error)")
            }
        }
    }

    private func cancelCompletionNotification(for entry: TimerEntry) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["gymfithub-rest-\(entry.exerciseId)"]
        )
    }

    public func requestNotificationPermissionIfNeeded(completion: ((Bool) -> Void)? = nil) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                print("⚡️ [TimerEngine] 通知权限申请失败: \(error)")
            }
            completion?(granted)
        }
    }

    // MARK: - Watch 同步广播

    private func notifyStateChanged() {
        // 计时器状态发生变化时，直接推送到 Apple Watch
        WatchSessionManager.shared.pushTimerState()
    }
}
