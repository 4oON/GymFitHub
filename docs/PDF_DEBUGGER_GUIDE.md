# PDF 布局调试器使用指南

## 📋 概述

PDF 布局调试器是一个专门用于调试和优化 ZenFit PDF 导出布局的工具。它提供了一个可视化界面，允许你实时调整 PDF 布局参数并预览效果。

## 🎯 功能特性

### 1. 实时参数调整
- **左侧控制面板**：使用滑动条调整各种布局参数
- **右侧预览区域**：实时显示 PDF 预览（带防抖优化，避免卡顿）
- **参数分组**：Hero Metrics、Table、Global 三大类别

### 2. 快捷操作
- **重置为默认值**：一键恢复到代码中的原始配置
- **应用建议配置**：使用优化后的推荐参数
- **下载 PDF**：使用当前配置生成并下载 PDF 文件

### 3. 可调参数

#### Hero Metrics 区域
| 参数 | 说明 | 范围 | 默认值 | 建议值 |
|------|------|------|--------|--------|
| `labelToValueGap` | 标签到数字的垂直间距 | 18-30mm | 22mm | 24mm |
| `charSpacing` | Inter 标签的字间距 | 0.5-3mm | 1.2mm | 1.5mm |
| `dividerX` | 左侧数据与右侧指标的水平分割线位置 | 80-110mm | 92mm | 95mm |
| `heroFontSize` | 大数字（如 3,080）的字号 | 60-84pt | 72pt | 72pt |
| `rowTopY` | 顶部标签起始高度偏移 | 0-10mm | 0mm | 5mm |
| `rightPaddingRight` | SETS 等右侧指标的右边距 | 0-8mm | 2mm | 4mm |

#### Table 区域
| 参数 | 说明 | 范围 | 默认值 | 建议值 |
|------|------|------|--------|--------|
| `titleGap` | EXERCISE DETAILS 标题与横线的间距 | 4-12mm | 6mm | 8mm |
| `headerFontSize` | 表头字号 | 6-10pt | 8pt | 8pt |
| `headerCharSpacing` | 表头字间距 | 0.3-1.5mm | 0.6mm | 0.6mm |
| `rowHeight` | 表格行高 | 7-12mm | 9mm | 9mm |

#### Global 配置
| 参数 | 说明 | 范围 | 默认值 |
|------|------|------|--------|
| `margin` | 页面边距 | 15-25mm | 20mm |
| `lineWidth` | 线条宽度 | 0.1-0.5mm | 0.2mm |

## 🚀 使用方法

### 方法 1: 在开发者测试面板中使用（推荐）

1. 打开 `frontend/src/dev/components/DeveloperTestPanel.tsx`

2. 添加 PDF 调试器标签页：

```tsx
import { PDFDebugger } from '@/features/export/components/PDFDebugger';

// 在组件中添加新的标签页
const tabs = [
  // ... 其他标签页
  {
    id: 'pdf-debugger',
    label: 'PDF 调试器',
    component: <PDFDebugger session={mockSession} userProfile={mockProfile} />
  }
];
```

3. 准备测试数据：

```tsx
const mockSession: WorkoutSession = {
  id: 'test-session',
  date: new Date().toISOString(),
  durationMinutes: 60,
  volumeLoad: 3080,
  exercises: [
    {
      id: 'ex-1',
      exerciseName: '杠铃深蹲',
      muscleGroup: 'Legs',
      sets: [
        { id: 's1', weight: 100, reps: 10, completed: true },
        { id: 's2', weight: 100, reps: 10, completed: true },
        { id: 's3', weight: 100, reps: 8, completed: true }
      ]
    },
    // ... 更多动作
  ]
};

const mockProfile: UserProfile = {
  id: 'user-1',
  name: '测试用户',
  weight: 75,
  height: 175,
  age: 30,
  gender: 'male'
};
```

### 方法 2: 创建独立路由

1. 在 `frontend/src/App.tsx` 中添加路由：

```tsx
import { PDFDebugger } from '@/features/export/components/PDFDebugger';

// 在路由配置中添加
<Route 
  path="/pdf-debugger" 
  element={<PDFDebugger session={session} userProfile={profile} />} 
/>
```

2. 访问 `http://localhost:5173/pdf-debugger`

### 方法 3: 在现有页面中集成

```tsx
import { PDFDebugger } from '@/features/export/components/PDFDebugger';

function MyComponent() {
  const [showDebugger, setShowDebugger] = useState(false);

  return (
    <>
      <button onClick={() => setShowDebugger(true)}>
        打开 PDF 调试器
      </button>
      
      {showDebugger && (
        <div className="fixed inset-0 z-50">
          <PDFDebugger 
            session={currentSession} 
            userProfile={currentProfile} 
          />
        </div>
      )}
    </>
  );
}
```

## 🔧 已修复的问题

### 1. SETS 右对齐问题 ✅
**问题描述**：SETS 指标的数字没有与顶部的黑色粗横线右端对齐。

**修复方案**：
- 修改了 [`drawHeroMetrics()`](../frontend/src/features/export/services/PDFExportService.ts:488) 函数
- SETS 的 x 坐标现在设置为 `pageWidth - margin`
- 数字右边缘距离页面右边距 `rightPaddingRight` mm

**代码位置**：
```typescript
// frontend/src/features/export/services/PDFExportService.ts:565
const metrics = [
  { label: 'DURATION', val: session.durationMinutes || 0, unit: 'MIN', x: dividerX + 8 },
  { label: 'CALORIES', val: advancedCalories, unit: 'KCAL', x: dividerX + 48 },
  { label: 'SETS', val: totalSets, unit: '', x: pageWidth - margin } // 与页面右边距对齐
];
```

