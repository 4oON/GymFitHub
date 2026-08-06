# 移动端全息报告组件使用说明

## 组件概述

`MobileWorkoutReportModal` 是一个专为移动端设计的全息训练报告弹出框组件，提供了现代化的用户界面和流畅的交互体验。

## 功能特性

1. **响应式设计**：专为移动设备优化，适配各种屏幕尺寸
2. **流畅动画**：使用 Framer Motion 实现平滑的入场和滚动触发动画
3. **全息视觉效果**：霓虹色系、发光边框、网格背景等未来科技风格
4. **完整数据展示**：包含所有训练数据的详细信息
5. **多语言支持**：支持中英文切换
6. **导出功能**：支持导出为 JSON 和 PDF 格式

## 使用方法

### 1. 导入组件

```typescript
import { MobileWorkoutReportModal } from '@/features/report/components/MobileWorkoutReportModal';
```

### 2. 使用组件

```tsx
<MobileWorkoutReportModal
    session={workoutSession}
    userProfile={userProfile}
    isOpen={isReportModalOpen}
    onClose={() => setIsReportModalOpen(false)}
/>
```

### 3. 参数说明

| 参数 | 类型 | 描述 |
|------|------|------|
| session | WorkoutSession | 训练会话数据 |
| userProfile | UserProfile | 用户资料 |
| isOpen | boolean | 控制模态框是否显示 |
| onClose | () => void | 关闭模态框的回调函数 |

## 设计亮点

### 1. 视觉设计
- **色彩方案**：深色背景搭配霓虹色强调
- **字体选择**：
  - 标题：Orbitron（科技感字体）
  - 数据：JetBrains Mono（等宽字体）
  - 正文：Inter（可读性字体）
- **特效**：
  - 全息网格背景
  - 发光边框和阴影
  - 滚动触发动画

### 2. 交互设计
- **入场动画**：从底部滑入的弹簧动画
- **滚动触发动画**：使用 Intersection Observer 实现元素进入视口时的动画
- **数字动画**：关键数据使用数字滚动动画
- **手势支持**：支持触摸手势操作

### 3. 布局结构
1. **顶部固定栏**：标题和操作按钮
2. **英雄区域**：核心数据展示
3. **数据可视化区**：大型饼图和肌肉群分布
4. **统计数据网格**：关键统计数据卡片
5. **主要肌群详情**：Top 3 肌群的详细信息
6. **完整动作列表**：所有训练动作的详细信息
7. **底部操作区**：导出按钮

## 技术实现

### 1. 动画库
使用 Framer Motion 实现流畅动画效果：

```tsx
import { motion, AnimatePresence } from 'framer-motion';
```

### 2. 滚动优化
使用 Intersection Observer 实现滚动触发动画：

```tsx
const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '-100px' }
        );
        
        if (ref.current) {
            observer.observe(ref.current);
        }
        
        return () => {
            observer.disconnect();
        };
    }, []);
    
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut', delay }}
        >
            {children}
        </motion.div>
    );
};
```

### 3. 数字动画
使用自定义组件实现数字滚动动画：

```tsx
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
        const duration = 1000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);
        
        return () => clearInterval(timer);
    }, [value]);
    
    return <span>{displayValue}</span>;
};
```

## 样式定制

### 1. 全局样式
在 `src/index.css` 中定义了以下样式类：

- `.custom-scrollbar`：自定义滚动条样式
- `.holographic-grid`：全息网格背景
- `.heading-font`：标题字体
- `.mono-font`：等宽字体

### 2. 颜色变量
使用 Tailwind CSS 的颜色系统，主要颜色包括：

- 背景色：`slate-900`, `slate-800`
- 强调色：`cyan-500`, `purple-500`, `pink-500`
- 文本色：`slate-200`, `slate-300`, `slate-400`

## 性能优化

1. **虚拟滚动**：对于长列表使用虚拟滚动优化
2. **懒加载**：滚动触发动画避免初始加载过多动画
3. **GPU 加速**：使用 CSS transform 而非 position 实现动画
4. **防抖处理**：滚动事件使用防抖处理

## 兼容性

- 支持 iOS Safari 14+
- 支持 Android Chrome 90+
- 适配各种屏幕尺寸（320px - 428px）
- 支持深色模式
- 支持横屏显示

## 注意事项

1. 确保已安装 `framer-motion` 依赖
2. 确保已引入所需的字体（Orbitron, JetBrains Mono）
3. 确保已添加必要的 CSS 样式类
4. 在使用 Intersection Observer 时注意浏览器兼容性

## 故障排除

### 1. 动画不生效
检查是否正确引入了 `framer-motion`：

```bash
npm install framer-motion
```

### 2. 字体显示异常
检查是否正确引入了字体：

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 3. 样式问题
检查是否正确引入了 CSS 文件并包含了必要的样式类。