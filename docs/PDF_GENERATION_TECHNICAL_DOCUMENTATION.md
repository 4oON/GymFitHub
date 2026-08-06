# PDF生成技术文档

## 技术栈概览

### 核心库
- **jsPDF** (v2.x) - PDF文档生成核心库
- **svg2pdf.js** - SVG转PDF渲染引擎
- **TypeScript** - 类型安全的开发语言
- **React** - 前端框架（用于UI交互）

### 字体支持
- **NotoSansSC-Regular.ttf** - 中文常规字体
- **NotoSansSC-Bold.ttf** - 中文粗体字体
- 字体路径：`/public/fonts/`

## PDF生成流程

### 1. 入口点

**文件**: [`WorkoutReportModal.tsx`](../frontend/src/features/report/components/WorkoutReportModal.tsx:146)

```typescript
// 用户点击"导出PDF"按钮
const handleExportPDF = async () => {
    try {
        await generateWorkoutPDF(enhancedSession, userProfile);
    } catch (error) {
        console.error('PDF export failed:', error);
    }
};
```

### 2. 主生成函数

**文件**: [`PDFExportService.ts`](../frontend/src/features/export/services/PDFExportService.ts:363)

```typescript
export const generateWorkoutPDF = async (
    session: WorkoutSession,
    userProfile: UserProfile
): Promise<void> => {
    // 1. 创建jsPDF实例
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // 2. 加载中文字体
    await loadChineseFont(doc);
    
    // 3. 绘制各个部分
    // - 标题区域
    // - 统计卡片
    // - 肌肉分布图表
    // - 肌肉解剖图
    // - 训练详情表格
    // - 顶级肌群分析
    
    // 4. 导出PDF文件
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
};
```

### 3. 字体加载机制

**文件**: [`PDFExportService.ts`](../frontend/src/features/export/services/PDFExportService.ts:13)

```typescript
const loadChineseFont = async (doc: jsPDF): Promise<void> => {
    // 1. 从public目录加载字体文件
    const regularFontResponse = await fetch('/fonts/NotoSansSC-Regular.ttf');
    const regularFontBlob = await regularFontResponse.blob();
    
    // 2. 转换为Base64
    const regularFontBase64 = await blobToBase64(regularFontBlob);
    
    // 3. 添加到jsPDF
    doc.addFileToVFS('NotoSansSC-Regular.ttf', regularFontBase64.split(',')[1]);
    doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');
    
    // 4. 同样处理Bold字体
    // ...
};
```

## 肌肉解剖图生成详解

### 架构概览

```
WorkoutSession (训练数据)
    ↓
generateMuscleHighlights() (计算肌肉激活度)
    ↓
getMuscleHighlightSvg() (生成SVG)
    ↓
svg2pdf() (转换为PDF)
    ↓
嵌入到PDF文档
```

### 1. 数据准备阶段

**文件**: [`MuscleHighlightService.ts`](../frontend/src/features/anatomy/services/MuscleHighlightService.ts)

```typescript
// 从训练数据生成肌肉高亮信息
const highlights = generateMuscleHighlights([session], 'daily');

// 返回格式：
[
    {
        muscle: 'CHEST',
        totalWeight: 2450,
        totalSets: 12,
        exerciseCount: 3,
        color: [239, 68, 68],  // RGB颜色
        opacity: 0.7            // 透明度（基于训练强度）
    },
    // ...更多肌肉
]
```

### 2. SVG生成阶段

**文件**: [`PDFExportService.ts`](../frontend/src/features/export/services/PDFExportService.ts:150)

#### 2.1 获取基础路径数据

```typescript
const getMuscleHighlightSvg = (session: WorkoutSession, view: 'front' | 'back'): string => {
    // 1. 获取基础身体轮廓路径
    const paths = view === 'front' ? BODY_PATHS.front : BODY_PATHS.back;
    const basePath = paths.baseSilhouette;  // 身体轮廓SVG路径
    const detailPath = paths.detail1;        // 装饰性细节（仅正面）
    
    // 2. 获取视图对应的肌肉映射
    const viewMapping = MUSCLE_VIEW_MAPPING_ENHANCED[view];
    // 例如：{ CHEST: 'chest_front', LATS: 'lats_back', ... }
};
```

#### 2.2 生成肌肉路径

```typescript
// 遍历所有肌肉组
Object.entries(viewMapping).forEach(([muscleGroup, pathKey]) => {
    const muscle = muscleGroup as MuscleGroup;
    const path = MUSCLE_PATHS[pathKey];  // 从常量获取SVG路径数据
    
    const highlight = highlightMap.get(muscle);
    
    if (highlight) {
        // 训练过的肌肉 - 使用彩色高亮
        allMusclePaths += `
            <path
                d="${path}"
                fill="rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})"
                stroke="rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)"
                stroke-width="1.5"
            />`;
    } else {
        // 未训练的肌肉 - 使用浅灰色
        allMusclePaths += `
            <path
                d="${path}"
                fill="#e2e8f0"
                fill-opacity="0.8"
                stroke="#94a3b8"
                stroke-width="1"
            />`;
    }
});
```

