import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // 直接在 AppDelegate 创建 window，绕过 Scene 机制
        // 这是最可靠的方式，不依赖 Info.plist 的 Scene 配置
        let bridgeVC = CAPBridgeViewController()

        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = bridgeVC
        window?.makeKeyAndVisible()

        // 允许 Safari Web Inspector 调试
        DispatchQueue.main.async {
            if #available(iOS 16.4, *) {
                bridgeVC.webView?.isInspectable = true
            }
        }

        return true
    }
}
