/**
 * Enhanced AI Recommendation Service V2
 * 
 * 基于真实历史数据的智能推荐系统
 * 集成HistoricalDataQueryService，提供准确的重量建议
 */

import type { Exercise, ActiveExercise, UserProfile, RecoveryStatus, WorkoutSession } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import HistoricalDataQueryService from './HistoricalDataQueryService';

export interface EnhancedRecommendationContext {
    userProfile: UserProfile;
    currentWorkout: ActiveExercise[];
    recoveryState: RecoveryStatus[];
    recentWorkouts: ActiveExercise[][];
    workoutHistory: WorkoutSession[];
    exerciseLibrary: Exercise[];
}

export interface SmartWeightRecommendation {
    weight: number;
    confidence: number; // 0-1
    reasoning: string;
    basedOnHistory: boolean;
    lastPerformed?: {
        date: number;
        weight: number;
        reps: number;
    };
    // 🆕 历史最大重量记录
    maxWeightRecord?: {
        weight: number;
        reps: number;
        date: number;
        daysAgo: number;
    };
    progressTrend?: 'increasing' | 'stable' | 'decreasing';
    similarExercises?: string[]; // 如果基于相似动作推荐
}

export interface HistoryBasedRecommendation {
    exerciseName: string;
    sets: number;
    reps: string;
    smartWeight: SmartWeightRecommendation;
    reason: string;
    tip?: string;
    popularityRating?: number;
    confidenceLevel: number; // 整体推荐可信度
}

export class EnhancedAIRecommendationServiceV2 {
    /**
     * 生成基于历史数据的智能推荐
     */
    static generateHistoryBasedRecommendations(
        context: EnhancedRecommendationContext,
        targetMuscleGroup?: MuscleGroup,
        maxRecommendations: number = 3
    ): HistoryBasedRecommendation[] {
        console.log('🤖 [V2] Generating history-based AI recommendations...');
        console.log('🔍 [V2] Context received:', {
            exerciseLibraryLength: context.exerciseLibrary.length,
            workoutHistoryLength: context.workoutHistory.length,
            currentWorkoutLength: context.currentWorkout.length,
            targetMuscleGroup,
            maxRecommendations
        });

        // 1. 获取用户整体训练统计
        const overallStats = HistoricalDataQueryService.getOverallTrainingStats();
        console.log('📊 [V2] Overall training stats:', overallStats);

        // 2. 筛选候选动作
        const candidateExercises = this.selectCandidateExercises(
            context.exerciseLibrary,
            targetMuscleGroup,
            context.currentWorkout,
            context.recoveryState
        );
        console.log('🎯 [V2] Candidate exercises found:', candidateExercises.length);
        console.log('🔍 [V2] First few candidates:', candidateExercises.slice(0, 3).map(ex => ex.name));

        // 3. 为每个候选动作生成智能推荐
        const recommendations: HistoryBasedRecommendation[] = [];

        for (const exercise of candidateExercises.slice(0, maxRecommendations * 2)) {
            console.log(`🔄 [V2] Processing exercise: ${exercise.name}`);
            const recommendation = this.generateSmartRecommendation(
                exercise,
                context,
                overallStats
            );

            if (recommendation && recommendation.confidenceLevel > 0.3) {
                console.log(`✅ [V2] Added recommendation for ${exercise.name} (confidence: ${recommendation.confidenceLevel})`);
                recommendations.push(recommendation);
            } else {
                console.log(`❌ [V2] Rejected recommendation for ${exercise.name} (confidence: ${recommendation?.confidenceLevel || 'null'})`);
            }
        }

        console.log(`🎉 [V2] Final recommendations count: ${recommendations.length}`);
        console.log('📋 [V2] Final recommendations:', recommendations);

        // 4. 按可信度排序并返回
        return recommendations
            .sort((a, b) => b.confidenceLevel - a.confidenceLevel)
            .slice(0, maxRecommendations);
    }

