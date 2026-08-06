/**
 * AI Workout Recommendation Service
 *
 * 使用配置的 AI 模型生成智能训练推荐
 * 当 AI Coach 开启时调用后端 AI API
 * 关闭时回退到本地算法
 */

import type { Exercise, ActiveExercise, UserProfile, RecoveryStatus, WorkoutSession } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { aiConfigBackendService } from './AIConfigBackendService';
import { apiClient } from '@/services/apiClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AIRecommendationContext {
    userProfile: UserProfile;
    currentWorkout: ActiveExercise[];
    recoveryState: RecoveryStatus[];
    workoutHistory: WorkoutSession[];
    exerciseLibrary: Exercise[];
    targetMuscleGroup?: MuscleGroup;
}

export interface AIWorkoutRecommendation {
    exerciseName: string;
    sets: number;
    reps: string;
    weight: number;
    reason: string;
    tip: string;
    confidence: number;
}

export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface AIRecommendationResult {
    recommendations: AIWorkoutRecommendation[];
    usage: TokenUsage | null;
    model: string;
    provider: string;
}

/**
 * 估算 Token 数量（基于字符数）
 * 中文约 1.5 tokens/字，英文约 0.25 tokens/字符
 */
export const estimateTokens = (text: string): number => {
    // 粗略估算：每个字符平均 0.6 tokens（中英文混合）
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
};

/**
 * 从消息和响应估算 token 使用
 */
export const estimateTokenUsage = (
    messages: Array<{ role: string; content: string }>,
    responseContent: string
): TokenUsage => {
    const promptTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const completionTokens = estimateTokens(responseContent);
    
    return {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens
    };
};

/**
 * 调用后端 AI 生成推荐
 */
