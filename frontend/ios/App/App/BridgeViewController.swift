import UIKit
import Capacitor
import WebKit
import CapApp_SPM

class BridgeViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        applyDarkBackground()
        setupNativeIntegrations()
    }

    /// 原生集成：注册自定义计时器插件 + 激活 WatchConnectivity 会话
    private func setupNativeIntegrations() {
        guard let bridge = bridge else { return }
        let timerPlugin = WorkoutTimerPlugin()
        bridge.registerPluginInstance(timerPlugin)
        WatchSessionManager.shared.activate()
        WatchSessionManager.shared.onWatchFinishRequest = { exerciseId in
            TimerEngine.shared.finishRest(exerciseId: exerciseId)
        }
        TimerEngine.shared.requestNotificationPermissionIfNeeded()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // 调试：打印 safe area 值
        if let webView = webView {
            print("=== Safe Area Debug ===")
            print("view.safeAreaInsets:", view.safeAreaInsets)
            print("webView.safeAreaInsets:", webView.safeAreaInsets)
            print("webView.frame:", webView.frame)
            print("view.bounds:", view.bounds)
            print("webView.scrollView.contentInset:", webView.scrollView.contentInset)
            print("webView.scrollView.adjustedContentInset:", webView.scrollView.adjustedContentInset)
        }

        applyDarkBackground()
    }

    private func applyDarkBackground() {
        let bgColor = UIColor(red: 0x02/255, green: 0x06/255, blue: 0x17/255, alpha: 1)

        view.backgroundColor = bgColor

        guard let webView = webView else { return }

        webView.backgroundColor = bgColor
        webView.isOpaque = true
        webView.scrollView.backgroundColor = bgColor

        // 强制禁用 iOS 自动 safe-area inset，避免 CSS env(safe-area-inset-bottom) 与 WebView 内边距叠加导致底部出现多余空间
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        if #available(iOS 13.0, *) {
            webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
        }

        // iOS 15+: 页面下方/回弹时的背景色
        if #available(iOS 15.0, *) {
            webView.underPageBackgroundColor = bgColor
        }

        // 清除 WebView 的默认背景视图
        webView.scrollView.subviews.forEach { subview in
            subview.backgroundColor = bgColor
        }

        // 确保滚动启用
        webView.scrollView.isScrollEnabled = true
        webView.scrollView.alwaysBounceVertical = true
        webView.scrollView.bounces = true
    }
}
