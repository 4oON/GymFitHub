/**
 * 每周训练总结服务 - Weekly Summary Service
 * 
 * 整合用户的训练数据，通过AI生成专业的每周训练总结
 * 优化版：缩短提示词，添加降级机制
 */

import type { 
  WeeklyReport, 
  WorkoutSession, 
  RecoveryStatus, 
  UserProfile,
  MuscleGroup 
} from '@/shared/types';
import { reportStorage } from './ReportStorageService';
import { getWeekInfo } from './WeeklyReportService';
import apiClient from '@/services/apiClient';
import type { TokenUsage } from '@/features/ai/services/AIWorkoutRecommendationService';
import { aiConfigBackendService } from '@/features/ai/services/AIConfigBackendService';
import { tokenCalculationService } from '@/features/ai/services/TokenCalculationService';


// 突破记录类型
export interface WeeklyHighlight {
  label: string;
  value: string;
  type: 'weight' | 'volume' | 'reps' | 'sets' | 'frequency' | 'other';
}

// AI生成的总结类型
export interface AIWeeklySummary {
  overview: string;
  dateRange?: string; // 例如: "2026-03-09 ~ 2026-03-15"
  highlights: string[];
  totalVolume: number; // 总负荷(kg)
  totalSets: number; // 总组数
  workoutDays: number; // 训练天数
  muscleAnalysis: {
    muscle: string;
    analysis: string;
    recommendation: string;
  }[];
  volumeAssessment: {
    level: 'insufficient' | 'adequate' | 'optimal' | 'excessive';
    description: string;
    suggestion: string;
  };
  nextWeekRecommendations: {
    focusMuscles: string[];
    suggestedExercises: {
      name: string;
      muscle: string;
      sets: number;
      reps: string;
      weight: string;
      reason: string;
    }[];
    trainingTips: string[];
  };
  recoveryAdvice: {
    readyToTrain: string[];
    needRest: string[];
    generalTips: string[];
  };
  generatedAt: number;
  weekNumber: number;
  year: number;
  isAIGenerated: boolean;
  // Token使用情况
  tokenUsage?: TokenUsage;
  estimatedCost?: { totalCost: number; currency: string };
  // UI状态
  tokenLoading?: boolean;
  // 余额对比（实际消费）
  balanceBefore?: number;
  balanceAfter?: number;
  actualCost?: number;
  currency?: string;
  // 本周突破记录
  weeklyHighlights?: WeeklyHighlight[];
}

// 获取最近两周的报告
const getRecentWeeklyReports = async (): Promise<{
  current: WeeklyReport | null;
  previous: WeeklyReport | null;
}> => {
  const allReports = await reportStorage.getAllReports();
  
  if (allReports.length === 0) {
    return { current: null, previous: null };
  }
  
  // 按时间排序（最新的在前）
  const sorted = allReports.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });
  
  console.log('[WeeklySummary] Latest report:', sorted[0]?.weekNumber, sorted[0]?.year);
  
  return {
    current: sorted[0] || null,
    previous: sorted[1] || null
  };
};

// 语言配置
const translations = {
  zh: {
    title: 'AI教练评价',
    weekLabel: '第几周',
    setsLabel: '总组数',
    volumeLabel: '训练量',
    assessmentLabel: '训练量',
    muscleLabel: '训练肌肉',
    nextWeekLabel: '下周建议',
    aiGenerated: 'AI生成',
    loadingText: 'AI正在分析您的训练数据...',
    loadingTime: '大约需要3-5秒',
    insufficient: '不足',
    adequate: '适中',
    optimal: '理想',
    excessive: '过量',
    trainingDays: '训练天数',
    totalSets: '总组数',
    totalVolume: '总负荷',
    restDays: '休息日'
  },
  en: {
    title: 'AI Coach Review',
    weekLabel: 'Week',
    setsLabel: 'Total Sets',
    volumeLabel: 'Volume',
    assessmentLabel: 'Status',
    muscleLabel: 'Trained Muscles',
    nextWeekLabel: 'Next Week Tips',
    aiGenerated: 'AI Generated',
    loadingText: 'AI is analyzing your training data...',
    loadingTime: 'About 3-5 seconds',
    insufficient: 'Low',
    adequate: 'Moderate',
    optimal: 'Ideal',
    excessive: 'High',
    trainingDays: 'Training Days',
    totalSets: 'Total Sets',
    totalVolume: 'Total Volume',
    restDays: 'Rest Days'
  }
};

// 获取当前语言
const getCurrentLanguage = (): 'zh' | 'en' => {
  try {
    return (localStorage.getItem('zenfit_language') as 'zh' | 'en') || 'zh';
  } catch {
    return 'zh';
  }
};

// 检测字符串是否包含中文
const containsChinese = (str: string): boolean => {
  return /[\u4e00-\u9fa5]/.test(str);
};

