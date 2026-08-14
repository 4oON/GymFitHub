import SwiftUI

/// 手表主界面：倒计时大屏
///
/// 显示：
/// - 当前动作名
/// - 剩余秒数（大数字）
/// - 圆形进度环
/// - "结束休息"按钮（回传 iPhone）
struct WatchTimerView: View {
    @EnvironmentObject var session: WatchSessionManager
    @State private var now = Date()

    private let timer = Timer.publish(every: 0.5, on: .main, in: .common).autoconnect()

    var body: some View {
        Group {
            if let timer = session.activeTimer {
                activeTimerView(timer)
            } else {
                idleView
            }
        }
        .onReceive(timer) { _ in now = Date() }
        .onAppear { session.requestStateSync() }
    }

    // MARK: - 空闲状态

    private var idleView: some View {
        VStack(spacing: 8) {
            Image(systemName: "timer")
                .font(.system(size: 32))
                .foregroundColor(.gray)
            Text("休息倒计时")
                .font(.headline)
            Text(session.isConnected ? "等待 iPhone 开始计时" : "未连接 iPhone")
                .font(.caption2)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding()
    }

    // MARK: - 活跃计时状态

    private func activeTimerView(_ timer: WatchSessionManager.WatchTimerState) -> some View {
        // 每次 SwiftUI 刷新时基于当前时间实时计算，确保倒计时持续走秒
        let remaining = timer.remaining
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

        return VStack(spacing: 4) {
            Text(timer.exerciseName)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.8))
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.15), lineWidth: 6)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        Color.green,
                        style: StrokeStyle(lineWidth: 6, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: progress)

                Text("\(remaining)")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)
            }
            .frame(width: 120, height: 120)
            .padding(.vertical, 2)

            Button {
                session.requestFinishRest()
            } label: {
                Text("结束休息")
                    .font(.system(size: 13, weight: .medium))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 4)
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
        }
        .padding(.horizontal, 8)
    }
}
