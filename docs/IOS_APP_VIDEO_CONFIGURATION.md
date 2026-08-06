# iOS App 视频配置指南

## 前端代码标准（已完成）

当前的 `VideoPlayer.tsx` 已经达到**工业级标准**，适用于 iOS App (WKWebView) 环境。

### 关键实现

1. **双保险属性设置**
   - JSX: `playsInline`
   - DOM: `video.setAttribute('webkit-playsinline', 'true')`
   - 确保兼容不同版本的iOS系统组件

2. **防止全屏劫持**
   - `disablePictureInPicture = true`
   - `controlsList="nofullscreen"`
   - `onClick` 中 `preventDefault()` + `stopPropagation()`

3. **性能优化**
   - `IntersectionObserver` 懒加载
   - 移除"离开视口暂停"逻辑（避免Freeze）
   - 静音循环播放（Muted + Loop）

4. **完整的iOS属性**
   ```typescript
   video.setAttribute('playsinline', 'true');
   video.setAttribute('webkit-playsinline', 'true');
   video.setAttribute('x5-playsinline', 'true');
   video.setAttribute('x5-video-player-type', 'h5');
   video.setAttribute('x5-video-player-fullscreen', 'false');
   ```

## ⚠️ 原生端必要配置

如果视频在iOS App中**依然**出现全屏问题，需要检查原生端配置：

### Swift 配置示例

```swift
// 在初始化 WKWebViewConfiguration 时
let configuration = WKWebViewConfiguration()
configuration.allowsInlineMediaPlayback = true  // ⚠️ 必须为 true
let webView = WKWebView(frame: .zero, configuration: configuration)
```

### Objective-C 配置示例

```objc
WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
configuration.allowsInlineMediaPlayback = YES;  // ⚠️ 必须为 YES
WKWebView *webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:configuration];
```

## 问题排查

### 如果视频依然全屏

1. ✅ 前端代码已经标准化（本次更新）
2. ❓ 检查原生端 `allowsInlineMediaPlayback` 是否为 `true`
3. ❓ 检查iOS版本（建议iOS 10+）
4. ❓ 检查是否开启了低电量模式（会阻止自动播放）

### 如果视频缩小后Freeze

1. ✅ 已移除"离开视口暂停"逻辑
2. ✅ 使用静音循环播放保持React控制
3. ❓ 检查内存占用（App环境内存管理严格）

## 测试环境

- **主要测试环境**: iOS App (WKWebView)
- **不测试**: Safari浏览器、微信浏览器
- **目标**: App内视频完全无问题

## 技术原理

### 为什么需要setAttribute？

React的JSX无法正确传递非标准HTML属性（如`webkit-playsinline`）。必须通过`setAttribute()`直接操作DOM。

### 为什么不暂停视频？

在App环境中，反复的`pause()`和`play()`容易触发WebView渲染挂起。让视频保持静音循环是最稳健的做法。

### 为什么需要preventDefault？

iOS的WKWebView会尝试调用`AVPlayerViewController`进行全屏劫持。`preventDefault()`能有效拦截点击穿透。

## 更新日志

- **2025-12-27**: 根据专业建议重构VideoPlayer，达到工业级标准
- 修复iOS视频乱放大问题
- 修复缩小后Freeze问题
- 优化自动播放逻辑
- 完善iOS属性设置