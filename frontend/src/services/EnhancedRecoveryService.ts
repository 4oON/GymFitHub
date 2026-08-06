/**
 * Enhanced Recovery Calculation Service
 * 
 * 智能恢复算法 V2 - 考虑更多因素的科学恢复模型
 * 
 * 改进点：
 * 1. 渐进式恢复：不再从100%直接降到0%，而是根据训练量计算初始疲劳度
 * 2. 历史训练量权重：经常训练的肌肉恢复更快
 * 3. 训练强度影响：高容量训练导致更深度疲劳
 * 4. 主观反馈整合：用户感受直接影响恢复计算
 * 5. 个性化恢复曲线：基于用户适应度档案
 */

import type { WorkoutSession, RecoveryStatus, MuscleGroup } from '@/shared/types';
import type { MuscleFeedback } from '@/shared/types/feedback';
import muscleFeedbackService from '@/features/report/services/MuscleFeedbackService';

// 肌肉群的基准恢复时间（小时）
import { MuscleGroup as MG } from '@/shared/types';
const BASE_RECOVERY_HOURS: Record<MuscleGroup, number> = {
  [MG.CHEST]: 72,
  [MG.LATS]: 72,
  [MG.QUADS]: 96,
  [MG.GLUTES]: 72,
  [MG.SHOULDERS]: 48,
  [MG.BICEPS]: 48,
  [MG.TRICEPS]: 48,
  [MG.ABS]: 24,
  [MG.OBLIQUES]: 24,
  [MG.HAMSTRINGS]: 96,
  [MG.CALVES]: 48,
  [MG.FOREARMS]: 24,
  [MG.TRAPS]: 48,
  [MG.LOWER_BACK]: 72,
  [MG.CARDIO]: 24,
};

interface MuscleWorkoutLoad {
  muscle: MuscleGroup;
  totalSets: number;
  totalVolume: number;
  intensity: number; // 平均强度 (RPE 1-10)
  isPrimary: boolean;
}

interface RecoveryCalculationContext {
  muscle: MuscleGroup;
  lastWorked: number;
  workoutLoad: MuscleWorkoutLoad;
  history: WorkoutSession[];
  feedbackAdjustment?: number;
}

class EnhancedRecoveryService {

  /**
   * 计算所有肌肉群的恢复状态（增强版）
   */
  calculateRecoveryFromHistory(
    history: WorkoutSession[],
    customRecoveryHours?: Record<MuscleGroup, number>
  ): RecoveryStatus[] {
    // 计算每个肌肉群的训练负荷
    const muscleLoads = this.calculateMuscleLoads(history);
    
    // 计算每个肌肉群的历史训练频率（适应度）
    const muscleAdaptation = this.calculateMuscleAdaptation(history);

    // 生成所有肌肉群的恢复状态
    const allMuscleGroups = Object.keys(BASE_RECOVERY_HOURS) as MuscleGroup[];

    return allMuscleGroups.map(muscle => {
      const load = muscleLoads.get(muscle);
      const adaptation = muscleAdaptation.get(muscle);
      const baseHours = customRecoveryHours?.[muscle] || BASE_RECOVERY_HOURS[muscle];
      
      // 获取个性化恢复系数
      const personalizedFactor = muscleFeedbackService.getPersonalizedRecoveryFactor(muscle);
      
      // 计算调整后的恢复时间
      const adjustedHours = this.calculateAdjustedRecoveryHours(
        muscle,
        load,
        adaptation,
        baseHours,
        personalizedFactor
      );

      const lastWorked = load?.lastWorked || 0;
      const recoveryPercentage = this.calculateEnhancedRecoveryPercentage(
        lastWorked,
        adjustedHours,
        load,
        adaptation
      );

      return {
        muscle,
        lastWorked,
        recoveryPercentage,
        recoveryDurationHours: adjustedHours,
      };
    });
  }

