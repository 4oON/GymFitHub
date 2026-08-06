/**
 * Enhanced Exercise Recommendation Service
 *
 * 增强的运动推荐服务，能够从数据库中读取用户的历史训练数据
 * 并基于实际的训练记录提供更准确的重量推荐
 */

import prisma from '../db/client';

interface HistoricalWorkoutData {
    sets: Array<{ weight: number; reps: number }>;
    daysAgo: number;
}

interface ExerciseRecommendationParams {
    userId: string;
    exerciseName: string;
    userWeight: number;
    experienceLevel: string;
    mechanic: string;
}

interface ExerciseRecommendation {
    sets: number;
    reps: string;
    weight: number;
    reason: string;
}



/**
 * 从数据库中查询用户的历史训练数据
 */
async function getHistoricalWorkoutData(
    userId: string,
    exerciseName: string
): Promise<HistoricalWorkoutData | null> {
    try {
        console.log(`🔍 [EnhancedRecommendation] 查询用户 ${userId} 的 ${exerciseName} 历史数据...`);

        // 查询最近30天内包含该动作的训练记录
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const workouts = await prisma.workout.findMany({
            where: {
                userId,
                OR: [
                    { date: { gte: thirtyDaysAgo } },
                    { createdAt: { gte: thirtyDaysAgo } }
                ]
            },
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ],
            take: 10
        });

        console.log(`📊 [EnhancedRecommendation] 找到 ${workouts.length} 条最近训练记录`);

        // 查找包含目标动作的训练
        for (const workout of workouts) {
            try {
                const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];

                // 查找匹配的动作 - 支持多种数据格式
                const targetExercise = exercises.find(ex => {
                    // 类型安全检查
                    if (!ex || typeof ex !== 'object') return false;

                    const exerciseObj = ex as any;

                    // 获取动作名称 - 支持不同的字段名
                    const exerciseNameFromData =
                        exerciseObj.exerciseName ||
                        exerciseObj.name ||
                        exerciseObj.notes ||
                        '';

                    if (!exerciseNameFromData || typeof exerciseNameFromData !== 'string') return false;

                    const lowerExerciseName = exerciseNameFromData.toLowerCase();
                    const lowerTargetName = exerciseName.toLowerCase();

                    return (
                        lowerExerciseName.includes(lowerTargetName) ||
                        lowerTargetName.includes(lowerExerciseName) ||
                        // 特殊处理各种动作变体
                        (lowerTargetName.includes('squat') && lowerExerciseName.includes('squat')) ||
                        (lowerTargetName.includes('deadlift') && lowerExerciseName.includes('deadlift')) ||
                        (lowerTargetName.includes('bench') && lowerExerciseName.includes('bench')) ||
                        (exerciseName.includes('深蹲') && lowerExerciseName.includes('squat')) ||
                        (exerciseName.includes('硬拉') && lowerExerciseName.includes('deadlift')) ||
                        (exerciseName.includes('卧推') && lowerExerciseName.includes('bench'))
                    );
                });

                if (targetExercise) {
                    const workoutDate = workout.date || workout.createdAt;
                    const daysAgo = Math.floor((Date.now() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));

                    const exerciseObj = targetExercise as any;

                    // 获取动作名称用于日志
                    const exerciseNameFromData =
                        exerciseObj.exerciseName ||
                        exerciseObj.name ||
                        exerciseObj.notes ||
                        'Unknown Exercise';

                    console.log(`✅ [EnhancedRecommendation] 找到匹配的训练记录: ${exerciseNameFromData}, ${daysAgo}天前`);

                    // 处理不同的组数据格式
                    let setsData: Array<{ weight: number; reps: number }> = [];

                    if (exerciseObj.sets && Array.isArray(exerciseObj.sets)) {
                        // 新格式：sets是数组
                        setsData = exerciseObj.sets.map((set: any) => ({
                            weight: parseFloat(set.weight) || 0,
                            reps: parseInt(set.reps) || 0
                        }));
                    } else if (exerciseObj.sets && exerciseObj.reps && exerciseObj.weight) {
                        // 旧格式：sets是数量，reps和weight是单个值
                        const setCount = parseInt(exerciseObj.sets) || 1;
                        const weight = parseFloat(exerciseObj.weight) || 0;
                        const reps = parseInt(exerciseObj.reps) || 0;

                        for (let i = 0; i < setCount; i++) {
                            setsData.push({ weight, reps });
                        }
                    }

                    if (setsData.length > 0) {
                        console.log(`📈 [EnhancedRecommendation] 组数详情: ${setsData.map((s: { weight: number; reps: number }) => `${s.weight}kg×${s.reps}`).join(', ')}`);

                        return {
                            sets: setsData,
                            daysAgo
                        };
                    }
                }
            } catch (error) {
                console.error(`❌ [EnhancedRecommendation] 解析训练记录失败:`, error);
                continue;
            }
        }

        console.log(`❌ [EnhancedRecommendation] 没有找到 ${exerciseName} 的历史数据`);
        return null;
    } catch (error) {
        console.error(`❌ [EnhancedRecommendation] 查询历史数据失败:`, error);
        return null;
    }
}

