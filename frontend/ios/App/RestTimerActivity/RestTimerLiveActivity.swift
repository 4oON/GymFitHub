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

            // 倒计时文字（系统 timerInterval 自动刷新，锁屏挂起也更新）
            // 关键坑：不能加 .fixedSize()！Text(timerInterval:) 内部用 GeometryReader 测量
            // 文字宽度，.fixedSize() 强制 intrinsic size，动画每帧刷新时 place 断言失败 → SIGTRAP。
            // 灵动岛的 Text(timerInterval:) 没有 .fixedSize() 所以不崩。
            Text(timerInterval: item.startDate...item.endDate, countsDown: true)
                .font(.system(size: 15, weight: .bold, design: .monospaced))
                .monospacedDigit()
                .foregroundColor(zenOrange)

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
            // 锁屏 Live Activity 的坑（已反复验证）：
            // ProgressView(timerInterval:) 的系统 .linear 样式，放在锁屏「铺满」上下文里
            // 会因内部 GeometryReader + 持续动画 AnimatableFrameAttribute 触发 SIGTRAP。
            // scaleEffect / RTL 只是加速了这个崩溃，真正的病根是「锁屏 + timerInterval 动画」。
            // 灵动岛正常是因为它有系统给的固定尺寸约束；锁屏的 .background 铺满会崩。
            // 故锁屏只保留静态深色底 + 倒计时文字（Text timerInterval 正常），不放进度条。
            Rectangle()
                .fill(Color.white.opacity(0.08))
        )
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .widgetURL(URL(string: "gymfithub://rest/open?exerciseId=\(item.exerciseId)"))
    }
}