  /**
   * 计算每个肌肉群的训练负荷
   */
  private calculateMuscleLoads(
    history: WorkoutSession[]
  ): Map<MuscleGroup, MuscleWorkoutLoad & { lastWorked: number }> {
    const loads = new Map<MuscleGroup, MuscleWorkoutLoad & { lastWorked: number }>();

    // 只考虑最近7天的训练
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentHistory = history.filter(h => new Date(h.date).getTime() > oneWeekAgo);

    for (const session of recentHistory) {
      const sessionTime = new Date(session.date).getTime();

      for (const exercise of session.exercises || []) {
        const muscle = exercise.muscleGroup as MuscleGroup;
        if (!muscle) continue;

        // 只计算有效的训练数据：completed + weight > 0 + reps > 0
        const sets = exercise.sets?.filter(s => 
          s.completed && s.weight > 0 && s.reps > 0
        ) || [];
        const setCount = sets.length;
        const volume = sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        
        // 如果没有有效组数，跳过这个练习
        if (setCount === 0) continue;
        // Estimate intensity based on reps (lower reps = higher intensity)
        // This is a simplified estimation since we don't have RPE data
        const avgReps = sets.length > 0
          ? sets.reduce((sum, s) => sum + s.reps, 0) / sets.length
          : 10;
        const estimatedRPE = Math.max(5, Math.min(10, 15 - avgReps)); // Lower reps = higher RPE

        const existing = loads.get(muscle);
        if (!existing || sessionTime > existing.lastWorked) {
          loads.set(muscle, {
            muscle,
            totalSets: setCount,
            totalVolume: volume,
            intensity: estimatedRPE,
            isPrimary: true,
            lastWorked: sessionTime,
          });
        } else if (sessionTime === existing.lastWorked) {
          // 同一天多次训练，累加
          existing.totalSets += setCount;
          existing.totalVolume += volume;
          existing.intensity = (existing.intensity + estimatedRPE) / 2;
        }

        // 处理次要肌肉群
        for (const secondaryMuscle of exercise.secondaryMuscles || []) {
          const secondaryLoad = loads.get(secondaryMuscle);
          if (!secondaryLoad || sessionTime > secondaryLoad.lastWorked) {
            loads.set(secondaryMuscle, {
              muscle: secondaryMuscle,
              totalSets: Math.ceil(setCount * 0.5), // 次要肌肉50%负荷
              totalVolume: Math.ceil(volume * 0.5),
              intensity: estimatedRPE,
              isPrimary: false,
              lastWorked: sessionTime,
            });
          }
        }
      }
    }

    return loads;
  }

  /**
   * 计算肌肉适应度（历史训练频率）
   */
  private calculateMuscleAdaptation(
    history: WorkoutSession[]
  ): Map<MuscleGroup, { weeklyFrequency: number; totalSets4Weeks: number }> {
    const adaptation = new Map<MuscleGroup, { weeklyFrequency: number; totalSets4Weeks: number }>();

    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
    const recentHistory = history.filter(h => new Date(h.date).getTime() > fourWeeksAgo);

    const muscleWorkoutCounts = new Map<MuscleGroup, { sessions: Set<string>; totalSets: number }>();

    for (const session of recentHistory) {
      for (const exercise of session.exercises || []) {
        const muscle = exercise.muscleGroup as MuscleGroup;
        if (!muscle) continue;

        const count = muscleWorkoutCounts.get(muscle) || { sessions: new Set(), totalSets: 0 };
        count.sessions.add(session.id);
        count.totalSets += exercise.sets?.filter(s => s.completed).length || 0;
        muscleWorkoutCounts.set(muscle, count);
      }
    }

    for (const [muscle, data] of muscleWorkoutCounts) {
      adaptation.set(muscle, {
        weeklyFrequency: data.sessions.size / 4, // 4周内的平均每周频率
        totalSets4Weeks: data.totalSets,
      });
    }

    return adaptation;
  }

