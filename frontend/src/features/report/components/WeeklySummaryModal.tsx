/**
 * 每周训练总结详情弹窗 - Weekly Summary Modal
 * 
 * 全屏展示AI生成的专业训练分析
 * 移动端优化版：适配iPhone 17 Pro窄屏
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Target,
  Activity,
  Dumbbell,
  Clock,
  Flame,
  Brain,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Coins,
  Trophy
} from 'lucide-react';
import type { AIWeeklySummary } from '../services/WeeklySummaryService';
import WeeklySummaryService from '../services/WeeklySummaryService';
import type { UserProfile, RecoveryStatus, WeeklyReport, WorkoutSession } from '@/shared/types';
import BodyHeatmap from './BodyHeatmap';
import { exerciseNameMapping } from '@/features/exercise/services/ExerciseNameMappingService';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  recoveryState: RecoveryStatus[];
}

// Tab类型
type TabType = 'overview' | 'sessions' | 'muscles' | 'recommendations';

// 翻译对象
const translations = {
  zh: {
    // Tab labels
    overview: '概览',
    sessions: '训练记录',
    muscles: '肌肉分析',
    recommendations: '下周建议',
    // Volume assessment
    volInsufficient: '训练量不足',
    volAdequate: '训练量适中',
    volOptimal: '训练量理想',
    volExcessive: '训练过量',
    volDescInsufficient: '本周训练量略低，可以适当增加训练强度或频率',
    volDescAdequate: '训练量合理，保持当前节奏即可',
    volDescOptimal: '训练量非常理想，有利于达成训练目标',
    volDescExcessive: '训练量过高，注意恢复，避免过度训练',
    volAssessmentTitle: '训练量评估',
    suggestion: '建议',
    // Overview tab
    aiCoachReview: 'AI教练评价',
    weeklyData: '本周数据',
    trainingDays: '训练天数',
    totalSets: '总组数',
    totalVolume: '总负荷',
    weekHighlights: '本周亮点',
    recoveryStatus: '恢复状态',
    // Sessions tab
    weeklyTrainingRecord: '本周训练记录',
    days: '天',
    noExerciseRecord: '暂无动作记录',
    noTrainingRecord: '暂无训练记录',
    mostActiveDay: '最活跃的一天',
    avgIntensity: '平均训练强度',
    perSetLoad: '每组平均负荷',
    // Muscles tab
    bodyHeatmap: '肌肉热力图',
    frontView: '正面',
    backView: '背面',
    aiMuscleAnalysis: 'AI肌肉分析',
    // Recommendations tab
    nextWeekTraining: '本周建议训练',
    recommendedExercises: '推荐动作',
    trainingTips: '训练建议',
    // Token
    aiAnalysis: 'AI分析',
    // Common
    day: '天',
    sets: '组',
    kg: 'kg',
    unknownExercise: '未知动作',
    viewDetails: '训练详情',
    noData: '暂无训练数据',
    startTraining: '开始训练',
    viewFullAnalysis: '查看完整分析'
  },
  en: {
    // Tab labels
    overview: 'Overview',
    sessions: 'Sessions',
    muscles: 'Muscles',
    recommendations: 'Next Week',
    // Volume assessment
    volInsufficient: 'Low Volume',
    volAdequate: 'Moderate Volume',
    volOptimal: 'Ideal Volume',
    volExcessive: 'High Volume',
    volDescInsufficient: 'Training volume is low. Consider increasing intensity or frequency.',
    volDescAdequate: 'Training volume is moderate. Keep up the good work!',
    volDescOptimal: 'Training volume is ideal for achieving your goals.',
    volDescExcessive: 'Training volume is high. Ensure adequate recovery.',
    volAssessmentTitle: 'Volume Assessment',
    suggestion: 'Suggestion',
    // Overview tab
    aiCoachReview: 'AI Coach Review',
    weeklyData: 'Weekly Data',
    trainingDays: 'Training Days',
    totalSets: 'Total Sets',
    totalVolume: 'Total Volume',
    weekHighlights: 'Highlights',
    recoveryStatus: 'Recovery Status',
    // Sessions tab
    weeklyTrainingRecord: 'Weekly Training',
    days: 'days',
    noExerciseRecord: 'No exercises recorded',
    noTrainingRecord: 'No training records',
    mostActiveDay: 'Most Active Day',
    avgIntensity: 'Avg Intensity',
    perSetLoad: 'Load per set',
    // Muscles tab
    bodyHeatmap: 'Body Heatmap',
    frontView: 'Front',
    backView: 'Back',
    aiMuscleAnalysis: 'AI Muscle Analysis',
    // Recommendations tab
    nextWeekTraining: 'Next Week Focus',
    recommendedExercises: 'Recommended Exercises',
    trainingTips: 'Training Tips',
    // Token
    aiAnalysis: 'AI Analysis',
    // Common
    day: 'days',
    sets: 'sets',
    kg: 'kg',
    unknownExercise: 'Unknown',
    viewDetails: 'Details',
    noData: 'No training data',
    startTraining: 'Start Training',
    viewFullAnalysis: 'View Full Analysis'
  }
};

// 获取训练量评估配置（根据语言）
const getVolumeConfig = (lang: 'zh' | 'en') => ({
  insufficient: {
    label: translations[lang].volInsufficient,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    iconColor: 'text-amber-500',
    description: translations[lang].volDescInsufficient
  },
  adequate: {
    label: translations[lang].volAdequate,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-500',
    description: translations[lang].volDescAdequate
  },
  optimal: {
    label: translations[lang].volOptimal,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    iconColor: 'text-emerald-500',
    description: translations[lang].volDescOptimal
  },
  excessive: {
    label: translations[lang].volExcessive,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
    iconColor: 'text-rose-500',
    description: translations[lang].volDescExcessive
  }
});

// Token使用徽章
const TokenUsageBadge: React.FC<{ usage: any; cost?: any }> = ({ usage, cost }) => {
  if (!usage) return null;
  
  const formatCost = (amount: number, currency?: string) => {
    const isCNY = currency === 'CNY';
    const symbol = isCNY ? '¥' : '$';
    if (amount < 0.01) return `${symbol}<0.01`;
    return `${symbol}${amount.toFixed(3)}`;
  };
  
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-slate-500 py-3 border-t border-slate-800">
      <div className="flex items-center gap-1.5">
        <Coins size={12} className="text-emerald-400" />
        <span>{usage.total_tokens?.toLocaleString() || 0} tokens</span>
      </div>
      <span className="text-slate-700">|</span>
      <div className="flex items-center gap-1.5">
        <span className="text-emerald-400 font-medium">{formatCost(cost?.totalCost || 0, cost?.currency)}</span>
        <span>{cost?.currency === 'CNY' ? 'CNY' : 'USD'}</span>
      </div>
      <span className="text-slate-700">|</span>
      <span className="text-slate-600">AI Analysis</span>
    </div>
  );
};

// 每日训练会话卡片
interface SessionCardProps {
  session: WorkoutSession;
  index: number;
  lang: 'zh' | 'en';
  t: typeof translations.zh;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, index, lang, t }) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatDate = (dateStr: string | number | Date) => {
    const date = new Date(dateStr);
    return lang === 'zh'
      ? `${date.getMonth() + 1}月${date.getDate()}日`
      : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };
  
  const getDayName = (dateStr: string | number | Date) => {
    const days = lang === 'zh' 
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };
  
  // 从exercises中计算总组数
  const totalSets = session.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0;
  const exerciseCount = session.exercises?.length || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-800/30 rounded-xl border border-slate-700/30 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-3 flex items-center justify-between"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 font-bold text-sm">{index + 1}</span>
          </div>
          <div className="text-left">
            <p className="text-white font-medium text-sm">{getDayName(session.date)}</p>
            <p className="text-slate-500 text-xs">{formatDate(session.date)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-slate-300 text-sm font-medium">{totalSets}{t.sets}</p>
            <p className="text-slate-500 text-xs">{exerciseCount} {lang === 'zh' ? '个动作' : 'exercises'}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-700/30"
          >
            <div className="px-3 py-2 space-y-1.5">
              {session.exercises?.map((exercise, exIdx) => (
                <div key={exIdx} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-slate-300 truncate flex-1 font-medium">{
                    lang === 'zh' 
                      ? (exercise.exerciseNameZh || exerciseNameMapping.getChineseName(exercise.exerciseName) || exercise.exerciseName || t.unknownExercise)
                      : (exercise.exerciseName || exercise.exerciseNameZh || t.unknownExercise)
                  }</span>
                  <span className="text-slate-500 flex-shrink-0 ml-2 bg-slate-700/50 px-2 py-0.5 rounded">
                    {exercise.sets?.length || 0} {lang === 'zh' ? '组' : 'sets'}
                  </span>
                </div>
              ))}
              {(!session.exercises || session.exercises.length === 0) && (
                <p className="text-slate-500 text-xs text-center py-2">{t.noExerciseRecord}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  recoveryState
}) => {
  const [summary, setSummary] = useState<AIWeeklySummary | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<{
    current: WeeklyReport | null;
    previous: WeeklyReport | null;
  }>({ current: null, previous: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 加载语言设置
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('zenfit_language') as 'zh' | 'en';
      if (savedLang) setLanguage(savedLang);
    } catch {}
  }, []);

  // 切换语言
  const toggleLanguage = () => {
    const newLang = language === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
    try {
      localStorage.setItem('zenfit_language', newLang);
    } catch {}
    // 刷新数据以应用新语言
    loadData(true);
  };

  const loadData = async (forceRefresh = false) => {
    if (!isOpen) return;
    
    try {
      setIsLoading(true);
      setLoadingProgress(0);

      // 模拟进度动画
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 300);

      const [reports, summaryData] = await Promise.all([
        WeeklySummaryService.getWeeklyReportsData(),
        (async () => {
          let data: AIWeeklySummary | null = null;
          if (!forceRefresh) {
            data = WeeklySummaryService.getCachedSummary();
          }
          if (!data) {
            data = await WeeklySummaryService.generateWeeklySummary(
              userProfile,
              recoveryState,
              { language }
            );
          }
          return data;
        })()
      ]);

      clearInterval(progressInterval);
      setLoadingProgress(100);

      setWeeklyReports(reports);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    WeeklySummaryService.clearCache();
    await loadData(true);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActiveTab('overview');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (isLoading) {
    const loadingTexts = {
      zh: { title: '本周训练总结', loading: 'AI正在分析您的训练数据...', time: '大约需要3-5秒' },
      en: { title: 'Weekly Summary', loading: 'AI is analyzing your training data...', time: 'About 3-5 seconds' }
    };
    const t = loadingTexts[language];
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-950 pt-safe"
        >
          <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
            <div className="flex items-center justify-between px-3 py-3">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 active:bg-slate-700 transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={18} className="text-slate-300" />
              </button>
              <h1 className="text-base font-bold text-white">{t.title}</h1>
              <div className="w-10" />
            </div>
          </div>

          <div className="flex items-center justify-center h-[calc(100vh-80px)]">
            <div className="text-center px-6 w-full max-w-xs">
              {/* 圆形进度条 */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                {/* 背景圆环 */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(30, 41, 59, 0.8)"
                    strokeWidth="6"
                  />
                  {/* 进度圆环 */}
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - loadingProgress / 100)}`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                {/* 百分比文字 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{Math.round(loadingProgress)}%</span>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm">{t.loading}</p>
              <p className="text-slate-500 text-xs mt-2">{t.time}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!summary || !weeklyReports?.current) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-slate-950 pt-safe"
        >
          <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
            <div className="flex items-center justify-between px-3 py-3">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 active:bg-slate-700 transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={18} className="text-slate-300" />
              </button>
              <h1 className="text-base font-bold text-white">{language === 'zh' ? '本周训练总结' : 'Weekly Summary'}</h1>
              <div className="w-10" />
            </div>
          </div>

          <div className="flex items-center justify-center h-[calc(100vh-80px)] px-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{language === 'zh' ? '暂无训练数据' : 'No training data'}</h3>
              <p className="text-slate-400 text-sm mb-6">{language === 'zh' ? '完成您的第一次训练后，AI将为您生成专业的训练分析' : 'Complete your first workout to get AI-powered training analysis'}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-500 active:bg-emerald-400 text-white rounded-xl font-medium text-sm transition-colors"
              >
                {language === 'zh' ? '开始训练' : 'Start Training'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const current = weeklyReports.current;
  const previous = weeklyReports.previous;
  const t = translations[language];
  const volumeConfig = getVolumeConfig(language);
  const volumeInfo = volumeConfig[summary.volumeAssessment.level] || volumeConfig.adequate;

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t.overview, icon: Activity },
    { id: 'sessions', label: t.sessions, icon: Dumbbell },
    { id: 'muscles', label: t.muscles, icon: Target },
    { id: 'recommendations', label: t.recommendations, icon: Sparkles },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col pt-safe"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 active:bg-slate-700 transition-colors"
              style={{ touchAction: 'manipulation' }}
            >
              <X size={18} className="text-slate-300" />
            </button>
            <div className="text-center flex-1 px-2">
              <h1 className="text-base font-bold text-white truncate">
                {language === 'zh' ? '本周训练总结' : 'Weekly Summary'}
              </h1>
              <p className="text-slate-500 text-[10px]">
                {current.dateRange?.start} ~ {current.dateRange?.end}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* 语言切换按钮 */}
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center px-2 h-10 rounded-lg bg-slate-800 active:bg-slate-700 transition-colors text-xs font-medium text-slate-300"
                style={{ touchAction: 'manipulation' }}
              >
                {language === 'zh' ? 'EN' : '中'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 active:bg-slate-700 transition-colors disabled:opacity-50"
                style={{ touchAction: 'manipulation' }}
              >
                <RotateCcw size={16} className={`text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tab Navigation - 移动端优化，减少padding */}
          <div className="flex px-2 pb-2 gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg font-medium text-xs whitespace-nowrap transition-all active:scale-95 ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/50 text-slate-400 active:text-slate-300 active:bg-slate-800'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
        >
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-3 space-y-3 pb-20"
              >
                {/* AI评价卡片 - 优化文本换行 */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-3.5 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-sm mb-1">{t.aiCoachReview}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed break-words">
                        {summary.overview}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 本周数据概览 - 2列紧凑布局 */}
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <h3 className="text-white font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                    <Trophy size={16} className="text-yellow-400" />
                    {t.weeklyData}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t.trainingDays, value: current.stats?.workoutDays, unit: t.day, icon: Calendar },
                      { label: t.totalSets, value: current.stats?.totalSets, unit: t.sets, icon: Target },
                      { label: t.totalVolume, value: current.stats?.totalVolume, unit: 'kg', icon: TrendingUp },
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <stat.icon size={12} className="text-slate-500" />
                          <span className="text-slate-500 text-[10px]">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-white font-bold text-base">{stat.value || 0}</span>
                          <span className="text-slate-500 text-[10px]">{stat.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Volume Assessment */}
                <div className={`rounded-xl p-3 border ${volumeInfo.borderColor} ${volumeInfo.bgColor}`}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-slate-900/50 flex items-center justify-center`}>
                      <Activity className={`w-4 h-4 ${volumeInfo.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm ${volumeInfo.color}`}>{volumeInfo.label}</h3>
                      <p className="text-slate-500 text-[10px]">{t.volAssessmentTitle}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">
                    {summary.volumeAssessment.description}
                  </p>
                  <div className="bg-slate-900/50 rounded-lg p-2.5">
                    <p className="text-slate-500 text-[10px] mb-0.5">{t.suggestion}</p>
                    <p className="text-slate-300 text-xs">{summary.volumeAssessment.suggestion}</p>
                  </div>
                </div>

                {/* Week Highlights */}
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <h3 className="text-white font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                    <Sparkles size={16} className="text-yellow-400" />
                    {t.weekHighlights}
                  </h3>
                  <div className="space-y-2">
                    {summary.highlights?.slice(0, 4).map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-xs leading-relaxed break-words">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recovery Status */}
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <h3 className="text-white font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                    <Zap size={16} className="text-blue-400" />
                    {t.recoveryStatus}
                  </h3>
                  <div className="space-y-2">
                    {summary.recoveryAdvice?.readyToTrain?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-xs leading-relaxed break-words">{item}</p>
                      </div>
                    ))}
                    {summary.recoveryAdvice?.needRest?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-xs leading-relaxed break-words">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Token使用信息 */}
                {summary.isAIGenerated && summary.tokenUsage && (
                  <TokenUsageBadge usage={summary.tokenUsage} cost={summary.estimatedCost} />
                )}
              </motion.div>
            )}

            {/* Sessions Tab - 每日训练记录 */}
            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-3 space-y-3 pb-20"
              >
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-1.5 text-sm">
                    <Dumbbell size={16} className="text-emerald-400" />
                    {t.weeklyTrainingRecord}
                    <span className="text-slate-500 font-normal ml-auto">
                      {current.sessions?.length || 0} {t.days}
                    </span>
                  </h3>
                  
                  {current.sessions?.length > 0 ? (
                    <div className="space-y-2">
                      {current.sessions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((session, idx) => (
                          <SessionCard key={session.id} session={session} index={idx} lang={language} t={t} />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500 text-sm">{t.noTrainingRecord}</p>
                    </div>
                  )}
                </div>

                {/* 训练统计 */}
                {current.sessions?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                      <p className="text-slate-500 text-xs mb-1">{t.mostActiveDay}</p>
                      <p className="text-white font-bold text-sm">
                        {(() => {
                          const maxSets = Math.max(...current.sessions.map(s => s.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0));
                          const bestDay = current.sessions.find(s => (s.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0) === maxSets);
                          return bestDay ? new Date(bestDay.date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }) : '-';
                        })()}
                      </p>
                      <p className="text-slate-500 text-[10px]">
                        {Math.max(...current.sessions.map(s => s.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0))}{language === 'zh' ? '组' : ' sets'}
                      </p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                      <p className="text-slate-500 text-xs mb-1">{t.avgIntensity}</p>
                      <p className="text-white font-bold text-sm">
                        {current.stats?.totalSets > 0 
                          ? Math.round((current.stats.totalVolume / current.stats.totalSets) * 10) / 10 
                          : 0} kg/组
                      </p>
                      <p className="text-slate-500 text-[10px]">{t.perSetLoad}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Muscles Tab */}
            {activeTab === 'muscles' && (
              <motion.div
                key="muscles"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-3 space-y-3 pb-20"
              >
                {/* Body Heatmap */}
                <BodyHeatmap muscleData={current.muscleDistribution || []} language={language} />

                {/* AI Muscle Analysis */}
                {summary.muscleAnalysis && summary.muscleAnalysis.length > 0 && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-1.5 text-sm">
                      <Brain size={16} className="text-blue-400" />
                      {t.aiMuscleAnalysis}
                    </h3>
                    <div className="space-y-2.5">
                      {summary.muscleAnalysis.slice(0, 4).map((analysis, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-2.5">
                          <h4 className="text-white font-medium text-sm mb-1">{analysis.muscle}</h4>
                          <p className="text-slate-400 text-xs mb-1.5 leading-relaxed">{analysis.analysis}</p>
                          <div className="flex items-start gap-1.5">
                            <ArrowRight size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                            <p className="text-emerald-400 text-xs">{analysis.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Recommendations Tab */}
            {activeTab === 'recommendations' && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-3 space-y-3 pb-20"
              >
                {/* Next Week Recommendations */}
                {summary.nextWeekRecommendations?.focusMuscles?.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-3 border border-blue-500/20">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-1.5 text-sm">
                      <Target size={16} className="text-blue-400" />
                      {t.nextWeekTraining}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {summary.nextWeekRecommendations.focusMuscles.map((muscle, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-medium"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Exercises */}
                {summary.nextWeekRecommendations?.suggestedExercises?.length > 0 && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-1.5 text-sm">
                      <Dumbbell size={16} className="text-emerald-400" />
                      {t.recommendedExercises}
                    </h3>
                    <div className="space-y-2.5">
                      {summary.nextWeekRecommendations.suggestedExercises.slice(0, 4).map((exercise, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-white font-medium text-sm truncate flex-1 pr-2">{exercise.name}</h4>
                            <span className="text-slate-500 text-[10px] flex-shrink-0">{exercise.muscle}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">
                              {exercise.sets}组
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">
                              {exercise.reps}次
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300">
                              {exercise.weight}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[10px]">{exercise.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Training Tips */}
                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                  <h3 className="text-white font-bold mb-2.5 flex items-center gap-1.5 text-sm">
                    <Sparkles size={16} className="text-yellow-400" />
                    {t.trainingTips}
                  </h3>
                  <div className="space-y-2">
                    {summary.nextWeekRecommendations?.trainingTips?.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Info size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300 text-xs leading-relaxed break-words">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeeklySummaryModal;
