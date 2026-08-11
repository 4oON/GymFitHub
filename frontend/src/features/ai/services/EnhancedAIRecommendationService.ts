import type { Exercise, ActiveExercise, UserProfile, RecoveryStatus, WorkoutSession } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { iOSStorage } from '@/services/iOSStorageService';

export interface HistoricalPerformance {
    exerciseName: string;
    exerciseId: string;
    maxWeight: number;
    averageWeight: number;
    lastWeight: number;
    totalSets: number;
    lastPerformed: number;
    progressTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface SmartWeightRecommendation {
    recommendedWeight: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
    basedOn: 'historical_data' | 'body_weight' | 'beginner_default';
    adjustmentFactor: number;
}

export interface EnhancedWorkoutRecommendation {
    id: string;
    type: 'exercise' | 'rest' | 'intensity' | 'volume' | 'weight_adjustment';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    reasoning: string;
    suggestedExercises?: Exercise[];
    suggestedSets?: number;
    suggestedReps?: string;
    smartWeightRecommendation?: SmartWeightRecommendation;
    restDays?: number;
    targetMuscles?: MuscleGroup[];
    feedbackEnabled: boolean;
    aiGenerated: boolean;
}

export interface EnhancedAIRecommendationContext {
    userProfile: UserProfile;
    currentWorkout: ActiveExercise[];
    recoveryState: RecoveryStatus[];
    recentWorkouts: ActiveExercise[][];
    workoutHistory: WorkoutSession[]; // 新增：完整的训练历史
    exerciseLibrary: Exercise[];
    currentDate: Date;
}

/**
 * 增强的AI推荐服务，能够分析历史数据并提供智能重量建议
 * Enhanced AI recommendation service with historical data analysis and smart weight suggestions
 */
export class EnhancedAIRecommendationService {

    /**
     * 分析用户的历史表现数据
     * Analyze user's historical performance data
     */
    static analyzeHistoricalPerformance(
        workoutHistory: WorkoutSession[],
        exerciseId?: string
    ): HistoricalPerformance[] {
        const performanceMap = new Map<string, {
            weights: number[];
            dates: number[];
            totalSets: number;
            exerciseName: string;
        }>();

        // 遍历所有训练历史
        workoutHistory.forEach(session => {
            session.exercises.forEach(exercise => {
                const key = exercise.exerciseId;
                if (exerciseId && key !== exerciseId) return; // 如果指定了特定练习，只分析该练习

                if (!performanceMap.has(key)) {
                    performanceMap.set(key, {
                        weights: [],
                        dates: [],
                        totalSets: 0,
                        exerciseName: exercise.exerciseName
                    });
                }

                const data = performanceMap.get(key)!;

                // 收集所有完成的组的重量数据
                exercise.sets.forEach(set => {
                    if (set.completed && set.weight > 0) {
                        data.weights.push(set.weight);
                        data.dates.push(new Date(session.date).getTime());
                        data.totalSets++;
                    }
                });
            });
        });

        // 转换为HistoricalPerformance数组
        const performances: HistoricalPerformance[] = [];

        performanceMap.forEach((data, exerciseId) => {
            if (data.weights.length === 0) return;

            const sortedWeights = [...data.weights].sort((a, b) => a - b);
            const maxWeight = Math.max(...data.weights);
            const averageWeight = data.weights.reduce((sum, w) => sum + w, 0) / data.weights.length;

            // 获取最近的重量（按日期排序）
            const recentData = data.weights
                .map((weight, index) => ({ weight, date: data.dates[index] }))
                .sort((a, b) => b.date - a.date);

            const lastWeight = recentData[0]?.weight || 0;
            const lastPerformed = Math.max(...data.dates);

            // 分析进步趋势
            let progressTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
            if (recentData.length >= 3) {
                const recent3 = recentData.slice(0, 3).map(d => d.weight);
                const avg1 = recent3[0];
                const avg3 = (recent3[1] + recent3[2]) / 2;

                if (avg1 > avg3 * 1.05) progressTrend = 'increasing';
                else if (avg1 < avg3 * 0.95) progressTrend = 'decreasing';
            }

            performances.push({
                exerciseName: data.exerciseName,
                exerciseId,
                maxWeight,
                averageWeight: Math.round(averageWeight * 10) / 10,
                lastWeight,
                totalSets: data.totalSets,
                lastPerformed,
                progressTrend
            });
        });

        return performances.sort((a, b) => b.lastPerformed - a.lastPerformed);
    }

