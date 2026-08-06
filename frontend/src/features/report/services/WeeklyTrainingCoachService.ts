/**
 * Weekly Training Coach Service - Elite Bodybuilding Coaching
 * 
 * Professional coach providing deep insights for:
 * - Scientific hypertrophy programming
 * - Aesthetic physique development
 * - Weak point analysis & prioritization
 * - Periodization & progression
 * - Psychological motivation & accountability
 * - Smart exercise recommendations based on training history
 */

import type { WeeklyReport, WorkoutSession, Exercise } from '@/shared/types';
import type { RecoveryStatus } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { INITIAL_EXERCISES } from '@/shared/constants/initial_exercises';
import muscleFeedbackService from './MuscleFeedbackService';
import type { ExerciseFreshness } from '@/shared/types/feedback';
import { VolumeCalculationService } from '@/features/workout/services/VolumeCalculationService';

export interface TrainingInsight {
  type: 'pre_week' | 'post_session' | 'mid_week' | 'late_week' | 'weekend';
  title: string;
  message: string;
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyProgress {
  daysTrained: number;
  totalSets: number;
  totalVolume: number;
  muscleDistribution: Record<string, number>;
  targetMuscles: string[];
  completedMuscles: string[];
  readyMuscles: string[];
  fatiguedMuscles: string[];
}

export interface RecommendedExercise {
  exercise: Exercise;
  totalVolume: number;
  totalSets: number;
  frequency: number;
  isNewExercise: boolean;
  reason: string;
}

export interface TokenUsage {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface CoachRecommendation {
  currentProgress: WeeklyProgress;
  insight: TrainingInsight;
  nextSessionSuggestion?: NextSessionRecommendation;
  tokenUsage?: TokenUsage;
  estimatedCost?: {
    totalCost: number;
    currency: string;
  };
}

// Hypertrophy volume landmarks (based on scientific literature)
const VOLUME_LANDMARKS = {
  mv: 10,   // Minimum effective volume
  mev: 12,  // Minimum effective volume for growth
  mav: 20,  // Maximum adaptive volume (sweet spot)
  mrv: 25   // Maximum recoverable volume
};

// Aesthetic priority matrix
const AESTHETIC_PRIORITIES = {
  v_taper: ['Lats', 'Shoulders', 'Back'],
  x_frame: ['Chest', 'Lats', 'Shoulders', 'Quads', 'Glutes'],
  detail: ['Abs', 'Calves', 'Biceps', 'Triceps', 'Forearms']
};

// Muscle group to exercise mapping for recommendations
const MUSCLE_GROUP_EXERCISES: Record<string, string[]> = {
  'Lats': ['Lat Pulldown', 'Pull-ups', 'Bent Over Row', 'Seated Cable Row', 'Straight Arm Pulldown'],
  'Back': ['Bent Over Row', 'Deadlift', 'Seated Cable Row', 'T-Bar Row'],
  'Chest': ['Bench Press', 'Incline Bench Press', 'Dumbbell Flyes', 'Push-ups'],
  'Shoulders': ['Overhead Press', 'Lateral Raises', 'Rear Delt Fly', 'Arnold Press'],
  'Biceps': ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl'],
  'Triceps': ['Tricep Pushdown', 'Skullcrushers', 'Close-Grip Bench Press', 'Dips'],
  'Quads': ['Squat', 'Leg Press', 'Leg Extension', 'Front Squat'],
  'Hamstrings': ['Romanian Deadlift', 'Leg Curl', 'Good Morning', 'Stiff-Leg Deadlift'],
  'Glutes': ['Hip Thrust', 'Glute Bridge', 'Cable Pull Through', 'Step-ups'],
  'Calves': ['Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise'],
  'Abs': ['Plank', 'Crunches', 'Leg Raises', 'Russian Twists'],
  'Forearms': ['Wrist Curl', 'Reverse Wrist Curl', 'Farmer Walk'],
  'Traps': ['Shrugs', 'Upright Row', 'Face Pulls'],
  'Lower Back': ['Back Extension', 'Superman', 'Good Morning', 'Deadlift']
};

// Related muscle groups for synergy training
const SYNERGY_MUSCLE_GROUPS: Record<string, string[]> = {
  'Lats': ['Traps', 'Lower Back', 'Biceps', 'Rear Delt'],
  'Back': ['Traps', 'Lower Back', 'Biceps'],
  'Chest': ['Triceps', 'Front Delt'],
  'Shoulders': ['Traps', 'Triceps'],
  'Biceps': ['Back', 'Lats'],
  'Triceps': ['Chest', 'Shoulders'],
  'Quads': ['Glutes', 'Calves'],
  'Hamstrings': ['Glutes', 'Lower Back'],
  'Glutes': ['Hamstrings', 'Quads']
};

// Exercise recommendation groups - each group is a set of 2 exercises
export interface ExerciseRecommendationGroup {
  id: string;
  name: string;
  focus: string;
  exercises: RecommendedExercise[];
}

export interface NextSessionRecommendation {
  targetMuscles: string[];
  estimatedSets: number;
  focus: 'volume' | 'intensity' | 'weak_points' | 'recovery' | 'aesthetics';
  recommendationGroups: ExerciseRecommendationGroup[];
}

class WeeklyTrainingCoachService {
  
