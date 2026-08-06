# Share Card 集成指南

## 快速开始

### 1. 基本使用

```tsx
import { ShareButton, transformToShareData } from '@/features/share';
import type { AIWeeklySummary } from '@/features/report/services/WeeklySummaryService';

// 在组件中使用
const MyComponent = ({ summary }: { summary: AIWeeklySummary }) => {
  // 转换数据
  const shareData = transformToShareData(summary, { language: 'zh' });

  return (
    <div>
      {/* 其他内容 */}
      <ShareButton 
        data={shareData}
        variant="default"
        size="md"
        onShareSuccess={() => console.log('分享成功')}
      />
    </div>
  );
};
```

### 2. 在 WeeklySummaryCard 中集成

修改 `WeeklySummaryCard.tsx`，添加分享按钮：

```tsx
import { ShareButton, fromAIWeeklySummary } from '@/features/share';

// 在组件 render 中
const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  userProfile,
  recoveryState,
  onOpenFullAnalysis,
  className = ''
}) => {
  const [summary, setSummary] = useState<AIWeeklySummary | null>(null);
  
  // ... 其他代码

  // 转换分享数据
  const shareData = summary ? fromAIWeeklySummary(summary, { language }) : null;

  return (
    <motion.div className="...">
      {/* Header 部分 */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* ... Logo 和标题 */}
          </div>
          
          <div className="flex items-center gap-2">
            {/* 添加分享按钮 */}
            {shareData && (
              <ShareButton 
                data={shareData}
                variant="minimal"
                size="sm"
                onShareSuccess={() => console.log('分享成功')}
              />
            )}
            
            {/* 其他按钮... */}
          </div>
        </div>
      </div>
      
      {/* 其他内容... */}
    </motion.div>
  );
};
```

### 3. 数据转换方式

#### 从 AIWeeklySummary 转换
```tsx
import { fromAIWeeklySummary } from '@/features/share';

const shareData = fromAIWeeklySummary(summary, { language: 'zh' });
```

#### 从 WeeklyReport 转换
```tsx
import { fromWeeklyReport } from '@/features/share';

const shareData = fromWeeklyReport(report, { 
  language: 'zh',
  overview: 'AI评价文本',
  tokenUsage: { total_tokens: 1500, prompt_tokens: 1000, completion_tokens: 500 },
  estimatedCost: { totalCost: 0.05 },
  isAIGenerated: true
});
```

#### 从简单数据转换
```tsx
import { fromSimpleData } from '@/features/share';

const shareData = fromSimpleData({
  workoutDays: 3,
  totalSets: 66,
  totalVolume: 41508,
  dateRange: '2026-03-16 ~ 2026-03-22',
  volumeLevel: 'excessive',
  volumeLabel: '过量',
  language: 'zh'
});
```

### 4. 按钮样式变体

```tsx
// 默认样式（带边框）
<ShareButton data={shareData} variant="default" />

// 极简样式（透明背景）
<ShareButton data={shareData} variant="minimal" />

// 浮动按钮（突出显示）
<ShareButton data={shareData} variant="floating" />

// 带文字标签
<ShareButton data={shareData} label="分享成果" />
```

### 5. 直接使用分享弹窗

如果需要更复杂的控制，可以直接使用 ShareCardModal：

```tsx
import { ShareCardModal, transformToShareData } from '@/features/share';

const MyComponent = ({ summary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const shareData = transformToShareData(summary);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开分享</button>
      
      <ShareCardModal
        data={shareData}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onShareSuccess={() => {
          console.log('分享成功');
          setIsOpen(false);
        }}
      />
    </>
  );
};
```

## iOS 兼容性

分享组件已针对 iOS WebView 进行优化：

1. **不使用 alert/confirm** - 使用自定义 Toast 提示
2. **触摸优化** - 所有按钮添加 `touchAction: 'manipulation'`
3. **长按保存** - iOS 用户可长按生成的图片保存到相册
4. **原生分享 API** - 支持使用 Web Share API

## 生成的分享卡片包含

- ZenFit Logo 和品牌标识
- 训练天数、总组数、总负荷、负荷等级
- AI 教练评价（如果有）
- AI Token 使用量和成本（如果有）
- 日期范围
- "由 ZenFit AI 生成" 标识

## 文件结构

```
features/share/
├── components/
│   ├── ShareCardCanvas.tsx    # 分享卡片画布（生成图片用）
│   ├── ShareCardModal.tsx     # iOS兼容的分享弹窗
│   └── ShareButton.tsx        # 分享按钮组件
├── hooks/
│   └── useShareImage.ts       # 图片生成Hook
├── utils/
│   └── dataTransformer.ts     # 数据转换工具
├── types.ts                   # 类型定义
├── index.ts                   # 模块入口
└── INTEGRATION_GUIDE.md       # 本指南
```

## 注意事项

1. 确保项目中已安装 `html2canvas`（已通过 svg2pdf.js 依赖自动安装）
2. 分享卡片使用内联样式，确保生成图片时样式正确
3. 在 iOS WebView 中，建议先让用户预览图片，然后提示长按保存