    /**
     * 生成智能重量推荐
     * Generate smart weight recommendations
     */
    static generateSmartWeightRecommendation(
        exercise: Exercise,
        userProfile: UserProfile,
        historicalPerformance?: HistoricalPerformance
    ): SmartWeightRecommendation {

        if (historicalPerformance && historicalPerformance.totalSets >= 3) {
            // 基于历史数据的推荐
            let recommendedWeight = historicalPerformance.lastWeight;
            let adjustmentFactor = 1.0;
            let reasoning = '';

            // 根据进步趋势调整
            switch (historicalPerformance.progressTrend) {
                case 'increasing':
                    adjustmentFactor = 1.025; // 增加2.5%
                    reasoning = `基于您的进步趋势，建议在上次重量${historicalPerformance.lastWeight}kg基础上增加2.5%`;
                    break;
                case 'decreasing':
                    adjustmentFactor = 0.95; // 减少5%
                    reasoning = `考虑到最近表现，建议适当降低重量以重新建立信心`;
                    break;
                default:
                    adjustmentFactor = 1.0;
                    reasoning = `基于您上次的训练重量${historicalPerformance.lastWeight}kg`;
            }

            // 考虑训练频率（如果很久没练，适当降低）
            const daysSinceLastWorkout = (Date.now() - historicalPerformance.lastPerformed) / (1000 * 60 * 60 * 24);
            if (daysSinceLastWorkout > 14) {
                adjustmentFactor *= 0.9; // 超过2周没练，降低10%
                reasoning += `，由于${Math.round(daysSinceLastWorkout)}天未训练，建议适当降低重量`;
            }

            recommendedWeight = Math.round(recommendedWeight * adjustmentFactor * 2) / 2; // 四舍五入到0.5kg

            return {
                recommendedWeight,
                confidence: 'high',
                reasoning,
                basedOn: 'historical_data',
                adjustmentFactor
            };
        }

        // 没有历史数据时的推荐逻辑
        let baseWeight = 0;
        let reasoning = '';
        let confidence: 'high' | 'medium' | 'low' = 'low';

        if (exercise.equipment === 'Bodyweight') {
            baseWeight = userProfile.weight;
            reasoning = `体重训练，建议使用体重${userProfile.weight}kg`;
            confidence = 'high';
        } else {
            // 基于体重和练习类型的估算
            const bodyWeightRatio = this.getBodyWeightRatio(exercise, userProfile.experienceLevel || 'Beginner');
            baseWeight = Math.round(userProfile.weight * bodyWeightRatio * 2) / 2;
            reasoning = `基于您的体重${userProfile.weight}kg和${userProfile.experienceLevel || '初学者'}水平估算`;
            confidence = 'medium';
        }

        return {
            recommendedWeight: baseWeight,
            confidence,
            reasoning,
            basedOn: historicalPerformance ? 'historical_data' : 'body_weight',
            adjustmentFactor: 1.0
        };
    }

