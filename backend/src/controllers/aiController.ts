import { Request, Response } from 'express';
import * as qwenService from '../services/qwenService';
import { getExerciseRecommendationWithHistory } from '../services/enhancedRecommendationService';
// import * as geminiService from '../services/geminiService'; // 保留但不使用

/**
 * AI Controller
 *
 * 处理所有AI相关的HTTP请求
 * 当前使用 QWEN (通义千问) 作为 AI 服务提供商
 */

/**
 * POST /api/ai/exercise-tips
 * 获取运动提示（双语）
 */
export const getExerciseTips = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { exerciseName } = req.body;

        if (!exerciseName) {
            return res.status(400).json({
                error: 'exerciseName is required'
            });
        }

        const tips = await qwenService.getExerciseTips(exerciseName);

        return res.json({
            success: true,
            data: tips
        });
    } catch (error) {
        console.error('Error in getExerciseTips:', error);
        return res.status(500).json({
            error: 'Failed to get exercise tips',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/ai/exercise-recommendation
 * 获取运动推荐 (使用增强的推荐服务)
 */
export const getExerciseRecommendation = async (req: Request, res: Response): Promise<Response> => {
    try {
        const {
            exerciseName,
            userWeight,
            experienceLevel,
            mechanic,
            lastWorkout
        } = req.body;

        // 验证必需参数
        if (!exerciseName || !userWeight || !experienceLevel || !mechanic) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['exerciseName', 'userWeight', 'experienceLevel', 'mechanic']
            });
        }

        // 从认证中间件获取用户ID（如果有的话）
        const userId = (req as any).user?.id;

        console.log(`🎯 [aiController] 处理推荐请求: ${exerciseName}, 用户ID: ${userId || '未认证'}`);

        // 优先使用增强的推荐服务
        try {
            const recommendation = await getExerciseRecommendationWithHistory({
                userId,
                exerciseName,
                userWeight,
                experienceLevel,
                mechanic,
                lastWorkout
            });

            console.log(`✅ [aiController] 增强推荐成功:`, recommendation);

            return res.json({
                success: true,
                data: recommendation,
                source: 'enhanced'
            });
        } catch (enhancedError) {
            console.error('❌ [aiController] 增强推荐失败，回退到QWEN:', enhancedError);

            // 回退到原有的QWEN推荐
            const recommendation = await qwenService.getExerciseRecommendation({
                exerciseName,
                userWeight,
                experienceLevel,
                mechanic,
                lastWorkout
            });

            return res.json({
                success: true,
                data: recommendation,
                source: 'qwen_fallback'
            });
        }
    } catch (error) {
        console.error('Error in getExerciseRecommendation:', error);
        return res.status(500).json({
            error: 'Failed to get exercise recommendation',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/ai/routine-suggestion
 * 获取训练建议
 */
export const getRoutineSuggestion = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { muscleGroup } = req.body;

        if (!muscleGroup) {
            return res.status(400).json({
                error: 'muscleGroup is required'
            });
        }

        const suggestion = await qwenService.getRoutineSuggestion(muscleGroup);

        return res.json({
            success: true,
            data: { suggestion }
        });
    } catch (error) {
        console.error('Error in getRoutineSuggestion:', error);
        return res.status(500).json({
            error: 'Failed to get routine suggestion',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/ai/workout-report
 * 生成训练报告
 */
export const generateWorkoutReport = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { exercises, duration } = req.body;

        if (!exercises || !duration) {
            return res.status(400).json({
                error: 'exercises and duration are required'
            });
        }

        const report = await qwenService.generateWorkoutReport({
            exercises,
            duration
        });

        return res.json({
            success: true,
            data: { report }
        });
    } catch (error) {
        console.error('Error in generateWorkoutReport:', error);
        return res.status(500).json({
            error: 'Failed to generate workout report',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * POST /api/ai/calculate-calories
 * 计算卡路里消耗
 */
export const calculateCalories = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { durationMinutes, bodyWeight, exercises } = req.body;

        if (!durationMinutes || !bodyWeight || !exercises) {
            return res.status(400).json({
                error: 'durationMinutes, bodyWeight, and exercises are required'
            });
        }

        const calories = await qwenService.calculateCaloriesWithAI({
            durationMinutes,
            bodyWeight,
            exercises
        });

        return res.json({
            success: true,
            data: { calories }
        });
    } catch (error) {
        console.error('Error in calculateCalories:', error);
        return res.status(500).json({
            error: 'Failed to calculate calories',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};