    /**
     * 为单个动作生成智能推荐
     */
    private static generateSmartRecommendation(
        exercise: Exercise,
        context: EnhancedRecommendationContext,
        overallStats: any
    ): HistoryBasedRecommendation | null {
        console.log(`🔄 [V2] Generating recommendation for: ${exercise.name}`);
        
        // 1. 查询历史数据
        const history = HistoricalDataQueryService.getExerciseHistory(
            exercise.id,
            exercise.name
        );
        console.log(`📚 [V2] History for ${exercise.name}:`, history);

        // 2. 生成智能重量推荐
        const smartWeight = this.generateSmartWeightRecommendation(
            exercise,
            history,
            context.userProfile
        );
        console.log(`⚖️ [V2] Smart weight for ${exercise.name}:`, smartWeight);

        // 3. 确定组数和次数
        const { sets, reps } = this.determineSetRepsScheme(
            exercise,
            history,
            context.userProfile
        );

        // 4. 生成推荐理由
        const reason = this.generateRecommendationReason(
            exercise,
            history,
            smartWeight,
            overallStats
        );

        // 5. 生成训练提示
        const tip = this.generateTrainingTip(exercise, history, smartWeight);

        // 6. 计算整体可信度
        const confidenceLevel = this.calculateOverallConfidence(
            smartWeight.confidence,
            history?.confidenceLevel || 0,
            exercise
        );
        console.log(`🎯 [V2] Confidence level for ${exercise.name}: ${confidenceLevel}`);

        const recommendation = {
            exerciseName: exercise.name,
            sets,
            reps,
            smartWeight,
            reason,
            tip,
            popularityRating: this.calculatePopularityRating(exercise, overallStats),
            confidenceLevel
        };

        console.log(`✨ [V2] Final recommendation for ${exercise.name}:`, recommendation);
        return recommendation;
    }

    /**
     * 生成智能重量推荐
     */
    private static generateSmartWeightRecommendation(
        exercise: Exercise,
        history: any,
        userProfile: UserProfile
    ): SmartWeightRecommendation {
        if (history) {
            // 基于历史数据的推荐
            return this.generateHistoryBasedWeightRecommendation(exercise, history);
        } else {
            // 基于相似动作或体重比例的推荐
            return this.generateFallbackWeightRecommendation(exercise, userProfile);
        }
    }

    /**
     * 基于历史数据的重量推荐
     * 🆕 使用历史最大重量作为参考，并显示距离现在多久
     */
    private static generateHistoryBasedWeightRecommendation(
        exercise: Exercise,
        history: any
    ): SmartWeightRecommendation {
        // 🆕 获取历史最大重量及日期
        const maxWeightData = HistoricalDataQueryService.getMaxWeightWithDate(
            exercise.id,
            exercise.name
        );

        const daysSinceLastPerformed = (Date.now() - history.lastPerformed) / (24 * 60 * 60 * 1000);

        // 🆕 优先使用历史最大重量作为推荐基准
        let recommendedWeight = history.lastWeight;
        let reasoning = `上次训练: ${history.lastWeight}kg`;

        // 如果有历史最大重量记录，在推荐中考虑它
        if (maxWeightData && maxWeightData.weight > history.lastWeight) {
            // 如果历史最大重量比上次重量大，建议逐步恢复
            const weightGap = maxWeightData.weight - history.lastWeight;
            
            if (maxWeightData.daysAgo <= 14) {
                // 最近刚创造的最大重量，建议挑战或保持
                recommendedWeight = Math.round(maxWeightData.weight * 0.95);
                reasoning = `历史最佳 ${maxWeightData.weight}kg (${maxWeightData.daysAgo}天前)`;
            } else if (maxWeightData.daysAgo <= 30) {
                // 1个月内，建议逐步恢复
                recommendedWeight = Math.round(history.lastWeight + weightGap * 0.3);
                reasoning = `向历史最佳 ${maxWeightData.weight}kg 恢复中`;
            } else {
                // 超过1个月，从上次重量开始渐进
                recommendedWeight = Math.round(history.lastWeight * 1.02);
                reasoning = `上次 ${history.lastWeight}kg · 历史最佳 ${maxWeightData.weight}kg (${maxWeightData.daysAgo}天前)`;
            }
        } else {
            // 没有超过上次的历史记录，使用原来的逻辑
            if (history.progressTrend === 'increasing' && daysSinceLastPerformed <= 14) {
                recommendedWeight = Math.round(history.lastWeight * 1.025); // Increase 2.5%
                reasoning = `渐进超负荷: ${history.lastWeight}kg → ${recommendedWeight}kg`;
            } else if (history.progressTrend === 'decreasing' || daysSinceLastPerformed > 30) {
                recommendedWeight = Math.round(history.lastWeight * 0.95); // Decrease 5%
                reasoning = daysSinceLastPerformed > 30
                    ? `休息 ${Math.round(daysSinceLastPerformed)} 天后建议降重恢复`
                    : `根据近期趋势调整`;
            }
        }

        // Cap at 110% of max weight for safety
        const maxSafeWeight = Math.round(history.maxWeight * 1.1);
        if (recommendedWeight > maxSafeWeight) {
            recommendedWeight = maxSafeWeight;
            reasoning += ` (安全上限)`;
        }

        return {
            weight: recommendedWeight,
            confidence: history.confidenceLevel,
            reasoning,
            basedOnHistory: true,
            lastPerformed: {
                date: history.lastPerformed,
                weight: history.lastWeight,
                reps: history.lastReps
            },
            // 🆕 包含历史最大重量信息
            maxWeightRecord: maxWeightData || undefined,
            progressTrend: history.progressTrend
        };
    }

