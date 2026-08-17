import SwiftUI

/// 手表主界面：休息倒计时
///
/// 设计目标：
/// - 深色背景，绿色 accent，贴近 iPhone App 主题
/// - 大号动作名称 + 大号倒计时数字
/// - 圆形进度环直观展示剩余时间
/// - 底部红色"结束休息"按钮，易于点击
struct WatchTimerView: View {
    @EnvironmentObject var session: WatchSessionManager

    // App 主题绿色（与 iPhone 端 accent 接近）
    private let accentGreen = Color(red: 0.20, green: 0.78, blue: 0.35)
    private let backgroundDark = Color(red: 0.02, green: 0.06, blue: 0.09)
    private let surfaceDark = Color(red: 0.10, green: 0.14, blue: 0.18)

    var body: some View {
        Group {
            if let timer = session.activeTimer {
                activeTimerView(timer)
            } else {
                idleView
            }
        }
        .onAppear { session.requestStateSync() }
    }

    // MARK: - 空闲状态

    private var idleView: some View {
        ZStack {
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 12) {
                Image(systemName: "timer")
                    .font(.system(size: 36, weight: .light))
                    .foregroundColor(accentGreen.opacity(0.8))

                Text("休息倒计时")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)

                Text(session.isConnected ? "等待 iPhone 开始计时" : "未连接 iPhone")
                    .font(.system(size: 13))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }

    // MARK: - 活跃计时状态

    private func activeTimerView(_ timer: WatchSessionManager.WatchTimerState) -> some View {
        let remaining = timer.remaining
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

        return ZStack {
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 0) {
                // 动作名称：大号、清晰
                Text(timer.exerciseName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)
                    .padding(.horizontal, 8)

                Spacer()

                // 倒计时圆环 + 数字
                ZStack {
                    Circle()
                        .stroke(surfaceDark, lineWidth: 10)

                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            accentGreen,
                            style: StrokeStyle(lineWidth: 10, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 0.5), value: progress)

                    VStack(spacing: 2) {
                        Text("\(remaining)")
                            .font(.system(size: 52, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(.white)

                        Text("秒")
                            .font(.system(size: 13))
                            .foregroundColor(.gray)
                    }
                }
                .frame(width: 140, height: 140)

                Spacer()

                // 结束休息按钮
                Button {
                    session.requestFinishRest()
                } label: {
                    Text("结束休息")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.red.opacity(0.85))
                        .cornerRadius(10)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
        }
    }
}