  private static getCurrentDay(): number {
    return new Date().getDay();
  }

  /**
   * Analyze all historical reports to find user's most performed exercises by volume
   */
  static analyzeHistoricalExerciseData(allReports: WeeklyReport[]): Map<string, {
    exerciseName: string;
    muscleGroup: string;
    totalVolume: number;
    totalSets: number;
    frequency: number;
  }> {
    const exerciseStats = new Map<string, {
      exerciseName: string;
      muscleGroup: string;
      totalVolume: number;
      totalSets: number;
      frequency: number;
    }>();

    allReports.forEach(report => {
      report.sessions?.forEach(session => {
        session.exercises?.forEach(ex => {
          const exerciseKey = ex.exerciseName || ex.exerciseId;
          if (!exerciseKey) return;

          const completedSets = ex.sets?.filter(s => s.completed) || [];
          const setCount = completedSets.length;
          // Use VolumeCalculationService for accurate volume calculation
          const volume = VolumeCalculationService.calculateActiveExerciseVolume(
            ex,
            INITIAL_EXERCISES,
            {} // Use default bodyweight
          );

          if (setCount > 0) {
            const existing = exerciseStats.get(exerciseKey);
            if (existing) {
              existing.totalVolume += volume;
              existing.totalSets += setCount;
              existing.frequency += 1;
            } else {
              exerciseStats.set(exerciseKey, {
                exerciseName: ex.exerciseName || ex.exerciseId,
                muscleGroup: ex.muscleGroup,
                totalVolume: volume,
                totalSets: setCount,
                frequency: 1
              });
            }
          }
        });
      });
    });

    return exerciseStats;
  }

