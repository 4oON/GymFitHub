# ZenFit iOS 原生编译全面评估报告

> 评估时间：2026-08-10
> 项目路径：`frontend/ios/App`
> 框架：Capacitor 8（Web → iOS 原生壳）

---

## 1. 底部导航栏多余空间问题（已修复）

### 🔴 Root Cause：双重 Safe Area 叠加

你的 Agent 反复修改 CSS 却始终无法消除底部多余空间，**根本问题在 Native 层，不在 CSS 层**。

| 层级 | 行为 | 结果 |
|------|------|------|
| **iOS WebView 默认行为** | `contentInsetAdjustmentBehavior = .automatic`（默认）会自动把 Web 内容的底边向上推一个 `safe-area-inset-bottom`（约 34px，Home Indicator 高度）。 | 此时 CSS `bottom: 0` 实际上已经位于 Home Indicator 上方。 |
| **CSS `.pb-safe`** | `padding-bottom: env(safe-area-inset-bottom)` 在 Nav 内部再补一次 34px。 | 按钮又被抬高 34px。 |
| **最终效果** | 按钮距物理屏幕底部 = 34px (WebView 自动 inset) + 34px (CSS padding) = **约 68px**。 | 用户看到的就是"导航栏下面多出来一大块背景"。 |

### ✅ 已应用的修复

**文件：`frontend/ios/App/App/BridgeViewController.swift`**

```swift
// 强制禁用 iOS 自动 safe-area inset
webView.scrollView.contentInsetAdjustmentBehavior = .never
if #available(iOS 13.0, *) {
    webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = false
}
```

**为什么这行是关键：**
- Capacitor 配置里写了 `contentInset: 'never'`，但这只影响 Capacitor 自身的逻辑，**不会修改 WKWebView 的 `contentInsetAdjustmentBehavior`**。
- 只有显式设为 `.never`，WebView 才会让 CSS 的 `bottom: 0` 贴到屏幕物理底部。
- 此时 CSS `env(safe-area-inset-bottom)` 正常生效，按钮刚好位于 Home Indicator 上方，**不会再出现多余的背景空档**。

### ⚠️ 需要配合的前端样式

你的 `MainApp.tsx` 中最新代码已经把 `pb-safe` 移到了外层容器、并且用了 `items-center py-2`，这是正确的写法，**与 `.never` 配合后效果最佳**。

如果之后发现按钮仍然偏上，可尝试把 `pb-safe` 的值改为只留 fallback：