/**
 * 基于历史数据计算推荐重量
 */
function calculateRecommendedWeight(
    historicalData: HistoricalWorkoutData,
    userWeight: number,
    _experienceLevel: string
): { weight: number; reason: string } {
    const { sets, daysAgo } = historicalData;

    // 找到最大重量
    const maxWeight = Math.max(...sets.map(set => set.weight));
    const avgWeight = sets.reduce((sum, set) => sum + set.weight, 0) / sets.length;

    console.log(`📊 [EnhancedRecommendation] 历史数据分析: 最大重量=${maxWeight}kg, 平均重量=${avgWeight.toFixed(1)}kg, ${daysAgo}天前`);

    let recommendedWeight: number;
    let reason: string;

    if (daysAgo <= 7) {
        // 一周内训练过，建议基于最大重量的80-85%，并适当增加
        const baseWeight = maxWeight * 0.8;
        recommendedWeight = Math.round((baseWeight + 2.5) / 2.5) * 2.5; // 增加2.5kg并四舍五入到2.5kg
        reason = `💪 基于您${daysAgo}天前的最大重量 ${maxWeight}kg，建议从 ${recommendedWeight}kg 开始渐进`;
    } else if (daysAgo <= 14) {
        // 两周内训练过，建议基于最大重量的80%
        recommendedWeight = Math.round((maxWeight * 0.8) / 2.5) * 2.5;
        reason = `📊 基于您${daysAgo}天前的最大重量 ${maxWeight}kg，建议 ${recommendedWeight}kg (80%)`;
    } else if (daysAgo <= 30) {
        // 一个月内训练过，建议基于最大重量的75%
        recommendedWeight = Math.round((maxWeight * 0.75) / 2.5) * 2.5;
        reason = `⚠️ 距离上次训练${daysAgo}天，建议从较轻重量 ${recommendedWeight}kg 开始 (75%)`;
    } else {
        // 超过一个月，建议基于最大重量的70%
        recommendedWeight = Math.round((maxWeight * 0.7) / 2.5) * 2.5;
        reason = `🔄 长时间未训练，建议从 ${recommendedWeight}kg 重新开始 (70%)`;
    }

    // 确保推荐重量不会太轻（至少是体重的20%）或太重（不超过历史最大重量的110%）
    const minWeight = Math.round((userWeight * 0.2) / 2.5) * 2.5;
    const maxAllowedWeight = Math.round((maxWeight * 1.1) / 2.5) * 2.5;

    recommendedWeight = Math.max(minWeight, Math.min(recommendedWeight, maxAllowedWeight));

    console.log(`🎯 [EnhancedRecommendation] 推荐重量: ${recommendedWeight}kg (范围: ${minWeight}-${maxAllowedWeight}kg)`);

    return { weight: recommendedWeight, reason };
}

/**
 * 增强的运动推荐函数
 */