  /**
   * Get top exercises for a specific muscle group based on historical volume
   * 
   * 增强版：考虑动作新鲜度，避免重复推荐最近用过的动作
   */
  static getTopExercisesForMuscle(
    muscleGroup: string,
    allReports: WeeklyReport[],
    limit: number = 2,
    prioritizeFreshness: boolean = true
  ): RecommendedExercise[] {
    const exerciseStats = this.analyzeHistoricalExerciseData(allReports);
    
    // 获取动作新鲜度信息
    const freshnessMap = new Map<string, ExerciseFreshness>();
    if (prioritizeFreshness) {
      INITIAL_EXERCISES
        .filter(e => e.muscleGroup === muscleGroup)
        .forEach(e => {
          const freshness = muscleFeedbackService.getExerciseFreshness(e.id);
          if (freshness) {
            freshnessMap.set(e.id, freshness);
          }
        });
    }

    // Filter exercises for target muscle group
    const muscleExercises = Array.from(exerciseStats.values())
      .filter(stat => stat.muscleGroup === muscleGroup)
      .sort((a, b) => b.totalVolume - a.totalVolume);

    const recommendations: RecommendedExercise[] = [];
    const usedExerciseNames = new Set<string>();
    const usedExerciseIds = new Set<string>();

    // 策略：优先推荐新鲜度高的动作
    if (prioritizeFreshness && muscleExercises.length > 0) {
      // 按新鲜度重新排序
      const sortedByFreshness = [...muscleExercises].sort((a, b) => {
        const freshnessA = freshnessMap.get(
          INITIAL_EXERCISES.find(e => e.name === a.exerciseName)?.id || ''
        );
        const freshnessB = freshnessMap.get(
          INITIAL_EXERCISES.find(e => e.name === b.exerciseName)?.id || ''
        );
        
        // 新鲜度高的优先
        const scoreA = (freshnessA?.freshnessScore || 100) + (a.totalVolume / 1000);
        const scoreB = (freshnessB?.freshnessScore || 100) + (b.totalVolume / 1000);
        
        return scoreB - scoreA;
      });

      // 选择新鲜度最高且历史数据足够的动作
      for (const stat of sortedByFreshness.slice(0, limit * 2)) {
        if (recommendations.length >= limit) break;

        const exercise = INITIAL_EXERCISES.find(e => 
          e.name === stat.exerciseName || e.nameZh === stat.exerciseName
        );

        if (exercise && !usedExerciseNames.has(exercise.name)) {
          const freshness = freshnessMap.get(exercise.id);
          const isRecentlyUsed = freshness && freshness.timesUsedThisWeek > 0;
          
          // 如果最近用过（本周），降低优先级
          if (isRecentlyUsed && recommendations.length < limit - 1) {
            continue;
          }

          recommendations.push({
            exercise,
            totalVolume: stat.totalVolume,
            totalSets: stat.totalSets,
            frequency: stat.frequency,
            isNewExercise: false,
            reason: isRecentlyUsed 
              ? `最近用过，建议尝试新动作` 
              : `${stat.totalSets}组历史数据 · 新鲜度高`
          });
          usedExerciseNames.add(exercise.name);
          usedExerciseIds.add(exercise.id);
        }
      }
    }

    // Add user's familiar exercises (from history) - 传统方式
    if (!prioritizeFreshness || recommendations.length === 0) {
      for (const stat of muscleExercises.slice(0, limit)) {
        if (recommendations.length >= limit) break;

        const exercise = INITIAL_EXERCISES.find(e => 
          e.name === stat.exerciseName || e.nameZh === stat.exerciseName
        );

        if (exercise && !usedExerciseNames.has(exercise.name)) {
          recommendations.push({
            exercise,
            totalVolume: stat.totalVolume,
            totalSets: stat.totalSets,
            frequency: stat.frequency,
            isNewExercise: false,
            reason: `${stat.totalSets}组已做过`
          });
          usedExerciseNames.add(exercise.name);
          usedExerciseIds.add(exercise.id);
        }
      }
    }

    // 补充推荐：优先推荐新鲜度高的新动作
    const algorithmExercises = MUSCLE_GROUP_EXERCISES[muscleGroup] || [];
    
    // 按新鲜度排序算法推荐
    const sortedAlgorithmExercises = [...algorithmExercises].sort((aName, bName) => {
      const exA = INITIAL_EXERCISES.find(e => e.name === aName || e.nameZh === aName);
      const exB = INITIAL_EXERCISES.find(e => e.name === bName || e.nameZh === bName);
      
      const freshnessA = exA ? freshnessMap.get(exA.id)?.freshnessScore || 100 : 50;
      const freshnessB = exB ? freshnessMap.get(exB.id)?.freshnessScore || 100 : 50;
      
      return freshnessB - freshnessA;
    });

    for (const exerciseName of sortedAlgorithmExercises) {
      if (recommendations.length >= limit) break;
      
      const exercise = INITIAL_EXERCISES.find(e => 
        e.name === exerciseName || e.nameZh === exerciseName
      );

      if (exercise && !usedExerciseNames.has(exercise.name)) {
        const freshness = freshnessMap.get(exercise.id);
        const isNew = !muscleExercises.some(me => me.exerciseName === exercise.name);
        
        recommendations.push({
          exercise,
          totalVolume: 0,
          totalSets: 0,
          frequency: 0,
          isNewExercise: isNew,
          reason: isNew 
            ? '新动作刺激 · 推荐尝试' 
            : freshness && freshness.timesUsedThisMonth > 2
              ? '本月频繁，建议轮换'
              : '动作库推荐'
        });
        usedExerciseNames.add(exercise.name);
        usedExerciseIds.add(exercise.id);
      }
    }

    return recommendations;
  }

  /**
   * Generate smart exercise recommendations for target muscles
   * - If 1 muscle group: recommend 1-2 exercises
   * - If 2+ muscle groups: recommend 1 exercise per muscle
   */
  static generateExerciseRecommendations(
    targetMuscles: string[],
    allReports: WeeklyReport[]
  ): RecommendedExercise[] {
    const recommendations: RecommendedExercise[] = [];

    if (targetMuscles.length === 1) {
      // Single muscle: recommend 1-2 exercises
      const muscleExercises = this.getTopExercisesForMuscle(targetMuscles[0], allReports, 2);
      recommendations.push(...muscleExercises);
    } else {
      // Multiple muscles: 1 exercise per muscle
      for (const muscle of targetMuscles) {
        const muscleExercises = this.getTopExercisesForMuscle(muscle, allReports, 1);
        recommendations.push(...muscleExercises);
      }
    }

    return recommendations;
  }

