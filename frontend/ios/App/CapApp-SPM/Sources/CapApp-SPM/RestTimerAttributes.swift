import ActivityKit
import Foundation

/// 休息计时 Live Activity 的共享数据结构。
/// 注意：主 App 与 Widget Extension 需各持一份**完全一致**的定义（名称/字段/类型一致），
/// 系统通过 Attributes 的 activityIdentifier 匹配两边的 ActivityConfiguration。
@available(iOS 16.1, *)
public struct RestTimerAttributes: ActivityAttributes {

    public struct ContentState: Codable, Hashable {
        /// 当前所有进行中的休息计时器（多组并列显示）
        public var items: [RestTimerItem]

        public init(items: [RestTimerItem]) {
            self.items = items
        }
    }

    public struct RestTimerItem: Codable, Hashable {
        public var exerciseId: String
        public var exerciseName: String      // 保留原文（中文动作名就显示中文）
        public var startDate: Date           // 休息开始时刻
        public var endDate: Date             // 休息结束时刻（倒计时终点）
        public var totalDuration: TimeInterval
        public var setNumber: Int            // 组号（1-based）

        public init(exerciseId: String, exerciseName: String, startDate: Date, endDate: Date, totalDuration: TimeInterval, setNumber: Int) {
            self.exerciseId = exerciseId
            self.exerciseName = exerciseName
            self.startDate = startDate
            self.endDate = endDate
            self.totalDuration = totalDuration
            self.setNumber = setNumber
        }
    }

    public init() {}
}
