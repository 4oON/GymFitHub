import ActivityKit
import Foundation

/// Widget Extension 侧的共享数据结构副本。
/// 必须与主 App（CapApp-SPM）中的 RestTimerAttributes **完全一致**。
@available(iOS 16.1, *)
public struct RestTimerAttributes: ActivityAttributes {

    public struct ContentState: Codable, Hashable {
        public var items: [RestTimerItem]

        public init(items: [RestTimerItem]) {
            self.items = items
        }
    }

    public struct RestTimerItem: Codable, Hashable {
        public var exerciseId: String
        public var exerciseName: String
        public var startDate: Date
        public var endDate: Date
        public var totalDuration: TimeInterval
        public var setNumber: Int

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
