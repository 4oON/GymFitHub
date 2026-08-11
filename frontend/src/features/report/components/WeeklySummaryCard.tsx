/**
 * 每周训练总结卡片 - Weekly Summary Card
 * 
 * Bento风格设计：肌肉标签 + 数据网格
 * 优化版：移动端友好的设计，iPhone 17 Pro适配
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  ChevronRight,
  Brain,
  Activity,
  RotateCcw,
  Sparkles,
  Dumbbell,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  Flame,
  Award,
  Cpu,
  Trophy
} from 'lucide-react';
import type { AIWeeklySummary } from '../services/WeeklySummaryService';
import WeeklySummaryService from '../services/WeeklySummaryService';
import type { UserProfile, RecoveryStatus } from '@/shared/types';
import { ShareButton, fromAIWeeklySummary } from '@/features/share';
import { AIThinkingCard } from '@/shared/components/ui/AIThinkingLoader';
import { iOSStorage } from '@/services/iOSStorageService';

// iOS Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    try { return iOSStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): boolean => {
    try { iOSStorage.setItem(key, value); return true; } catch { return false; }
  },
  removeItem: (key: string): boolean => {
    try { iOSStorage.removeItem(key); return true; } catch { return false; }
  }
};

// Use localStorage-based cache that persists across page navigations
const CACHE_KEY = 'zenfit_weekly_summary_cache';
const CACHE_TIMESTAMP_KEY = 'zenfit_weekly_summary_timestamp';
const CACHE_LANGUAGE_KEY = 'zenfit_weekly_summary_language';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache

interface WeeklySummaryCardProps {
  userProfile: UserProfile;
  recoveryState: RecoveryStatus[];
  onOpenFullAnalysis: () => void;
  className?: string;
}

// 训练量评估配置
const volumeConfig = {
  insufficient: { 
    label: '不足', 
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/10'
  },
  adequate: { 
    label: '适中', 
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/10'
  },
  optimal: { 
    label: '理想', 
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10'
  },
  excessive: { 
    label: '过量', 
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/10'
  }
};

// 肌肉颜色映射 - 更暗更黑
const muscleColors: Record<string, { bg: string; text: string; border: string }> = {
  '胸大肌': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  '胸肌': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  '背阔肌': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  '背部': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  '三角肌': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  '肩部': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  '肱二头肌': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  '肱三头肌': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  '手臂': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  '股四头肌': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  '腘绳肌': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  '臀大肌': { bg: 'bg-emerald-600/10', text: 'text-emerald-500', border: 'border-emerald-600/15' },
  '臀部': { bg: 'bg-emerald-600/10', text: 'text-emerald-500', border: 'border-emerald-600/15' },
  '腿部': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  '核心': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  '腹肌': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  '小腿': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  '全身': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' }
};

// 肌肉名称中英文映射
const muscleNameMap: Record<string, string> = {
  '胸大肌': 'Chest',
  '胸肌': 'Chest',
  '背阔肌': 'Lats',
  '背部': 'Back',
  '三角肌': 'Delts',
  '三角肌前束': 'Front Delts',
  '三角肌中束': 'Side Delts',
  '三角肌后束': 'Rear Delts',
  '肩部': 'Shoulders',
  '肱二头肌': 'Biceps',
  '肱三头肌': 'Triceps',
  '手臂': 'Arms',
  '股四头肌': 'Quads',
  '腘绳肌': 'Hamstrings',
  '臀大肌': 'Glutes',
  '臀部': 'Glutes',
  '腿部': 'Legs',
  '核心': 'Core',
  '腹肌': 'Abs',
  '小腿': 'Calves',
  '全身': 'Full Body',
  '斜方肌': 'Traps',
  '下背部': 'Lower Back',
  '前臂': 'Forearms',
  '腹斜肌': 'Obliques'
};

// 获取肌肉英文名称
const getMuscleNameEn = (muscle: string): string => {
  return muscleNameMap[muscle] || muscle;
};

// 获取肌肉标签样式
const getMuscleStyle = (muscle: string) => {
  // 精确匹配
  if (muscleColors[muscle]) return muscleColors[muscle];
  // 包含匹配
  for (const [key, style] of Object.entries(muscleColors)) {
    if (muscle.includes(key) || key.includes(muscle.replace(/肌$/, ''))) {
      return style;
    }
  }
  // 默认样式
  return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
};

// 解析肌肉名称（从亮点中提取）
const extractMusclesFromHighlights = (highlights: string[] | undefined): string[] => {
  if (!highlights || !Array.isArray(highlights)) return [];
  
  const muscles: string[] = [];
  const muscleKeywords = ['胸大肌', '胸肌', '背阔肌', '背部', '三角肌', '肩部', '肱二头肌', '肱三头肌', '手臂', '股四头肌', '腘绳肌', '臀大肌', '臀部', '腿部', '核心', '腹肌', '小腿'];
  
  highlights.forEach(highlight => {
    muscleKeywords.forEach(keyword => {
      if (highlight.includes(keyword) && !muscles.includes(keyword)) {
        muscles.push(keyword);
      }
    });
  });
  
  return muscles.slice(0, 4);
};

// Highlights 不再拆分 - Machine Hip And Glute Kickback 是一个完整动作名称

// Bento数据卡片
interface BentoItemProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: 'emerald' | 'blue' | 'cyan' | 'teal' | 'indigo';
  delay?: number;
}

const BentoItem: React.FC<BentoItemProps> = ({ icon: Icon, value, label, color, delay = 0 }) => {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-400',
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-400',
    teal: 'from-teal-500/20 to-emerald-500/10 text-teal-400',
    indigo: 'from-indigo-500/20 to-purple-500/10 text-indigo-400'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClasses[color]} border border-white/5 p-3`}
    >
      <div className="relative z-10">
        <Icon size={16} className="mb-2 opacity-80" />
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs opacity-70 mt-0.5">{label}</p>
      </div>
      {/* 装饰性背景 */}
      <div className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full bg-white/5 blur-xl" />
    </motion.div>
  );
};