// 计算本周突破记录
const calculateWeeklyHighlights = (
  current: WeeklyReport,
  previous: WeeklyReport | null,
  lang: 'zh' | 'en'
): WeeklyHighlight[] => {
  const highlights: WeeklyHighlight[] = [];
  const sessions = current.sessions || [];
  
  if (sessions.length === 0) {
    return highlights;
  }

  // 1. 找出最大重量突破
  const exerciseMaxWeights = new Map<string, number>();
  sessions.forEach(session => {
    session.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.completed && set.weight > 0) {
          const currentMax = exerciseMaxWeights.get(exercise.exerciseName) || 0;
          if (set.weight > currentMax) {
            exerciseMaxWeights.set(exercise.exerciseName, set.weight);
          }
        }
      });
    });
  });

  // 找出最大重量TOP1
  let topWeightExercise = '';
  let topWeight = 0;
  exerciseMaxWeights.forEach((weight, exercise) => {
    if (weight > topWeight) {
      topWeight = weight;
      topWeightExercise = exercise;
    }
  });

  if (topWeight > 0) {
    highlights.push({
      label: lang === 'zh' ? `${topWeightExercise} 最大重量` : `${topWeightExercise} Max Weight`,
      value: `${topWeight} kg`,
      type: 'weight'
    });
  }

  // 2. 找出肌肉容量突破（本周容量最大的肌肉）
  if (current.muscleDistribution && current.muscleDistribution.length > 0) {
    const topMuscle = current.muscleDistribution[0];
    if (topMuscle && topMuscle.totalWeight > 0) {
      const muscleName = lang === 'zh' 
        ? (muscleNameMap[topMuscle.muscle] || topMuscle.muscle)
        : topMuscle.muscle;
      
      // 格式化容量显示
      let volumeValue = '';
      if (topMuscle.totalWeight >= 1000) {
        volumeValue = `${(topMuscle.totalWeight / 1000).toFixed(1)}t`;
      } else {
        volumeValue = `${topMuscle.totalWeight}kg`;
      }
      
      highlights.push({
        label: lang === 'zh' ? `${muscleName} 总容量` : `${muscleName} Volume`,
        value: volumeValue,
        type: 'volume'
      });
    }
  }

  // 3. 训练频率突破（与上周比较）
  if (previous) {
    const currentDays = current.stats.workoutDays;
    const previousDays = previous.stats.workoutDays;
    const dayDiff = currentDays - previousDays;
    
    if (dayDiff > 0) {
      highlights.push({
        label: lang === 'zh' ? '训练频率提升' : 'Training Frequency ↑',
        value: `+${dayDiff} ${lang === 'zh' ? '天' : 'days'}`,
        type: 'frequency'
      });
    }
  }

  // 4. 总容量突破（与上周比较）
  if (previous) {
    const currentVolume = current.stats.totalVolume;
    const previousVolume = previous.stats.totalVolume;
    const volumeChange = previousVolume > 0 
      ? ((currentVolume - previousVolume) / previousVolume * 100)
      : 0;
    
    if (volumeChange > 10) {
      highlights.push({
        label: lang === 'zh' ? '总容量增长' : 'Total Volume ↑',
        value: `+${volumeChange.toFixed(0)}%`,
        type: 'volume'
      });
    }
  }

  // 5. 如果突破不够4个，添加其他亮点
  if (highlights.length < 3) {
    // 总组数
    if (current.stats.totalSets > 50) {
      highlights.push({
        label: lang === 'zh' ? '总组数' : 'Total Sets',
        value: `${current.stats.totalSets} ${lang === 'zh' ? '组' : 'sets'}`,
        type: 'sets'
      });
    }
  }

  // 6. 如果有训练时长数据，添加时长亮点
  const totalDuration = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  if (totalDuration > 120) {
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;
    highlights.push({
      label: lang === 'zh' ? '总训练时长' : 'Total Duration',
      value: lang === 'zh' ? `${hours}小时${mins > 0 ? mins + '分' : ''}` : `${hours}h${mins > 0 ? mins + 'm' : ''}`,
      type: 'other'
    });
  }

  return highlights.slice(0, 4); // 最多返回4个
};

// 肌肉名称中英文映射
const muscleNameMap: Record<string, string> = {
  'Chest': '胸部',
  'Back': '背部',
  'Lats': '背阔肌',
  'Shoulders': '肩部',
  'Delts': '三角肌',
  'Biceps': '肱二头肌',
  'Triceps': '肱三头肌',
  'Arms': '手臂',
  'Quads': '股四头肌',
  'Hamstrings': '腘绳肌',
  'Glutes': '臀部',
  'Legs': '腿部',
  'Abs': '腹肌',
  'Core': '核心',
  'Calves': '小腿',
  'Traps': '斜方肌',
  'Lower Back': '下背部',
  'Forearms': '前臂'
};