#### 2.3 构建完整SVG

```typescript
const svgContent = `
    <svg viewBox="-30 0 400 700" xmlns="http://www.w3.org/2000/svg">
        <defs>
            ${gradients}  <!-- 渐变定义 -->
        </defs>
        
        <!-- 基础轮廓（浅灰色背景） -->
        <path d="${basePath}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
        
        <!-- 装饰层（仅正面视图） -->
        ${detailPath ? `<path d="${detailPath}" fill="#e2e8f0" .../>` : ''}
        
        <!-- 所有肌肉区域（高亮+非高亮） -->
        ${allMusclePaths}
    </svg>
`;

return svgContent.trim();
```

### 3. SVG转PDF阶段

**文件**: [`PDFExportService.ts`](../frontend/src/features/export/services/PDFExportService.ts:527)

```typescript
// 正面视图
if (frontSvg) {
    const frontX = margin + (contentWidth / 4) - (svgWidth / 2);
    
    // 1. 解析SVG字符串为DOM元素
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(frontSvg, 'image/svg+xml');
    const svgElement = svgDoc.documentElement as unknown as SVGElement;
    
    // 2. 使用svg2pdf转换并添加到PDF
    await svg2pdf(svgElement, doc, {
        x: frontX,
        y: svgY,
        width: svgWidth,   // 45mm
        height: svgHeight  // 65mm
    });
    
    // 3. 添加标签
    doc.text('正面 Front', frontX + svgWidth / 2, svgY + svgHeight + 4, { align: 'center' });
}

// 背面视图（同样的流程）
```

## 肌肉路径数据结构

### 路径来源

**文件**: [`musclePaths.ts`](../frontend/src/features/anatomy/constants/musclePaths.ts)

```typescript
export const MUSCLE_PATHS = {
    // 正面肌肉
    chest_front: "M198.55,55.64c-7.09,7.7-6.76,16.47...",
    abs_front: "M185.23,145.67c-2.34,8.91-4.12,17.98...",
    quads_front: "M167.89,312.45c-1.23,15.67-2.89,31.34...",
    
    // 背面肌肉
    lats_back: "M234.76,172.23c-3.04,14.41-6.67,28.95...",
    traps_back: "M198.34,67.89c-5.67,9.23-8.45,19.12...",
    glutes_back: "M189.45,267.34c-4.23,12.56-7.89,25.23...",
    
    // ...更多肌肉路径
};
```

### 视图映射

**文件**: [`MuscleHighlightService.ts`](../frontend/src/features/anatomy/services/MuscleHighlightService.ts)

```typescript
export const MUSCLE_VIEW_MAPPING_ENHANCED = {
    front: {
        CHEST: 'chest_front',
        ABS: 'abs_front',
        OBLIQUES: 'obliques_front',
        QUADS: 'quads_front',
        SHOULDERS: 'shoulders_front',
        BICEPS: 'biceps_front',
        FOREARMS: 'forearms_front',
        TRAPS: 'traps_front'
    },
    back: {
        LATS: 'lats_back',
        TRAPS: 'traps_back',
        LOWERBACK: 'lowerback_back',
        GLUTES: 'glutes_back',
        HAMSTRINGS: 'hamstrings_back',
        CALVES: 'calves_back',
        TRICEPS: 'triceps_back'
    }
};
```

## 颜色和透明度计算

### 颜色定义

**文件**: [`muscleColors.ts`](../frontend/src/features/anatomy/constants/muscleColors.ts)

```typescript
export const MUSCLE_COLORS_RGB: Record<MuscleGroup, [number, number, number]> = {
    CHEST: [239, 68, 68],      // 红色 #ef4444
    QUADS: [59, 130, 246],     // 蓝色 #3b82f6
    LATS: [6, 182, 212],       // 青色 #06b6d4
    ABS: [34, 197, 94],        // 绿色 #22c55e
    SHOULDERS: [139, 92, 246], // 紫色 #8b5cf6
    BICEPS: [245, 158, 11],    // 橙色 #f59e0b
    TRICEPS: [236, 72, 153],   // 粉色 #ec4899
    // ...更多颜色
};
```

### 透明度计算

**文件**: [`MuscleHighlightService.ts`](../frontend/src/features/anatomy/services/MuscleHighlightService.ts)

```typescript
// 基于训练强度计算透明度
const calculateOpacity = (weight: number, maxWeight: number): number => {
    const ratio = weight / maxWeight;
    
    if (ratio >= 0.7) return 0.9;      // 高强度：90%不透明
    if (ratio >= 0.4) return 0.7;      // 中强度：70%不透明
    if (ratio >= 0.2) return 0.5;      // 低强度：50%不透明
    return 0.3;                         // 极低强度：30%不透明
};
```

