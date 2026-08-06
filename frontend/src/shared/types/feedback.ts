/**
 * Muscle Feedback Types
 * 用户主观感受反馈系统 - 让AI了解真实的肌肉状态
 */

import type { MuscleGroup } from './index';

/**
 * 肌肉主观感受等级
 */
export type MuscleSensationLevel = 
  | 'none'      // 无感觉
  | 'mild'      // 轻微
  | 'moderate'  // 中等
  | 'strong'    // 强烈
  | 'extreme';  // 极强

/**
 * 肌肉酸痛等级
 */
export type MuscleSorenessLevel = 
  | 'none'      // 无酸痛
  | 'mild'      // 轻微酸痛
  | 'moderate'  // 中等酸痛
  | 'severe'    // 严重酸痛
  | 'extreme';  // 剧痛（建议休息）

/**
 * 泵感持续时间
 */
export type PumpDuration = 
  | 'none'      // 无泵感
  | 'short'     // 训练后30分钟内消退
  | 'medium'    // 持续1-2小时
  | 'long'      // 持续半天
  | 'very_long'; // 持续到第二天

/**
 * 单次肌肉反馈记录
 */
export interface MuscleFeedback {
  id: string;
  muscle: MuscleGroup;
  workoutId: string;          // 关联的训练ID
  workoutDate: number;        // 训练时间戳
  
  // 主观感受（训练后24-48小时填写）
  sorenessLevel: MuscleSorenessLevel;    // 酸痛等级
  pumpLevel: MuscleSensationLevel;       // 泵感强度
  pumpDuration: PumpDuration;            // 泵感持续时间
  fatigueLevel: MuscleSensationLevel;    // 疲劳程度
  
  // 恢复状态评估
  recoveryFeeling: 'fully_recovered' | 'mostly_recovered' | 'slightly_tired' | 'still_fatigued' | 'not_recovered';
  
  // 额外备注
  notes?: string;
  
  // 元数据
  createdAt: number;
  updatedAt?: number;
}

/**
 * 反馈收集状态
 */
export interface FeedbackCollectionState {
  workoutId: string;
  workoutDate: number;
  musclesTrained: MuscleGroup[];
  feedbackDueTime: number;    // 建议反馈时间（训练后24小时）
  isCompleted: boolean;
  completedAt?: number;
}

/**
 * 肌肉适应度档案（基于历史反馈）
 */
export interface MuscleAdaptationProfile {
  muscle: MuscleGroup;
  
  // 适应能力评分 (0-100)
  recoveryAdaptationScore: number;   // 恢复适应能力
  volumeToleranceScore: number;      // 容量耐受度
  
  // 历史统计
  averageSoreness: number;           // 平均酸痛等级 (0-4)
  averagePump: number;               // 平均泵感等级 (0-4)
  averageRecoveryTime: number;       // 平均恢复时间(小时)
  
  // 最近表现
  recentWorkoutsCount: number;       // 最近训练次数
  lastFeedbackAt?: number;           // 最后反馈时间
  
  // 个性化恢复系数 (影响算法)
  personalizedRecoveryFactor: number; // 0.5-2.0, 1.0为基准
}

/**
 * 动作新鲜度记录
 */
export interface ExerciseFreshness {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  
  // 使用历史
  lastUsedAt: number;        // 上次使用
  timesUsedThisMonth: number; // 本月使用次数
  timesUsedThisWeek: number;  // 本周使用次数
  consecutiveUses: number;    // 连续使用次数
  
  // 新鲜度评分 (0-100)
  freshnessScore: number;
  
  // 上次反馈
  lastPumpRating?: MuscleSensationLevel;
  lastSorenessRating?: MuscleSorenessLevel;
}

/**
 * 创建新反馈的输入
 */
export interface CreateMuscleFeedbackInput {
  muscle: MuscleGroup;
  workoutId: string;
  workoutDate: number;
  sorenessLevel: MuscleSorenessLevel;
  pumpLevel: MuscleSensationLevel;
  pumpDuration: PumpDuration;
  fatigueLevel: MuscleSensationLevel;
  recoveryFeeling: MuscleFeedback['recoveryFeeling'];
  notes?: string;
}

/**
 * 反馈选项配置
 */
export const MUSCLE_SENSATION_OPTIONS: { value: MuscleSensationLevel; label: string; emoji: string }[] = [
  { value: 'none', label: '无感觉', emoji: '😶' },
  { value: 'mild', label: '轻微', emoji: '🙂' },
  { value: 'moderate', label: '中等', emoji: '💪' },
  { value: 'strong', label: '强烈', emoji: '🔥' },
  { value: 'extreme', label: '极强', emoji: '🚀' },
];

export const MUSCLE_SORENESS_OPTIONS: { value: MuscleSorenessLevel; label: string; emoji: string; color: string }[] = [
  { value: 'none', label: '无酸痛', emoji: '✅', color: 'text-emerald-400' },
  { value: 'mild', label: '轻微酸痛', emoji: '😌', color: 'text-cyan-400' },
  { value: 'moderate', label: '中等酸痛', emoji: '😅', color: 'text-amber-400' },
  { value: 'severe', label: '严重酸痛', emoji: '😣', color: 'text-orange-400' },
  { value: 'extreme', label: '剧痛(需休息)', emoji: '🚫', color: 'text-rose-500' },
];

export const PUMP_DURATION_OPTIONS: { value: PumpDuration; label: string; emoji: string }[] = [
  { value: 'none', label: '无泵感', emoji: '😶' },
  { value: 'short', label: '30分钟内消退', emoji: '⏱️' },
  { value: 'medium', label: '持续1-2小时', emoji: '💪' },
  { value: 'long', label: '持续半天', emoji: '🔥' },
  { value: 'very_long', label: '持续到第二天', emoji: '🚀' },
];

export const RECOVERY_FEELING_OPTIONS: { value: MuscleFeedback['recoveryFeeling']; label: string; emoji: string; color: string }[] = [
  { value: 'fully_recovered', label: '完全恢复', emoji: '💯', color: 'text-emerald-400' },
  { value: 'mostly_recovered', label: '基本恢复', emoji: '✅', color: 'text-cyan-400' },
  { value: 'slightly_tired', label: '略有疲劳', emoji: '😌', color: 'text-amber-400' },
  { value: 'still_fatigued', label: '仍然疲劳', emoji: '😅', color: 'text-orange-400' },
  { value: 'not_recovered', label: '未恢复', emoji: '😣', color: 'text-rose-500' },
];