// 生成AI提示词（支持中英文）
const generateShortAIPrompt = (
  current: WeeklyReport,
  previous: WeeklyReport | null,
  userProfile: UserProfile,
  recoveryState: RecoveryStatus[],
  language?: 'zh' | 'en'
): string => {
  const lang = language || getCurrentLanguage();
  const goal = userProfile.primaryGoal || (lang === 'zh' ? '增肌' : 'Hypertrophy');
  const topMuscles = current.muscleDistribution.slice(0, 3).map(m => m.muscle).join(lang === 'zh' ? '、' : ', ');
  const readyMuscles = recoveryState.filter(r => r.recoveryPercentage >= 85).map(r => r.muscle).join(lang === 'zh' ? '、' : ', ');
  
  if (lang === 'en') {
    return `[LANGUAGE: ENGLISH ONLY] You are an English-speaking professional fitness coach. ALL responses MUST be in English.

【User Profile】
- Goal: ${goal}
- Experience: ${userProfile.experienceLevel || 'Beginner'}
- Weight: ${userProfile.weight}${userProfile.unit}

【Training Data】
- Workout Days: ${current.stats.workoutDays} days
- Total Sets: ${current.stats.totalSets} sets
- Total Volume: ${current.stats.totalVolume}kg
- Main Muscles: ${topMuscles}
- Ready to Train: ${readyMuscles || 'None'}

【CRITICAL - MUST FOLLOW】
1. ALL text MUST be in ENGLISH ONLY
2. NO Chinese characters (中文) allowed in ANY field
3. Use English muscle names: Chest, Back, Lats, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Abs, Calves
4. Be motivational but professional
5. Return valid JSON format only

{
  "overview": "Brief English assessment (max 60 chars), like 'Strong week! Back and legs well stimulated'",
  "highlights": [
    "English achievement description",
    "English muscle group observation", 
    "English encouragement"
  ],
  "volumeAssessment": {
    "level": "optimal",
    "description": "English volume assessment",
    "suggestion": "English suggestion"
  },
  "nextWeekRecommendations": {
    "focusMuscles": ["English muscle name 1", "English muscle name 2"],
    "trainingTips": ["English tip 1", "English tip 2"]
  }
}

⚠️ WARNING: Chinese text will be rejected. Use English ONLY.`;
  }
  
  return `作为专业健身教练，分析本周训练数据并给出中文总结。

【用户档案】
- 训练目标：${goal}
- 经验等级：${userProfile.experienceLevel || '初级'}
- 体重：${userProfile.weight}${userProfile.unit}

【本周训练数据】
- 训练天数：${current.stats.workoutDays}天
- 总组数：${current.stats.totalSets}组
- 总负荷：${current.stats.totalVolume}kg
- 主要训练肌肉：${topMuscles}
- 已恢复可训练：${readyMuscles || '无'}

【输出要求】
1. 所有内容必须是中文
2. 不要出现英文
3. 肌肉名称使用中文（如：胸大肌、背阔肌、股四头肌等）
4. 返回以下JSON格式：

{
  "overview": "30字以内的中文总体评价",
  "highlights": ["中文亮点1", "中文亮点2", "中文亮点3"],
  "volumeAssessment": {
    "level": "optimal",
    "description": "中文训练量评价",
    "suggestion": "中文建议"
  },
  "nextWeekRecommendations": {
    "focusMuscles": ["中文肌肉名称1", "中文肌肉名称2"],
    "trainingTips": ["中文训练技巧1", "中文训练技巧2"]
  }
}`;
};

