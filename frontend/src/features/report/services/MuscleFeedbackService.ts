/**
 * Muscle Feedback Service
 * 
 * 管理用户主观感受反馈，整合到恢复算法和训练推荐中
 */

import type { 
  MuscleFeedback, 
  CreateMuscleFeedbackInput, 
  MuscleAdaptationProfile,
  ExerciseFreshness
} from '@/shared/types/feedback';
import type { WorkoutSession, Exercise } from '@/shared/types';
import type { MuscleGroup } from '@/shared/types';
import { iOSStorage } from '@/services/iOSStorageService';

const STORAGE_KEYS = {
  FEEDBACKS: 'zenfit_muscle_feedbacks',
  ADAPTATION_PROFILES: 'zenfit_muscle_adaptation_profiles',
  EXERCISE_FRESHNESS: 'zenfit_exercise_freshness',
  PENDING_FEEDBACK: 'zenfit_pending_feedback',
};

// iOS Safe localStorage wrapper
const safeStorage = {
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = iOSStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  setItem: (key: string, value: unknown): boolean => {
    try {
      iOSStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

class MuscleFeedbackService {
  /**
   * 创建新的肌肉反馈
   */
  createFeedback(input: CreateMuscleFeedbackInput): MuscleFeedback {
    const feedback: MuscleFeedback = {
      id: `${Date.now()}_${input.muscle}`,
      ...input,
      createdAt: Date.now(),
    };

    const existing = this.getAllFeedbacks();
    existing.push(feedback);
    safeStorage.setItem(STORAGE_KEYS.FEEDBACKS, existing);

    // 更新肌肉适应度档案
    this.updateMuscleAdaptationProfile(input.muscle, feedback);

    return feedback;
  }

  /**
   * 批量创建反馈（一次训练多个肌肉）
   */
  createBatchFeedback(
    muscles: MuscleGroup[],
    workoutId: string,
    workoutDate: number,
    data: Omit<CreateMuscleFeedbackInput, 'muscle' | 'workoutId' | 'workoutDate'>
  ): MuscleFeedback[] {
    const feedbacks: MuscleFeedback[] = [];
    
    for (const muscle of muscles) {
      const feedback = this.createFeedback({
        muscle,
        workoutId,
        workoutDate,
        ...data,
      });
      feedbacks.push(feedback);
    }

    return feedbacks;
  }

  /**
   * 获取所有反馈
   */
  getAllFeedbacks(): MuscleFeedback[] {
    return safeStorage.getItem<MuscleFeedback[]>(STORAGE_KEYS.FEEDBACKS, []);
  }

  /**
   * 获取特定肌肉的反馈历史
   */
  getFeedbackForMuscle(muscle: MuscleGroup, limit: number = 10): MuscleFeedback[] {
    const all = this.getAllFeedbacks();
    return all
      .filter(f => f.muscle === muscle)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * 获取特定训练的反馈
   */
  getFeedbackForWorkout(workoutId: string): MuscleFeedback[] {
    const all = this.getAllFeedbacks();
    return all.filter(f => f.workoutId === workoutId);
  }

  /**
   * 更新肌肉适应度档案
   */
  private updateMuscleAdaptationProfile(muscle: MuscleGroup, newFeedback: MuscleFeedback): void {
    const profiles = safeStorage.getItem<Record<string, MuscleAdaptationProfile>>(
      STORAGE_KEYS.ADAPTATION_PROFILES, 
      {}
    );

    const existing = profiles[muscle];
    const history = this.getFeedbackForMuscle(muscle, 10);
    
    // 计算统计数据
    const avgSoreness = history.reduce((sum, f) => sum + this.sensationToNumber(f.sorenessLevel), 0) / history.length;
    const avgPump = history.reduce((sum, f) => sum + this.sensationToNumber(f.pumpLevel), 0) / history.length;
    
    // 计算平均恢复时间（基于反馈中报告的恢复感受）
    const recoveryHours = this.calculateAverageRecoveryTime(history);

    // 更新个性化恢复系数
    // 如果经常报告"完全恢复"且酸痛轻微，说明恢复能力强
    const recentFullyRecovered = history.filter(f => f.recoveryFeeling === 'fully_recovered').length;
    const recoveryRatio = recentFullyRecovered / history.length;
    
    let recoveryFactor = 1.0;
    if (recoveryRatio > 0.7) recoveryFactor = 0.8; // 恢复快
    else if (recoveryRatio < 0.3) recoveryFactor = 1.3; // 恢复慢

    profiles[muscle] = {
      muscle,
      recoveryAdaptationScore: Math.min(100, (recoveryRatio * 100) + (existing?.recoveryAdaptationScore || 0) / 2),
      volumeToleranceScore: Math.min(100, (avgPump * 20) + (existing?.volumeToleranceScore || 0) / 2),
      averageSoreness: avgSoreness,
      averagePump: avgPump,
      averageRecoveryTime: recoveryHours,
      recentWorkoutsCount: history.length,
      lastFeedbackAt: Date.now(),
      personalizedRecoveryFactor: recoveryFactor,
    };

    safeStorage.setItem(STORAGE_KEYS.ADAPTATION_PROFILES, profiles);
  }

  /**
   * 获取肌肉适应度档案
   */
  getMuscleAdaptationProfile(muscle: MuscleGroup): MuscleAdaptationProfile | null {
    const profiles = safeStorage.getItem<Record<string, MuscleAdaptationProfile>>(
      STORAGE_KEYS.ADAPTATION_PROFILES, 
      {}
    );
    return profiles[muscle] || this.createDefaultProfile(muscle);
  }

  /**
   * 创建默认档案
   */
  private createDefaultProfile(muscle: MuscleGroup): MuscleAdaptationProfile {
    return {
      muscle,
      recoveryAdaptationScore: 50,
      volumeToleranceScore: 50,
      averageSoreness: 2,
      averagePump: 2,
      averageRecoveryTime: 48,
      recentWorkoutsCount: 0,
      personalizedRecoveryFactor: 1.0,
    };
  }

  /**
   * 获取所有适应度档案
   */
  getAllAdaptationProfiles(): Record<string, MuscleAdaptationProfile> {
    return safeStorage.getItem<Record<string, MuscleAdaptationProfile>>(
      STORAGE_KEYS.ADAPTATION_PROFILES, 
      {}
    );
  }

  /**
   * 更新动作新鲜度
   */
  updateExerciseFreshness(exercises: Exercise[]): void {
    const freshness = safeStorage.getItem<Record<string, ExerciseFreshness>>(
      STORAGE_KEYS.EXERCISE_FRESHNESS, 
      {}
    );

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    for (const exercise of exercises) {
      const existing = freshness[exercise.id];
      
      // 计算时间窗口内的使用次数
      const isWithinWeek = existing && (now - existing.lastUsedAt) < oneWeek;
      const isWithinMonth = existing && (now - existing.lastUsedAt) < oneMonth;

      freshness[exercise.id] = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup as MuscleGroup,
        lastUsedAt: now,
        timesUsedThisWeek: isWithinWeek ? (existing?.timesUsedThisWeek || 0) + 1 : 1,
        timesUsedThisMonth: isWithinMonth ? (existing?.timesUsedThisMonth || 0) + 1 : 1,
        consecutiveUses: isWithinWeek ? (existing?.consecutiveUses || 0) + 1 : 1,
        // 新鲜度计算：使用次数越少，新鲜度越高
        freshnessScore: Math.max(0, 100 - ((existing?.timesUsedThisMonth || 0) * 10)),
      };
    }

    // 减少未使用动作的新鲜度（让它们变得新鲜）
    for (const key in freshness) {
      const ex = freshness[key];
      if (!exercises.find(e => e.id === key)) {
        const daysSinceUsed = (now - ex.lastUsedAt) / (24 * 60 * 60 * 1000);
        if (daysSinceUsed > 7) {
          ex.freshnessScore = Math.min(100, ex.freshnessScore + 10);
          ex.consecutiveUses = 0;
        }
      }
    }

    safeStorage.setItem(STORAGE_KEYS.EXERCISE_FRESHNESS, freshness);
  }

  /**
   * 获取动作新鲜度
   */
  getExerciseFreshness(exerciseId: string): ExerciseFreshness | null {
    const freshness = safeStorage.getItem<Record<string, ExerciseFreshness>>(
      STORAGE_KEYS.EXERCISE_FRESHNESS, 
      {}
    );
    return freshness[exerciseId] || null;
  }

  /**
   * 获取肌肉组下使用最频繁的动作
   */
  getMostUsedExercisesForMuscle(muscleGroup: MuscleGroup, limit: number = 3): ExerciseFreshness[] {
    const freshness = safeStorage.getItem<Record<string, ExerciseFreshness>>(
      STORAGE_KEYS.EXERCISE_FRESHNESS, 
      {}
    );

    return Object.values(freshness)
      .filter(f => f.muscleGroup === muscleGroup)
      .sort((a, b) => b.timesUsedThisMonth - a.timesUsedThisMonth)
      .slice(0, limit);
  }

  /**
   * 检查是否需要收集反馈（训练后24-48小时）
   */
  checkPendingFeedback(): { workoutId: string; workoutDate: number; muscles: MuscleGroup[] } | null {
    const pending = safeStorage.getItem<{ workoutId: string; date: number; muscles: MuscleGroup[] } | null>(
      STORAGE_KEYS.PENDING_FEEDBACK, 
      null
    );

    if (!pending) return null;

    const hoursSinceWorkout = (Date.now() - pending.date) / (60 * 60 * 1000);
    
    // 24-72小时后询问
    if (hoursSinceWorkout >= 24 && hoursSinceWorkout <= 72) {
      // 检查是否已经提交过反馈
      const existingFeedback = this.getFeedbackForWorkout(pending.workoutId);
      if (existingFeedback.length === 0) {
        return {
          workoutId: pending.workoutId,
          workoutDate: pending.date,
          muscles: pending.muscles,
        };
      }
    }

    // 超过72小时清除
    if (hoursSinceWorkout > 72) {
      safeStorage.setItem(STORAGE_KEYS.PENDING_FEEDBACK, null);
    }

    return null;
  }

  /**
   * 设置待收集反馈
   */
  setPendingFeedback(workoutId: string, muscles: MuscleGroup[]): void {
    safeStorage.setItem(STORAGE_KEYS.PENDING_FEEDBACK, {
      workoutId,
      date: Date.now(),
      muscles: [...new Set(muscles)],
    });
  }

  /**
   * 清除待收集反馈
   */
  clearPendingFeedback(): void {
    safeStorage.setItem(STORAGE_KEYS.PENDING_FEEDBACK, null);
  }

  /**
   * 获取所有需要反馈的训练（用于主动填写）
   * 包括：
   * 1. 待收集反馈（训练后24-72小时）
   * 2. 最近训练（训练后0-72小时，尚未提交反馈）
   */
  getAllPendingFeedbackWorkouts(
    recentSessions: { id: string; date: number; muscles: MuscleGroup[] }[]
  ): Array<{
    workoutId: string;
    workoutDate: number;
    muscles: MuscleGroup[];
    hoursSinceWorkout: number;
    canSubmitNow: boolean;
    submitted: boolean;
  }> {
    const result: ReturnType<typeof this.getAllPendingFeedbackWorkouts> = [];

    for (const session of recentSessions) {
      const hoursSince = (Date.now() - session.date) / (60 * 60 * 1000);
      
      // 只考虑72小时内的训练
      if (hoursSince > 72) continue;

      // 检查是否已提交反馈
      const existingFeedback = this.getFeedbackForWorkout(session.id);
      const submitted = existingFeedback.length > 0;

      result.push({
        workoutId: session.id,
        workoutDate: session.date,
        muscles: [...new Set(session.muscles)],
        hoursSinceWorkout: hoursSince,
        canSubmitNow: hoursSince >= 0, // 随时可以提交，但建议24小时后
        submitted,
      });
    }

    return result.sort((a, b) => b.workoutDate - a.workoutDate);
  }

  // 辅助方法
  private sensationToNumber(level: string): number {
    const map: Record<string, number> = {
      none: 0,
      mild: 1,
      moderate: 2,
      strong: 3,
      extreme: 4,
    };
    return map[level] || 2;
  }

  private calculateAverageRecoveryTime(history: MuscleFeedback[]): number {
    if (history.length === 0) return 48;

    const hoursMap: Record<string, number> = {
      fully_recovered: 24,
      mostly_recovered: 36,
      slightly_tired: 48,
      still_fatigued: 60,
      not_recovered: 72,
    };

    const total = history.reduce((sum, f) => sum + (hoursMap[f.recoveryFeeling] || 48), 0);
    return total / history.length;
  }

  /**
   * 获取个性化恢复系数
   */
  getPersonalizedRecoveryFactor(muscle: MuscleGroup): number {
    const profile = this.getMuscleAdaptationProfile(muscle);
    return profile?.personalizedRecoveryFactor || 1.0;
  }

  /**
   * 基于反馈调整恢复百分比
   * 
   * 重要：这个算法将主观反馈整合到恢复计算中
   */
  adjustRecoveryWithFeedback(
    muscle: MuscleGroup, 
    calculatedRecovery: number,
    hoursSinceWorkout: number
  ): number {
    const profile = this.getMuscleAdaptationProfile(muscle);
    if (!profile || profile.recentWorkoutsCount < 3) {
      // 反馈数据不足，使用基准算法
      return calculatedRecovery;
    }

    // 获取最近这次训练的反馈（如果在时间范围内）
    const recentFeedback = this.getFeedbackForMuscle(muscle, 1)[0];
    if (!recentFeedback) return calculatedRecovery;

    const hoursSinceFeedback = (Date.now() - recentFeedback.createdAt) / (60 * 60 * 1000);
    
    // 只考虑24小时内的反馈
    if (hoursSinceFeedback > 24) return calculatedRecovery;

    // 根据主观恢复感受调整
    const recoveryAdjustments: Record<string, number> = {
      fully_recovered: 1.2,      // 加速恢复
      mostly_recovered: 1.1,
      slightly_tired: 0.9,       // 略微减慢
      still_fatigued: 0.7,       // 明显减慢
      not_recovered: 0.5,        // 大幅减慢
    };

    const adjustment = recoveryAdjustments[recentFeedback.recoveryFeeling] || 1.0;
    
    // 应用个性化恢复系数
    const personalizedFactor = profile.personalizedRecoveryFactor;
    
    // 计算调整后的恢复百分比
    // 公式：基础恢复 * 主观调整 * 个性化系数
    const adjusted = calculatedRecovery * adjustment * personalizedFactor;

    // 边界限制
    return Math.min(100, Math.max(0, adjusted));
  }
}

export default new MuscleFeedbackService();