    /**
     * 获取体重比例系数
     * Get body weight ratio for different exercises
     */
    private static getBodyWeightRatio(exercise: Exercise, experienceLevel: string): number {
        const baseRatios: Record<string, number> = {
            // 复合动作
            'Deadlift': 1.0,
            'Squat': 0.8,
            'Bench Press': 0.6,
            'Overhead Press': 0.4,
            'Row': 0.5,
            // 孤立动作
            'Bicep Curl': 0.15,
            'Tricep Extension': 0.2,
            'Lateral Raise': 0.08,
            'Leg Extension': 0.3,
            'Leg Curl': 0.25
        };

        // 根据经验等级调整
        const experienceMultiplier = {
            'Beginner': 0.5,
            'Intermediate': 0.75,
            'Advanced': 1.0
        }[experienceLevel] || 0.5;

        // 尝试匹配练习名称
        const exerciseName = exercise.name;
        for (const [key, ratio] of Object.entries(baseRatios)) {
            if (exerciseName.toLowerCase().includes(key.toLowerCase())) {
                return ratio * experienceMultiplier;
            }
        }

        // 默认值：根据机械类型
        const defaultRatio = exercise.mechanic === 'Compound' ? 0.4 : 0.2;
        return defaultRatio * experienceMultiplier;
    }

    /**
     * 生成增强的训练推荐
     * Generate enhanced workout recommendations
     */
    static generateEnhancedRecommendations(context: EnhancedAIRecommendationContext): EnhancedWorkoutRecommendation[] {
        const recommendations: EnhancedWorkoutRecommendation[] = [];

        // 分析历史表现
        const historicalPerformances = this.analyzeHistoricalPerformance(context.workoutHistory);

        // 生成基于历史数据的重量调整推荐
        if (context.currentWorkout.length > 0) {
            context.currentWorkout.forEach(activeExercise => {
                const historical = historicalPerformances.find(h => h.exerciseId === activeExercise.exerciseId);

                if (historical && historical.totalSets >= 3) {
                    const exercise = context.exerciseLibrary.find(e => e.id === activeExercise.exerciseId);
                    if (exercise) {
                        const smartWeight = this.generateSmartWeightRecommendation(exercise, context.userProfile, historical);

                        // 只有当推荐重量与当前重量有显著差异时才推荐
                        const currentWeight = activeExercise.sets[0]?.weight || 0;
                        const weightDifference = Math.abs(smartWeight.recommendedWeight - currentWeight);

                        if (weightDifference >= 2.5) { // 至少2.5kg差异才推荐
                            recommendations.push({
                                id: `weight-adjustment-${activeExercise.id}`,
                                type: 'weight_adjustment',
                                priority: smartWeight.confidence === 'high' ? 'high' : 'medium',
                                title: `调整 ${activeExercise.exerciseName} 重量`,
                                description: `建议重量：${smartWeight.recommendedWeight}kg（当前：${currentWeight}kg）`,
                                reasoning: smartWeight.reasoning,
                                smartWeightRecommendation: smartWeight,
                                feedbackEnabled: true,
                                aiGenerated: true
                            });
                        }
                    }
                }
            });
        }

        // 添加基于历史数据的练习推荐
        const wellPerformingExercises = historicalPerformances
            .filter(h => h.progressTrend === 'increasing' && h.totalSets >= 5)
            .slice(0, 3);

        if (wellPerformingExercises.length > 0) {
            const suggestedExercises = wellPerformingExercises
                .map(h => context.exerciseLibrary.find(e => e.id === h.exerciseId))
                .filter(Boolean) as Exercise[];

            if (suggestedExercises.length > 0) {
                recommendations.push({
                    id: 'historical-strength-exercises',
                    type: 'exercise',
                    priority: 'medium',
                    title: '继续强化优势项目',
                    description: '这些练习您最近进步很好，建议继续加强',
                    reasoning: '基于您的训练历史，这些动作显示出良好的进步趋势',
                    suggestedExercises,
                    feedbackEnabled: true,
                    aiGenerated: true
                });
            }
        }

        // 添加需要重新关注的练习推荐
        const neglectedExercises = historicalPerformances
            .filter(h => {
                const daysSinceLastWorkout = (Date.now() - h.lastPerformed) / (1000 * 60 * 60 * 24);
                return daysSinceLastWorkout > 14 && h.totalSets >= 3;
            })
            .slice(0, 2);

        if (neglectedExercises.length > 0) {
            const suggestedExercises = neglectedExercises
                .map(h => context.exerciseLibrary.find(e => e.id === h.exerciseId))
                .filter(Boolean) as Exercise[];

            if (suggestedExercises.length > 0) {
                recommendations.push({
                    id: 'neglected-exercises',
                    type: 'exercise',
                    priority: 'low',
                    title: '重新关注这些动作',
                    description: '这些练习您已经很久没有训练了',
                    reasoning: '保持训练的全面性，避免肌肉不平衡',
                    suggestedExercises,
                    feedbackEnabled: true,
                    aiGenerated: true
                });
            }
        }

        // 继续使用原有的推荐逻辑（恢复状态、平衡性等）
        recommendations.push(...this.generateTraditionalRecommendations(context));

        return recommendations
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .slice(0, 6); // 限制推荐数量
    }

