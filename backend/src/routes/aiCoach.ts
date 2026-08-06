/**
 * AI Coach Routes
 * 
 * AI教练对话和客制化训练计划相关API
 * 所有路由都需要认证
 */

import { Router } from 'express';
import * as aiCoachController from '../controllers/aiCoachController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// 所有AI Coach路由都需要认证
router.use(authMiddleware);

/**
 * ============================================
 * 对话管理
 * ============================================
 */

/**
 * GET /api/ai/coach/conversations
 * 获取用户的所有对话列表
 * 
 * Response:
 * - success: boolean
 * - data: Array<{
 *     id: string,
 *     title: string,
 *     context: object,
 *     lastMessageAt: Date,
 *     createdAt: Date,
 *     _count: { messages: number }
 *   }>
 */
router.get('/conversations', aiCoachController.getConversations);

/**
 * POST /api/ai/coach/conversations
 * 创建新对话
 * 
 * Body:
 * - title?: string (可选，默认"New Chat")
 * 
 * Response:
 * - success: boolean
 * - data: { id, title, context, isActive, createdAt, updatedAt }
 */
router.post('/conversations', aiCoachController.createConversation);

/**
 * GET /api/ai/coach/conversations/:id
 * 获取单个对话详情（包含消息和训练计划）
 * 
 * Response:
 * - success: boolean
 * - data: {
 *     id, title, context, messages[], routines[]
 *   }
 */
router.get('/conversations/:id', aiCoachController.getConversation);

/**
 * DELETE /api/ai/coach/conversations/:id
 * 删除对话（软删除）
 * 
 * Response:
 * - success: boolean
 * - message: string
 */
router.delete('/conversations/:id', aiCoachController.deleteConversation);

/**
 * PUT /api/ai/coach/conversations/:id/title
 * 更新对话标题
 * 
 * Body:
 * - title: string
 * 
 * Response:
 * - success: boolean
 * - data: { id, title, ... }
 */
router.put('/conversations/:id/title', aiCoachController.updateConversationTitle);

/**
 * POST /api/ai/coach/conversations/:id/model
 * 设置当前对话 preferred AI 配置
 *
 * Body:
 * - configId: string
 */
router.post('/conversations/:id/model', aiCoachController.setConversationModel);

/**
 * ============================================
 * 消息相关
 * ============================================
 */

/**
 * POST /api/ai/coach/conversations/:id/messages
 * 发送消息并获取AI回复
 * 
 * Body:
 * - content: string (用户消息内容)
 * - contextData?: {
 *     recentWorkouts?: Array,
 *     muscleRecovery?: Array,
 *     userProfile?: object
 *   }
 * 
 * Response:
 * - success: boolean
 * - data: {
 *     id, role, content, type, metadata, createdAt
 *   }
 */
router.post('/conversations/:id/messages', aiCoachController.sendMessage);

/**
 * POST /api/ai/coach/conversations/:id/messages/stream
 * 流式发送消息并获取AI回复（SSE，逐字输出）
 *
 * Response: text/event-stream
 * - data: {"delta":"部分文本"}  逐块内容
 * - data: {"done":true,...}     结束事件（含落库后的完整消息）
 */
router.post('/conversations/:id/messages/stream', aiCoachController.sendMessageStream);

/**
 * ============================================
 * 客制化训练计划
 * ============================================
 */

/**
 * POST /api/ai/coach/conversations/:id/routines
 * 生成客制化训练计划
 * 
 * Body:
 * - focusMuscles: string[] (目标肌肉群，如["Chest", "Triceps"])
 * - routineType: 'compound_focus' | 'isolation_focus' | 'balanced' | 'custom'
 * - difficulty?: 'beginner' | 'intermediate' | 'advanced' (默认intermediate)
 * - duration?: number (预计时长分钟，默认60)
 * - preferences?: string (额外偏好描述)
 * 
 * Response:
 * - success: boolean
 * - data: {
 *     id, name, description, focusMuscles, routineType,
 *     exercises[], estimatedDuration, difficulty, createdAt
 *   }
 */
router.post('/conversations/:id/routines', aiCoachController.generateRoutine);

/**
 * GET /api/ai/coach/routines
 * 获取用户的所有AI推荐训练计划
 * 
 * Query:
 * - includeUsed?: boolean (是否包含已使用的计划，默认false)
 * 
 * Response:
 * - success: boolean
 * - data: Array<AICoachRoutine>
 */
router.get('/routines', aiCoachController.getRoutines);

/**
 * POST /api/ai/coach/routines/:id/save
 * 保存训练计划（标记为已保存）
 * 
 * Response:
 * - success: boolean
 * - data: AICoachRoutine
 */
router.post('/routines/:id/save', aiCoachController.saveRoutine);

/**
 * POST /api/ai/coach/routines/:id/use
 * 标记训练计划为已使用
 * 
 * Response:
 * - success: boolean
 * - data: AICoachRoutine
 */
router.post('/routines/:id/use', aiCoachController.markRoutineAsUsed);

export default router;