  /**
   * Generate multiple recommendation groups for target muscles
   * Creates several "sets" of exercises user can browse through
   */
  static generateRecommendationGroups(
    targetMuscles: string[],
    allReports: WeeklyReport[]
  ): ExerciseRecommendationGroup[] {
    const groups: ExerciseRecommendationGroup[] = [];
    const primaryMuscle = targetMuscles[0];
    const relatedMuscles = SYNERGY_MUSCLE_GROUPS[primaryMuscle] || [];
    
    // Group 1: Primary muscle exercises (familiar ones)
    const primaryExercises = this.getTopExercisesForMuscle(primaryMuscle, allReports, 4);
    if (primaryExercises.length >= 2) {
      groups.push({
        id: 'primary-1',
        name: `${primaryMuscle} Focus`,
        focus: 'Primary',
        exercises: primaryExercises.slice(0, 2)
      });
      if (primaryExercises.length >= 4) {
        groups.push({
          id: 'primary-2',
          name: `${primaryMuscle} Alt`,
          focus: 'Primary',
          exercises: primaryExercises.slice(2, 4)
        });
      }
    }

    // Group 2: Related synergy muscles (Traps, Lower Back for Lats)
    const synergyExercises: RecommendedExercise[] = [];
    for (const muscle of relatedMuscles.slice(0, 2)) {
      const exercises = this.getTopExercisesForMuscle(muscle, allReports, 1);
      synergyExercises.push(...exercises);
    }
    if (synergyExercises.length >= 2) {
      groups.push({
        id: 'synergy-1',
        name: 'Support Muscles',
        focus: 'Synergy',
        exercises: synergyExercises.slice(0, 2)
      });
    }

    // Group 3: Mix of primary + one related muscle
    if (primaryExercises.length > 0 && relatedMuscles.length > 0) {
      const relatedExercise = this.getTopExercisesForMuscle(relatedMuscles[0], allReports, 1);
      if (relatedExercise.length > 0) {
        groups.push({
          id: 'mix-1',
          name: `${primaryMuscle} + ${relatedMuscles[0]}`,
          focus: 'Mixed',
          exercises: [primaryExercises[0], relatedExercise[0]]
        });
      }
    }

    // Group 4: More related muscles if available
    if (relatedMuscles.length >= 2) {
      const moreSynergy: RecommendedExercise[] = [];
      for (const muscle of relatedMuscles.slice(1, 3)) {
        const exercises = this.getTopExercisesForMuscle(muscle, allReports, 1);
        moreSynergy.push(...exercises);
      }
      if (moreSynergy.length >= 2) {
        groups.push({
          id: 'synergy-2',
          name: 'More Support',
          focus: 'Synergy',
          exercises: moreSynergy.slice(0, 2)
        });
      }
    }

    return groups;
  }
  
  private static getDaysUntilWeekend(): number {
    const day = this.getCurrentDay();
    return day === 0 ? 0 : 7 - day;
  }
  
  static calculateProgress(
    currentWeekSessions: WorkoutSession[],
    recoveryState: RecoveryStatus[]
  ): WeeklyProgress {
    const muscleDistribution: Record<string, number> = {};
    let totalSets = 0;
    let totalVolume = 0;
    const completedMuscles = new Set<string>();
    
    currentWeekSessions.forEach(session => {
      // 只计算有效的组数：completed + weight > 0 + reps > 0
      const validSets = session.exercises?.flatMap(ex => 
        ex.sets?.filter(s => s.completed && s.weight > 0 && s.reps > 0) || []
      ) || [];
      
      const sessionSets = validSets.length;
      const sessionVolume = validSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
      
      totalSets += sessionSets;
      totalVolume += sessionVolume;
      
      session.exercises?.forEach(exercise => {
        const muscle = exercise.muscleGroup;
        if (muscle) {
          const validExerciseSets = exercise.sets?.filter(s => 
            s.completed && s.weight > 0 && s.reps > 0
          ) || [];
          
          if (validExerciseSets.length > 0) {
            muscleDistribution[muscle] = (muscleDistribution[muscle] || 0) + validExerciseSets.length;
            completedMuscles.add(muscle);
          }
        }
      });
    });
    
    const readyMuscles = recoveryState.filter(r => r.recoveryPercentage >= 85).map(r => r.muscle);
    const fatiguedMuscles = recoveryState.filter(r => r.recoveryPercentage < 60).map(r => r.muscle);
    
    return {
      daysTrained: currentWeekSessions.length,
      totalSets,
      totalVolume,
      muscleDistribution,
      targetMuscles: [],
      completedMuscles: Array.from(completedMuscles),
      readyMuscles,
      fatiguedMuscles
    };
  }
  
