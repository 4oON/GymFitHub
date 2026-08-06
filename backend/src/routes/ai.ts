import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import * as aiConfigController from '../controllers/aiConfigController';
import { authMiddleware } from '../middleware/authMiddleware';

/**
 * AI Routes
 * 
 * 所有AI相关的API端点
 * 需要认证才能访问
 */

const router = Router();

// 所有AI路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/ai/exercise-tips
 * 获取运动提示（双语）
 * 
 * Body:
 * - exerciseName: string
 * 
 * Response:
 * - english: string
 * - chinese: string
 */
router.post('/exercise-tips', aiController.getExerciseTips);

/**
 * POST /api/ai/exercise-recommendation
 * 获取运动推荐
 * 
 * Body:
 * - exerciseName: string
 * - userWeight: number
 * - experienceLevel: string
 * - mechanic: string
 * - lastWorkout?: { sets: Array<{weight: number, reps: number}>, daysAgo: number }
 * 
 * Response:
 * - sets: number
 * - reps: string
 * - weight: number
 * - reason: string
 */
router.post('/exercise-recommendation', aiController.getExerciseRecommendation);

/**
 * POST /api/ai/routine-suggestion
 * 获取训练建议
 * 
 * Body:
 * - muscleGroup: string
 * 
 * Response:
 * - suggestion: string
 */
router.post('/routine-suggestion', aiController.getRoutineSuggestion);

/**
 * POST /api/ai/workout-report
 * 生成训练报告
 * 
 * Body:
 * - exercises: Array<{ exerciseName: string, sets: Array<{weight?: number, reps: number}> }>
 * - duration: number
 * 
 * Response:
 * - report: string (Markdown格式)
 */
router.post('/workout-report', aiController.generateWorkoutReport);

/**
 * POST /api/ai/calculate-calories
 * 计算卡路里消耗
 * 
 * Body:
 * - durationMinutes: number
 * - bodyWeight: number
 * - exercises: Array<{ name: string, sets: number, reps: number, weight: number, muscleGroup: string }>
 * 
 * Response:
 * - calories: number
 */
router.post('/calculate-calories', aiController.calculateCalories);

/**
 * ============================================
 * AI Provider Config Routes (多配置管理)
 * ============================================
 */

/**
 * GET /api/ai/configs
 * 获取用户的所有 AI 配置
 */
router.get('/configs', aiConfigController.getAIConfigs);

/**
 * POST /api/ai/configs
 * 创建新的 AI 配置
 * 
 * Body:
 * - name: string (配置名称，如 "Moonshot CN")
 * - provider: string (perplexity, kimi, openai, anthropic, custom)
 * - baseUrl?: string (可选，自定义 Base URL)
 * - apiKey: string
 * - modelId: string
 * - temperature?: number (默认 0.2)
 * - isDefault?: boolean (是否设为默认)
 */
router.post('/configs', aiConfigController.createAIConfig);

/**
 * PUT /api/ai/configs/:id
 * 更新 AI 配置
 */
router.put('/configs/:id', aiConfigController.updateAIConfig);

/**
 * DELETE /api/ai/configs/:id
 * 删除 AI 配置
 */
router.delete('/configs/:id', aiConfigController.deleteAIConfig);

/**
 * POST /api/ai/configs/:id/default
 * 设置默认配置
 */
router.post('/configs/:id/default', aiConfigController.setDefaultConfig);

/**
 * GET /api/ai/configs/:configId/balance
 * 获取 Moonshot 余额
 */
router.get('/configs/:configId/balance', aiConfigController.getMoonshotBalance);

/**
 * POST /api/ai/configs/fetch-models
 * 后端代理拉取可用模型列表（解决浏览器 CORS 直连失败）。
 * Body: { baseUrl?: string, apiKey: string, provider?: string }
 */
router.post('/configs/fetch-models', aiConfigController.fetchModelsProxy);

/**
 * POST /api/ai/generate
 * 通用 AI 生成接口 - 后端代理
 * Body: { messages: Array<{role: string, content: string}>, temperature?: number }
 * Response: { success: true, content: string, model: string, provider: string }
 */
router.post('/generate', aiConfigController.generateAIResponse);

export default router;