### 2. 多余辅助线删除 ✅
**问题描述**：MUSCLE ACTIVATION ANALYSIS 标题上方有一条多余的分割线。

**修复方案**：
- 删除了 line 809 的分割线代码
- 保留了以下必要的线条：
  - [`drawSwissHeader()`](../frontend/src/features/export/services/PDFExportService.ts:401) 中的粗线（页眉分割线）
  - [`drawHeroMetrics()`](../frontend/src/features/export/services/PDFExportService.ts:488) 中的垂直细线（数据分割线）
  - [`drawMinimalTable()`](../frontend/src/features/export/services/PDFExportService.ts:270) 中的表头线和行分割线
  - [`drawVerticalStackedBar()`](../frontend/src/features/export/services/PDFExportService.ts:645) 中的图表线

**代码位置**：
```typescript
// frontend/src/features/export/services/PDFExportService.ts:793
// 删除了这段代码：
// doc.setDrawColor(226, 232, 240);
// doc.setLineWidth(0.2);
// doc.line(margin, currentY - 6, margin + contentWidth, currentY - 6);
```

### 3. 参数可配置化 ✅
**问题描述**：所有布局参数都是硬编码的，难以调整和优化。

**修复方案**：
- 创建了 [`PDFConfig`](../frontend/src/features/export/types/PDFConfig.ts) 接口
- 提取了所有硬编码参数到配置对象
- 修改了 [`generateWorkoutPDF()`](../frontend/src/features/export/services/PDFExportService.ts:750) 函数接受配置参数
- 所有绘图函数现在都使用配置对象中的值

## 📁 文件结构

```
frontend/src/features/export/
├── types/
│   └── PDFConfig.ts              # PDF 配置接口和默认值
├── components/
│   └── PDFDebugger.tsx           # 调试器组件
├── services/
│   └── PDFExportService.ts       # PDF 生成服务（已更新）
└── constants/
    └── pdfStyles.ts              # PDF 样式常量

docs/
└── PDF_DEBUGGER_GUIDE.md         # 本文档

test_pdf_debugger.html            # 测试页面
```

## 🎨 界面预览

```
┌─────────────────────────────────────────────────────────────┐
│  PDF 布局调试器                                              │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  控制面板    │              PDF 预览区域                    │
│              │                                              │
│  ┌────────┐  │  ┌────────────────────────────────────┐    │
│  │ 重置   │  │  │                                    │    │
│  │ 建议   │  │  │         PDF 实时预览               │    │
│  │ 下载   │  │  │                                    │    │
│  └────────┘  │  │                                    │    │
│              │  │                                    │    │
│  Hero Metrics│  │                                    │    │
│  ┌────────┐  │  │                                    │    │
│  │ 滑动条 │  │  │                                    │    │
│  └────────┘  │  │                                    │    │
│              │  │                                    │    │
│  Table       │  │                                    │    │
│  ┌────────┐  │  │                                    │    │
│  │ 滑动条 │  │  │                                    │    │
│  └────────┘  │  └────────────────────────────────────┘    │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## 💡 使用技巧

### 1. 快速找到最佳参数
1. 先点击"应用建议配置"查看优化后的效果
2. 根据实际需求微调个别参数
3. 使用"下载 PDF"保存当前配置的结果

### 2. 对比不同配置
1. 调整参数后，等待预览更新（500ms 防抖）
2. 如果不满意，点击"重置为默认值"
3. 重新尝试其他参数组合

### 3. 参数调整建议
- **增加呼吸感**：增大 `charSpacing` 和 `labelToValueGap`
- **紧凑布局**：减小 `rowHeight` 和 `titleGap`
- **对齐优化**：调整 `dividerX` 和 `rightPaddingRight`

## 🐛 故障排除

### 问题 1: 预览不显示
**原因**：可能是 session 或 userProfile 数据不完整

**解决方案**：
```typescript
// 确保数据结构完整
const session = {
  id: 'xxx',
  date: new Date().toISOString(),
  durationMinutes: 60,
  volumeLoad: 3000,
  exercises: [/* 至少一个动作 */]
};
```

### 问题 2: 调整参数后没有反应
**原因**：防抖延迟（500ms）

**解决方案**：等待 0.5 秒后预览会自动更新

### 问题 3: 下载的 PDF 与预览不一致
**原因**：浏览器 PDF 渲染差异

**解决方案**：以下载的 PDF 为准，预览仅供参考

## 📝 开发说明

### 添加新的可调参数

1. 在 [`PDFConfig.ts`](../frontend/src/features/export/types/PDFConfig.ts) 中添加参数：

```typescript
export interface PDFConfig {
  // ... 现有参数
  newSection: {
    newParameter: number;  // 新参数
  };
}
```

2. 在 [`PDFDebugger.tsx`](../frontend/src/features/export/components/PDFDebugger.tsx) 中添加滑动条：

```tsx
<SliderControl
  label="新参数说明"
  value={config.newSection.newParameter}
  min={0}
  max={100}
  step={1}
  unit="mm"
  onChange={(val) => updateConfig(['newSection', 'newParameter'], val)}
/>
```

3. 在 [`PDFExportService.ts`](../frontend/src/features/export/services/PDFExportService.ts) 中使用参数：

```typescript
const value = config.newSection.newParameter;
// 使用 value 进行布局计算
```

## 🔗 相关文档

- [PDF 生成技术文档](./PDF_GENERATION_TECHNICAL_DOCUMENTATION.md)
- [PDF 布局优化](./PDF_LAYOUT_OPTIMIZATION.md)
- [PDF Swiss 风格重构](./PDF_SWISS_STYLE_REFACTOR.md)

## 📞 支持

如有问题或建议，请联系开发团队或在项目中提交 Issue。