// 生成本地基础分析（AI失败时使用）
const generateLocalSummary = (
  current: WeeklyReport,
  previous: WeeklyReport | null,
  userProfile: UserProfile,
  recoveryState: RecoveryStatus[],
  language?: 'zh' | 'en'
): AIWeeklySummary => {
  const lang = language || getCurrentLanguage();
  const t = translations[lang];
  const { stats, muscleDistribution = [] } = current;
  const goal = userProfile.primaryGoal || 'Hypertrophy';
  
  // 训练量评估
  let volumeLevel: 'insufficient' | 'adequate' | 'optimal' | 'excessive' = 'adequate';
  const benchmarks = {
    Beginner: { min: 10, optimal: 20, max: 30 },
    Intermediate: { min: 15, optimal: 25, max: 40 },
    Advanced: { min: 20, optimal: 30, max: 50 }
  };
  const bm = benchmarks[userProfile.experienceLevel || 'Beginner'];
  if (stats.totalSets < bm.min) volumeLevel = 'insufficient';
  else if (stats.totalSets > bm.max) volumeLevel = 'excessive';
  else if (stats.totalSets >= bm.optimal) volumeLevel = 'optimal';
  
  // 生成概览（根据语言）
  let overview = lang === 'zh' 
    ? `本周训练${stats.workoutDays}天，总负荷${stats.totalVolume}kg`
    : `Trained ${stats.workoutDays} days this week, total volume ${stats.totalVolume}kg`;
    
  if (previous && current.weeklyProgress) {
    const change = current.weeklyProgress.volumeChange;
    if (lang === 'zh') {
      overview += `，较上周${change > 0 ? '增长' : '下降'}${Math.abs(change).toFixed(1)}%`;
    } else {
      overview += `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% from last week`;
    }
  }
  
  // 找出主要训练肌肉
  const topMuscles = muscleDistribution.slice(0, 3).map(m => m.muscle);
  
  // 恢复状态分析
  const readyMuscles = recoveryState.filter(r => r.recoveryPercentage >= 85);
  const fatiguedMuscles = recoveryState.filter(r => r.recoveryPercentage < 60);
  
  // 生成建议（根据语言）
  const volumeDescriptions: Record<string, string> = lang === 'zh' ? {
    insufficient: '本周训练量偏低，建议适当增加训练频率或组数',
    adequate: '训练量适中，保持当前节奏',
    optimal: '训练量理想，有利于达成增肌目标',
    excessive: '训练量偏高，注意恢复避免过度训练'
  } : {
    insufficient: 'Training volume is low this week. Consider increasing frequency or sets.',
    adequate: 'Training volume is moderate. Keep up the good work!',
    optimal: 'Training volume is ideal for achieving your goals.',
    excessive: 'Training volume is high. Ensure adequate recovery.'
  };
  
  const volumeSuggestions: Record<string, string> = lang === 'zh' ? {
    insufficient: goal === 'Hypertrophy' 
      ? '增肌建议每周15-20组/肌肉，可适当增加'
      : '建议逐步增加训练量以提升效果',
    adequate: '继续保持，可尝试渐进超负荷',
    optimal: '非常好！注意休息和饮食配合',
    excessive: '建议减少10-20%训练量，确保充分恢复'
  } : {
    insufficient: goal === 'Hypertrophy'
      ? 'For hypertrophy, aim for 15-20 sets per muscle per week.'
      : 'Consider gradually increasing training volume.',
    adequate: 'Maintain current routine. Try progressive overload.',
    optimal: 'Excellent! Ensure proper rest and nutrition.',
    excessive: 'Consider reducing volume by 10-20% for recovery.'
  };
  
  // 生成日期范围字符串
  const dateRangeStr = current.dateRange 
    ? `${current.dateRange.start} ~ ${current.dateRange.end}`
    : lang === 'zh' ? `第${current.weekNumber}周` : `Week ${current.weekNumber}`;
  
  // 计算本周突破记录
  const weeklyHighlights = calculateWeeklyHighlights(current, previous, lang);
  
  // Highlights 国际化
  const highlights = lang === 'zh' ? [
    `训练${stats.workoutDays}天，完成${stats.totalSets}组`,
    `重点训练: ${topMuscles.join('、')}`,
    readyMuscles.length > 0 
      ? `${readyMuscles.length}个肌肉已恢复可训练`
      : '肌肉恢复中，注意休息日'
  ] : [
    `Trained ${stats.workoutDays} days, completed ${stats.totalSets} sets`,
    `Focus: ${topMuscles.join(', ')}`,
    readyMuscles.length > 0
      ? `${readyMuscles.length} muscle groups ready to train`
      : 'Muscles recovering, take rest days'
  ];
  
  // Muscle analysis 国际化
  const muscleAnalysis = muscleDistribution.length > 0 
    ? muscleDistribution.slice(0, 3).map(m => ({
        muscle: m.muscle,
        analysis: lang === 'zh' 
          ? `${m.muscle}占本周训练${m.percentage.toFixed(1)}%，共${m.sets}组`
          : `${m.muscle}: ${m.percentage.toFixed(1)}% of weekly training, ${m.sets} sets`,
        recommendation: lang === 'zh'
          ? (m.percentage > 40 
              ? '训练占比高，下周可减少或替换'
              : m.percentage < 10 
                ? '训练量偏少，下周可增加'
                : '训练量适中，继续保持')
          : (m.percentage > 40
              ? 'High training ratio, consider reducing next week'
              : m.percentage < 10
                ? 'Low volume, consider increasing next week'
                : 'Good balance, maintain current volume')
      }))
    : [{ 
        muscle: lang === 'zh' ? '全身' : 'Full Body', 
        analysis: lang === 'zh' ? '综合训练' : 'Full body training', 
        recommendation: lang === 'zh' ? '保持训练频率' : 'Maintain training frequency'
      }];
  
  return {
    overview,
    dateRange: dateRangeStr,
    highlights,
    totalVolume: stats.totalVolume || 0,
    totalSets: stats.totalSets || 0,
    workoutDays: stats.workoutDays || 0,
    muscleAnalysis,
    volumeAssessment: {
      level: volumeLevel,
      description: volumeDescriptions[volumeLevel],
      suggestion: volumeSuggestions[volumeLevel]
    },
    nextWeekRecommendations: {
      focusMuscles: readyMuscles.length > 0 
        ? readyMuscles.slice(0, 2).map(r => r.muscle)
        : muscleDistribution.length > 0 
          ? muscleDistribution.slice(-2).map(m => m.muscle)
          : [lang === 'zh' ? '全身训练' : 'Full Body'],
      suggestedExercises: muscleDistribution.length > 0 
        ? muscleDistribution.slice(0, 2).flatMap(m => [
            {
              name: lang === 'zh' ? `${m.muscle}主推动作` : `${m.muscle} Primary Exercise`,
              muscle: m.muscle,
              sets: goal === 'Hypertrophy' ? 4 : 3,
              reps: goal === 'Hypertrophy' ? '8-12' : '6-8',
              weight: lang === 'zh' ? '基于上次递增2.5kg' : 'Increase 2.5kg from last time',
              reason: lang === 'zh' ? '渐进超负荷原则' : 'Progressive overload principle'
            }
          ])
        : [{ 
            name: lang === 'zh' ? '复合动作训练' : 'Compound Exercises', 
            muscle: lang === 'zh' ? '全身' : 'Full Body', 
            sets: 3, 
            reps: '10-12', 
            weight: lang === 'zh' ? '适中' : 'Moderate', 
            reason: lang === 'zh' ? '打好基础' : 'Build foundation'
          }],
      trainingTips: lang === 'zh' ? [
        goal === 'Hypertrophy' ? '增肌期保持蛋白质摄入1.6-2.2g/kg' : '注意营养补充',
        '保证每晚7-8小时睡眠',
        '训练前充分热身，训练后拉伸'
      ] : [
        goal === 'Hypertrophy' ? 'Consume 1.6-2.2g protein per kg bodyweight' : 'Ensure proper nutrition',
        'Get 7-8 hours of sleep nightly',
        'Warm up before training, stretch after'
      ]
    },
    recoveryAdvice: {
      readyToTrain: readyMuscles.length > 0 
        ? readyMuscles.map(r => lang === 'zh'
            ? `${r.muscle}: 已恢复${Math.round(r.recoveryPercentage)}%，可安排训练`
            : `${r.muscle}: ${Math.round(r.recoveryPercentage)}% recovered, ready to train`)
        : [lang === 'zh' ? '所有肌肉恢复中，建议休息或低强度训练' : 'All muscles recovering, rest or light training recommended'],
      needRest: fatiguedMuscles.length > 0
        ? fatiguedMuscles.map(r => lang === 'zh'
            ? `${r.muscle}: 仅恢复${Math.round(r.recoveryPercentage)}%，需更多休息`
            : `${r.muscle}: Only ${Math.round(r.recoveryPercentage)}% recovered, needs more rest`)
        : [lang === 'zh' ? '无疲劳肌肉' : 'No fatigued muscles'],
      generalTips: lang === 'zh' ? [
        '训练后30分钟内补充蛋白质',
        '每日饮水量2-3升',
        '使用泡沫轴放松紧张肌肉'
      ] : [
        'Consume protein within 30 minutes post-workout',
        'Drink 2-3 liters of water daily',
        'Use foam roller to relax tight muscles'
      ]
    },
    generatedAt: Date.now(),
    weekNumber: current.weekNumber,
    year: current.year,
    isAIGenerated: false,
    weeklyHighlights
  };
};

