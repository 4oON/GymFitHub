import SwiftUI

/// Watch main interface: rest timer
///
/// Design goals:
/// - Dark background, green accent, consistent with iPhone App theme
/// - Support multiple concurrent timers (list layout)
/// - Generous spacing and breathing room, not cramped
/// - iOS-native feel with proper safe areas
struct WatchTimerView: View {
    @EnvironmentObject var session: WatchSessionManager

    // App theme colors - matching ZenFit iPhone app
    private let accentGreen = Color(red: 0.20, green: 0.78, blue: 0.35) // #34C759
    private let backgroundDark = Color(red: 0.02, green: 0.06, blue: 0.09) // #050F17
    private let surfaceDark = Color(red: 0.12, green: 0.16, blue: 0.20) // #1F2933
    private let cardDark = Color(red: 0.08, green: 0.11, blue: 0.15) // #141C26

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

            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "timer")
                    .font(.system(size: 44, weight: .light))
                    .foregroundColor(accentGreen)

                VStack(spacing: 8) {
                    Text("Rest Timer")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundColor(.white)

                    Text(session.isConnected ? "Waiting for iPhone" : "Not connected")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                }

                Spacer()
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
                // Exercise name with generous top padding
                Text(timer.exerciseName)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                    .multilineTextAlignment(.center)
                    .padding(.top, 36)
                    .padding(.horizontal, 16)

                Spacer()

                // Countdown ring + digits
                ZStack {
                    Circle()
                        .stroke(surfaceDark, lineWidth: 8)

                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            accentGreen,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 0.5), value: progress)

                    VStack(spacing: 2) {
                        Text("\(remaining)")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundColor(.white)

                        Text("sec")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.gray)
                    }
                }
                .frame(width: 130, height: 130)

                Spacer()

                // Done button - checkmark style
                Button {
                    session.requestFinishRest(exerciseId: timer.exerciseId)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 15, weight: .semibold))
                        Text("Done")
                            .font(.system(size: 16, weight: .semibold))
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(accentGreen.opacity(0.9))
                    .cornerRadius(12)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 24)
                .padding(.bottom, 20)
            }
        }
    }

    // MARK: - Multiple Timers (List)

    private var multiTimerView: some View {
        ZStack {
            backgroundDark.ignoresSafeArea()

            VStack(spacing: 0) {
                // Minimal header with safe area
                Text("Rest Timers")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.top, 32)
                    .padding(.bottom, 12)

                // Timer list - maximize visible area
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(session.activeTimers) { timer in
                            timerCard(timer)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.bottom, 16)
                }
            }
        }
    }

    private func timerCard(_ timer: WatchSessionManager.WatchTimerState) -> some View {
        let remaining = timer.remaining
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

        return HStack(spacing: 14) {
            // Progress ring (small)
            ZStack {
                Circle()
                    .stroke(surfaceDark, lineWidth: 4)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        accentGreen,
                        style: StrokeStyle(lineWidth: 4, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                Text("\(remaining)")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)
            }
            .frame(width: 44, height: 44)

            // Exercise info
            VStack(alignment: .leading, spacing: 3) {
                Text(timer.exerciseName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text("\(remaining)s left")
                    .font(.system(size: 12))
                    .foregroundColor(.gray)
            }

            Spacer()

            // Done button - checkmark
            Button {
                session.requestFinishRest(exerciseId: timer.exerciseId)
            } label: {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 26))
                    .foregroundColor(accentGreen)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(cardDark)
        .cornerRadius(14)
    }
}