  /**
   * Deep physique analysis for bodybuilding
   */
  static analyzePhysique(
    muscleDistribution: Record<string, number>,
    totalSets: number,
    recoveryState?: RecoveryStatus[]
  ): {
    vTaperScore: number;
    symmetryScore: number;
    weakPoints: MuscleGroup[];
    strengths: string[];
    priorityActions: string[];
  } {
    const lats = muscleDistribution['Lats'] || 0;
    const back = muscleDistribution['Back'] || 0;
    const chest = muscleDistribution['Chest'] || 0;
    const shoulders = muscleDistribution['Shoulders'] || 0;
    const quads = muscleDistribution['Quads'] || 0;
    const hamstrings = muscleDistribution['Hamstrings'] || 0;
    const glutes = muscleDistribution['Glutes'] || 0;
    
    // V-taper analysis
    const backVolume = lats + back;
    const chestVolume = chest;
    const vTaperRatio = chestVolume > 0 ? backVolume / chestVolume : 0;
    const vTaperScore = Math.min(10, vTaperRatio * 5);
    
    // Symmetry analysis
    const upperVolume = backVolume + chest + shoulders;
    const lowerVolume = quads + hamstrings + glutes;
    const symmetryRatio = lowerVolume > 0 ? upperVolume / lowerVolume : 0;
    const symmetryScore = symmetryRatio > 1.5 ? 6 : symmetryRatio < 0.8 ? 5 : 8;
    
    const weakPoints: MuscleGroup[] = [];
    const strengths: string[] = [];
    const priorityActions: string[] = [];
    
    // Get fatigued muscles from recovery state (recovery < 85%)
    const fatiguedMuscles = new Set(
      recoveryState?.filter(r => r.recoveryPercentage < 85).map(r => r.muscle) || []
    );
    
    // V-taper weak points (only if Lats are recovered)
    if (vTaperRatio < 1.0 && !fatiguedMuscles.has(MuscleGroup.LATS)) {
      weakPoints.push(MuscleGroup.LATS);
      priorityActions.push('Widen your back: 4 sets of pull-ups or lat pulldowns');
    } else if (vTaperRatio > 1.3) {
      strengths.push('V-taper');
    }
    
    // Shoulder development (only if recovered)
    if (shoulders < 12 && totalSets > 30 && !fatiguedMuscles.has(MuscleGroup.SHOULDERS)) {
      weakPoints.push(MuscleGroup.SHOULDERS);
      priorityActions.push('Build 3D delts: lateral raises + press variations');
    } else if (shoulders >= 16) {
      strengths.push('Shoulder caps');
    }
    
    // Leg development (only if recovered)
    const legsFatigued = fatiguedMuscles.has(MuscleGroup.QUADS) || fatiguedMuscles.has(MuscleGroup.HAMSTRINGS) || fatiguedMuscles.has(MuscleGroup.GLUTES);
    if (lowerVolume < 20 && totalSets > 40 && !legsFatigued) {
      weakPoints.push(MuscleGroup.QUADS); // Use QUADS as representative for legs
      priorityActions.push('Legs lagging: prioritize squats, leg press, RDLs');
    }
    
    // Arm detail
    const arms = (muscleDistribution['Biceps'] || 0) + (muscleDistribution['Triceps'] || 0);
    if (arms > 0 && backVolume > 0 && arms < backVolume * 0.4) {
      // Arms is a combination, push Biceps as representative
      weakPoints.push(MuscleGroup.BICEPS);
      priorityActions.push('Arms need love: add dedicated arm day or finishers');
    }
    
    return { vTaperScore, symmetryScore, weakPoints, strengths, priorityActions };
  }
  
  /**
   * Generate coaching message based on psychology of training
   */
  private static generateCoachingMessage(
    daysTrained: number,
    totalSets: number,
    weakPoints: string[],
    lastWeekVolume: number,
    currentVolume: number
  ): string {
    const volumeChange = lastWeekVolume > 0 ? ((currentVolume - lastWeekVolume) / lastWeekVolume * 100) : 0;
    
    // High frequency champions
    if (daysTrained >= 4) {
      if (volumeChange > 10) return "🔥 You're in the top 5% of dedication. This volume surge is going to show in the mirror!";
      return "💪 4+ sessions? That's elite consistency. Your physique is transforming week by week.";
    }
    
    // Good progress
    if (daysTrained === 3) {
      if (volumeChange > 5) return "📈 Progressive overload in action! You're building more than muscle - you're building discipline.";
      if (weakPoints.length > 0) return `⚡ 3 sessions locked in! Now let's address those ${weakPoints.join(', ')} for complete development.`;
      return "✅ Solid week! 3 sessions is the sweet spot for gains with recovery.";
    }
    
    // Need more
    if (daysTrained === 2) {
      return "⚠️  2 sessions won't build the physique you envision. Time to level up this weekend!";
    }
    
    if (daysTrained === 1) {
      return "🎯 Started strong! But one session is just a taste. Let's build momentum.";
    }
    
    return "🏋️  Fresh week ahead. Your future physique depends on the choices you make right now.";
  }
  
