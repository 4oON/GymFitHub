# Active Workout Timer UI 修复计划

## 问题分析

### 当前 GlobalTimer 组件的问题

1. **位置遮挡问题**
   - 当前倒计时条固定在顶部 (`top-0`)
   - 在 Workout 页面时 `pt-14`，其他页面 `pt-2`
   - 悬浮条可能会遮挡返回按钮等重要 UI 元素
   - z-index 为 100，可能与其他元素冲突

2. **当前实现特点**
   - 位置：`fixed top-0 left-0 right-0`
   - 高度：`h-12` (48px)
   - 支持多个计时器同时显示
   - 包含进度条、倒计时显示、+30s 按钮、Done 按钮
   - 根据 `currentScreen` 调整 padding

3. **Toast 组件特点**
   - 位置：`absolute top-20` 居中显示
   - 自动消失机制
   - 半透明背景 + backdrop-blur
   - z-index: 9999
   - 不会遮挡重要 UI

## 解决方案设计

### 新的 Toast 风格倒计时条

#### 核心设计原则
1. **非侵入式定位**：使用 `fixed bottom` 定位，避免遮挡顶部导航
2. **保持持久性**：不自动消失，直到倒计时结束或用户手动完成
3. **跨页面一致性**：无论在哪个页面都保持相同位置和样式
4. **功能完整性**：保留所有现有功能（+30s、Done、多计时器支持）

#### 视觉设计
```
位置：fixed bottom-4 left-1/2 -translate-x-1/2
尺寸：max-w-md w-full (响应式)
高度：紧凑型 h-16 (64px)
层级：z-[9999] (与 Toast 相同，确保最高优先级)
样式：
  - 半透明背景 bg-slate-900/95
  - 毛玻璃效果 backdrop-blur-xl
  - 圆角 rounded-2xl
  - 边框 border border-emerald-500/30
  - 阴影 shadow-2xl
```

#### 布局结构
```
┌─────────────────────────────────────────┐
│ [Timer Icon] Exercise Name    [+30s] [✓]│
│              2:53                        │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────┘
```

#### 多计时器处理
- 主计时器（最早的）显示在最前面
- 其他计时器以小标签形式显示在底部
- 或者使用轮播/堆叠方式显示

### 技术实现要点

#### 1. 定位策略
```tsx
className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] px-4"
```

#### 2. 响应式设计
```tsx
style={{ maxWidth: '90vw', width: '400px' }}
```

#### 3. 动画效果
- 入场：从底部滑入 + 淡入
- 退场：向底部滑出 + 淡出
- 过渡：smooth transition-all duration-300

#### 4. 状态管理
- 保持现有的 timer state 结构
- 不改变父组件的 timer 管理逻辑
- 只改变 UI 呈现方式

## 实现步骤

### Phase 1: 重构 GlobalTimer 组件
1. 修改定位从 `top` 到 `bottom`
2. 调整 z-index 到 9999
3. 移除 `currentScreen` 相关的条件 padding
4. 简化布局，采用更紧凑的设计

### Phase 2: 优化视觉效果
1. 参考 Toast 组件的样式
2. 添加入场/退场动画
3. 优化进度条显示
4. 改进多计时器的显示方式

### Phase 3: 测试验证
1. 测试在不同页面的显示效果
2. 验证不会遮挡任何重要 UI
3. 确认所有功能正常工作
4. 测试多计时器场景

## 代码变更清单

### 文件修改
- `frontend/src/features/workout/components/GlobalTimer.tsx`
  - 修改定位和样式
  - 优化布局结构
  - 添加动画效果

### 不需要修改的文件
- `frontend/src/features/workout/components/InProgressWorkout.tsx` (timer 逻辑不变)
- `frontend/src/components/Toast.tsx` (保持独立)
- 父组件的 timer 管理逻辑

## 预期效果

### 优点
1. ✅ 不会遮挡顶部返回按钮
2. ✅ 在所有页面保持一致的位置
3. ✅ 更符合 Toast 通知的交互习惯
4. ✅ 视觉上更加优雅和现代
5. ✅ 保持所有现有功能

### 用户体验改进
- 倒计时信息始终可见但不干扰操作
- 底部位置更符合移动端操作习惯
- 与 Toast 通知形成统一的设计语言
- 更容易触达操作按钮（+30s、Done）

## 兼容性考虑

- 保持与现有 timer 状态管理的完全兼容
- 不影响其他组件的功能
- 响应式设计适配不同屏幕尺寸
- 动画性能优化，避免卡顿