    /**
     * 生成传统推荐（基于原有逻辑）
     * Generate traditional recommendations (based on original logic)
     */
    private static generateTraditionalRecommendations(context: EnhancedAIRecommendationContext): EnhancedWorkoutRecommendation[] {
        const recommendations: EnhancedWorkoutRecommendation[] = [];

        // 恢复状态分析
        const wellRecoveredMuscles = context.recoveryState
            .filter(status => {
                const percentage = this.calculateRecoveryPercentage(status.lastWorked, 72);
                return percentage > 85;
            })
            .map(status => status.muscle);

        if (wellRecoveredMuscles.length > 0) {
            const targetMuscle = wellRecoveredMuscles[0];
            const suggestedExercises = context.exerciseLibrary
                .filter(ex => ex.muscleGroup === targetMuscle)
                .slice(0, 3);

            recommendations.push({
                id: `recovery-${targetMuscle}`,
                type: 'exercise',
                priority: 'high',
                title: `训练 ${targetMuscle}`,
                description: `您的${targetMuscle.toLowerCase()}肌肉已完全恢复，适合今天训练`,
                reasoning: `恢复分析显示${targetMuscle}处于最佳训练状态`,
                suggestedExercises,
                targetMuscles: [targetMuscle],
                suggestedSets: 3,
                suggestedReps: '8-12',
                feedbackEnabled: true,
                aiGenerated: true
            });
        }

        return recommendations;
    }

    /**
     * 计算恢复百分比
     * Calculate recovery percentage
     */
    private static calculateRecoveryPercentage(lastWorked: number, durationHours: number = 72): number {
        if (!lastWorked) return 100;
        const now = Date.now();
        const elapsed = now - lastWorked;
        const durationMs = durationHours * 60 * 60 * 1000;
        return Math.min(100, (elapsed / durationMs) * 100);
    }

    /**
     * 处理用户反馈
     * Handle user feedback on recommendations
     */
    static handleRecommendationFeedback(
        recommendationId: string,
        feedback: 'positive' | 'negative' | 'regenerate',
        context?: any
    ): void {
        // 这里可以实现反馈处理逻辑
        // 例如：记录到本地存储或发送到后端进行模型改进
        console.log(`AI推荐反馈: ${recommendationId} - ${feedback}`);

        // 可以根据反馈调整未来的推荐算法
        const feedbackData = {
            recommendationId,
            feedback,
            timestamp: Date.now(),
            context
        };

        // 存储反馈数据 (iOS-safe)
        try {
            const existingFeedback = JSON.parse(iOSStorage.getItem('ai_recommendation_feedback') || '[]');
            existingFeedback.push(feedbackData);
            iOSStorage.setItem('ai_recommendation_feedback', JSON.stringify(existingFeedback));
        } catch {
            console.warn('⚠️ Cannot save feedback (storage restricted)');
        }
    }
}

export default EnhancedAIRecommendationService;