  /**
   * 计算调整后的恢复时间
   */
  private calculateAdjustedRecoveryHours(
    muscle: MuscleGroup,
    load: MuscleWorkoutLoad & { lastWorked: number } | undefined,
    adaptation: { weeklyFrequency: number; totalSets4Weeks: number } | undefined,
    baseHours: number,
    personalizedFactor: number
  ): number {
    let adjustedHours = baseHours;

    if (load) {
      // 根据训练量调整恢复时间
      // 高容量训练需要更长时间恢复
      const volumeFactor = this.calculateVolumeFactor(load.totalSets, load.totalVolume);
      adjustedHours *= volumeFactor;

      // 根据强度调整
      const intensityFactor = 1 + ((load.intensity - 7) * 0.05); // RPE每高于7增加5%
      adjustedHours *= Math.max(0.8, intensityFactor);
    }

    if (adaptation) {
      // 经常训练的肌肉恢复更快（适应效应）
      // 每周训练2次以上，恢复时间减少10-20%
      const adaptationFactor = Math.max(0.8, 1 - (adaptation.weeklyFrequency * 0.05));
      adjustedHours *= adaptationFactor;
    }

    // 应用个性化恢复系数
    adjustedHours *= personalizedFactor;

    // 确保在合理范围内
    return Math.max(24, Math.min(168, adjustedHours)); // 24小时到7天
  }

  /**
   * 计算训练量因子
   */
  private calculateVolumeFactor(totalSets: number, totalVolume: number): number {
    // 基准：10组，5000容量
    const setFactor = Math.min(1.5, Math.max(0.8, totalSets / 10));
    const volumeFactor = Math.min(1.5, Math.max(0.8, totalVolume / 5000));
    
    // 综合因子，偏向训练组数
    return (setFactor * 0.6) + (volumeFactor * 0.4);
  }

  /**
   * 计算增强版恢复百分比
   */
  private calculateEnhancedRecoveryPercentage(
    lastWorked: number,
    durationHours: number,
    load?: MuscleWorkoutLoad,
    adaptation?: { weeklyFrequency: number; totalSets4Weeks: number }
  ): number {
    if (!lastWorked || lastWorked === 0) {
      return 100;
    }

    const now = Date.now();
    const elapsedHours = (now - lastWorked) / (60 * 60 * 1000);

    // 如果没有训练记录，完全恢复
    if (!load) {
      return 100;
    }

    // 渐进式恢复曲线
    // 训练后不会直接降到0%，而是根据训练量计算初始疲劳度
    const initialFatigue = this.calculateInitialFatigue(load, adaptation);
    
    // 恢复曲线：非线性，前慢后快
    const recoveryProgress = elapsedHours / durationHours;
    
    // 使用S曲线模拟真实恢复过程
    // 0-20%: 深度疲劳期，恢复慢
    // 20-80%: 主要恢复期
    // 80-100%: 超量恢复期
    let recoveryPercentage: number;
    
    if (recoveryProgress < 0.2) {
      // 深度疲劳期：恢复缓慢
      recoveryPercentage = initialFatigue + (recoveryProgress / 0.2) * 0.1 * (100 - initialFatigue);
    } else if (recoveryProgress < 0.8) {
      // 主要恢复期：线性恢复
      const deepPhaseRecovery = initialFatigue + 0.1 * (100 - initialFatigue);
      const mainPhaseProgress = (recoveryProgress - 0.2) / 0.6;
      recoveryPercentage = deepPhaseRecovery + mainPhaseProgress * 0.7 * (100 - deepPhaseRecovery);
    } else {
      // 超量恢复期：快速达到100%
      const mainPhaseRecovery = initialFatigue + 0.8 * (100 - initialFatigue);
      const supercompProgress = (recoveryProgress - 0.8) / 0.2;
      recoveryPercentage = mainPhaseRecovery + supercompProgress * (100 - mainPhaseRecovery);
    }

    return Math.min(100, Math.max(0, recoveryPercentage));
  }

