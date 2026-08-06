# iOS WebView 调试指南

## 问题诊断

### 黑屏/崩溃常见原因

1. **localStorage 访问失败** (iOS 隐私模式)
2. **alert()/confirm()/prompt() 被阻止** (iOS WebView 安全策略)
3. **视频 autoplay 没有 playsinline 属性**
4. **触摸事件处理不当**

---

## Safari 远程调试步骤

### 1. 启用 iPhone 调试

1. iPhone 设置 → Safari → 高级 → 打开"Web 检查器"
2. Mac Safari → 偏好设置 → 高级 → 勾选"在菜单栏中显示开发菜单"

### 2. 连接调试

1. 用 USB 连接 iPhone 到 Mac
2. 在 iPhone 上打开 ZenFit App
3. Mac Safari → 开发菜单 → 选择你的 iPhone → 选择 WebView
4. 查看 Console 标签页中的 JavaScript 错误

---

## 常见错误及解决方案

### 错误: `QuotaExceededError` 或 localStorage 访问失败

**症状**: 页面加载后黑屏，Console 显示 localStorage 错误

**原因**: iOS 隐私模式禁用 localStorage

**修复**: 所有 localStorage 调用必须包裹 try-catch

```typescript
// ✅ 正确做法
const safeStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  }
};

// ❌ 错误做法
data = localStorage.getItem('key'); // 会崩溃！
```

---

### 错误: `alert() / confirm() / prompt() 被阻止`

**症状**: 执行某些操作后应用无响应/黑屏

**原因**: iOS WebView 阻止这些浏览器 API

**修复**: 使用自定义 React 组件替代

```typescript
// ❌ 错误 - 会被阻止
alert('Error message');
if (confirm('Are you sure?')) { ... }

// ✅ 正确 - 使用状态管理显示自定义对话框
const [error, setError] = useState<string | null>(null);
const [showConfirm, setShowConfirm] = useState(false);

// 显示错误
{error && <ErrorModal message={error} onClose={() => setError(null)} />}

// 显示确认
{showConfirm && <ConfirmDialog 
  message="Are you sure?"
  onConfirm={() => { /* do action */ }}
  onCancel={() => setShowConfirm(false)}
/>}
```

---

### 错误: 视频无法播放/黑屏

**症状**: 训练视频无法显示或自动播放

**原因**: iOS 要求视频必须有 playsinline 属性

**修复**: 添加正确的视频属性

```typescript
// ✅ 正确做法
<video
  ref={videoRef}
  src={videoUrl}
  muted
  playsInline  // React camelCase
  webkit-playsinline="true"  // iOS 9-10 兼容
  style={{ touchAction: 'manipulation' }}
/>

// 或者用原生 DOM API
video.setAttribute('playsinline', 'true');
video.setAttribute('webkit-playsinline', 'true');
```

---

### 错误: 触摸目标太小

**症状**: 按钮点击不灵敏，特别是小图标按钮

**原因**: iOS 建议最小 44px 触摸目标

**修复**: 确保所有可点击元素最小 44x44px

```typescript
// ✅ 正确做法
<button className="p-3 min-w-[44px] min-h-[44px]">
  <Icon size={20} />
</button>

// 或使用 CSS
touch-action: manipulation;
```

---

## 检查清单

在发布到 iOS 前，确认以下项目：

- [ ] 所有 localStorage 调用有 try-catch
- [ ] 没有使用 alert()/confirm()/prompt()
- [ ] 视频元素有 playsinline 属性
- [ ] 触摸目标最小 44px
- [ ] 在 iOS Safari 测试过
- [ ] 在 iOS WebView (WKWebView) 测试过
- [ ] 在 iOS 隐私模式下测试过

---

## 快速修复命令

搜索项目中可能需要修复的代码：

```bash
# 查找所有 localStorage 使用
grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx"

# 查找所有 alert/confirm/prompt
grep -rn "alert(\|confirm(\|prompt(" src/ --include="*.ts" --include="*.tsx"

# 查找视频元素
grep -rn "<video" src/ --include="*.tsx"
```

---

## 相关文件 (已修复)

- `frontend/src/features/ai/services/EnhancedAIRecommendationServiceV2.ts`
- `frontend/src/features/ai/services/EnhancedAIRecommendationService.ts`
- `frontend/src/features/ai/services/AIConfigStorageService.ts`
- `frontend/src/features/ai/services/AIWorkoutRecommendationService.ts`
- `frontend/src/features/report/components/MobileWorkoutReportModal.tsx`
- `frontend/src/features/report/components/WorkoutReportModal.tsx`
- `frontend/src/features/report/components/WeeklyReportViewer.tsx`
- `frontend/src/features/ai/components/AIModelConfigModal.tsx`
- `frontend/src/features/report/components/WeeklySummaryCard.tsx`
- `frontend/src/features/report/components/WeeklyTrainingCoachCard.tsx`
- `frontend/src/features/report/components/RecommendedExerciseCard.tsx`