```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## 2. iOS Native / Xcode 兼容性问题

### 2.1 SceneDelegate vs AppDelegate 生命周期冲突（⚠️ 中高风险）

- **现状**：`AppDelegate.swift` 里手动 `window = UIWindow(frame: UIScreen.main.bounds)` 绕过 Scene 机制；但 `SceneDelegate.swift` 仍然被编译进 Target，并且使用的是 `CAPBridgeViewController`（**不是你的自定义 `BridgeViewController`**）。
- **风险**：一旦 `Info.plist` 被意外加入 `UIApplicationSceneManifest`，或 iOS 未来版本行为变化，App 会启动 Scene 路径，导致：
  - 自定义的 `BridgeViewController` 被跳过，安全区域/背景色/Debug 设置全部失效。
  - 底部导航问题会重新出现。
- **已修复**：把 `SceneDelegate.swift` 里的 `CAPBridgeViewController()` 统一替换为 `BridgeViewController()`，保证即使走 Scene 路径也使用同样的配置。
- **建议**：在 Xcode 中把 `SceneDelegate.swift` 从 Target 的 **Compile Sources** 里移除（如果不需要多窗口），并删除 `Info.plist` 中可能残留的 `UIApplicationSceneManifest` 字段。

### 2.2 Main.storyboard 引用的是基类而非自定义类（⚠️ 低风险）

- `Main.storyboard` 里的 Initial View Controller 绑的是 `CAPBridgeViewController`，不是 `BridgeViewController`。
- 由于你已经在 `AppDelegate` 里用代码创建 window，storyboard 实际上不会被使用，所以不影响运行。
- **建议**：在 Xcode 中把 storyboard 里的 Class 改为 `BridgeViewController`，Module 改为 `CapApp_SPM`，保持代码与 Interface Builder 一致。

### 2.3 Capacitor 版本不完全对齐（⚠️ 低风险）

| 包 | 版本 |
|---|---|
| `@capacitor/core` | 8.2.0 |
| `@capacitor/ios` | 8.2.0 |
| `@capacitor/cli` | 8.5.0 |
| `CapApp-SPM` (SwiftPM) | exact 8.5.0 |

- 运行时 Native 侧是 8.5.0，JS 侧是 8.2.0。Capacitor 的 patch 版本差异通常向后兼容，但**建议统一升级到 8.5.0**，避免 subtle bridge 行为差异。
- 升级命令：`npm install @capacitor/core@8.5.0 @capacitor/ios@8.5.0`，然后 `npx cap sync ios`。

### 2.4 Xcode 项目文件异常值（⚠️ 低风险）

- `LastUpgradeCheck = 2660`：正常应为 `1500`（Xcode 15）或 `1600`（Xcode 16）。当前值无效，虽不阻断编译，但可能导致 Xcode 打开项目时弹出升级提示。
- `LastSwiftUpdateCheck = 0920`：过于陈旧。
- `ENABLE_USER_SCRIPT_SANDBOXING = YES`：如果你未来加入 Run Script Build Phase，脚本可能会被沙箱拦截。
- **建议**：用 Xcode 16 打开项目，执行 **Editor → Validate Settings**，让 Xcode 自动修正这些字段。

### 2.5 多余的 SPM 依赖（⚠️ 低影响）

- `swift-algorithms`、`swift-system`、`swift-numerics` 被 Link 进 App，但代码中没有任何引用。
- 结果：增加包体积和编译时间。
- **建议**：在 Xcode → Project → Package Dependencies 中移除这三个库。

### 2.6 HealthKit / CordovaPluginHealth（✅ 基本正确）

- `App.entitlements` 已配置 `com.apple.developer.healthkit` 和 `background-delivery`。
- `Info.plist` 已包含 `NSHealthShareUsageDescription` / `NSHealthUpdateUsageDescription`。
- `CapApp-SPM` 正确依赖了 `CordovaPluginHealth`。
- **注意**：`cordova-plugin-health` 需要在 Xcode 中开启 **HealthKit Capability**，并确保 `config.xml` 中的 feature 名称与插件一致。

---

## 3. Web 前端 iOS WebView 兼容性问题

### 3.1 `localStorage` 大量直接调用（🔴 高风险）

**现状**：项目中超过 50 处直接调用 `localStorage.getItem / setItem / removeItem`。

**风险**：
- iOS 隐私模式 / WKWebView 在某些情况下会禁用或限制 localStorage，直接调用会抛出 `QuotaExceededError` 或 `SecurityError`，导致白屏或功能崩溃。
- 你的 `AGENTS.md` 明确要求使用 `safeStorage` try-catch wrapper，但大量业务代码并未遵循。

**涉及文件（部分）**：
- `src/pages/MainApp.tsx`
- `src/services/HealthKitService.ts`
- `src/services/apiClient.ts`
- `src/features/report/services/WeeklySummaryService.ts`
- `src/hooks/useActiveWorkoutPersistence.ts`
- ...（共计 20+ 文件）

**建议**：
1. 在 `src/utils/safeStorage.ts` 中统一封装：
   ```ts
   export const safeStorage = {
     getItem(key: string): string | null {
       try { return localStorage.getItem(key); } catch { return null; }
     },
     setItem(key: string, value: string): boolean {
       try { localStorage.setItem(key, value); return true; } catch { return false; }
     },
     removeItem(key: string): boolean {
       try { localStorage.removeItem(key); return true; } catch { return false; }
     }
   };
   ```
2. 逐步把业务代码中的 `localStorage.*` 替换为 `safeStorage.*`。
3. `src/services/iOSStorageService.ts` 已经做了类似封装，但其他模块没有使用它。

### 3.2 `alert()` / `confirm()` 仍存在于生产代码（🔴 高风险）

**iOS WebView 会直接屏蔽 `alert()` / `confirm()` / `prompt()`**，导致调用处无响应或卡住。

**存在位置**：

| 文件 | 行号 | 场景 |
|---|---|---|
| `src/features/export/services/PDFExportService.ts` | 1209, 1223, 1244 | PDF 导出失败提示 |
| `src/features/export/services/JSONExportService.ts` | 615, 623, 643 | JSON 导出失败提示 |
| `src/features/export/services/PNGExportService.ts` | 232 | 分享提示 |
| `src/dev/components/WorkoutTestPanel.tsx` | 143 | 删除确认（`confirm`） |
| `src/dev/components/SVGPathImporter.tsx` | 223 | 复制成功提示 |
| `src/features/export/components/PDFDebugger.tsx` | 124, 134 | Debug 提示 |

**建议**：
- 生产路径（PDF/JSON/PNG Export）必须替换为自定义 React Modal 或 Toast 组件。
- Dev-only 代码可以保留，但建议统一风格。
- 你的 `src/shared/components/ui/ConfirmDialog.tsx` 已经是一个可用的替代方案，应在业务中推广使用。

### 3.3 `navigator.vibrate` 在 iOS WebView 中无效（⚠️ 低风险）

- `MainApp.tsx` 两处调用 `navigator.vibrate([200, 100, 200])`。
- iOS WKWebView **不支持 Vibration API**。代码里虽然加了 `if (navigator.vibrate)` 保护，不会崩溃，但也没有任何反馈。
- **建议**：如需原生震动感，接入 Capacitor **Haptics** 插件 (`@capacitor/haptics`)，调用 `Haptics.impact()` 或 `Haptics.notification()`。

### 3.4 `window` / `document` 事件与触摸优化（⚠️ 中风险）

- `body` 已设置 `-webkit-tap-highlight-color: transparent` 和 `-webkit-touch-callout: none`，这是正确的。
- 项目中未系统设置 `touch-action: manipulation`，建议给所有可点击元素加 `touch-action: manipulation` 防止 300ms 点击延迟。
- 没有系统检查 touch target 是否 ≥ 44px，需人工 review。

### 3.5 Viewport 与滚动（⚠️ 中风险）

- `index.html` 已配置 `viewport-fit=cover`，正确。
- `body` 有 `min-height: 100dvh` 和 `#root` 也有 `min-height: 100dvh`。在 iOS WebView 中，`-webkit-fill-available` 和 `dvh` 混用可能导致高度抖动。
- **建议**：统一使用 `h-[100dvh]` 并在关键容器上关闭 `-webkit-fill-available` fallback，或确保 `html`/`body` 不额外设置 `min-height` 造成滚动容器嵌套。

