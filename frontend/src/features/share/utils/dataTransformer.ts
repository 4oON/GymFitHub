/**
 * 数据转换工具
 * Data Transformer - 将各种数据格式转换为 ShareCardData
 */

import type { ShareCardData, ShareCardHighlight } from '../types';
import type { AIWeeklySummary } from '../../report/services/WeeklySummaryService';
import type { WeeklyReport } from '@/shared/types';

/**
 * 从 AIWeeklySummary 转换
 */
export const fromAIWeeklySummary = (
  summary: AIWeeklySummary,
  options?: { language?: 'zh' | 'en' }
): ShareCardData => {
  const lang = options?.language || 'zh';
  
  // 根据 level 获取对应标签
  const getVolumeLabel = (level: string): string => {
    const labels: Record<string, { zh: string; en: string }> = {
      insufficient: { zh: '不足', en: 'Low' },
      adequate: { zh: '适中', en: 'Moderate' },
      optimal: { zh: '理想', en: 'Ideal' },
      excessive: { zh: '过量', en: 'High' }
    };
    return labels[level]?.[lang] || labels[level]?.en || level;
  };
  
  // 转换突破记录
  const highlights: ShareCardHighlight[] = summary.weeklyHighlights?.map(h => ({
    label: h.label,
    value: h.value,
    type: h.type
  })) || [];

  return {
    workoutDays: summary.workoutDays,
    totalSets: summary.totalSets,
    totalVolume: summary.totalVolume,
    volumeLevel: summary.volumeAssessment?.level || 'adequate',
    volumeLabel: getVolumeLabel(summary.volumeAssessment?.level || 'adequate'),
    dateRange: summary.dateRange || '',
    weekNumber: summary.weekNumber,
    year: summary.year,
    tokenUsage: summary.tokenUsage,
    estimatedCost: summary.estimatedCost ? { totalCost: summary.estimatedCost.totalCost } : undefined,
    isAIGenerated: summary.isAIGenerated,
    trainedMuscles: summary.muscleAnalysis?.map(m => m.muscle),
    nextWeekRecommendations: summary.nextWeekRecommendations?.focusMuscles,
    overview: summary.overview,
    language: lang,
    highlights
  };
};

/**
 * 从 WeeklyReport 转换
 */
export const fromWeeklyReport = (
  report: WeeklyReport,
  options?: { 
    language?: 'zh' | 'en';
    overview?: string;
    tokenUsage?: ShareCardData['tokenUsage'];
    estimatedCost?: ShareCardData['estimatedCost'];
    isAIGenerated?: boolean;
  }
): ShareCardData => {
  const lang = options?.language || 'zh';
  
  // 根据训练量判断等级
  const volume = report.stats.totalVolume;
  const workoutDays = report.stats.workoutDays;
  
  let level: ShareCardData['volumeLevel'] = 'adequate';
  let label = lang === 'zh' ? '适中' : 'Moderate';
  
  if (workoutDays < 2) {
    level = 'insufficient';
    label = lang === 'zh' ? '不足' : 'Low';
  } else if (workoutDays >= 5 && volume > 50000) {
    level = 'excessive';
    label = lang === 'zh' ? '过量' : 'High';
  } else if (workoutDays >= 3 && volume >= 20000) {
    level = 'optimal';
    label = lang === 'zh' ? '理想' : 'Ideal';
  }

  return {
    workoutDays: report.stats.workoutDays,
    totalSets: report.stats.totalSets,
    totalVolume: report.stats.totalVolume,
    volumeLevel: level,
    volumeLabel: label,
    dateRange: `${report.dateRange.start} ~ ${report.dateRange.end}`,
    weekNumber: report.weekNumber,
    year: report.year,
    tokenUsage: options?.tokenUsage,
    estimatedCost: options?.estimatedCost,
    isAIGenerated: options?.isAIGenerated,
    overview: options?.overview,
    language: lang
  };
};

/**
 * 从简单数据对象转换
 */
export const fromSimpleData = (data: {
  workoutDays: number;
  totalSets: number;
  totalVolume: number;
  dateRange: string;
  volumeLevel?: ShareCardData['volumeLevel'];
  volumeLabel?: string;
  language?: 'zh' | 'en';
  weekNumber?: number;
  year?: number;
  tokenUsage?: ShareCardData['tokenUsage'];
  estimatedCost?: ShareCardData['estimatedCost'];
  isAIGenerated?: boolean;
  overview?: string;
}): ShareCardData => {
  const lang = data.language || 'zh';
  
  return {
    workoutDays: data.workoutDays,
    totalSets: data.totalSets,
    totalVolume: data.totalVolume,
    volumeLevel: data.volumeLevel || 'adequate',
    volumeLabel: data.volumeLabel || (lang === 'zh' ? '适中' : 'Moderate'),
    dateRange: data.dateRange,
    weekNumber: data.weekNumber,
    year: data.year,
    tokenUsage: data.tokenUsage,
    estimatedCost: data.estimatedCost,
    isAIGenerated: data.isAIGenerated,
    overview: data.overview,
    language: lang
  };
};

/**
 * 智能检测数据类型并转换
 */
export const transformToShareData = (
  data: AIWeeklySummary | WeeklyReport | Partial<ShareCardData>,
  options?: { language?: 'zh' | 'en' }
): ShareCardData => {
  // 检测数据类型
  if ('volumeAssessment' in data) {
    return fromAIWeeklySummary(data as AIWeeklySummary, options);
  }
  
  if ('stats' in data && 'weekNumber' in data) {
    return fromWeeklyReport(data as WeeklyReport, options);
  }
  
  // 默认当作 ShareCardData 处理 - 需要补充必填字段
  const partial = data as Partial<ShareCardData>;
  const lang = options?.language || partial.language || 'zh';
  
  return fromSimpleData({
    workoutDays: partial.workoutDays || 0,
    totalSets: partial.totalSets || 0,
    totalVolume: partial.totalVolume || 0,
    dateRange: partial.dateRange || '',
    volumeLevel: partial.volumeLevel,
    volumeLabel: partial.volumeLabel,
    language: lang,
    weekNumber: partial.weekNumber,
    year: partial.year,
    tokenUsage: partial.tokenUsage,
    estimatedCost: partial.estimatedCost,
    isAIGenerated: partial.isAIGenerated,
    overview: partial.overview
  });
};
