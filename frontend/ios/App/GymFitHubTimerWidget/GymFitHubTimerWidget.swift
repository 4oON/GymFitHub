//
//  GymFitHubTimerWidget.swift
//  GymFitHubTimerWidget
//
//  Created by SKL on 19/8/2026.
//

import WidgetKit
import SwiftUI

/// Shared App Group ID for Watch App ↔ Widget data sharing
private let appGroupID = "group.com.gymfithub.app.timer"

struct TimerData: Codable {
    let exerciseId: String
    let exerciseName: String
    let duration: Double
    let endDate: TimeInterval

    var endDateAsDate: Date {
        Date(timeIntervalSince1970: endDate)
    }

    func remaining(at date: Date) -> Int {
        max(0, Int(ceil(endDateAsDate.timeIntervalSince(date))))
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), timers: [], isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let currentDate = Date()
        var entries: [SimpleEntry] = []

        // Read current timers from App Group
        let timers = loadTimersFromAppGroup()

        // Create timeline entries for the next 60 seconds.
        // CRITICAL: Each entry must carry the SAME timers array, and the VIEW
        // must compute remaining based on entry.date (not a pre-computed value).
        // This ensures the countdown ticks even though the system may not
        // call getTimeline again for several minutes.
        for secondOffset in 0..<60 {
            let entryDate = Calendar.current.date(byAdding: .second, value: secondOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate, timers: timers, isPlaceholder: false)
            entries.append(entry)
        }

        // Reload policy: ask the system to refresh as soon as possible
        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }

    private func loadEntry() -> SimpleEntry {
        let timers = loadTimersFromAppGroup()
        return SimpleEntry(date: Date(), timers: timers, isPlaceholder: false)
    }

    private func loadTimersFromAppGroup() -> [TimerData] {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let data = defaults.array(forKey: "activeTimers") as? [[String: Any]] else {
            return []
        }
        return data.compactMap { dict in
            guard let exerciseId = dict["exerciseId"] as? String,
                  let exerciseName = dict["exerciseName"] as? String,
                  let duration = dict["duration"] as? Double,
                  let endDate = dict["endDate"] as? TimeInterval else {
                return nil
            }
            return TimerData(exerciseId: exerciseId, exerciseName: exerciseName, duration: duration, endDate: endDate)
        }
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let timers: [TimerData]
    let isPlaceholder: Bool
}

struct GymFitHubTimerWidgetEntryView : View {
    var entry: Provider.Entry

    // App theme colors
    private let accentGreen = Color(red: 0.20, green: 0.78, blue: 0.35)   // #34C759
    private let accentOrange = Color(red: 1.00, green: 0.58, blue: 0.00)  // #FF9500
    private let accentBlue = Color(red: 0.04, green: 0.52, blue: 1.00)    // #0A84FF
    private let accentPurple = Color(red: 0.69, green: 0.32, blue: 0.87)  // #AF52DE
    private let backgroundDark = Color(red: 0.02, green: 0.06, blue: 0.09)
    private let surfaceDark = Color(red: 0.12, green: 0.16, blue: 0.20)

    /// Assign a distinct color per timer index (green first, then theme-compatible alternates)
    private func color(for index: Int) -> Color {
        let palette = [accentGreen, accentOrange, accentBlue, accentPurple]
        return palette[index % palette.count]
    }

    var body: some View {
        if entry.timers.isEmpty {
            // No active timers
            VStack(spacing: 4) {
                Image(systemName: "timer")
                    .font(.system(size: 20))
                    .foregroundColor(accentGreen)
                Text("No Timer")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(backgroundDark)
        } else if entry.timers.count == 1, let timer = entry.timers.first {
            // Single timer - horizontal progress bar, counts down to zero
            singleTimerBar(timer)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(backgroundDark)
        } else {
            // Multiple timers - one row each with distinct color
            multiTimerRows
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(backgroundDark)
        }
    }

    // MARK: - Single Timer (progress bar)

    private func singleTimerBar(_ timer: TimerData) -> some View {
        let remaining = timer.remaining(at: entry.date)
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(timer.exerciseName)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Spacer(minLength: 4)
                Text("\(remaining)s")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(accentGreen)
            }

            // Horizontal bar that shrinks as the timer counts down
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(surfaceDark)
                    Capsule()
                        .fill(accentGreen)
                        .frame(width: geo.size.width * progress)
                }
            }
            .frame(height: 6)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
    }

    // MARK: - Multiple Timers

    private var multiTimerRows: some View {
        VStack(spacing: 3) {
            ForEach(Array(entry.timers.prefix(3).enumerated()), id: \.element.exerciseId) { index, timer in
                timerRow(timer, index: index)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }

    private func timerRow(_ timer: TimerData, index: Int) -> some View {
        let remaining = timer.remaining(at: entry.date)
        let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0
        let color = color(for: index)

        return HStack(spacing: 5) {
            // Color indicator + mini bar
            VStack(alignment: .leading, spacing: 2) {
                RoundedRectangle(cornerRadius: 1.5)
                    .fill(color)
                    .frame(width: 3, height: 10)
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(surfaceDark)
                        Capsule().fill(color).frame(width: geo.size.width * progress)
                    }
                }
                .frame(height: 3)
            }
            .frame(width: 22)

            Text(timer.exerciseName)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.white)
                .lineLimit(1)

            Spacer(minLength: 2)

            Text("\(remaining)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundColor(color)
        }
    }
}

struct GymFitHubTimerWidget: Widget {
    let kind: String = "GymFitHubTimerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(watchOS 10.0, *) {
                GymFitHubTimerWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                GymFitHubTimerWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("Rest Timer")
        .description("Shows your current rest timer countdown.")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular])
    }
}

#Preview(as: .accessoryRectangular) {
    GymFitHubTimerWidget()
} timeline: {
    SimpleEntry(date: Date(), timers: [], isPlaceholder: true)
    SimpleEntry(date: Date(), timers: [
        TimerData(exerciseId: "1", exerciseName: "Bench Press", duration: 90, endDate: Date().addingTimeInterval(45).timeIntervalSince1970)
    ], isPlaceholder: false)
}
