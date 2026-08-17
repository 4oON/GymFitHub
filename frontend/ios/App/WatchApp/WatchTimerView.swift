import SwiftUI

/// Watch main interface: rest timer
///
/// Design goals:
/// - Dark background, green accent, consistent with iPhone App theme
/// - Support multiple concurrent timers (list layout)
/// - Avoid status bar overlap with proper safe area handling
/// - Clean, modern card-based design
struct WatchTimerView: View {
    @EnvironmentObject var session: WatchSessionManager

    // App theme colors
    private let accentGreen = Color(red: 0.20, green: 0.78, blue: 0.35)
    private let backgroundDark = Color(red: 0.02, green: 0.06, blue: 0.09)
    private let surfaceDark = Color(red: 0.10, green: 0.14, blue: 0.18)
    private let cardDark = Color(red: 0.08, green: 0.11, blue: 0.15)

    var body: some View {
        Group {
            if session.activeTimers.isEmpty {
                idleView
            } else if session.activeTimers.count == 1, let timer = session.activeTimers.first {
                singleTimerView(timer)
            } else {
                multiTimerView
            }
        }
        .onAppear { session.requestStateSync() }
    }

    // MARK: - Idle State

    private var idleView: some View {
        ZStack {
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 16) {
                Image(systemName: "timer")
                    .font(.system(size: 40, weight: .light))
                    .foregroundColor(accentGreen)

                Text("Rest Timer")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.white)

                Text(session.isConnected ? "Waiting for iPhone to start" : "Not connected to iPhone")
                    .font(.system(size: 14))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }

    // MARK: - Single Timer (Full Screen)

    private func singleTimerView(_ timer: WatchSessionManager.WatchTimerState) -> some View {
        let remaining = timer.remaining
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

        return ZStack {
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 0) {
                // Exercise name - avoid status bar with top padding
                Text(timer.exerciseName)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                    .multilineTextAlignment(.center)
                    .padding(.top, 24)
                    .padding(.horizontal, 12)

                Spacer()

                // Countdown ring + digits
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

                    VStack(spacing: 4) {
                        Text("\(remaining)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(.white)

                        Text("sec")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.gray)
                    }
                }
                .frame(width: 150, height: 150)

                Spacer()

                // End Rest button
                Button {
                    session.requestFinishRest(exerciseId: timer.exerciseId)
                } label: {
                    Text("End Rest")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.red.opacity(0.9))
                        .cornerRadius(12)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)
                .padding(.bottom, 16)
            }
        }
    }

    // MARK: - Multiple Timers (List)

    private var multiTimerView: some View {
        ZStack {
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                Text("Rest Timers")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.top, 24)
                    .padding(.bottom, 8)

                // Timer list
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(session.activeTimers) { timer in
                            timerCard(timer)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 12)
                }
            }
        }
    }

    private func timerCard(_ timer: WatchSessionManager.WatchTimerState) -> some View {
        let remaining = timer.remaining
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

        return HStack(spacing: 12) {
            // Progress ring (small)
            ZStack {
                Circle()
                    .stroke(surfaceDark, lineWidth: 5)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        accentGreen,
                        style: StrokeStyle(lineWidth: 5, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                Text("\(remaining)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)
            }
            .frame(width: 50, height: 50)

            // Exercise info
            VStack(alignment: .leading, spacing: 2) {
                Text(timer.exerciseName)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text("\(remaining)s remaining")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
            }

            Spacer()

            // End button
            Button {
                session.requestFinishRest(exerciseId: timer.exerciseId)
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.red.opacity(0.9))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(cardDark)
        .cornerRadius(12)
    }
}
