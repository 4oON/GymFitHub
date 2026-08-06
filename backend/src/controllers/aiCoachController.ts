/**
 * AI Coach Controller
 * 
 * 处理AI教练对话相关的HTTP请求
 */

import { Request, Response } from 'express';
import * as aiCoachService from '../services/aiCoachService';

/**
 * 创建新对话
 * POST /api/ai/coach/conversations
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { title } = req.body;
        const conversation = await aiCoachService.createConversation(userId, title);

        res.status(201).json({
            success: true,
            data: conversation,
        });
    } catch (error: any) {
        console.error('Create conversation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create conversation',
        });
    }
};

/**
 * 获取用户的所有对话
 * GET /api/ai/coach/conversations
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const conversations = await aiCoachService.getUserConversations(userId);

        res.json({
            success: true,
            data: conversations,
        });
    } catch (error: any) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get conversations',
        });
    }
};

/**
 * 获取单个对话详情
 * GET /api/ai/coach/conversations/:id
 */
export const getConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const conversation = await aiCoachService.getConversation(id, userId);

        if (!conversation) {
            res.status(404).json({
                success: false,
                error: 'Conversation not found',
            });
            return;
        }

        res.json({
            success: true,
            data: conversation,
        });
    } catch (error: any) {
        console.error('Get conversation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get conversation',
        });
    }
};

/**
 * 发送消息
 * POST /api/ai/coach/conversations/:id/messages
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { content, contextData } = req.body;

        if (!content || typeof content !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Message content is required',
            });
            return;
        }

        const result = await aiCoachService.sendMessage(
            id,
            userId,
            content,
            contextData
        );

        res.json({
            success: true,
            data: result,
        });
        // Debug: verify generatedTitle is being returned from sendMessage
        console.log(`[Controller] sendMessage response - generatedTitle: "${(result as any).generatedTitle || 'undefined'}"`);
    } catch (error: any) {
        console.error('Send message error:', error);
        const message = error?.message || 'Failed to send message';
        const isConfigError = message.includes('No AI provider configured') ||
                              message.includes('AI provider URL not configured') ||
                              message.includes('No AI configuration found');
        res.status(isConfigError ? 400 : 500).json({
            success: false,
            error: message,
        });
    }
};

/**
 * 流式发送消息（SSE）
 * POST /api/ai/coach/conversations/:id/messages/stream
 *
 * Response (text/event-stream):
 *   data: {"delta":"部分文本"}
 *   ...
 *   data: {"done":true,"messageId":"...","content":"...","model":"...","provider":"...","generatedTitle":"..."}
 */
export const sendMessageStream = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.userId;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { id } = req.params;
    const { content, contextData } = req.body;

    if (!content || typeof content !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Message content is required',
        });
        return;
    }

    // 初始化 SSE 连接
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');

    const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    let aborted = false;
    // Use res.on('close') — fires on client disconnect.
    // req.on('close') fires too early (right after the POST body is read).
    res.on('close', () => {
        aborted = true;
    });

    try {
        const result = await aiCoachService.sendMessageStream(
            id,
            userId,
            content,
            contextData,
            (delta) => {
                if (aborted) return;
                sendEvent({ delta });
            }
        );

        if (aborted) return;
        sendEvent({
            done: true,
            messageId: result.messageId,
            content: result.content,
            model: result.model,
            provider: result.provider,
            durationMs: result.durationMs,
            generatedTitle: result.generatedTitle,
            createdAt: result.createdAt,
        });
        res.end();
    } catch (error: any) {
        console.error('Send message stream error:', error);
        if (aborted || res.writableEnded) return;
        const message = error?.message || 'Failed to send message';
        const isConfigError = message.includes('No AI provider configured') ||
                              message.includes('AI provider URL not configured') ||
                              message.includes('No AI configuration found');
        sendEvent({ error: message, configError: isConfigError });
        res.end();
    }
};

/**
 * 生成客制化训练计划
 * POST /api/ai/coach/conversations/:id/routines
 */
export const generateRoutine = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { focusMuscles, routineType, difficulty, duration, preferences } = req.body;

        if (!focusMuscles || !Array.isArray(focusMuscles) || focusMuscles.length === 0) {
            res.status(400).json({
                success: false,
                error: 'focusMuscles array is required',
            });
            return;
        }

        if (!routineType || !['compound_focus', 'isolation_focus', 'balanced', 'custom'].includes(routineType)) {
            res.status(400).json({
                success: false,
                error: 'Valid routineType is required',
            });
            return;
        }

        const routine = await aiCoachService.generateCustomRoutine(
            id,
            userId,
            {
                focusMuscles,
                routineType,
                difficulty: difficulty || 'intermediate',
                duration: duration || 60,
                preferences: preferences || '',
            }
        );

        res.json({
            success: true,
            data: routine,
        });
    } catch (error: any) {
        console.error('Generate routine error:', error);
        const message = error?.message || 'Failed to generate routine';
        const isConfigError = message.includes('No AI provider configured') ||
                              message.includes('AI provider URL not configured') ||
                              message.includes('No AI configuration found');
        res.status(isConfigError ? 400 : 500).json({
            success: false,
            error: message,
        });
    }
};

/**
 * 获取用户的AI推荐训练计划
 * GET /api/ai/coach/routines
 */
export const getRoutines = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { includeUsed } = req.query;
        const routines = await aiCoachService.getUserRoutines(
            userId,
            includeUsed === 'true'
        );

        res.json({
            success: true,
            data: routines,
        });
    } catch (error: any) {
        console.error('Get routines error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get routines',
        });
    }
};

/**
 * 保存训练计划
 * POST /api/ai/coach/routines/:id/save
 */
export const saveRoutine = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const routine = await aiCoachService.saveRoutine(id, userId);

        res.json({
            success: true,
            data: routine,
        });
    } catch (error: any) {
        console.error('Save routine error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save routine',
        });
    }
};

/**
 * 标记训练计划为已使用
 * POST /api/ai/coach/routines/:id/use
 */
export const markRoutineAsUsed = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const routine = await aiCoachService.markRoutineAsUsed(id, userId);

        res.json({
            success: true,
            data: routine,
        });
    } catch (error: any) {
        console.error('Mark routine as used error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to mark routine as used',
        });
    }
};

/**
 * 删除对话
 * DELETE /api/ai/coach/conversations/:id
 */
export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        await aiCoachService.deleteConversation(id, userId);

        res.json({
            success: true,
            message: 'Conversation deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete conversation',
        });
    }
};

/**
 * 设置当前对话 preferred AI 配置
 * POST /api/ai/coach/conversations/:id/model
 */
export const setConversationModel = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { configId } = req.body;

        if (!configId || typeof configId !== 'string') {
            res.status(400).json({
                success: false,
                error: 'configId is required',
            });
            return;
        }

        const conversation = await aiCoachService.setConversationModel(id, userId, configId);

        res.json({
            success: true,
            data: conversation,
        });
    } catch (error: any) {
        console.error('Set conversation model error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to set conversation model',
        });
    }
};

/**
 * 更新对话标题
 * PUT /api/ai/coach/conversations/:id/title
 */
export const updateConversationTitle = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const { title } = req.body;

        if (!title || typeof title !== 'string') {
            res.status(400).json({
                success: false,
                error: 'Title is required',
            });
            return;
        }

        const conversation = await aiCoachService.updateConversationTitle(id, userId, title);

        res.json({
            success: true,
            data: conversation,
        });
    } catch (error: any) {
        console.error('Update conversation title error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update conversation title',
        });
    }
};
