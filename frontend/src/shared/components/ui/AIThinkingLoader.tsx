/**
 * AI 思考加载组件
 * 统一的三行布局：动画 + 文字 + 进度点
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIThinkingLoaderProps {
  language?: 'zh' | 'en';
  customText?: string;
  size?: 'sm' | 'md' | 'lg';
  showCard?: boolean;
  className?: string;
}

const thinkingTexts = {
  zh: ['AI 正在思考...', '分析训练数据中...', '计算最优方案...', '生成个性化建议...'],
  en: ['AI is thinking...', 'Analyzing training data...', 'Calculating optimal plan...', 'Generating personalized advice...']
};

// 统一的神经网络动画
const NeuralNetworkIcon: React.FC = () => (
  <svg width="100%" height="100%" viewBox="0 0 60 60" fill="none">
    {/* 节点 */}
    <motion.circle cx="15" cy="15" r="3" fill="#10b981"
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}/>
    <motion.circle cx="45" cy="12" r="3" fill="#10b981"
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}/>
    <motion.circle cx="30" cy="30" r="3" fill="#06b6d4"
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}/>
    <motion.circle cx="12" cy="45" r="3" fill="#10b981"
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}/>
    <motion.circle cx="48" cy="48" r="3" fill="#10b981"
      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}/>
    {/* 连接线 */}
    <motion.path d="M15 15 L30 30 M45 12 L30 30 M12 45 L30 30 M48 48 L30 30" 
      stroke="url(#netGrad)" strokeWidth="1.5" strokeLinecap="round"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2, repeat: Infinity }}/>
    <defs>
      <linearGradient id="netGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5"/>
      </linearGradient>
    </defs>
  </svg>
);

// 统一的旋转环
const SpinnerRing: React.FC<{ size: string }> = ({ size }) => (
  <div className={`${size} rounded-full relative`}
    style={{
      background: 'conic-gradient(from 0deg, transparent 0deg, #10b981 60deg, #06b6d4 180deg, transparent 240deg)',
      animation: 'spin 1.5s linear infinite'
    }}>
    <div className="absolute inset-[2px] rounded-full bg-slate-900" />
  </div>
);

// 统一的三行布局组件
const LoaderContent: React.FC<{ 
  text: string; 
  size: 'sm' | 'md' | 'lg';
  showDots?: boolean;
}> = ({ text, size, showDots = true }) => {
  const sizeMap = {
    sm: { wrapper: 'w-8 h-8', text: 'text-xs', gap: 'gap-2' },
    md: { wrapper: 'w-12 h-12', text: 'text-sm', gap: 'gap-3' },
    lg: { wrapper: 'w-16 h-16', text: 'text-base', gap: 'gap-4' }
  };
  const cfg = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${cfg.gap}`}>
      {/* 第一行：旋转环 + 神经网络 */}
      <div className={`relative ${cfg.wrapper}`}>
        <div className={`absolute inset-0 ${cfg.wrapper} rounded-full bg-emerald-500/20 blur-lg animate-pulse`} />
        <SpinnerRing size={cfg.wrapper} />
        <div className="absolute inset-0 flex items-center justify-center p-1.5">
          <NeuralNetworkIcon />
        </div>
      </div>

      {/* 第二行：动态文字 */}
      <div className={`${cfg.text} text-slate-400 font-medium`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* 第三行：进度点 */}
      {showDots && (
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const AIThinkingLoader: React.FC<AIThinkingLoaderProps> = ({
  language = 'zh',
  customText,
  size = 'md',
  showCard = true,
  className = ''
}) => {
  const [textIndex, setTextIndex] = useState(0);
  const texts = customText ? [customText] : thinkingTexts[language];

  useEffect(() => {
    if (texts.length <= 1) return;
    const interval = setInterval(() => setTextIndex(p => (p + 1) % texts.length), 2500);
    return () => clearInterval(interval);
  }, [texts.length]);

  const content = <LoaderContent text={texts[textIndex]} size={size} />;

  if (!showCard) return <div className={className}>{content}</div>;

  const containerMap = { sm: 'p-4', md: 'p-8', lg: 'p-12' };
  return (
    <div className={`${containerMap[size]} bg-slate-900/50 rounded-2xl border border-slate-800/50 ${className}`}>
      {content}
    </div>
  );
};

// 卡片式加载（WeeklySummaryCard 用）- 同样的三行布局，只是横向排列
export const AIThinkingCard: React.FC<{ language?: 'zh' | 'en' }> = ({ language = 'zh' }) => {
  const [textIndex, setTextIndex] = useState(0);
  const texts = thinkingTexts[language];

  useEffect(() => {
    const interval = setInterval(() => setTextIndex(p => (p + 1) % texts.length), 2500);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6">
      <div className="flex items-center justify-center gap-5">
        {/* 左侧：同样的旋转环 + 神经网络 */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-lg animate-pulse" />
          <SpinnerRing size="w-10 h-10" />
          <div className="absolute inset-0 flex items-center justify-center p-1">
            <NeuralNetworkIcon />
          </div>
        </div>

        {/* 右侧：文字 + 进度点（两行） */}
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-slate-300 font-medium"
            >
              {texts[textIndex]}
            </motion.p>
          </AnimatePresence>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 添加 CSS 动画
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default AIThinkingLoader;
