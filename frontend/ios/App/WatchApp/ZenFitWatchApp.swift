import SwiftUI

@main
struct ZenFitWatchApp: App {
    var body: some Scene {
        WindowGroup {
            WatchTimerView()
                .environmentObject(WatchSessionManager.shared)
        }
    }
}
