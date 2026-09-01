import ActivityKit
import WidgetKit
import SwiftUI

// 品牌色（与 App 图标 / 前端主题一致）
let zenOrange = Color(red: 1.0, green: 0.42, blue: 0.0)   // #FF6A00
let zenBackground = Color(red: 0.04, green: 0.05, blue: 0.08) // #0B0E14

struct RestTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RestTimerAttributes.self) { context in
            RestTimerLockScreenView(context: context)
                .activityBackgroundTint(zenBackground)
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.items.first?.exerciseName ?? "")
                        .font(.caption2)
                        .foregroundColor(.white)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.center) {
                    if let first = context.state.items.first {
                        Text(first.endDate, style: .timer)
                            .font(.title3.bold())
                            .monospacedDigit()
                            .foregroundColor(.white)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("×\(context.state.items.count)")
                        .font(.caption2)
                        .foregroundColor(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let first = context.state.items.first {
                        ProgressView(timerInterval: first.startDate...first.endDate, countsDown: true)
                            .progressViewStyle(.linear)
                            .tint(zenOrange)
                    }
                }
            } compactLeading: {
                Image(systemName: "dumbbell.fill")
                    .foregroundColor(zenOrange)
            } compactTrailing: {
                if let first = context.state.items.first {
                    Text(first.endDate, style: .timer)
                        .monospacedDigit()
                        .frame(maxWidth: 34)
                }
            } minimal: {
                Image(systemName: "dumbbell.fill")
                    .foregroundColor(zenOrange)
            }
        }
    }
}

/// 锁屏视图：多组并列的横条倒计时
struct RestTimerLockScreenView: View {
    let context: ActivityViewContext<RestTimerAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(context.state.items.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    Divider()
                        .overlay(Color(white: 0.18))
                        .padding(.vertical, 10)
                }
                RestTimerRow(item: item)
            }
        }
        .padding(14)
    }
}

struct RestTimerRow: View {
    let item: RestTimerAttributes.RestTimerItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(zenOrange)
                    .frame(width: 5, height: 18)
                Text(item.exerciseName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Spacer()
                Text("Set \(item.setNumber)")
                    .font(.caption)
                    .foregroundColor(Color(white: 0.55))
            }

            ProgressView(timerInterval: item.startDate...item.endDate, countsDown: true)
                .progressViewStyle(.linear)
                .tint(zenOrange)

            HStack(alignment: .bottom) {
                Text(item.endDate, style: .timer)
                    .font(.system(size: 24, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(.white)
                Spacer()
                Text("Total \(Self.duration(item.totalDuration))")
                    .font(.caption)
                    .foregroundColor(Color(white: 0.55))
            }
        }
    }

    static func duration(_ t: TimeInterval) -> String {
        let s = Int(t)
        return "\(s / 60):\(String(format: "%02d", s % 60))"
    }
}