  /**
   * Get specific training recommendations based on science
   */
  private static getTrainingScienceTips(
    totalSets: number,
    weakPoints: string[],
    daysRemaining: number
  ): string[] {
    const tips: string[] = [];
    
    // Volume recommendations
    if (totalSets < VOLUME_LANDMARKS.mev) {
      tips.push(`Volume below MEV (${VOLUME_LANDMARKS.mev} sets). You need ${VOLUME_LANDMARKS.mev - totalSets} more sets minimum for growth.`);
    } else if (totalSets >= VOLUME_LANDMARKS.mav && totalSets < VOLUME_LANDMARKS.mrv) {
      tips.push(`Sweet spot volume! You're in the hypertrophy zone (${VOLUME_LANDMARKS.mav}-${VOLUME_LANDMARKS.mrv} sets).`);
    } else if (totalSets >= VOLUME_LANDMARKS.mrv) {
      tips.push('High volume week! Ensure 48h recovery before training same muscle again.');
    }
    
    // Weak point prioritization
    if (weakPoints.length > 0 && daysRemaining >= 2) {
      tips.push(`Priority attack: Train ${weakPoints[0]} first in your next session when energy is highest.`);
    }
    
    if (weakPoints.includes('Lats')) {
      tips.push('Lats = V-taper. Try: 4x8-12 pull-ups (weighted if needed), 3x15 lat pulldowns, 3x10 per arm dumbbell rows.');
    }
    
    if (weakPoints.includes('Shoulders')) {
      tips.push('3D delts need: Overhead press (strength) + lateral raises (width) + rear delt flys (posterior).');
    }
    
    if (weakPoints.includes('Legs')) {
      tips.push('Never skip leg day! Squats, leg press, RDLs, leg extensions - hit them all this weekend.');
    }
    
    return tips.slice(0, 3);
  }
  
  /**
   * Calculate estimated token usage for local algorithm
   */
  private static calculateTokenUsage(
    currentWeekSessions: WorkoutSession[],
    allReports: WeeklyReport[]
  ): { tokenUsage: TokenUsage; estimatedCost: { totalCost: number; currency: string } } {
    // Base tokens for algorithm processing
    const baseTokens = 150;
    
    // Tokens per session analyzed
    const sessionTokens = currentWeekSessions.length * 50;
    
    // Tokens per historical report
    const reportTokens = Math.min(allReports.length * 30, 300);
    
    const totalTokens = baseTokens + sessionTokens + reportTokens;
    
    // Estimate input/output split (70% input, 30% output for analysis)
    const promptTokens = Math.floor(totalTokens * 0.7);
    const completionTokens = totalTokens - promptTokens;
    
    // Estimated cost (very low for local algorithm, mostly for display)
    const estimatedCost = {
      totalCost: 0.001, // Fixed minimal cost for display
      currency: 'CNY' as const
    };
    
    return {
      tokenUsage: {
        total_tokens: totalTokens,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens
      },
      estimatedCost
    };
  }

