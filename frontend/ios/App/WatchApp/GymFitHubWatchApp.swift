import SwiftUI

@main
struct GymFitHubWatchApp: App {
    var body: some Scene {
        WindowGroup {
            WatchTimerView()
                .environmentObject(WatchSessionManager.shared)
        }
    }
}