// 检查AI是否启用
const isAIEnabled = (): boolean => {
  try {
    return localStorage.getItem('zenfit_ai_enabled') !== 'false';
  } catch {
    return true;
  }
};

// 估算 token 数量（基于字符数）
// 注意：使用 TokenCalculationService 中的实现
const estimateTokens = (text: string): number => {
  return tokenCalculationService.estimateTokens(text);
};

// 调用后端AI（60秒超时，确保Kimi有足够时间响应）
const callAIOnce = async (prompt: string): Promise<{ content: string; usage?: any; estimatedUsage?: TokenUsage } | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('zenfit-token') || ''}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log('[WeeklySummary] AI response not OK:', response.status);
      if (response.status === 429) {
        console.warn('[WeeklySummary] Rate limited (429), backing off...');
        // 等待5秒后重试一次
        await new Promise(resolve => setTimeout(resolve, 5000));
        return null; // 返回 null 让调用方使用本地 summary
      }
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.content) {
      console.log('[WeeklySummary] AI response received, usage:', data.usage);
      
      // 如果 API 没有返回 usage，使用本地估算
      let estimatedUsage: TokenUsage | undefined;
      if (!data.usage) {
        const promptTokens = estimateTokens(prompt);
        const completionTokens = estimateTokens(data.content);
        estimatedUsage = {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens
        };
        console.log('[WeeklySummary] Estimated token usage:', estimatedUsage);
      }
      
      return { 
        content: data.content, 
        usage: data.usage,
        estimatedUsage
      };
    }
    return null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[WeeklySummary] AI call timeout (60s)');
    } else {
      console.log('[WeeklySummary] AI call failed:', error);
    }
    return null;
  }
};