  static getCoachRecommendation(
    currentWeekSessions: WorkoutSession[],
    recoveryState: RecoveryStatus[],
    lastWeekReport: WeeklyReport | null,
    justCompletedSession?: WorkoutSession,
    allReports: WeeklyReport[] = []
  ): CoachRecommendation {
    // Calculate token usage
    const { tokenUsage, estimatedCost } = this.calculateTokenUsage(currentWeekSessions, allReports);
    const day = this.getCurrentDay();
    const daysRemaining = this.getDaysUntilWeekend();
    const progress = this.calculateProgress(currentWeekSessions, recoveryState);
    
    const { vTaperScore, symmetryScore, weakPoints, strengths, priorityActions } = this.analyzePhysique(
      progress.muscleDistribution,
      progress.totalSets,
      recoveryState
    );
    
    // POST-SESSION: Just completed a workout
    if (justCompletedSession) {
      // 只计算有效的组数
      const validSets = justCompletedSession.exercises?.flatMap(ex => 
        ex.sets?.filter(s => s.completed && s.weight > 0 && s.reps > 0) || []
      ) || [];
      const sessionSets = validSets.length;
      
      return {
        currentProgress: progress,
        insight: {
          type: 'post_session',
          title: 'Session Crushed! 💪',
          message: this.generateCoachingMessage(progress.daysTrained, progress.totalSets, weakPoints, lastWeekReport?.stats.totalVolume || 0, progress.totalVolume),
          recommendations: [
            `${sessionSets} sets added to ${justCompletedSession.exercises?.map(e => e.muscleGroup).filter(Boolean).join(', ') || 'your physique'}`,
            ...priorityActions.slice(0, 2),
            progress.fatiguedMuscles.length > 0 
              ? `⚠️  ${progress.fatiguedMuscles.join(', ')} need 48h recovery`
              : '✅ Recovery status green - ready for next session'
          ],
          priority: 'high'
        },
        nextSessionSuggestion: progress.readyMuscles.length > 0 ? {
          targetMuscles: weakPoints.length > 0 ? weakPoints.slice(0, 2) : progress.readyMuscles.slice(0, 2),
          estimatedSets: 14,
          focus: weakPoints.length > 0 ? 'weak_points' : 'volume',
          recommendationGroups: this.generateRecommendationGroups(
            weakPoints.length > 0 ? weakPoints.slice(0, 2) : progress.readyMuscles.slice(0, 2),
            allReports
          )
        } : undefined,
        tokenUsage,
        estimatedCost
      };
    }
    
    // SUNDAY: Reflection and planning
    if (day === 0) {
      const weekGrade = progress.daysTrained >= 4 && progress.totalSets >= 45 ? 'A+' : 
                       progress.daysTrained >= 3 ? 'B+' : 'C';
      
      // For next week, recommend weak points or recovered muscles
      const nextWeekMuscles = weakPoints.length > 0 
        ? weakPoints.slice(0, 2) 
        : recoveryState.filter(r => r.recoveryPercentage >= 85).map(r => r.muscle).slice(0, 2);
      
      return {
        currentProgress: progress,
        insight: {
          type: 'weekend',
          title: `Week Complete: Grade ${weekGrade}`,
          message: `${progress.daysTrained} days, ${progress.totalSets} sets, ${(progress.totalVolume/1000).toFixed(1)}k kg. ${weekGrade.startsWith('A') ? 'Elite work!' : weekGrade.startsWith('B') ? 'Solid progress.' : 'Room to improve next week.'}`,
          recommendations: [
            `V-Taper Score: ${vTaperScore.toFixed(1)}/10 ${vTaperScore < 6 ? '- Prioritize back width' : vTaperScore > 8 ? '- Looking wide!' : ''}`,
            `Symmetry Score: ${symmetryScore}/10`,
            'Recovery protocol: 1.6-2.2g protein/kg, 7-9h sleep, 3L+ water',
            'Next week preview: ' + (weakPoints.length > 0 ? `Attack ${weakPoints[0]} aggressively` : 'Maintain balance, add 5% volume')
          ],
          priority: 'medium'
        },
        nextSessionSuggestion: nextWeekMuscles.length > 0 ? {
          targetMuscles: nextWeekMuscles,
          estimatedSets: 16,
          focus: weakPoints.length > 0 ? 'weak_points' : 'volume',
          recommendationGroups: this.generateRecommendationGroups(nextWeekMuscles, allReports)
        } : undefined,
        tokenUsage,
        estimatedCost
      };
    }
    
    // FRIDAY-SATURDAY: Weekend push
    if ((day === 5 || day === 6) && currentWeekSessions.length > 0) {
      const neglectedMuscles = recoveryState
        .filter(r => r.recoveryPercentage >= 85 && !progress.completedMuscles.includes(r.muscle))
        .map(r => r.muscle);
      
      if (progress.daysTrained >= 4) {
        return {
          currentProgress: progress,
          insight: {
            type: 'late_week',
            title: 'Elite Frequency! 🏆',
            message: `${progress.daysTrained} sessions - you're in beast mode! Now let's polish the physique with targeted work.`,
            recommendations: [
              ...priorityActions.slice(0, 1),
              neglectedMuscles.length > 0 
                ? `Refinement session: ${neglectedMuscles.slice(0, 2).join(', ')} for symmetry`
                : 'All bases covered! Consider pump work or active recovery',
              'Weekend strategy: Light session Saturday OR full rest for recovery'
            ],
            priority: 'low'
          },
          nextSessionSuggestion: neglectedMuscles.length > 0 ? {
            targetMuscles: neglectedMuscles.slice(0, 2),
            estimatedSets: 10,
            focus: 'aesthetics',
            recommendationGroups: this.generateRecommendationGroups(
              neglectedMuscles.slice(0, 2),
              allReports
            )
          } : undefined,
          tokenUsage,
          estimatedCost
        };
      }
      
      // Need more sessions
      const sessionsNeeded = 4 - progress.daysTrained;
      return {
        currentProgress: progress,
        insight: {
          type: 'late_week',
          title: daysRemaining === 1 ? 'Final Push! ⏰' : 'Weekend Warrior Mode! ⚡',
          message: `${progress.daysTrained} sessions complete. ${sessionsNeeded} more to hit optimal frequency. ${daysRemaining === 1 ? "It's now or never!" : 'You have time - make it count!'}`,
          recommendations: [
            ...this.getTrainingScienceTips(progress.totalSets, weakPoints, daysRemaining),
            `Available to train: ${progress.readyMuscles.slice(0, 3).join(', ')}`,
            weakPoints.length > 0 
              ? `Priority target: ${weakPoints[0]} - don't let it lag another week`
              : 'Focus on compound movements: squat, deadlift, bench, row, press'
          ],
          priority: 'high'
        },
        nextSessionSuggestion: {
          targetMuscles: weakPoints.length > 0 ? weakPoints.slice(0, 2) : progress.readyMuscles.slice(0, 2),
          estimatedSets: 16,
          focus: progress.totalSets < 45 ? 'volume' : 'intensity',
          recommendationGroups: this.generateRecommendationGroups(
            weakPoints.length > 0 ? weakPoints.slice(0, 2) : progress.readyMuscles.slice(0, 2),
            allReports
          )
        },
        tokenUsage,
        estimatedCost
      };
    }
    
    // MID-WEEK: Progress check
    if ((day === 3 || day === 4) && currentWeekSessions.length > 0) {
      // Select target muscles for recommendation (recovered weak points first, then ready muscles)
      const recoveredWeakPoints = weakPoints.filter(wp => 
        recoveryState.find(r => r.muscle === wp && r.recoveryPercentage >= 85)
      );
      const targetMuscles = recoveredWeakPoints.length > 0 
        ? recoveredWeakPoints.slice(0, 2) 
        : progress.readyMuscles.slice(0, 2);
      
      return {
        currentProgress: progress,
        insight: {
          type: 'mid_week',
          title: 'Mid-Week Assessment 📊',
          message: this.generateCoachingMessage(progress.daysTrained, progress.totalSets, weakPoints, lastWeekReport?.stats.totalVolume || 0, progress.totalVolume),
          recommendations: [
            `V-Taper: ${vTaperScore.toFixed(1)}/10 | Symmetry: ${symmetryScore}/10`,
            ...priorityActions.slice(0, 2),
            ...this.getTrainingScienceTips(progress.totalSets, weakPoints, daysRemaining)
          ],
          priority: 'medium'
        },
        nextSessionSuggestion: targetMuscles.length > 0 ? {
          targetMuscles,
          estimatedSets: 16,
          focus: recoveredWeakPoints.length > 0 ? 'weak_points' : 'volume',
          recommendationGroups: this.generateRecommendationGroups(targetMuscles, allReports)
        } : undefined,
        tokenUsage,
        estimatedCost
      };
    }
    
    // EARLY WEEK: First session or planning
    if (currentWeekSessions.length === 0) {
      const lastWeekSets = lastWeekReport?.stats.totalSets || 0;
      const readyMuscles = recoveryState.filter(r => r.recoveryPercentage >= 85);
      
      // Select target muscles for recommendation (weak points first, then ready muscles)
      const targetMuscles = weakPoints.length > 0 
        ? weakPoints.slice(0, 2) 
        : readyMuscles.slice(0, 2).map(r => r.muscle);
      
      return {
        currentProgress: progress,
        insight: {
          type: 'pre_week',
          title: 'Weekly Battle Plan 🎯',
          message: lastWeekSets > 0 
            ? `Last week: ${lastWeekSets} sets. This week we push for ${lastWeekSets + 4}+. Time to level up!`
            : 'Fresh week, fresh gains. Let\'s build something impressive.',
          recommendations: [
            `Target: ${Math.max(24, (lastWeekSets || 20))} total sets`,
            `Priority muscles (recovered): ${readyMuscles.slice(0, 3).map(r => r.muscle).join(', ')}`,
            'Focus order: 1. Weak points first 2. Heavy compounds 3. Isolation finishers',
            'Schedule: Aim for 4 sessions Mon-Sat'
          ],
          priority: 'medium'
        },
        // NEW: Add exercise recommendations even when no sessions yet
        nextSessionSuggestion: targetMuscles.length > 0 ? {
          targetMuscles,
          estimatedSets: 16,
          focus: weakPoints.length > 0 ? 'weak_points' : 'volume',
          recommendationGroups: this.generateRecommendationGroups(targetMuscles, allReports)
        } : undefined,
        tokenUsage,
        estimatedCost
      };
    }
    
    // Default: Generic progress
    return {
      currentProgress: progress,
      insight: {
        type: 'mid_week',
        title: 'Weekly Progress',
        message: `${progress.daysTrained} sessions logged. ${progress.totalSets} sets toward your best physique.`,
        recommendations: [
          ...priorityActions.slice(0, 1),
          'Progressive overload: Beat last week\'s weights or reps',
          `Next: ${progress.readyMuscles.slice(0, 2).join(', ')} when you're ready`
        ],
        priority: 'low'
      },
      tokenUsage,
      estimatedCost
    };
  }
}

export default WeeklyTrainingCoachService;