  /**
   * 计算初始疲劳度
   * 
   * 训练后不会直接设为0%，而是根据训练量计算一个合理的初始恢复值
   * 例如：正常训练后可能从30-50%开始恢复，而不是从0%
   */
  private calculateInitialFatigue(
    load: MuscleWorkoutLoad,
    adaptation?: { weeklyFrequency: number; totalSets4Weeks: number }
  ): number {
    // 基础初始恢复值（30%）
    let initialRecovery = 30;

    // 根据训练量调整
    if (load.totalSets <= 6) {
      // 低容量训练：从50%开始
      initialRecovery = 50;
    } else if (load.totalSets <= 12) {
      // 中等容量：从35%开始
      initialRecovery = 35;
    } else {
      // 高容量：从20%开始
      initialRecovery = 20;
    }

    // 适应度影响：经常训练的肌肉初始恢复更好
    if (adaptation) {
      const adaptationBonus = Math.min(15, adaptation.weeklyFrequency * 3);
      initialRecovery += adaptationBonus;
    }

    // 强度影响：高强度训练初始恢复更差
    const intensityPenalty = Math.max(0, (load.intensity - 7) * 2);
    initialRecovery -= intensityPenalty;

    return Math.min(60, Math.max(15, initialRecovery));
  }

  /**
   * 更新恢复状态（训练完成后调用）- 增强版
   */
  updateRecoveryAfterWorkout(
    currentRecoveryState: RecoveryStatus[],
    session: WorkoutSession,
    primaryMuscles: Set<MuscleGroup>,
    secondaryMuscles: Set<MuscleGroup>
  ): RecoveryStatus[] {
    const now = Date.now();

    // 计算本次训练对各肌肉的负荷
    const workoutLoads = this.calculateSessionLoads(session);

    // 设置待收集反馈
    const allMuscles = [...new Set([...primaryMuscles, ...secondaryMuscles])];
    muscleFeedbackService.setPendingFeedback(session.id, allMuscles);

    // 更新动作新鲜度
    muscleFeedbackService.updateExerciseFreshness(
      session.exercises?.map(e => ({
        id: e.exerciseId,
        name: e.exerciseName || e.exerciseId,
        muscleGroup: e.muscleGroup,
      })) || []
    );

    return currentRecoveryState.map(status => {
      const isPrimary = primaryMuscles.has(status.muscle);
      const isSecondary = secondaryMuscles.has(status.muscle);
      const load = workoutLoads.get(status.muscle);

      if (isPrimary && load) {
        // 主要肌肉：基于训练量计算初始疲劳度
        const adaptation = { weeklyFrequency: 2, totalSets4Weeks: 40 }; // 简化处理
        const initialRecovery = this.calculateInitialFatigue(load, adaptation);
        
        // 计算恢复持续时间
        const baseHours = BASE_RECOVERY_HOURS[status.muscle] || 72;
        const durationHours = this.calculateAdjustedRecoveryHours(
          status.muscle,
          { ...load, lastWorked: now },
          adaptation,
          baseHours,
          muscleFeedbackService.getPersonalizedRecoveryFactor(status.muscle)
        );

        console.log(`🔄 ${status.muscle}: Initial recovery ${initialRecovery.toFixed(0)}%, Duration ${durationHours.toFixed(1)}h`);

        return {
          ...status,
          lastWorked: now,
          recoveryPercentage: initialRecovery,
          recoveryDurationHours: durationHours,
        };
      } else if (isSecondary && load) {
        // 次要肌肉：从更高的初始值开始
        const adaptation = { weeklyFrequency: 2, totalSets4Weeks: 40 };
        const initialRecovery = Math.min(70, this.calculateInitialFatigue(load, adaptation) + 20);
        
        return {
          ...status,
          lastWorked: now,
          recoveryPercentage: initialRecovery,
        };
      }

      return status;
    });
  }

