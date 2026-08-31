import UIKit
import Capacitor
import WebKit
import UserNotifications

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
