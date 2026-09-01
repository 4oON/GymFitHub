import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

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

/// 锁屏视图：多组并列的单行倒计时。
/// 每行：动作名 + 橙色内联倒计时 + [+30s] [Done] 按钮；点击行（非按钮）打开 App。
struct RestTimerLockScreenView: View {
    let context: ActivityViewContext<RestTimerAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(context.state.items.enumerated()), id: \.offset) { index, item in
                if index > 0 {
                    Divider()
                        .overlay(Color(white: 0.18))
                        .padding(.vertical, 6)
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
        HStack(spacing: 8) {
            Text(item.exerciseName)
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
                .truncationMode(.tail)

            Text(timerInterval: item.startDate...item.endDate, countsDown: true)
                .font(.system(size: 15, weight: .bold, design: .monospaced))
                .monospacedDigit()
                .foregroundColor(zenOrange)
                .fixedSize()

            Spacer(minLength: 8)

            if #available(iOS 17.0, *) {
                Button(intent: ExtendRestIntent(exerciseId: item.exerciseId, seconds: 30)) {
                    Text("+30s")
                        .font(.caption.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.14))
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .fixedSize()

                Button(intent: FinishRestIntent(exerciseId: item.exerciseId)) {
                    Text("Done")
                        .font(.caption.bold())
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(zenOrange)
                        .foregroundColor(Color(red: 0.1, green: 0.05, blue: 0.0))
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
                .fixedSize()
            }
        }
        .padding(.vertical, 7)
        .padding(.horizontal, 10)
        .background(
            ZStack {
                // 轨道底色（白色微透，作背景条轨道）
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                // 从右向左消退的倒计时条：系统 ProgressView + RTL 方向翻转
                // 关键：Live Activity 里 ProgressView(timerInterval:) + scaleEffect 会让
                // WidgetRenderer 的 GeometryReader 布局断言崩溃（SIGTRAP），必须移除 scaleEffect。
                // 负缩放(x:-1)黑框、正放大(y:8)崩溃，两种都不能用。
                ProgressView(timerInterval: item.startDate...item.endDate, countsDown: true)
                    .progressViewStyle(.linear)
                    .tint(zenOrange)
                    .environment(\.layoutDirection, .rightToLeft)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .widgetURL(URL(string: "gymfithub://rest/open?exerciseId=\(item.exerciseId)"))
    }
}