const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({
  userProfile,
  recoveryState,
  onOpenFullAnalysis,
  className = ''
}) => {
  const [summary, setSummary] = useState<AIWeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenLoaded, setTokenLoaded] = useState(false);
  const [showTokenTimeout, setShowTokenTimeout] = useState(false);

  // 加载语言设置
  useEffect(() => {
    const savedLang = safeStorage.getItem('zenfit_language') as 'zh' | 'en';
    if (savedLang) setLanguage(savedLang);
  }, []);

  // Token loading timeout - if no token after 8 seconds, show timeout
  useEffect(() => {
    if (summary?.tokenLoading && !summary?.tokenUsage) {
      setShowTokenTimeout(false);
      const timer = setTimeout(() => {
        setShowTokenTimeout(true);
        setTokenLoading(false);
      }, 8000); // 8秒超时
      return () => clearTimeout(timer);
    }
  }, [summary]);

  // 跟踪语言切换冷却状态
  const languageSwitchCooldown = useRef(false);

  // 切换语言（带防抖）
  const toggleLanguage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 防止频繁切换（5秒冷却）
    if (languageSwitchCooldown.current) {
      console.log('[WeeklySummaryCard] Language switch on cooldown, skipping');
      return;
    }
    
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    safeStorage.setItem('zenfit_language', newLang);
    
    // 设置冷却
    languageSwitchCooldown.current = true;
    setTimeout(() => {
      languageSwitchCooldown.current = false;
    }, 5000);
    
    // Clear caches for language switch
    WeeklySummaryService.clearCache();
    safeStorage.removeItem(CACHE_KEY);
    safeStorage.removeItem(CACHE_TIMESTAMP_KEY);
    safeStorage.removeItem(CACHE_LANGUAGE_KEY);
    
    // 使用本地生成的 summary（不调用 AI，避免 429）
    setIsLoading(true);
    try {
      // 调用服务但不触发 AI（使用 AI 禁用模式）
      const newSummary = await WeeklySummaryService.generateWeeklySummary(
        userProfile,
        recoveryState,
        { language: newLang }
      );
      if (newSummary) {
        setSummary(newSummary);
      }
    } catch (err) {
      console.error('[WeeklySummaryCard] Failed to load summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [language, userProfile, recoveryState]);

  const loadSummary = useCallback(async (forceRefresh = false, lang?: 'zh' | 'en') => {
    try {
      const currentLang = lang || language;
      
      // Check cache first (even before setting loading)
      if (!forceRefresh) {
        const cached = WeeklySummaryService.getCachedSummary(currentLang);
        if (cached) {
          console.log('[WeeklySummaryCard] Using cached summary');
          setSummary(cached);
          setIsLoading(false);
          return;
        }
      }
      
      setIsLoading(true);

      const newSummary = await WeeklySummaryService.generateWeeklySummary(
        userProfile,
        recoveryState,
        { language: currentLang }
      );

      if (newSummary) {
        console.log('[WeeklySummaryCard] Summary loaded:', {
          isAIGenerated: newSummary.isAIGenerated, 
          tokenUsage: newSummary.tokenUsage,
          overview: newSummary.overview,
          language: currentLang
        });
        setSummary(newSummary);
        
        // If AI was attempted but no token yet, show calculating state
        if (newSummary.isAIGenerated && !newSummary.tokenUsage) {
          setTokenLoading(true);
        } else {
          setTokenLoading(false);
        }
      }
    } catch (err) {
      console.error('Failed to load weekly summary:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userProfile, recoveryState, language]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    // Clear all caches
    WeeklySummaryService.clearCache();
    safeStorage.removeItem(CACHE_KEY);
    safeStorage.removeItem(CACHE_TIMESTAMP_KEY);
    safeStorage.removeItem(CACHE_LANGUAGE_KEY);
    await loadSummary(true);
  };

  // Load summary on mount - persistent cache across page navigations
  useEffect(() => {
    const init = async () => {
      try {
        // Check localStorage cache with timestamp and language
        const cachedData = safeStorage.getItem(CACHE_KEY);
        const cachedTimestamp = safeStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cachedLanguage = safeStorage.getItem(CACHE_LANGUAGE_KEY);
        
        if (cachedData && cachedTimestamp && cachedLanguage === language) {
          const age = Date.now() - parseInt(cachedTimestamp);
          if (age < CACHE_DURATION_MS) {
            console.log('[WeeklySummaryCard] Using localStorage cache, age:', Math.round(age/1000), 's');
            const parsed = JSON.parse(cachedData);
            setSummary(parsed);
            setIsLoading(false);
            return;
          }
        }
        
        // Check WeeklySummaryService cache as fallback (includes language validation)
        const cached = WeeklySummaryService.getCachedSummary(language);
        if (cached) {
          console.log('[WeeklySummaryCard] Using service cache');
          setSummary(cached);
          setIsLoading(false);
          return;
        }
        
        // Only load from API if no valid cache exists
        console.log('[WeeklySummaryCard] No cache, loading from API');
        await loadSummary(false, language);
      } catch (e) {
        console.error('[WeeklySummaryCard] Cache error:', e);
        await loadSummary(false, language);
      }
    };
    
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Persist cache to localStorage when summary changes
  useEffect(() => {
    if (summary) {
      try {
        safeStorage.setItem(CACHE_KEY, JSON.stringify(summary));
        safeStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        safeStorage.setItem(CACHE_LANGUAGE_KEY, language);
      } catch (e) {
        console.error('[WeeklySummaryCard] Failed to cache summary:', e);
      }
    }
  }, [summary]);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <AIThinkingCard language={language} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={`bg-slate-900/80 rounded-2xl border border-slate-800 p-4 ${className}`}>
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm">{language === 'zh' ? '暂无训练数据' : 'No training data'}</p>
        </div>
      </div>
    );
  }

  const volume = volumeConfig[summary.volumeAssessment?.level] || volumeConfig.adequate;
  const trainedMuscles = extractMusclesFromHighlights(summary.highlights);
  
  // 训练量标签翻译
  const getVolumeLabel = (level: string) => {
    const labels: Record<string, { zh: string; en: string }> = {
      insufficient: { zh: '不足', en: 'Low' },
      adequate: { zh: '适中', en: 'Moderate' },
      optimal: { zh: '理想', en: 'Ideal' },
      excessive: { zh: '过量', en: 'High' }
    };
    return labels[level]?.[language] || labels[level]?.en || level;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden ${className}`}
      onClick={onOpenFullAnalysis}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center border border-emerald-500/20">
              <Brain className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-[15px]">
                {language === 'zh' ? '本周训练总结' : 'Weekly Summary'}
              </h3>
              <p className="text-slate-500 text-xs">{summary.dateRange}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* 分享按钮 */}
            <div onClick={(e) => e.stopPropagation()}>
              <ShareButton 
                data={fromAIWeeklySummary(summary, { language })}
                variant="minimal"
                size="sm"
                onShareSuccess={() => console.log('[WeeklySummaryCard] 分享成功')}
              />
            </div>
            {/* 语言切换按钮 */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 bg-slate-800 text-slate-300 text-[10px] font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              {language === 'zh' ? 'EN' : '中'}
            </button>
            {!summary.isAIGenerated && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadSummary(true);
                }}
                disabled={isRefreshing}
                className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-lg flex items-center gap-1 border border-emerald-500/20"
              >
                <Sparkles size={10} />
                AI
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <RotateCcw 
                size={14} 
                className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>
            <ChevronRight size={18} className="text-slate-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* AI评价 - Bento风格卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-slate-900 border border-emerald-500/20 p-3"
        >
          {/* 装饰性光晕 */}
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="absolute -left-4 -bottom-4 w-12 h-12 rounded-full bg-cyan-500/10 blur-xl" />
          
          <div className="relative flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs text-emerald-400/80 font-medium mb-0.5">
                {language === 'zh' ? 'AI教练评价' : 'AI Coach Review'}
              </p>
              <p className="text-slate-200 text-sm leading-relaxed">
                {summary.overview}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 本周突破记录 - 焦点区域，大卡片 */}
        {(() => {
          const processedHighlights = (summary.weeklyHighlights || []).slice(0, 5);
          if (processedHighlights.length === 0) return null;
          
          // 分割成两行：如果只有1个则占满，否则第一行最多2个
          const firstRow = processedHighlights.length === 1
            ? processedHighlights.slice(0, 1)
            : processedHighlights.slice(0, 2);
          const secondRow = processedHighlights.length === 1
            ? []
            : processedHighlights.slice(2, 5);
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-slate-900 rounded-2xl border border-emerald-500/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Trophy size={16} className="text-emerald-400" />
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  {language === 'zh' ? '本周突破' : 'Weekly PRs'}
                </span>
              </div>
              
              {/* 第一行 - 大卡片（1个时占满，2个时平分） */}
              <div className={`grid ${firstRow.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mb-3`}>
                {firstRow.map((highlight, idx) => {
                  // 解析 label：动作名 + 类型（如 最大重量）
                  const labelParts = highlight.label.match(/^(.+?)\s+(最大重量|Max Weight|总容量|Total Vol|增长|Increase|提升|Gain)$/);
                  const exerciseName = labelParts ? labelParts[1] : highlight.label;
                  const metricType = labelParts ? labelParts[2] : '';
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className="bg-slate-950/60 rounded-xl px-3 py-3 flex flex-col justify-between min-h-[80px]"
                    >
                      {/* 动作名 - 主标签，限制行数 */}
                      <span className="text-[11px] text-slate-300 font-medium leading-tight mb-2 line-clamp-2">
                        {exerciseName}
                      </span>
                      {/* 数值行 - 水平排列，不换行 */}
                      <div className="flex items-center gap-1.5 mt-auto">
                        <span className="text-lg font-bold text-emerald-400 whitespace-nowrap">
                          {highlight.value}
                        </span>
                        {/* 类型标签 - 水平显示 */}
                        {metricType && (
                          <span className="text-[9px] text-slate-500 whitespace-nowrap">
                            {metricType}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* 第二行 - 与第一行对齐的网格 */}
              {secondRow.length > 0 && (
                <div className={`grid ${firstRow.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                  {secondRow.map((highlight, idx) => {
                    const labelParts = highlight.label.match(/^(.+?)\s+(最大重量|Max Weight|总容量|Total Vol|增长|Increase|提升|Gain|频率|Freq)$/);
                    const exerciseName = labelParts ? labelParts[1] : highlight.label;
                    const metricType = labelParts ? labelParts[2] : '';
                    
                    return (
                      <motion.div
                        key={idx + 2}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 + idx * 0.05 }}
                        className="bg-slate-950/60 rounded-xl px-3 py-2.5 flex flex-col justify-between min-h-[64px]"
                      >
                        <span className="text-[10px] text-slate-300 font-medium leading-tight mb-1 line-clamp-2">
                          {exerciseName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-auto">
                          <span className="text-base font-bold text-emerald-400 whitespace-nowrap">
                            {highlight.value}
                          </span>
                          {metricType && (
                            <span className="text-[8px] text-slate-500 whitespace-nowrap">
                              {metricType}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* 核心数据 - 紧凑单行显示 */}
        <div className="flex items-center justify-between gap-2 bg-slate-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-blue-400" />
            <div>
              <div className="text-lg font-bold text-white leading-none">{summary.workoutDays}</div>
              <div className="text-[10px] text-slate-500">{language === 'zh' ? '天' : 'Days'}</div>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Dumbbell size={14} className="text-emerald-400" />
            <div>
              <div className="text-lg font-bold text-white leading-none">{summary.totalSets}</div>
              <div className="text-[10px] text-slate-500">{language === 'zh' ? '组' : 'Sets'}</div>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-cyan-400" />
            <div>
              <div className="text-lg font-bold text-white leading-none">
                {(() => {
                  const volume = summary.totalVolume || 0;
                  if (volume === 0) return '-';
                  if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}kt`;
                  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}t`;
                  return `${volume}kg`;
                })()}
              </div>
              <div className="text-[10px] text-slate-500">{language === 'zh' ? '负荷' : 'Vol'}</div>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className={volume.color} />
            <div>
              <div className={`text-lg font-bold leading-none ${volume.color}`}>
                {getVolumeLabel(summary.volumeAssessment?.level || 'adequate')}
              </div>
              <div className="text-[10px] text-slate-500">{language === 'zh' ? '等级' : 'Lvl'}</div>
            </div>
          </div>
        </div>

        {/* 肌肉标签云 */}
        {trainedMuscles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target size={12} className="text-slate-500" />
              <span className="text-xs text-slate-500">{language === 'zh' ? '训练肌肉' : 'Muscles'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trainedMuscles.map((muscle, idx) => {
                const style = getMuscleStyle(muscle);
                return (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + idx * 0.05 }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {language === 'zh' ? muscle : getMuscleNameEn(muscle)}
                  </motion.span>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 本周建议肌肉 */}
        {summary.nextWeekRecommendations?.focusMuscles?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-3 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">{language === 'zh' ? '下周建议' : 'Next Week'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.nextWeekRecommendations?.focusMuscles?.slice(0, 3).map((muscle, idx) => {
                const style = getMuscleStyle(muscle);
                return (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-md text-xs ${style.bg} ${style.text} border ${style.border}`}
                  >
                    {language === 'zh' ? muscle : getMuscleNameEn(muscle)}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* AI Usage Info - Premium style matching Smart Recommendation */}
        {summary.isAIGenerated === true && summary.tokenUsage && summary.tokenUsage.total_tokens > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm"
          >
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-white">
                        {summary.tokenUsage.total_tokens.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">tokens</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>Input: {(summary.tokenUsage.prompt_tokens / 1000).toFixed(1)}k</span>
                      <span>•</span>
                      <span>Output: {(summary.tokenUsage.completion_tokens / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {summary.estimatedCost && summary.estimatedCost.totalCost > 0 && (
                    <div className="text-lg font-bold text-emerald-400">
                      ¥{summary.estimatedCost.totalCost < 0.01 ? '<0.01' : summary.estimatedCost.totalCost.toFixed(2)}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-slate-800/30 border-t border-slate-800/50">
        <p className="text-slate-500 text-xs text-center flex items-center justify-center gap-1">
          {language === 'zh' ? '查看完整分析' : 'View Full Analysis'}
          <ChevronRight size={12} />
        </p>
      </div>
    </motion.div>
  );
};

export default WeeklySummaryCard;