    /**
     * 备用重量推荐（无历史数据时）
     */
    private static generateFallbackWeightRecommendation(
        exercise: Exercise,
        userProfile: UserProfile
    ): SmartWeightRecommendation {
        // 1. 尝试查找相似动作的历史数据
        const similarExercises = HistoricalDataQueryService.findSimilarExerciseHistory(
            exercise.name,
            exercise.muscleGroup
        );

        if (similarExercises.length > 0) {
            const avgWeight = similarExercises.reduce((sum, ex) => sum + ex.averageWeight, 0) / similarExercises.length;
            const recommendedWeight = Math.round(avgWeight * 0.9); // 保守一些

            return {
                weight: recommendedWeight,
                confidence: 0.6,
                reasoning: `Based on similar exercises`,
                basedOnHistory: true,
                similarExercises: similarExercises.map(ex => ex.exerciseName).slice(0, 3)
            };
        }

        // 2. 基于体重比例的传统推荐
        const bodyWeight = userProfile.weight || 75;
        const weightRatio = this.getExerciseWeightRatio(exercise.muscleGroup, exercise.mechanic);
        const recommendedWeight = Math.round(bodyWeight * weightRatio);

        return {
            weight: recommendedWeight,
            confidence: 0.3,
            reasoning: `Estimated from bodyweight ratio (${Math.round(weightRatio * 100)}%)`,
            basedOnHistory: false
        };
    }

    /**
     * 确定组数和次数方案
     */
    private static determineSetRepsScheme(
        exercise: Exercise,
        history: any,
        userProfile: UserProfile
    ): { sets: number; reps: string } {
        // 基于用户目标和动作类型
        const goal = userProfile.primaryGoal || 'HYPERTROPHY';
        const isCompound = exercise.mechanic === 'Compound';

        if (history && history.totalSessions >= 3) {
            // 基于历史数据的个性化方案
            const avgReps = history.lastReps || 10;
            if (avgReps <= 6) {
                return { sets: 4, reps: '4-6' }; // 力量训练
            } else if (avgReps <= 12) {
                return { sets: 3, reps: '8-12' }; // 肌肥大
            } else {
                return { sets: 3, reps: '12-15' }; // 耐力
            }
        }

        // 默认方案
        switch (goal) {
            case 'Strength':
                return { sets: isCompound ? 4 : 3, reps: isCompound ? '3-5' : '5-8' };
            case 'Hypertrophy':
                return { sets: 3, reps: isCompound ? '6-10' : '8-12' };
            case 'Endurance':
                return { sets: 3, reps: '12-15' };
            default:
                return { sets: 3, reps: '8-12' };
        }
    }