const callAIGenerate = async (messages: Array<{ role: string; content: string }>): Promise<{
    content: string;
    usage: TokenUsage | null;
    model: string;
    provider: string;
}> => {
    const token = apiClient.getToken();

    const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
            messages,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API failed: ${error}`);
    }

    const result = await response.json();
    return {
        content: result.content || result.data?.content || '',
        usage: result.usage || null,
        model: result.model || 'unknown',
        provider: result.provider || 'unknown'
    };
};

/**
 * 构建 AI 提示词
 */
const buildRecommendationPrompt = (context: AIRecommendationContext): string => {
    const { userProfile, currentWorkout, recoveryState, workoutHistory, exerciseLibrary, targetMuscleGroup } = context;

    // 获取最近训练记录
    const recentWorkouts = workoutHistory
        .slice(-5)
        .map(s => ({
            date: new Date(s.date).toLocaleDateString(),
            exercises: s.exercises.map(e => e.exerciseName).join(', '),
            volume: s.volumeLoad
        }));

    // 获取当前已选动作
    const currentExercises = currentWorkout.map(e => e.exerciseName).join(', ') || 'None';

    // 获取恢复状态
    const recoveryInfo = recoveryState
        .filter(r => r.recoveryPercentage < 100)
        .map(r => `${r.muscle}: ${r.recoveryPercentage.toFixed(0)}%`)
        .join(', ') || 'All muscles recovered';

    // 筛选候选动作
    const candidateExercises = exerciseLibrary
        .filter(e => {
            if (targetMuscleGroup && e.muscleGroup !== targetMuscleGroup) return false;
            if (currentWorkout.some(c => c.exerciseId === e.id)) return false;
            return true;
        })
        .slice(0, 20)
        .map(e => e.name)
        .join(', ');

    return `You are an expert fitness trainer AI. Recommend 3 exercises for the user's next workout.

User Profile:
- Weight: ${userProfile.weight}kg
- Experience: ${userProfile.experienceLevel || 'Intermediate'}
- Goal: ${userProfile.primaryGoal || 'General Fitness'}

Current Workout: ${currentExercises}

Recent Training History (${recentWorkouts.length} sessions):
${recentWorkouts.map(w => `- ${w.date}: ${w.exercises} (${w.volume}kg volume)`).join('\n')}

Muscle Recovery Status: ${recoveryInfo}

Available Exercises to Recommend From:
${candidateExercises}

Return ONLY a JSON array in this exact format:
[
  {
    "exerciseName": "Exercise Name",
    "sets": 3,
    "reps": "8-12",
    "weight": 60,
    "reason": "Brief reason based on user's history",
    "tip": "Specific training tip",
    "confidence": 0.85
  }
]

Rules:
1. Recommend exercises targeting undertrained muscles based on recovery data
2. Weight should be realistic for the user's level
3. Consider progressive overload if recent trend shows improvement
4. If a muscle is not recovered (<70%), avoid exercises targeting it
5. Provide personalized reasons based on their training history`;
};

/**
 * 解析 AI 响应
 */
const parseAIResponse = (content: string): AIWorkoutRecommendation[] => {
    try {
        // 提取 JSON 部分
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON array found in response');
        }

        const recommendations = JSON.parse(jsonMatch[0]);

        // 验证格式
        return recommendations.map((rec: any) => ({
            exerciseName: rec.exerciseName || rec.name || 'Unknown',
            sets: rec.sets || 3,
            reps: rec.reps || '8-12',
            weight: rec.weight || 0,
            reason: rec.reason || rec.explanation || 'Recommended based on your training data',
            tip: rec.tip || rec.advice || 'Focus on proper form',
            confidence: rec.confidence || 0.7
        }));
    } catch (error) {
        console.error('Failed to parse AI response:', error, content);
        throw new Error('Invalid AI response format');
    }
};

/**
 * 计算 Token 价格
 */
export const calculateTokenCost = (
    usage: TokenUsage,
    provider: string,
    model: string
): { inputCost: number; outputCost: number; totalCost: number; currency: string } => {
    // Prices per 1K tokens (in USD or CNY)
    const prices: Record<string, { input: number; output: number; currency: string }> = {
        // Kimi (Moonshot) - in CNY
        'kimi-k2': { input: 0.006, output: 0.006, currency: 'CNY' },
        'kimi-k2.5': { input: 0.006, output: 0.006, currency: 'CNY' },
        'kimi-k2-0711-preview': { input: 0.006, output: 0.006, currency: 'CNY' },
        'kimi-k2-turbo-preview': { input: 0.006, output: 0.006, currency: 'CNY' },
        'kimi-k2-thinking': { input: 0.006, output: 0.006, currency: 'CNY' },
        'kimi-k1.5': { input: 0.006, output: 0.006, currency: 'CNY' },
        'moonshot-v1': { input: 0.006, output: 0.006, currency: 'CNY' },
        
        // OpenAI - in USD
        'gpt-4o': { input: 0.0025, output: 0.01, currency: 'USD' },
        'gpt-4o-mini': { input: 0.00015, output: 0.0006, currency: 'USD' },
        'gpt-4': { input: 0.03, output: 0.06, currency: 'USD' },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015, currency: 'USD' },
        
        // Perplexity - in USD
        'sonar': { input: 0.001, output: 0.001, currency: 'USD' },
        'sonar-pro': { input: 0.003, output: 0.015, currency: 'USD' },
        
        // Anthropic - in USD
        'claude-3-5-sonnet': { input: 0.003, output: 0.015, currency: 'USD' },
        'claude-3-opus': { input: 0.015, output: 0.075, currency: 'USD' },
        'claude-3-haiku': { input: 0.00025, output: 0.00125, currency: 'USD' },
    };
    
    // Find matching price
    let price = prices[model.toLowerCase()];
    if (!price) {
        // Try partial match
        const modelKey = Object.keys(prices).find(k => model.toLowerCase().includes(k));
        price = modelKey ? prices[modelKey] : { input: 0.002, output: 0.002, currency: 'USD' }; // Default
    }
    
    const inputCost = (usage.prompt_tokens / 1000) * price.input;
    const outputCost = (usage.completion_tokens / 1000) * price.output;
    
    return {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        currency: price.currency
    };
};

/**
 * 生成 AI 驱动的训练推荐
 */
export const generateAIWorkoutRecommendations = async (
    context: AIRecommendationContext
): Promise<AIRecommendationResult> => {
    console.log('🤖 [AI Service] Generating AI workout recommendations...');

    const prompt = buildRecommendationPrompt(context);

    const messages = [
        {
            role: 'system',
            content: 'You are a professional fitness trainer AI. Provide personalized workout recommendations based on user data. Always respond with valid JSON.'
        },
        {
            role: 'user',
            content: prompt
        }
    ];

    const { content, usage: apiUsage, model, provider } = await callAIGenerate(messages);
    const recommendations = parseAIResponse(content);

    // 如果 API 没有返回 usage，使用估算值
    const usage = apiUsage || estimateTokenUsage(messages, content);
    
    console.log('✅ [AI Service] Generated', recommendations.length, 'recommendations');
    console.log('📊 [AI Service] Token usage:', usage, '(API returned:', apiUsage ? 'yes' : 'no, estimated', ')');
    
    return {
        recommendations,
        usage,
        model,
        provider
    };
};

/**
 * 检查 AI Coach 是否可用
 */
export const isAICoachAvailable = async (): Promise<boolean> => {
    try {
        // Check if AI Coach is enabled (iOS-safe)
        let enabled = true;
        try {
            enabled = localStorage.getItem('zenfit_ai_enabled') !== 'false';
        } catch {
            enabled = true; // iOS 隐私模式下默认启用
        }
        if (!enabled) return false;

        // Check if has default config
        const defaultConfig = await aiConfigBackendService.getDefaultConfig();
        return !!defaultConfig;
    } catch {
        return false;
    }
};