---

## 4. 构建与部署建议

### 4.1 清理与重建流程

在修复上述 Native 代码后，请按以下顺序重建，避免缓存导致旧代码残留：

```bash
cd /Users/skl/Documents/GymFitHub/frontend

# 1. 重新构建前端
npm run build

# 2. 同步到 iOS 项目
npx cap sync ios

# 3. 在 Xcode 中清理
# Product → Clean Build Folder (Shift+Cmd+K)
# Product → Build (Cmd+B)

# 4. 建议先用模拟器验证 safe area
# iPhone 16 Pro (带 Home Indicator) + iPhone SE (无 Home Indicator)
```

### 4.2 建议的测试矩阵

| 设备/模拟器 | 测试重点 |
|---|---|
| iPhone 16 Pro / 15 Pro | 底部 Home Indicator 区域是否无多余空白；Dark Background 是否铺满；震动反馈是否可用 |
| iPhone SE (3rd gen) | 无 Home Indicator 时 `pb-safe` 是否变为 0；布局是否无异常 |
| iPad Air | 旋转、多窗口、Split View 下的导航栏表现 |

---

## 5. 修复清单总览

| # | 问题 | 严重程度 | 状态 | 负责文件 |
|---|---|---|---|---|
| 1 | 底部导航多余空间（双重 Safe Area） | 🔴 高 | ✅ 已修复 | `BridgeViewController.swift` |
| 2 | SceneDelegate 与 AppDelegate 类不一致 | 🟡 中 | ✅ 已修复 | `SceneDelegate.swift` |
| 3 | localStorage 无保护大量调用 | 🔴 高 | ⏳ 待修复 | 20+ TS 文件 |
| 4 | alert()/confirm() 被 iOS 屏蔽 | 🔴 高 | ⏳ 待修复 | Export Services, Dev panels |
| 5 | Capacitor 版本不一致 | 🟡 中 | ⏳ 建议 | `package.json` |
| 6 | Xcode 项目字段异常 | 🟡 低 | ⏳ 建议 | `project.pbxproj` |
| 7 | 多余 SPM 依赖 | 🟢 低 | ⏳ 建议 | Xcode Package Dependencies |
| 8 | navigator.vibrate 无效 | 🟢 低 | ⏳ 可选 | `MainApp.tsx` |
| 9 | Touch target / touch-action 未统一 | 🟡 中 | ⏳ 建议 | 全局 CSS / 组件 |

---

## 6. 下一步行动建议（按优先级）

1. **立即**：在 Xcode 中 `Clean Build Folder` → `Build`，确认底部导航栏在 iPhone 16 Pro 模拟器上正常贴合。
2. **本周**：
   - 创建 `safeStorage` 统一封装，把 `localStorage` 调用集中替换。
   - 把 Export Services 中的 `alert()` 替换为 Toast / Modal。
3. **下次发版前**：
   - 统一 Capacitor 版本到 `8.5.0`。
   - 清理 Xcode 中的无效 SPM 依赖和项目字段。
   - 接入 `@capacitor/haptics` 替代 `navigator.vibrate`。

---

*报告由 Mobile App Builder 专家生成。*