    /**
     * 生成推荐理由
     */
    private static generateRecommendationReason(
        exercise: Exercise,
        history: any,
        smartWeight: SmartWeightRecommendation,
        overallStats: any
    ): string {
        if (history) {
            const daysSince = Math.round((Date.now() - history.lastPerformed) / (24 * 60 * 60 * 1000));

            if (daysSince <= 7) {
                return `Based on ${history.totalSessions} sessions of recent history`;
            } else if (daysSince <= 30) {
                return `Last performed ${daysSince} days ago, adjusted from history`;
            } else {
                return `Last performed ${daysSince} days ago, start lighter`;
            }
        }

        if (smartWeight.similarExercises && smartWeight.similarExercises.length > 0) {
            return `Based on experience with: ${smartWeight.similarExercises.join(', ')}`;
        }

        // Based on muscle training frequency
        if (overallStats.mostTrainedMuscles.includes(exercise.muscleGroup)) {
            return `Popular ${exercise.muscleGroup} exercise in your training`;
        }

        return `Good ${exercise.muscleGroup} exercise for your level`;
    }

    /**
     * 生成训练提示
     */
    private static generateTrainingTip(
        exercise: Exercise,
        history: any,
        smartWeight: SmartWeightRecommendation
    ): string {
        const tips = [];

        if (history) {
            if (history.progressTrend === 'increasing') {
                tips.push('Keep up the progress');
            } else if (history.progressTrend === 'decreasing') {
                tips.push('Focus on form quality');
            }

            if (smartWeight.lastPerformed) {
                const daysSince = Math.round((Date.now() - smartWeight.lastPerformed.date) / (24 * 60 * 60 * 1000));
                if (daysSince > 14) {
                    tips.push('Warm up thoroughly');
                }
            }
        }

        // Exercise type tips
        if (exercise.mechanic === 'Compound') {
            tips.push('Control the tempo');
        } else {
            tips.push('Focus on muscle contraction');
        }

        return tips.slice(0, 2).join(' • ') || 'Maintain proper form';
    }

