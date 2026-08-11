# 待办 / TODO

## 后台计时器本地通知（高优先级）

**问题**：iOS 上训练组间休息倒计时在 App 切后台后会被系统冻结，`requestAnimationFrame` / `setInterval` 停止执行。用户切到其他 App 后，1:30 的休息时间会一直卡在后台，直到切回 App 才继续并触发提醒。

**影响文件**：
- `src/pages/MainApp.tsx`（全局计时器逻辑、Haptics 震动调用）
- `src/features/workout/components/GlobalTimer.tsx`

**推荐方案**：
1. 新建分支 `feature/background-timer-notifications`
2. 引入 `@capacitor/local-notifications`
3. 切后台时把剩余真实时间交给 iOS `UNUserNotificationCenter`
4. 通知到达时播放声音 + Haptics 震动
5. 切回 App 时清理已触发通知
6. 申请 iOS 通知权限，更新 `Info.plist` / entitlements
7. 真机后台测试 5/10/90 秒三种场景

**为什么重要**：这是 iOS App 训练场景的核心可用性问题；没有后台提醒，组间休息功能不可靠。

---

*最后更新：2026-08-11*
