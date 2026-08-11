/**
 * Historical Data Query Service
 * 
 * 从用户的历史训练记录中查询真实的重量数据
 * 用于AI推荐系统提供基于历史表现的智能建议
 */

import type { WorkoutSession, ActiveExercise, WorkoutSet, WeeklyReport } from '@/shared/types';
import { iOSStorage } from '@/services/iOSStorageService';

export interface ExerciseHistoryData {
    exerciseId: string;
    exerciseName: string;
    lastPerformed: number; // 时间戳
    maxWeight: number;
    averageWeight: number;
    lastWeight: number; // 上次最后一组的重量
    lastReps: number; // 上次最后一组的次数
    totalSessions: number;
    progressTrend: 'increasing' | 'stable' | 'decreasing';
    confidenceLevel: number; // 0-1，数据可信度
}

export interface LastSetData {
    weight: number;
    reps: number;
    completedAt: number;
    sessionDate: number;
}

export class HistoricalDataQueryService {
    /**
     * 从localStorage加载所有历史训练数据
     */
    private static loadWorkoutSessions(): WorkoutSession[] {
        try {
            // 使用正确的localStorage键名
            const sessionsJson = iOSStorage.getItem('zenfit_history');
            if (!sessionsJson) return [];

            const sessions: WorkoutSession[] = JSON.parse(sessionsJson);
            return sessions.filter(session =>
                session.exercises &&
                session.exercises.length > 0 &&
                session.date
            );
        } catch (error) {
            console.error('❌ Failed to load workout sessions:', error);
            return [];
        }
    }

    /**
     * 从localStorage加载周报数据
     */
    private static async loadWeeklyReports(): Promise<WeeklyReport[]> {
        try {
            // 周报数据存储在IndexedDB中，这里暂时返回空数组
            // 主要数据来源是zenfit_history中的WorkoutSession
            return [];
        } catch (error) {
            console.error('❌ Failed to load weekly reports:', error);
            return [];
        }
    }

    /**
     * 获取所有历史数据（主要从zenfit_history获取）
     */
    private static getAllHistoricalSessions(): WorkoutSession[] {
        const directSessions = this.loadWorkoutSessions();

        // 由于周报数据在IndexedDB中，这里主要使用直接的训练记录
        // 去重：使用Map基于session ID去重
        const sessionMap = new Map<string, WorkoutSession>();

        directSessions.forEach(session => {
            if (session.id && session.exercises && session.exercises.length > 0) {
                sessionMap.set(session.id, session);
            }
        });

        // 按日期排序（最新的在前）
        return Array.from(sessionMap.values())
            .sort((a, b) => b.date - a.date);
    }

    /**
     * 根据动作ID或名称查询历史数据
     */
    static getExerciseHistory(
        exerciseId?: string,
        exerciseName?: string
    ): ExerciseHistoryData | null {
        const allSessions = this.getAllHistoricalSessions();

        if (allSessions.length === 0) {
            console.warn('⚠️ No historical workout data found');
            return null;
        }

        // 查找匹配的动作记录
        const matchingExercises: Array<{
            exercise: ActiveExercise;
            sessionDate: number;
        }> = [];

        allSessions.forEach(session => {
            session.exercises.forEach(exercise => {
                const isMatch = (exerciseId && exercise.exerciseId === exerciseId) ||
                    (exerciseName && (
                        exercise.exerciseName === exerciseName ||
                        exercise.exerciseNameZh === exerciseName
                    ));

                if (isMatch) {
                    matchingExercises.push({
                        exercise,
                        sessionDate: session.date
                    });
                }
            });
        });

        if (matchingExercises.length === 0) {
            console.warn(`⚠️ No history found for exercise: ${exerciseId || exerciseName}`);
            return null;
        }

        // 按日期排序（最新的在前）
        matchingExercises.sort((a, b) => b.sessionDate - a.sessionDate);

        // 分析历史数据
        const weights: number[] = [];
        const completedSets: Array<{ weight: number; reps: number; date: number }> = [];

        matchingExercises.forEach(({ exercise, sessionDate }) => {
            exercise.sets.forEach(set => {
                if (set.completed && set.weight > 0) {
                    weights.push(set.weight);
                    completedSets.push({
                        weight: set.weight,
                        reps: set.reps,
                        date: sessionDate
                    });
                }
            });
        });

        if (weights.length === 0) {
            console.warn(`⚠️ No completed sets found for exercise: ${exerciseId || exerciseName}`);
            return null;
        }

        // 计算统计数据
        const maxWeight = Math.max(...weights);
        const averageWeight = Math.round(weights.reduce((sum, w) => sum + w, 0) / weights.length);

        // 获取最近一次训练的最后一组数据
        const latestExercise = matchingExercises[0];
        const lastCompletedSet = latestExercise.exercise.sets
            .filter(set => set.completed)
            .pop(); // 获取最后一组

        const lastWeight = lastCompletedSet?.weight || averageWeight;
        const lastReps = lastCompletedSet?.reps || 0;

        // 分析进步趋势（比较最近3次和之前3次的平均重量）
        const progressTrend = this.analyzeProgressTrend(completedSets);

        // 计算数据可信度
        const confidenceLevel = this.calculateConfidenceLevel(
            matchingExercises.length,
            weights.length,
            matchingExercises[0].sessionDate
        );

        return {
            exerciseId: exerciseId || latestExercise.exercise.exerciseId,
            exerciseName: exerciseName || latestExercise.exercise.exerciseName,
            lastPerformed: latestExercise.sessionDate,
            maxWeight,
            averageWeight,
            lastWeight,
            lastReps,
            totalSessions: matchingExercises.length,
            progressTrend,
            confidenceLevel
        };
    }