    /**
     * 计算整体可信度
     */
    private static calculateOverallConfidence(
        weightConfidence: number,
        historyConfidence: number,
        exercise: Exercise
    ): number {
        let confidence = (weightConfidence + historyConfidence) / 2;

        // 复合动作通常更可靠
        if (exercise.mechanic === 'Compound') {
            confidence += 0.1;
        }

        // 常见动作更可靠
        const commonExercises = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Push-up'];
        if (commonExercises.some(name => exercise.name.includes(name))) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0);
    }

    /**
     * 计算流行度评级
     */
    private static calculatePopularityRating(exercise: Exercise, overallStats: any): number {
        // 基于用户历史训练频率
        if (overallStats.mostTrainedMuscles.includes(exercise.muscleGroup)) {
            return 3;
        }

        // 基于动作类型
        if (exercise.mechanic === 'Compound') {
            return 2;
        }

        return 1;
    }

    /**
     * 选择候选动作
     */
    private static selectCandidateExercises(
        exerciseLibrary: Exercise[],
        targetMuscleGroup?: MuscleGroup,
        currentWorkout: ActiveExercise[] = [],
        recoveryState: RecoveryStatus[] = []
    ): Exercise[] {
        const currentExerciseIds = new Set(currentWorkout.map(ex => ex.exerciseId));

        return exerciseLibrary.filter(exercise => {
            // 排除已在当前训练中的动作
            if (currentExerciseIds.has(exercise.id)) return false;

            // 如果指定了目标肌肉群
            if (targetMuscleGroup && exercise.muscleGroup !== targetMuscleGroup) return false;

            // 检查肌肉恢复状态
            const muscleRecovery = recoveryState.find(r => r.muscle === exercise.muscleGroup);
            if (muscleRecovery && muscleRecovery.recoveryPercentage < 70) return false;

            return true;
        });
    }

    /**
     * 获取动作重量比例
     */
    private static getExerciseWeightRatio(muscleGroup: MuscleGroup, mechanic?: string): number {
        const ratios: Record<string, number> = {
            [MuscleGroup.CHEST]: mechanic === 'Compound' ? 1.0 : 0.4,
            [MuscleGroup.SHOULDERS]: 0.5,
            [MuscleGroup.TRICEPS]: 0.3,
            [MuscleGroup.LATS]: 0.8,
            [MuscleGroup.TRAPS]: 0.6,
            [MuscleGroup.LOWER_BACK]: 0.8,
            [MuscleGroup.BICEPS]: 0.25,
            [MuscleGroup.FOREARMS]: 0.2,
            [MuscleGroup.ABS]: 0.3,
            [MuscleGroup.OBLIQUES]: 0.25,
            [MuscleGroup.QUADS]: 1.2,
            [MuscleGroup.HAMSTRINGS]: 0.8,
            [MuscleGroup.GLUTES]: 1.0,
            [MuscleGroup.CALVES]: 0.6,
        };

        return ratios[muscleGroup] || 0.5;
    }

    /**
     * 存储用户反馈
     */
    static async recordRecommendationFeedback(
        exerciseName: string,
        recommendedWeight: number,
        actualWeight: number,
        feedback: 'helpful' | 'too_heavy' | 'too_light' | 'regenerate',
        additionalNotes?: string
    ): Promise<void> {
        const feedbackData = {
            timestamp: Date.now(),
            exerciseName,
            recommendedWeight,
            actualWeight,
            feedback,
            additionalNotes,
            accuracy: actualWeight > 0 ? Math.abs(recommendedWeight - actualWeight) / recommendedWeight : null
        };

        // 存储反馈数据 (iOS-safe)
        try {
            const existingFeedback = JSON.parse(localStorage.getItem('ai_recommendation_feedback_v2') || '[]');
            existingFeedback.push(feedbackData);
            localStorage.setItem('ai_recommendation_feedback_v2', JSON.stringify(existingFeedback));
        } catch {
            console.warn('⚠️ Cannot save feedback (storage restricted)');
        }

        console.log('✅ Recommendation feedback recorded:', feedbackData);
    }

    /**
     * 获取推荐准确性统计
     */
    static getRecommendationAccuracyStats(): {
        totalFeedbacks: number;
        averageAccuracy: number;
        helpfulPercentage: number;
        commonIssues: string[];
    } {
        let feedbacks: any[] = [];
        try {
            feedbacks = JSON.parse(localStorage.getItem('ai_recommendation_feedback_v2') || '[]');
        } catch {
            feedbacks = [];
        }

        if (feedbacks.length === 0) {
            return {
                totalFeedbacks: 0,
                averageAccuracy: 0,
                helpfulPercentage: 0,
                commonIssues: []
            };
        }

        const accuracies = feedbacks.filter((f: any) => f.accuracy !== null).map((f: any) => 1 - f.accuracy);
        const averageAccuracy = accuracies.length > 0 ? accuracies.reduce((sum: number, acc: number) => sum + acc, 0) / accuracies.length : 0;

        const helpfulCount = feedbacks.filter((f: any) => f.feedback === 'helpful').length;
        const helpfulPercentage = (helpfulCount / feedbacks.length) * 100;

        const issueCount = new Map();
        feedbacks.forEach((f: any) => {
            if (f.feedback !== 'helpful') {
                issueCount.set(f.feedback, (issueCount.get(f.feedback) || 0) + 1);
            }
        });

        const commonIssues = Array.from(issueCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([issue]) => issue);

        return {
            totalFeedbacks: feedbacks.length,
            averageAccuracy: Math.round(averageAccuracy * 100),
            helpfulPercentage: Math.round(helpfulPercentage),
            commonIssues
        };
    }
}

export default EnhancedAIRecommendationServiceV2;