// 解析AI响应
const parseAIResponse = (content: string): Partial<AIWeeklySummary> | null => {
  try {
    // 清理markdown代码块
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      jsonStr = content.replace(/```\n?/g, '');
    }
    
    jsonStr = jsonStr.trim();
    const parsed = JSON.parse(jsonStr);
    
    return {
      overview: parsed.overview || '',
      highlights: parsed.highlights || [],
      muscleAnalysis: parsed.muscleAnalysis || [],
      volumeAssessment: parsed.volumeAssessment || {
        level: 'adequate',
        description: '',
        suggestion: ''
      },
      nextWeekRecommendations: parsed.nextWeekRecommendations || {
        focusMuscles: [],
        suggestedExercises: [],
        trainingTips: []
      },
      recoveryAdvice: parsed.recoveryAdvice || {
        readyToTrain: [],
        needRest: [],
        generalTips: []
      }
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
};

// 主服务类
export class WeeklySummaryService {
  
  /**
   * 获取Weekly Reports数据
   */
  static async getWeeklyReportsData(): Promise<{
    current: WeeklyReport | null;
    previous: WeeklyReport | null;
  }> {
    return getRecentWeeklyReports();
  }
  
  /**
   * 生成每周总结（带AI和降级）
   */
  static async generateWeeklySummary(
    userProfile: UserProfile,
    recoveryState: RecoveryStatus[],
    options?: { language?: 'zh' | 'en'; skipAI?: boolean }
  ): Promise<AIWeeklySummary | null> {
    try {
      // 1. 获取weekly reports
      const { current, previous } = await getRecentWeeklyReports();
      
      if (!current) {
        console.log('No weekly report available');
        return null;
      }
      
      // 2. 检查AI是否启用（如果 skipAI 为 true，则禁用 AI）
      const aiEnabled = !options?.skipAI && isAIEnabled();
      console.log('[WeeklySummary] AI enabled:', aiEnabled, 'skipAI:', options?.skipAI);
      
      // 3. 生成本地基础分析
      const lang = options?.language || getCurrentLanguage();
      const localSummary = generateLocalSummary(current, previous, userProfile, recoveryState, lang);
      
      // 4. 如果AI被禁用，直接返回本地分析
      if (!aiEnabled) {
        console.log('[WeeklySummary] AI is disabled, using local summary');
        localStorage.setItem('zenfit_weekly_summary_cache', JSON.stringify({
          summary: localSummary,
          cachedAt: Date.now(),
          weekNumber: current.weekNumber,
          year: current.year,
          language: lang
        }));
        return localSummary;
      }
      
      // 5. 尝试AI增强（带重试）
      // 5.1 查询余额（调用前）
      let balanceBefore: number | undefined;
      let balanceAfter: number | undefined;
      let actualCost: number | undefined;
      let balanceCurrency: string | undefined;
      let activeConfigId: string | undefined;
      
      try {
        const configs = await aiConfigBackendService.getConfigs();
        const activeConfig = configs.find(c => c.isDefault && c.provider === 'kimi');
        if (activeConfig) {
          activeConfigId = activeConfig.id;
          const balanceResponse = await aiConfigBackendService.getBalance(activeConfig.id);
          console.log('[WeeklySummary] Balance response before:', balanceResponse);
          // 支持多种余额字段名 (Moonshot API 可能返回 available_balance 或 total_balance)
          const balanceValue = balanceResponse?.balance?.available_balance 
            || balanceResponse?.balance?.total_balance 
            || balanceResponse?.balance?.cash_balance;
          if (balanceValue !== undefined) {
            balanceBefore = parseFloat(String(balanceValue));
            balanceCurrency = 'CNY';
            console.log('[WeeklySummary] Balance before AI call:', balanceBefore, balanceCurrency);
          } else {
            console.log('[WeeklySummary] No balance value found in response:', balanceResponse?.balance);
          }
        }
      } catch (e) {
        console.log('[WeeklySummary] Failed to get balance before:', e);
      }
      
      const prompt = generateShortAIPrompt(current, previous, userProfile, recoveryState, lang);
      const aiResult = await callAIOnce(prompt); // 单次调用，8秒超时
      
      // 5.2 查询余额（调用后）
      try {
        if (balanceBefore !== undefined && activeConfigId) {
          // 等待2秒让余额更新
          await new Promise(resolve => setTimeout(resolve, 2000));
          const balanceResponse = await aiConfigBackendService.getBalance(activeConfigId);
          console.log('[WeeklySummary] Balance response after:', balanceResponse);
          // 支持多种余额字段名
          const balanceValue = balanceResponse?.balance?.available_balance 
            || balanceResponse?.balance?.total_balance 
            || balanceResponse?.balance?.cash_balance;
          if (balanceValue !== undefined) {
            balanceAfter = parseFloat(String(balanceValue));
            actualCost = balanceBefore - balanceAfter;
            console.log('[WeeklySummary] Balance after AI call:', balanceAfter, 'Cost:', actualCost);
          } else {
            console.log('[WeeklySummary] No balance value found in after response:', balanceResponse?.balance);
          }
        }
      } catch (e) {
        console.log('[WeeklySummary] Failed to get balance after:', e);
      }
      
      if (aiResult) {
      const aiData = parseAIResponse(aiResult.content);
      console.log('[WeeklySummary] AI result:', {
        hasContent: !!aiResult.content,
        usage: aiResult.usage,
        hasParsedData: !!aiData,
        actualCost,
        balanceBefore,
        balanceAfter
      });
      
      // 无论AI解析是否成功，只要有usage数据就记录token使用情况
      // 优先使用 API 返回的 usage，否则使用本地估算
      const tokenUsage: TokenUsage | undefined = aiResult.usage ? {
        prompt_tokens: aiResult.usage.prompt_tokens || 0,
        completion_tokens: aiResult.usage.completion_tokens || 0,
        total_tokens: aiResult.usage.total_tokens || 0
      } : aiResult.estimatedUsage;
      
      console.log('[WeeklySummary] Extracted tokenUsage:', tokenUsage);
      
      // 根据 Moonshot Kimi 定价计算费用（元）
      const estimatedCost = tokenUsage ? tokenCalculationService.calculateCost(tokenUsage, 'kimi') : undefined;
      
      console.log('[WeeklySummary] Estimated cost:', estimatedCost);
      
      if (aiData) {
        // 严格检测AI返回的内容语言是否匹配（扩大检测范围）
        const hasChineseInContent = lang === 'en' && (
          containsChinese(aiData.overview) ||
          aiData.highlights?.some((h: string) => containsChinese(h)) ||
          containsChinese(aiData.volumeAssessment?.description) ||
          containsChinese(aiData.volumeAssessment?.suggestion) ||
          aiData.muscleAnalysis?.some((m: any) => containsChinese(m.analysis) || containsChinese(m.recommendation)) ||
          aiData.nextWeekRecommendations?.trainingTips?.some((t: string) => containsChinese(t)) ||
          aiData.recoveryAdvice?.generalTips?.some((t: string) => containsChinese(t))
        );
        
        // 调试日志：记录检测到的中文字段
        if (hasChineseInContent) {
          console.log('[WeeklySummary] Detected Chinese in AI response:', {
            overview: aiData.overview,
            highlights: aiData.highlights,
            volumeDesc: aiData.volumeAssessment?.description,
            volumeSugg: aiData.volumeAssessment?.suggestion
          });
        }
        
        if (hasChineseInContent) {
          console.log('[WeeklySummary] AI returned wrong language, using local fallback');
          // 使用本地生成的 summary，但保留 token 信息用于显示
          const fallbackSummary: AIWeeklySummary = {
            ...localSummary,
            isAIGenerated: true, // 标记为 AI 调用过（虽然结果没用）
            tokenUsage,
            estimatedCost,
            // 添加余额对比信息
            balanceBefore,
            balanceAfter,
            actualCost,
            currency: balanceCurrency
          };
          localStorage.setItem('zenfit_weekly_summary_cache', JSON.stringify({
            summary: fallbackSummary,
            cachedAt: Date.now(),
            weekNumber: current.weekNumber,
            year: current.year,
            language: lang
          }));
          return fallbackSummary;
        }
        
        console.log('[WeeklySummary] Token usage:', tokenUsage);
        
        // 合并AI数据和本地数据
        // 保留本地计算的数值字段（AI可能不返回这些）
        const mergedSummary: AIWeeklySummary = {
          ...localSummary,
          ...aiData,
          // 保留本地数值字段（如果AI没返回或返回0）
          totalVolume: aiData.totalVolume || localSummary.totalVolume,
          totalSets: aiData.totalSets || localSummary.totalSets,
          workoutDays: aiData.workoutDays || localSummary.workoutDays,
          volumeAssessment: aiData.volumeAssessment || localSummary.volumeAssessment,
          nextWeekRecommendations: aiData.nextWeekRecommendations || localSummary.nextWeekRecommendations,
          recoveryAdvice: aiData.recoveryAdvice || localSummary.recoveryAdvice,
          isAIGenerated: true,
          tokenUsage,
          estimatedCost,
          // 添加余额对比信息
          balanceBefore,
          balanceAfter,
          actualCost,
          currency: balanceCurrency
        };
        
        console.log('[WeeklySummary] Merged summary with token:', {
          isAIGenerated: mergedSummary.isAIGenerated,
          hasTokenUsage: !!mergedSummary.tokenUsage,
          totalTokens: mergedSummary.tokenUsage?.total_tokens,
          actualCost: mergedSummary.actualCost
        });
        
        // 缓存结果
        localStorage.setItem('zenfit_weekly_summary_cache', JSON.stringify({
          summary: mergedSummary,
          cachedAt: Date.now(),
          weekNumber: current.weekNumber,
          year: current.year,
          language: lang
        }));
        
        return mergedSummary;
      } else {
        // AI返回了内容但解析失败，仍然记录token使用情况
        console.log('[WeeklySummary] AI content parse failed, using local fallback with token data');
        const fallbackSummary: AIWeeklySummary = {
          ...localSummary,
          isAIGenerated: true, // 标记为 AI 调用过
          tokenUsage,
          estimatedCost,
          // 添加余额对比信息
          balanceBefore,
          balanceAfter,
          actualCost,
          currency: balanceCurrency
        };
        localStorage.setItem('zenfit_weekly_summary_cache', JSON.stringify({
          summary: fallbackSummary,
          cachedAt: Date.now(),
          weekNumber: current.weekNumber,
          year: current.year,
          language: lang
        }));
        return fallbackSummary;
      }
    }
      
      // 6. AI失败，使用本地分析
      console.log('Using local summary (AI unavailable)');
      const localWithMeta: AIWeeklySummary = {
        ...localSummary,
        isAIGenerated: true  // 标记为true表示尝试过AI
        // 不设置 tokenLoading，让前端8秒后自动显示 Timeout
      };
      localStorage.setItem('zenfit_weekly_summary_cache', JSON.stringify({
        summary: localWithMeta,
        cachedAt: Date.now(),
        weekNumber: current.weekNumber,
        year: current.year,
        language: lang
      }));
      
      return localWithMeta;
      
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      return null;
    }
  }
  
  /**
   * 验证总结数据完整性
   */
  private static validateSummary(data: any): AIWeeklySummary | null {
    if (!data || typeof data !== 'object') return null;
    
    // 验证必需字段
    const required = ['overview', 'highlights', 'volumeAssessment', 'nextWeekRecommendations', 'recoveryAdvice', 'weekNumber', 'year'];
    for (const field of required) {
      if (!(field in data)) {
        console.log(`Missing field: ${field}`);
        return null;
      }
    }
    
    // 确保volumeAssessment有level字段
    if (!data.volumeAssessment?.level) {
      data.volumeAssessment = {
        level: 'adequate',
        description: 'Training volume is moderate',
        suggestion: 'Maintain current training routine'
      };
    }
    
    // 确保isAIGenerated字段存在
    // 检测AI生成内容：本地生成的overview包含"训练了"或"Trained"等统计词汇
    // AI生成的是自然语言评价，如"训练质量高但频次偏低"
    const isLocalPattern = /(本周|上周|Week|Trained \d+ days|total volume|总容量|比上周|from last week)/i.test(data.overview || '');
    const isNaturalLanguage = !isLocalPattern && (data.overview?.length > 20);
    
    if (typeof data.isAIGenerated !== 'boolean') {
      data.isAIGenerated = isNaturalLanguage;
    } else if (!data.isAIGenerated && isNaturalLanguage) {
      // 旧缓存数据标记为false，但内容看起来是AI生成的
      console.log('[validateSummary] Detected AI content, fixing isAIGenerated flag');
      data.isAIGenerated = true;
    }
    
    // 保留tokenUsage和estimatedCost（如果存在）
    // 这些字段是可选的，不需要验证
    
    return data as AIWeeklySummary;
  }
  
  /**
   * 获取缓存的总结
   */
  static getCachedSummary(language?: 'zh' | 'en'): AIWeeklySummary | null {
    try {
      const cached = localStorage.getItem('zenfit_weekly_summary_cache');
      if (!cached) return null;
      
      const { summary, cachedAt, weekNumber, year, language: cachedLanguage } = JSON.parse(cached);
      
      // 验证数据结构
      const validated = this.validateSummary(summary);
      if (!validated) {
        console.log('Invalid cached summary structure, clearing cache');
        localStorage.removeItem('zenfit_weekly_summary_cache');
        return null;
      }
      
      // 检查语言是否匹配（如果指定了语言）
      if (language && cachedLanguage && cachedLanguage !== language) {
        console.log('[WeeklySummary] Language mismatch, clearing cache');
        localStorage.removeItem('zenfit_weekly_summary_cache');
        return null;
      }
      
      // 检查是否过期（6小时）
      const cacheAge = Date.now() - cachedAt;
      if (cacheAge > 6 * 60 * 60 * 1000) {
        localStorage.removeItem('zenfit_weekly_summary_cache');
        return null;
      }
      
      // 检查是否当前周
      const now = new Date();
      const currentWeek = getWeekInfo(now);
      
      if (weekNumber !== currentWeek.weekNumber || year !== currentWeek.year) {
        return null;
      }
      
      return validated;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * 清除缓存
   */
  static clearCache(): void {
    localStorage.removeItem('zenfit_weekly_summary_cache');
  }
}

export default WeeklySummaryService;