    /**
     * 获取指定动作的上次最后一组数据
     */
    static getLastSetData(
        exerciseId?: string,
        exerciseName?: string
    ): LastSetData | null {
        const history = this.getExerciseHistory(exerciseId, exerciseName);
        if (!history) return null;

        return {
            weight: history.lastWeight,
            reps: history.lastReps,
            completedAt: history.lastPerformed,
            sessionDate: history.lastPerformed
        };
    }

    /**
     * 🆕 获取指定动作的历史最大重量及达成日期
     * 用于 AI 推荐显示"历史最佳重量"
     */
    static getMaxWeightWithDate(
        exerciseId?: string,
        exerciseName?: string
    ): { weight: number; reps: number; date: number; daysAgo: number } | null {
        const allSessions = this.getAllHistoricalSessions();
        
        let maxWeight = 0;
        let maxReps = 0;
        let maxDate = 0;

        allSessions.forEach(session => {
            session.exercises?.forEach(exercise => {
                const isMatch = (exerciseId && exercise.exerciseId === exerciseId) ||
                    (exerciseName && (
                        exercise.exerciseName === exerciseName ||
                        exercise.exerciseNameZh === exerciseName
                    ));

                if (isMatch) {
                    exercise.sets?.forEach(set => {
                        if (set.completed && set.weight > maxWeight) {
                            maxWeight = set.weight;
                            maxReps = set.reps;
                            maxDate = session.date;
                        }
                    });
                }
            });
        });

        if (maxWeight === 0) return null;

        const daysAgo = Math.floor((Date.now() - maxDate) / (24 * 60 * 60 * 1000));

        return {
            weight: maxWeight,
            reps: maxReps,
            date: maxDate,
            daysAgo
        };
    }

    /**
     * 获取用户的整体训练统计
     */
    static getOverallTrainingStats(): {
        totalSessions: number;
        totalVolume: number;
        averageSessionDuration: number;
        mostTrainedMuscles: string[];
        trainingFrequency: number; // 每周平均训练次数
        lastWorkoutDate: number;
    } {
        const allSessions = this.getAllHistoricalSessions();

        if (allSessions.length === 0) {
            return {
                totalSessions: 0,
                totalVolume: 0,
                averageSessionDuration: 0,
                mostTrainedMuscles: [],
                trainingFrequency: 0,
                lastWorkoutDate: 0
            };
        }

        const totalVolume = allSessions.reduce((sum, session) => sum + (session.volumeLoad || 0), 0);
        const totalDuration = allSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
        const averageSessionDuration = Math.round(totalDuration / allSessions.length);

        // 统计肌肉群训练频率
        const muscleFrequency = new Map<string, number>();
        allSessions.forEach(session => {
            session.exercises.forEach(exercise => {
                const muscle = exercise.muscleGroup;
                muscleFrequency.set(muscle, (muscleFrequency.get(muscle) || 0) + 1);
            });
        });

        const mostTrainedMuscles = Array.from(muscleFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([muscle]) => muscle);

        // 计算训练频率（最近4周的平均）
        const fourWeeksAgo = Date.now() - (4 * 7 * 24 * 60 * 60 * 1000);
        const recentSessions = allSessions.filter(session => session.date >= fourWeeksAgo);
        const trainingFrequency = Math.round((recentSessions.length / 4) * 10) / 10;

        return {
            totalSessions: allSessions.length,
            totalVolume: Math.round(totalVolume),
            averageSessionDuration,
            mostTrainedMuscles,
            trainingFrequency,
            lastWorkoutDate: allSessions[0]?.date || 0
        };
    }