export async function getEnhancedExerciseRecommendation(
    params: ExerciseRecommendationParams
): Promise<ExerciseRecommendation> {
    const { userId, exerciseName, userWeight, experienceLevel, mechanic } = params;

    console.log(`🚀 [EnhancedRecommendation] 开始为用户 ${userId} 生成 ${exerciseName} 的推荐...`);

    // 1. 查询历史数据
    const historicalData = await getHistoricalWorkoutData(userId, exerciseName);

    // 2. 基础参数设置
    const isCompound = mechanic === 'Compound';
    const sets = experienceLevel === 'Beginner' ? 3 : experienceLevel === 'Intermediate' ? 4 : 5;
    const reps = isCompound ? "6-8" : "10-12";

    let weight: number;
    let reason: string;

    if (historicalData && historicalData.sets.length > 0) {
        // 3. 基于历史数据计算推荐
        const recommendation = calculateRecommendedWeight(historicalData, userWeight, experienceLevel);
        weight = recommendation.weight;
        reason = recommendation.reason;
    } else {
        // 4. 没有历史数据时的fallback逻辑
        console.log(`📝 [EnhancedRecommendation] 没有历史数据，使用fallback逻辑`);

        // 根据经验水平和动作类型设置基础重量
        let baseMultiplier: number;

        if (isCompound) {
            // 复合动作：深蹲、硬拉、卧推等
            switch (experienceLevel) {
                case 'Beginner':
                    baseMultiplier = 0.4; // 体重的40%
                    break;
                case 'Intermediate':
                    baseMultiplier = 0.6; // 体重的60%
                    break;
                case 'Advanced':
                    baseMultiplier = 0.8; // 体重的80%
                    break;
                default:
                    baseMultiplier = 0.5;
            }
        } else {
            // 孤立动作：弯举、推举等
            switch (experienceLevel) {
                case 'Beginner':
                    baseMultiplier = 0.15; // 体重的15%
                    break;
                case 'Intermediate':
                    baseMultiplier = 0.25; // 体重的25%
                    break;
                case 'Advanced':
                    baseMultiplier = 0.35; // 体重的35%
                    break;
                default:
                    baseMultiplier = 0.2;
            }
        }

        const baseWeight = userWeight * baseMultiplier;
        weight = Math.round(baseWeight / 2.5) * 2.5; // 四舍五入到2.5kg
        reason = `💡 基于您的体重 ${userWeight}kg 和 ${experienceLevel} 经验水平的智能推荐`;

        console.log(`📊 [EnhancedRecommendation] Fallback推荐: ${weight}kg (体重${userWeight}kg × ${baseMultiplier})`);
    }

    const recommendation = { sets, reps, weight, reason };
    console.log(`✅ [EnhancedRecommendation] 最终推荐:`, recommendation);

    return recommendation;
}

/**
 * 为AI控制器提供的包装函数
 */
export async function getExerciseRecommendationWithHistory(params: {
    userId?: string;
    exerciseName: string;
    userWeight: number;
    experienceLevel: string;
    mechanic: string;
    lastWorkout?: {
        sets: Array<{ weight: number; reps: number }>;
        daysAgo: number;
    };
}): Promise<ExerciseRecommendation> {
    const { userId, lastWorkout, ...otherParams } = params;

    // 如果提供了userId，使用增强推荐
    if (userId) {
        return getEnhancedExerciseRecommendation({
            userId,
            ...otherParams
        });
    }

    // 如果没有userId但有lastWorkout数据，使用传统逻辑
    if (lastWorkout && lastWorkout.sets && lastWorkout.sets.length > 0) {
        const historicalData: HistoricalWorkoutData = {
            sets: lastWorkout.sets,
            daysAgo: lastWorkout.daysAgo
        };

        const recommendation = calculateRecommendedWeight(
            historicalData,
            otherParams.userWeight,
            otherParams.experienceLevel
        );

        const isCompound = otherParams.mechanic === 'Compound';
        const sets = otherParams.experienceLevel === 'Beginner' ? 3 : otherParams.experienceLevel === 'Intermediate' ? 4 : 5;
        const reps = isCompound ? "6-8" : "10-12";

        return {
            sets,
            reps,
            weight: recommendation.weight,
            reason: recommendation.reason
        };
    }

    // 最后的fallback
    return getEnhancedExerciseRecommendation({
        userId: 'fallback',
        ...otherParams
    });
}