  /**
   * 计算单次训练的肌肉负荷
   */
  private calculateSessionLoads(session: WorkoutSession): Map<MuscleGroup, MuscleWorkoutLoad> {
    const loads = new Map<MuscleGroup, MuscleWorkoutLoad>();

    for (const exercise of session.exercises || []) {
      const muscle = exercise.muscleGroup as MuscleGroup;
      if (!muscle) continue;

      // 只计算有效的训练数据：completed + weight > 0 + reps > 0
      const sets = exercise.sets?.filter(s => 
        s.completed && s.weight > 0 && s.reps > 0
      ) || [];
      const setCount = sets.length;
      const volume = sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      
      // 如果没有有效组数，跳过这个练习
      if (setCount === 0) continue;
      // Estimate intensity based on reps (lower reps = higher intensity)
      const avgReps = sets.length > 0
        ? sets.reduce((sum, s) => sum + s.reps, 0) / sets.length
        : 10;
      const avgRPE = Math.max(5, Math.min(10, 15 - avgReps));

      const existing = loads.get(muscle);
      if (existing) {
        existing.totalSets += setCount;
        existing.totalVolume += volume;
        existing.intensity = (existing.intensity + avgRPE) / 2;
      } else {
        loads.set(muscle, {
          muscle,
          totalSets: setCount,
          totalVolume: volume,
          intensity: avgRPE,
          isPrimary: true,
        });
      }
    }

    return loads;
  }

  /**
   * 整合主观反馈调整恢复状态
   */
  adjustRecoveryWithFeedback(
    recoveryState: RecoveryStatus[],
    muscle: MuscleGroup,
    feedbackRecoveryFeeling: MuscleFeedback['recoveryFeeling']
  ): RecoveryStatus[] {
    const adjustments: Record<string, number> = {
      fully_recovered: 1.0,
      mostly_recovered: 0.85,
      slightly_tired: 0.6,
      still_fatigued: 0.35,
      not_recovered: 0.1,
    };

    const targetPercentage = adjustments[feedbackRecoveryFeeling] * 100;

    return recoveryState.map(status => {
      if (status.muscle === muscle) {
        // 如果用户觉得恢复得比算法算的好，就调整
        if (targetPercentage > status.recoveryPercentage) {
          console.log(`🔄 Adjusting ${muscle} recovery: ${status.recoveryPercentage.toFixed(0)}% → ${targetPercentage.toFixed(0)}% (based on feedback)`);
          
          // 更新适应度档案的恢复系数
          this.updateRecoveryFactorFromFeedback(muscle, feedbackRecoveryFeeling);
          
          return {
            ...status,
            recoveryPercentage: targetPercentage,
          };
        }
      }
      return status;
    });
  }

  /**
   * 基于反馈更新恢复系数
   */
  private updateRecoveryFactorFromFeedback(
    muscle: MuscleGroup,
    feeling: MuscleFeedback['recoveryFeeling']
  ): void {
    const profile = muscleFeedbackService.getMuscleAdaptationProfile(muscle);
    if (!profile) return;

    // 如果经常报告恢复好，降低恢复系数（恢复更快）
    // 如果经常报告恢复差，提高恢复系数（恢复更慢）
    let factorChange = 0;
    switch (feeling) {
      case 'fully_recovered':
        factorChange = -0.05;
        break;
      case 'mostly_recovered':
        factorChange = -0.02;
        break;
      case 'still_fatigued':
        factorChange = 0.05;
        break;
      case 'not_recovered':
        factorChange = 0.1;
        break;
    }

    const newFactor = Math.max(0.5, Math.min(2.0, profile.personalizedRecoveryFactor + factorChange));
    
    // 更新存储
    const profiles = muscleFeedbackService.getAllAdaptationProfiles();
    profiles[muscle] = {
      ...profile,
      personalizedRecoveryFactor: newFactor,
    };
    
    // 保存到 localStorage
    localStorage.setItem('zenfit_muscle_adaptation_profiles', JSON.stringify(profiles));
  }

  // 兼容旧接口的方法
  getMusclesNeedingRecovery(recoveryState: RecoveryStatus[], threshold: number = 80): MuscleGroup[] {
    return recoveryState
      .filter(status => status.recoveryPercentage < threshold)
      .map(status => status.muscle);
  }

  getFullyRecoveredMuscles(recoveryState: RecoveryStatus[], threshold: number = 80): MuscleGroup[] {
    return recoveryState
      .filter(status => status.recoveryPercentage >= threshold)
      .map(status => status.muscle);
  }
}

export default new EnhancedRecoveryService();