## PDF布局系统

### 坐标系统

```
(0,0) ────────────────────────────────────> X轴
  │
  │  ┌─────────────────────────────────┐
  │  │  margin (19mm)                  │
  │  │  ┌───────────────────────────┐  │
  │  │  │                           │  │
  │  │  │   内容区域                │  │
  │  │  │   (contentWidth)          │  │
  │  │  │                           │  │
  │  │  │   currentY (动态追踪)     │  │
  │  │  │                           │  │
  │  │  └───────────────────────────┘  │
  │  │                                  │
  │  └─────────────────────────────────┘
  ↓
Y轴
```

### 分页机制

```typescript
const checkPageBreak = (doc: jsPDF, currentY: number, contentHeight: number): number => {
    const bottomMargin = 19;
    
    // 检查是否需要分页
    if (currentY + contentHeight > pageHeight - bottomMargin) {
        doc.addPage();           // 添加新页
        return 19;               // 重置到新页顶部
    }
    
    return currentY;             // 继续当前页
};
```

### 绘制流程

```typescript
let currentY = 19;  // 从顶部边距开始

// 1. 标题区域
currentY = checkPageBreak(doc, currentY, 28);
drawCard(doc, margin, currentY, contentWidth, 28);
// ... 绘制标题内容
currentY += 33;

// 2. 统计卡片
// ... 绘制6个统计卡片
currentY += 48;

// 3. 肌肉分布图表
currentY = checkPageBreak(doc, currentY, 65);
// ... 绘制图表
currentY += 73;

// 4. 肌肉解剖图
currentY = checkPageBreak(doc, currentY, 75);
// ... 绘制SVG
currentY += 83;

// 5. 训练详情表格
currentY = checkPageBreak(doc, currentY, tableHeight);
// ... 绘制表格
currentY += tableHeight + 8;

// 6. 顶级肌群分析
currentY = checkPageBreak(doc, currentY, 38);
// ... 绘制分析卡片
```

## 关键技术细节

### 1. SVG路径精度

- 所有肌肉路径使用**贝塞尔曲线**定义
- 路径数据格式：`M x,y C x1,y1 x2,y2 x,y ...`
- 确保路径闭合以正确填充颜色

### 2. 渐变效果

```typescript
const generateMuscleGradients = (highlights: any[]): string => {
    return highlights.map(h => `
        <linearGradient id="gradient-${h.muscle.toLowerCase()}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(${h.color.join(',')});stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:rgb(${h.color.join(',')});stop-opacity:0.3" />
        </linearGradient>
    `).join('');
};
```

### 3. 中文字体处理

- **问题**: jsPDF默认不支持中文
- **解决**: 动态加载NotoSansSC字体
- **注意**: 字体文件需要转换为Base64嵌入

### 4. SVG转PDF的挑战

- **DOMParser**: 将SVG字符串解析为DOM
- **svg2pdf.js**: 将SVG DOM转换为PDF图形指令
- **坐标转换**: SVG viewBox → PDF坐标系统

### 5. 性能优化

- **异步加载**: 字体和SVG处理使用async/await
- **批量绘制**: 减少PDF操作次数
- **路径复用**: MUSCLE_PATHS常量避免重复计算

## 数据流图

```
用户训练数据 (WorkoutSession)
    ↓
计算肌肉分布 (groupByMuscle)
    ↓
生成高亮数据 (generateMuscleHighlights)
    ├─→ 颜色映射 (MUSCLE_COLORS_RGB)
    ├─→ 透明度计算 (calculateOpacity)
    └─→ 路径映射 (MUSCLE_VIEW_MAPPING)
    ↓
构建SVG字符串 (getMuscleHighlightSvg)
    ├─→ 基础轮廓 (BODY_PATHS)
    ├─→ 肌肉路径 (MUSCLE_PATHS)
    └─→ 渐变定义 (generateMuscleGradients)
    ↓
SVG → PDF转换 (svg2pdf)
    ↓
嵌入PDF文档 (jsPDF)
    ↓
导出文件 (Blob → Download)
```

## 文件依赖关系

```
WorkoutReportModal.tsx
    ↓
PDFExportService.ts
    ├─→ MuscleHighlightService.ts
    │   ├─→ muscleColors.ts
    │   ├─→ musclePaths.ts
    │   └─→ muscleHitboxes.ts
    ├─→ CalorieCalculationService.ts
    └─→ jsPDF + svg2pdf.js
```

## 总结

这个PDF生成系统的核心优势：

1. **完全客户端生成** - 无需服务器处理
2. **矢量图形** - SVG确保高质量输出
3. **动态高亮** - 基于实际训练数据
4. **中文支持** - 自定义字体加载
5. **响应式布局** - 自动分页和内容调整
6. **类型安全** - TypeScript确保代码质量

技术栈选择合理，实现了高质量的PDF训练报告生成功能。