    /**
     * 智能搜索相似动作的历史数据
     * 当找不到精确匹配时，搜索相似的动作
     */
    static findSimilarExerciseHistory(
        targetExerciseName: string,
        muscleGroup?: string
    ): ExerciseHistoryData[] {
        const allSessions = this.getAllHistoricalSessions();
        const similarExercises = new Map<string, ExerciseHistoryData>();

        // 关键词匹配策略
        const keywords = this.extractKeywords(targetExerciseName);

        allSessions.forEach(session => {
            session.exercises.forEach(exercise => {
                const exerciseKeywords = this.extractKeywords(exercise.exerciseName);
                const similarity = this.calculateSimilarity(keywords, exerciseKeywords);

                // 如果相似度超过阈值，或者肌肉群匹配
                if (similarity > 0.3 || (muscleGroup && exercise.muscleGroup === muscleGroup)) {
                    const history = this.getExerciseHistory(exercise.exerciseId, exercise.exerciseName);
                    if (history && !similarExercises.has(history.exerciseId)) {
                        similarExercises.set(history.exerciseId, history);
                    }
                }
            });
        });

        return Array.from(similarExercises.values())
            .sort((a, b) => b.confidenceLevel - a.confidenceLevel)
            .slice(0, 5); // 返回最相关的5个
    }

    /**
     * 分析进步趋势
     */
    private static analyzeProgressTrend(
        completedSets: Array<{ weight: number; reps: number; date: number }>
    ): 'increasing' | 'stable' | 'decreasing' {
        if (completedSets.length < 6) return 'stable';

        // 按日期排序
        completedSets.sort((a, b) => a.date - b.date);

        // 比较最近3次和之前3次的平均重量
        const recent = completedSets.slice(-3);
        const previous = completedSets.slice(-6, -3);

        const recentAvg = recent.reduce((sum, set) => sum + set.weight, 0) / recent.length;
        const previousAvg = previous.reduce((sum, set) => sum + set.weight, 0) / previous.length;

        const changePercentage = ((recentAvg - previousAvg) / previousAvg) * 100;

        if (changePercentage > 5) return 'increasing';
        if (changePercentage < -5) return 'decreasing';
        return 'stable';
    }

    /**
     * 计算数据可信度
     */
    private static calculateConfidenceLevel(
        sessionCount: number,
        setCount: number,
        lastPerformed: number
    ): number {
        let confidence = 0;

        // 基于训练次数
        if (sessionCount >= 5) confidence += 0.4;
        else if (sessionCount >= 3) confidence += 0.3;
        else if (sessionCount >= 1) confidence += 0.2;

        // 基于组数
        if (setCount >= 15) confidence += 0.3;
        else if (setCount >= 10) confidence += 0.2;
        else if (setCount >= 5) confidence += 0.1;

        // 基于时间新鲜度（最近30天内）
        const daysSinceLastPerformed = (Date.now() - lastPerformed) / (24 * 60 * 60 * 1000);
        if (daysSinceLastPerformed <= 7) confidence += 0.3;
        else if (daysSinceLastPerformed <= 30) confidence += 0.2;
        else if (daysSinceLastPerformed <= 90) confidence += 0.1;

        return Math.min(confidence, 1.0);
    }

    /**
     * 提取关键词
     */
    private static extractKeywords(exerciseName: string): string[] {
        return exerciseName
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * 计算相似度
     */
    private static calculateSimilarity(keywords1: string[], keywords2: string[]): number {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    /**
     * 获取动作的重量建议范围
     */
    static getWeightRecommendationRange(
        exerciseId?: string,
        exerciseName?: string
    ): { min: number; max: number; recommended: number } | null {
        const history = this.getExerciseHistory(exerciseId, exerciseName);

        if (!history) {
            // 如果没有历史数据，尝试查找相似动作
            const similarExercises = this.findSimilarExerciseHistory(
                exerciseName || 'unknown'
            );

            if (similarExercises.length > 0) {
                const avgWeight = similarExercises.reduce((sum, ex) => sum + ex.averageWeight, 0) / similarExercises.length;
                return {
                    min: Math.round(avgWeight * 0.8),
                    max: Math.round(avgWeight * 1.2),
                    recommended: Math.round(avgWeight)
                };
            }

            return null;
        }

        // 基于历史数据计算建议范围
        const baseWeight = history.lastWeight;
        const progressMultiplier = history.progressTrend === 'increasing' ? 1.05 :
            history.progressTrend === 'decreasing' ? 0.95 : 1.0;

        const recommended = Math.round(baseWeight * progressMultiplier);

        return {
            min: Math.round(recommended * 0.9),
            max: Math.round(Math.min(recommended * 1.1, history.maxWeight * 1.05)),
            recommended
        };
    }
}

export default HistoricalDataQueryService;