# iOS 兼容性修复总结

## 修复日期
2026-03-21

## 问题列表

### 1. ✅ 黑屏崩溃 (Black Screen Crashes)
**原因**: 
- `alert()` / `confirm()` 被 iOS WebView 阻止
- `localStorage` 在 iOS 隐私模式下抛出异常

**修复文件**:
| 文件 | 修复内容 |
|------|----------|
| `MobileWorkoutReportModal.tsx` | 移除 `alert(errorMessage)` (2处) |
| `WorkoutReportModal.tsx` | 移除 `alert(errorMessage)` (2处) |
| `WeeklyReportViewer.tsx` | 移除 `alert()` (2处) |
| `AIModelConfigModal.tsx` | 移除 `confirm()`, 改为直接执行 |
| `AiResultPreview.tsx` (ai) | 替换 `alert()` 为状态错误显示 |
| `AiResultPreview.tsx` (routine) | 替换 `alert()` 为状态错误显示 |

### 2. ✅ localStorage 崩溃
**原因**: iOS 隐私模式禁用 localStorage，访问会抛出 `QuotaExceededError`

**修复文件**:
| 文件 | 修复内容 |
|------|----------|
| `EnhancedAIRecommendationServiceV2.ts` | 添加 try-catch 包裹 localStorage (3处) |
| `EnhancedAIRecommendationService.ts` | 添加 try-catch 包裹 localStorage |
| `AIConfigStorageService.ts` | 添加 try-catch 到 `clearConfig()` |
| `AIWorkoutRecommendationService.ts` | 添加 try-catch 到 `isAICoachAvailable()` |

### 3. ✅ Training Coach 不显示推荐
**修复**: 
- 修复了 Sunday (day === 0) 分支缺少 `nextSessionSuggestion` 的问题
- 添加了 `safeStorage` 包装器确保 iOS 兼容性
- 视频元素添加 `playsinline` 和 `webkit-playsinline` 属性

### 4. ✅ AI Suggestions 面板缺失
**原因**: 
- 应用重新安装后历史数据为空，导致推荐数组为空
- 条件渲染 `historyBasedRecommendations.length > 0` 阻止了面板显示

**状态**: 这不是 bug，而是设计行为。当没有历史数据时，面板不会显示。用户需要先进行一些训练记录。

---

## 修复代码示例

### Safe Storage 包装器
```typescript
// 所有 localStorage 调用必须使用此包装器
const safeStorage = {
  getItem: (key: string) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  },
  removeItem: (key: string) => {
    try { localStorage.removeItem(key); return true; } catch { return false; }
  }
};
```

### 替代 alert/confirm
```typescript
// ❌ 不要这样做
alert('Error message');
if (confirm('Are you sure?')) { ... }

// ✅ 使用 React 状态
const [error, setError] = useState<string | null>(null);
{error && <ErrorModal message={error} onClose={() => setError(null)} />}
```

---

## 测试建议

### iOS Safari 测试
1. 正常模式下访问 AI 报告
2. 隐私模式下访问 AI 报告
3. 检查控制台无 localStorage 错误

### iOS WebView 测试 (Capacitor)
1. 连接 Xcode 查看设备日志
2. 检查是否有 JavaScript 异常
3. 验证所有功能正常工作

---

## 文件变更列表

```
frontend/src/features/ai/services/EnhancedAIRecommendationServiceV2.ts
frontend/src/features/ai/services/EnhancedAIRecommendationService.ts
frontend/src/features/ai/services/AIConfigStorageService.ts
frontend/src/features/ai/services/AIWorkoutRecommendationService.ts
frontend/src/features/ai/components/AIModelConfigModal.tsx
frontend/src/features/ai/components/AiResultPreview.tsx
frontend/src/features/report/components/MobileWorkoutReportModal.tsx
frontend/src/features/report/components/WorkoutReportModal.tsx
frontend/src/features/report/components/WeeklyReportViewer.tsx
frontend/src/features/report/components/WeeklyTrainingCoachCard.tsx
frontend/src/features/report/components/RecommendedExerciseCard.tsx
frontend/src/features/routine/components/AiResultPreview.tsx
```

---

## 后续行动

1. **测试**: 在 iOS 设备上测试所有 AI 功能
2. **监控**: 发布后监控 Sentry/日志中的 iOS 错误
3. **文档**: 更新 AGENTS.md 中的 iOS 开发指南
4. **代码审查**: 确保新代码遵循 iOS 安全规则

---

## 相关文档

- `docs/IOS_DEBUGGING_GUIDE.md` - 完整的 iOS 调试指南
- `AGENTS.md` - 项目 iOS 兼容性规则
