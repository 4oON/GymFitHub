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
                        Text(timerInterval: first.startDate...first.endDate, countsDown: true)
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
                    Text(timerInterval: first.startDate...first.endDate, countsDown: true, showsHours: false)
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

/// 锁屏视图：多组并列的紧凑横条倒计时。
/// 每个条目两行：动作名 + 内联倒计时 + 操作按钮 / 横条进度条。
struct RestTimerLockScreenView: View {
    let context: ActivityViewContext<RestTimerAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(context.state.items.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    Divider()
                        .overlay(Color(white: 0.18))
                        .padding(.vertical, 8)
                }
                RestTimerRow(item: item)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }
}

struct RestTimerRow: View {
    let item: RestTimerAttributes.RestTimerItem

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Text(item.exerciseName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                    .layoutPriority(1)

                Text(timerInterval: item.startDate...item.endDate, countsDown: true)
                    .font(.system(size: 15, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(zenOrange)

                Spacer(minLength: 8)

                Link(destination: extendURL) {
                    Text("+30s")
                        .font(.caption.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.14))
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                }

                Link(destination: doneURL) {
                    Text("Done")
                        .font(.caption.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(zenOrange)
                        .foregroundColor(Color(red: 0.1, green: 0.05, blue: 0.0))
                        .clipShape(Capsule())
                }
            }

            ProgressView(timerInterval: item.startDate...item.endDate, countsDown: true)
                .progressViewStyle(.linear)
                .tint(zenOrange)
        }
    }

    private var extendURL: URL {
        URL(string: "gymfithub://rest/extend?exerciseId=\(item.exerciseId)&seconds=30")!
    }

    private var doneURL: URL {
        URL(string: "gymfithub://rest/done?exerciseId=\(item.exerciseId)")!
    }
}
