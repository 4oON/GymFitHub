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
        let entry = loadEntry()
        entries.append(entry)

        // Create timeline entries for the next 60 seconds (Widget max refresh rate)
        // The system will decide when to actually refresh, but we prepare per-second data
        for secondOffset in 1..<60 {
            let entryDate = Calendar.current.date(byAdding: .second, value: secondOffset, to: currentDate)!
            let futureEntry = SimpleEntry(date: entryDate, timers: entry.timers, isPlaceholder: false)
            entries.append(futureEntry)
        }

        // Reload policy: try to refresh as soon as possible
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
    let isPlaceholder: bool
}

struct GymFitHubTimerWidgetEntryView : View {
    var entry: Provider.Entry

    // App theme colors
    private let accentGreen = Color(red: 0.20, green: 0.78, blue: 0.35)
    private let backgroundDark = Color(red: 0.02, green: 0.06, blue: 0.09)
    private let surfaceDark = Color(red: 0.12, green: 0.16, blue: 0.20)

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
            // Single timer view
            let remaining = timer.remaining(at: entry.date)
            let progress = timer.duration > 0 ? Double(remaining) / timer.duration : 0

            VStack(spacing: 4) {
                Text(timer.exerciseName)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                ZStack {
                    Circle()
                        .stroke(surfaceDark, lineWidth: 3)
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(accentGreen, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .rotationEffect(.degrees(-90))

                    Text("\(remaining)")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundColor(.white)
                }
                .frame(width: 50, height: 50)

                Text("sec")
                    .font(.system(size: 9))
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(backgroundDark)
        } else {
            // Multiple timers - show count and first timer
            let firstTimer = entry.timers[0]
            let remaining = firstTimer.remaining(at: entry.date)

            VStack(spacing: 2) {
                HStack(spacing: 4) {
                    Image(systemName: "timer")
                        .font(.system(size: 12))
                        .foregroundColor(accentGreen)
                    Text("\(entry.timers.count) Timers")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white)
                }

                Text("\(remaining)s")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)

                Text(firstTimer.exerciseName)
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(backgroundDark)
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
    SimpleEntry(date: .now, timers: [], isPlaceholder: true)
    SimpleEntry(date: .now, timers: [
        TimerData(exerciseId: "1", exerciseName: "Bench Press", duration: 90, endDate: Date().addingTimeInterval(45).timeIntervalSince1970)
    ], isPlaceholder: false)
}
