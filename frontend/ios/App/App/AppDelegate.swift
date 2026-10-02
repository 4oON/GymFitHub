import UIKit
import Capacitor
import WebKit
import UserNotifications
import CapApp_SPM

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // 直接在 AppDelegate 创建 window，绕过 Scene 机制
        // 这是最可靠的方式，不依赖 Info.plist 的 Scene 配置
        let bridgeVC = BridgeViewController()

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.backgroundColor = UIColor(red: 0x0F/255, green: 0x11/255, blue: 0x15/255, alpha: 1)
        window?.rootViewController = bridgeVC
        window?.makeKeyAndVisible()

        // 允许 Safari Web Inspector 调试
        DispatchQueue.main.async {
            if #available(iOS 16.4, *) {
                bridgeVC.webView?.isInspectable = true
            }
        }

        // 设置本地通知代理，确保 App 在前台时也能展示横幅并播放声音
        UNUserNotificationCenter.current().delegate = self

        return true
    }

    // MARK: - URL Scheme 处理（锁屏 Live Activity 的 +30s / Done 按钮）

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        handleRestURL(url)
        return true
    }

    private func handleRestURL(_ url: URL) {
        guard url.scheme == "gymfithub", url.host == "rest" else { return }
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return }
        guard let exerciseId = components.queryItems?.first(where: { $0.name == "exerciseId" })?.value,
              !exerciseId.isEmpty else { return }

        let action = url.path
        if action == "/extend" {
            let secondsStr = components.queryItems?.first(where: { $0.name == "seconds" })?.value ?? "30"
            let seconds = Double(secondsStr) ?? 30
            TimerEngine.shared.extendRest(exerciseId: exerciseId, bySeconds: seconds)
        } else if action == "/done" {
            TimerEngine.shared.finishRest(exerciseId: exerciseId)
        }
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// App 在前台收到本地通知时，仍展示横幅并播放声音
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        if #available(iOS 14.0, *) {
            completionHandler([.banner, .sound, .badge])
        } else {
            completionHandler([.alert, .sound, .badge])
        }
    }

    /// 用户点击通知时进入此处，可用于后续跳转
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        completionHandler()
    }
}
