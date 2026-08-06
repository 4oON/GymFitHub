import type { ActiveExercise } from '@/shared/types';
import apiClient from '@/services/apiClient';

/**
 * Gemini AI Service - Frontend Proxy
 *
 * 前端通过调用后端API来使用AI服务
 * 符合前后端分离架构原则
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * 获取认证token - 使用统一的 apiClient
 */
const getAuthToken = (): string | null => {
    return apiClient.getToken();
};

/**
 * 通用API调用函数
 */
const callBackendAPI = async (endpoint: string, data: any) => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/ai/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
};

// Mock function for development
export async function generateWorkoutPlanMock(input: any) {
    console.log('🔧 调用后端API - generateWorkoutPlanMock', input);
    return {
        planText: 'AI服务通过后端API调用中...',
    };
}

export const getExerciseTip = async (exerciseName: string): Promise<string> => {
    try {
        const tips = await callBackendAPI('exercise-tips', { exerciseName });
        return tips.english || `关于 ${exerciseName} 的专业提示`;
    } catch (error) {
        console.error('Error calling backend AI API:', error);
        return `关于 ${exerciseName} 的专业提示：保持核心收紧，控制动作节奏。`;
    }
};

export const getExerciseTips = async (exerciseName: string): Promise<{ english: string; chinese: string }> => {
    try {
        const tips = await callBackendAPI('exercise-tips', { exerciseName });
        return tips;
    } catch (error) {
        console.error('Error calling backend AI API:', error);
        return {
            english: `Tips for ${exerciseName}: Keep core tight | Control the movement | Breathe steadily`,
            chinese: `${exerciseName}提示：核心收紧 | 控制动作 | 平稳呼吸`
        };
    }
};

export const getRoutineSuggestion = async (muscleGroup: string): Promise<string> => {
    try {
        const result = await callBackendAPI('routine-suggestion', { muscleGroup });
        return result.suggestion;
    } catch (error) {
        console.error('Error calling backend AI API:', error);
        return "Squat, Bench Press, Deadlift";
    }
};

export const getExerciseRecommendation = async (
    exerciseName: string,
    userWeight: number,
    experienceLevel: string,
    mechanic: string,
    lastWorkout?: {
        sets: Array<{ weight: number; reps: number }>;
        daysAgo: number;
    }
): Promise<{
    sets: number;
    reps: string;
    weight: number;
    reason: string;
}> => {
    try {
        const recommendation = await callBackendAPI('exercise-recommendation', {
            exerciseName,
            userWeight,
            experienceLevel,
            mechanic,
            lastWorkout
        });
        return recommendation;
    } catch (error) {
        console.error('Error calling backend AI API:', error);

        // 🆕 增强的Fallback逻辑 - 优先使用历史数据
        const isCompound = mechanic === 'Compound';
        const sets = experienceLevel === 'Beginner' ? 3 : experienceLevel === 'Intermediate' ? 4 : 5;
        const reps = isCompound ? "6-8" : "10-12";
        
        let weight: number;
        let reason: string;
        
        if (lastWorkout && lastWorkout.sets && lastWorkout.sets.length > 0) {
            // 基于历史数据的推荐
            const lastSet = lastWorkout.sets[lastWorkout.sets.length - 1];
            const baseWeight = lastSet.weight;
            
            // 根据时间间隔调整重量
            if (lastWorkout.daysAgo <= 7) {
                // 一周内训练过，建议增加2.5%
                weight = Math.round((baseWeight * 1.025) / 2.5) * 2.5;
                reason = `💪 基于您${lastWorkout.daysAgo}天前的训练记录 ${baseWeight}kg，建议增加到 ${weight}kg`;
            } else if (lastWorkout.daysAgo <= 30) {
                // 一个月内训练过，保持相同重量
                weight = baseWeight;
                reason = `📊 基于您${lastWorkout.daysAgo}天前的训练记录 ${baseWeight}kg`;
            } else {
                // 超过一个月，适当降低重量
                weight = Math.round((baseWeight * 0.9) / 2.5) * 2.5;
                reason = `⚠️ 距离上次训练${lastWorkout.daysAgo}天，建议从较轻重量 ${weight}kg 开始`;
            }
            
            console.log(`🎯 [geminiService] Using historical data for ${exerciseName}: ${baseWeight}kg -> ${weight}kg`);
        } else {
            // 没有历史数据，使用体重比例
            const baseWeight = userWeight * (isCompound ? 0.6 : 0.3);
            weight = Math.round(baseWeight / 2.5) * 2.5;
            reason = "💡 基于您的体重和经验水平的智能推荐";
            
            console.log(`📊 [geminiService] No history for ${exerciseName}, using body weight ratio: ${weight}kg`);
        }

        return {
            sets,
            reps,
            weight,
            reason
        };
    }
};

export const generateWorkoutReport = async (exercises: ActiveExercise[], duration: number): Promise<string> => {
    try {
        const result = await callBackendAPI('workout-report', {
            exercises: exercises.map(ex => ({
                exerciseName: ex.exerciseName,
                sets: ex.sets
            })),
            duration
        });
        return result.report;
    } catch (error) {
        console.error('Error calling backend AI API:', error);
        return `
**训练完成！**

本次训练时长：${duration}分钟，完成${exercises.length}个动作。

**恢复建议**：注意补充蛋白质和水分，充分休息。
        `.trim();
    }
};

/**
 * Calculate calories burned using backend AI service
 */
export const calculateCaloriesWithAI = async (
    durationMinutes: number,
    bodyWeight: number,
    exercises: Array<{
        name: string;
        sets: number;
        reps: number;
        weight: number;
        muscleGroup: string;
    }>
): Promise<number> => {
    try {
        const result = await callBackendAPI('calculate-calories', {
            durationMinutes,
            bodyWeight,
            exercises
        });
        return result.calories;
    } catch (error) {
        console.error('Error calling backend AI API:', error);

        // Fallback calculation
        const fallbackCalories = Math.round((durationMinutes / 60) * 5 * bodyWeight);
        return fallbackCalories;
    }
};