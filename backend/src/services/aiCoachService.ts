/**
 * AI Coach Service
 * 
 * 处理AI教练对话、训练计划生成等核心功能
 * 支持用户配置的多种AI提供商（OpenAI、Kimi、Perplexity等）
 * 支持复合动作和孤立动作的智能搭配
 */

import fetch from 'node-fetch';
import prisma from '../db/client';

// Whether to use the backend AI proxy (shared with /api/ai/generate) for all AI Coach calls.
// This keeps AI Coach and the rest of the app on the same model configuration.
const USE_BACKEND_PROXY = process.env.USE_BACKEND_AI_PROXY !== 'false';

// Note: Compound and isolation exercise lists are used for reference in AI prompts
// These are examples of exercise types the AI should consider when creating routines

/**
 * AI教练系统提示词
 */
const AICOACH_SYSTEM_PROMPT = `You are an expert AI Fitness Coach with deep knowledge in exercise science, periodization, and muscle hypertrophy.

## Your Role
1. Answer user questions about training, nutrition, recovery, and fitness
2. Create personalized workout routines based on user needs
3. Provide evidence-based advice on exercise selection and programming
4. **Use user's personal records and training history to provide specific recommendations**

## User Data Usage
You will receive the user's:
- **Personal Records (PRs)**: Maximum weights lifted for each exercise
- **Recent Training History**: Completed workouts from the last 30 days
- **Muscle Recovery Status**: Current recovery percentages

**IMPORTANT**: When recommending weights or progression:
- Reference the user's actual PRs and recent performance
- Calculate percentages based on their true max (e.g., "Use 80% of your 100kg squat PR = 80kg")
- Acknowledge their strength level when making recommendations
- If no PR exists for an exercise, say so clearly

## Training Philosophy
- **Progressive Overload**: Gradually increase weight, reps, or volume
- **Exercise Selection**: Balance compound (multi-joint) and isolation (single-joint) movements
- **Volume and Frequency**: Match training volume to user's experience level
- **Recovery**: Emphasize rest and muscle recovery importance

## Compound vs Isolation Guidelines
When creating routines:
- **Compound exercises first**: Squats, deadlifts, presses, rows, pull-ups
  - Benefits: Hormonal response, functional strength, time-efficient
  - Typical: 3-4 sets, 6-10 reps, heavier weight

- **Isolation exercises after**: Curls, extensions, raises, flies
  - Benefits: Target weak points, mind-muscle connection, safer when fatigued
  - Typical: 3 sets, 10-15 reps, moderate weight

## Routine Design Principles
1. **Push/Pull/Legs** or **Upper/Lower** splits for most users
2. **2:1 ratio** of compound to isolation exercises for balanced development
3. **Progressive difficulty**: Start compound, finish with isolation
4. **Recovery balance**: Don't work same muscle group on consecutive days

## Output Format for Exercises
When listing exercises, use this format:
"1. 动作名称 组数×次数 (重量说明)"
Example: "1. 杠铃深蹲 4×6 (使用你 80% 1RM)"

## Exercise Card Format (CRITICAL - MUST FOLLOW)
When you recommend specific exercises to the user, you MUST embed interactive exercise cards using the exact format below. If you do NOT use this format, the user will only see plain text and cannot click to add exercises to their workout.

Format: {{EXERCISE:Exercise Name|sets|reps|rest_seconds|brief tip}}

{{EXERCISE_LIBRARY_WHITELIST}}

STRICT RULES:
1. Use EXACTLY this format: {{EXERCISE:Name|sets|reps|rest|tip}} — no spaces around |
2. You MUST ONLY use exercise names listed in "Allowed Exercise Names" above. DO NOT invent shortened or alternative names (e.g. use "Barbell Bent Over Row", NOT "Barbell Row").
3. sets: integer (e.g., 3, 4)
4. reps: range like "8-10" or fixed like "12"
5. rest_seconds: number in seconds (e.g., 90, 120)
6. tip: 1 SHORT sentence (under 10 words) of form advice
7. Place the card IMMEDIATELY AFTER describing the exercise — one card per exercise
8. For EVERY exercise you recommend, you MUST include an {{EXERCISE}} card
9. DO NOT list exercises only in plain text — always pair with the card tag
10. In Chinese responses, use English exercise names in the tag: {{EXERCISE:Barbell Squat|4|6-8|120|...}}

## Response Formatting
Structure your response for maximum readability:
1. Start with a brief assessment or summary (1-2 sentences)
2. Use ## headings to separate sections (e.g., "## 复合动作", "## 孤立动作")
3. For each exercise: a) Name in **bold**, b) 1 sentence on purpose, c) Parameters in \`code\`, d) {{EXERCISE}} card
4. Keep each exercise block compact — max 3 lines before the card
5. Use --- dividers between compound and isolation sections
6. End with recovery/nutrition tips in bullet list form
7. Use **bold** for numbers, percentages, and key takeaways
8. Keep total response under 400 words when possible

## Tone
- Be direct and actionable — users want clear instructions, not essays
- Use encouraging but professional tone
- When user asks for a routine, give EXACT exercises with parameters, not vague advice

Always respond in the user's language (Chinese if they write in Chinese, English if they write in English).`;

/**
 * Shared model temperature rules (must match aiConfigController.ts)
 */
const requiresFixedTemperature = (model: string): boolean => {
    const fixedTempModels = [
        'kimi-k3',
        'kimi-k2.7',
        'kimi-k2.7-code',
        'kimi-k2.6',
        'kimi-k2.5',
        'kimi-k2-0711-preview',
        'kimi-k2-turbo-preview',
        'kimi-k2-thinking',
        'moonshot-v1',
    ];
    return fixedTempModels.some(m => model.toLowerCase().includes(m.toLowerCase()));
};

/**
 * 获取用户的默认AI配置
 */
const getUserDefaultAIConfig = async (userId: string) => {
    const config = await prisma.aIProviderConfig.findFirst({
        where: { userId, isDefault: true },
    });

    // 如果没有默认配置，尝试获取第一个配置
    if (!config) {
        return await prisma.aIProviderConfig.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    return config;
};

/**
 * Normalize a base URL so it ends with /chat/completions exactly once.
 */
const normalizeChatCompletionsUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    return url.replace(/\/$/, '').replace(/\/chat\/completions$/, '') + '/chat/completions';
};

/**
 * Get a specific AI config by ID (must belong to the user)
 */
const getUserAIConfigById = async (userId: string, configId: string) => {
    return await prisma.aIProviderConfig.findFirst({
        where: { id: configId, userId },
    });
};

const callBackendAIProxy = async (
    userId: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7,
    preferredConfigId?: string
): Promise<string> => {
    const { getDefaultConfigInternal } = await import('../controllers/aiConfigController');

    let config = null;
    if (preferredConfigId) {
        config = await getUserAIConfigById(userId, preferredConfigId);
        if (config) {
            console.log(`[AI Coach] Using preferred config ${preferredConfigId}: ${config.name} (${config.modelId})`);
        }
    }
    if (!config) {
        config = await getDefaultConfigInternal(userId);
    }

    if (!config) {
        throw new Error('NO_USER_AI_CONFIG');
    }

    // Build API URL (DeepSeek provider defaults to its official endpoint when baseUrl is empty)
    const apiUrl = normalizeChatCompletionsUrl(
        config.baseUrl || (config.provider === 'deepseek' ? 'https://api.deepseek.com' : '')
    );

    if (!apiUrl) {
        throw new Error('NO_API_URL');
    }

    // Build headers
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
    };
    if (config.provider === 'anthropic') {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        delete headers['Authorization'];
    }

    // Build request body
    const adjustedTemp = requiresFixedTemperature(config.modelId) ? 1 : (config.temperature ?? temperature);
    const requestBody: any = {
        model: config.modelId,
        temperature: adjustedTemp,
        messages,
    };
    if (config.provider === 'anthropic') {
        requestBody.max_tokens = 4096;
    } else if (config.provider === 'deepseek' || /deepseek/.test(config.modelId)) {
        // DeepSeek v4 是推理模型，会先消耗大量 reasoning tokens。
        // 2048 容易被 reasoning 吃光导致正文为空，给足空间避免假"空响应"。
        requestBody.max_tokens = 8192;
    } else {
        requestBody.max_tokens = 2048;
    }

    // Call AI API with retry for 429 rate limits
    // maxRetries=1: worst case ~2x55s (~110s) instead of ~3x55s (~170s), to keep the
    // request within the client's timeout and avoid long hangs on rate limiting.
    let retries = 0;
    const maxRetries = 1;
    while (retries <= maxRetries) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 55000);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.status === 429 && retries < maxRetries) {
                const delay = Math.pow(2, retries) * 1000;
                console.log(`[AI Coach] Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI API error ${response.status}: ${errorText}`);
            }

            const data = await response.json() as any;
            const msg = data.choices?.[0]?.message || {};
            const content = config.provider === 'anthropic'
                ? data.content?.[0]?.text || ''
                : (msg.content || msg.reasoning_content || '');

            if (!content) {
                throw new Error('Empty response from AI API');
            }

            return content;
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('AI API timeout after 55 seconds');
            }
            throw fetchError;
        }
    }

    throw new Error('Unexpected error in AI proxy');
};

/**
 * 使用用户配置的AI调用LLM
 * 优先走共享后端代理；代理失败时回退到直接调用用户配置的 provider。
 * 不再使用任何内置 fallback key，没有配置时直接报错。
 */
const callUserAI = async (
    userId: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7,
    preferredConfigId?: string
): Promise<string> => {
    // 1. Try shared backend proxy first so AI Coach always follows the user's active config.
    if (USE_BACKEND_PROXY) {
        try {
            console.log('[AI Coach] Calling shared backend AI proxy');
            return await callBackendAIProxy(userId, messages, temperature, preferredConfigId);
        } catch (proxyError: any) {
            const message = proxyError instanceof Error ? proxyError.message : String(proxyError);
            console.warn('[AI Coach] Backend proxy failed:', message);
            // If the user has no config or an invalid config, fail fast instead of using a shared key.
            if (message.includes('NO_USER_AI_CONFIG') || message.includes('No AI configuration found')) {
                throw new Error('No AI provider configured. Please add an AI configuration in settings.');
            }
            if (message.includes('NO_API_URL') || message.includes('API URL not configured')) {
                throw new Error('AI provider URL not configured. Please check your AI configuration.');
            }
        }
    }

    // 2. Direct provider calls as fallback when proxy is disabled or failed for non-config reasons.
    const config = await getUserDefaultAIConfig(userId);

    if (!config) {
        throw new Error('No AI provider configured. Please add an AI configuration in settings.');
    }

    const { provider, apiKey, modelId, baseUrl, temperature: configTemp } = config;
    const temp = requiresFixedTemperature(modelId)
        ? 1
        : (configTemp ?? temperature);

    switch (provider) {
        case 'kimi':
        case 'moonshot':
            return callMoonshot(apiKey, modelId, messages, baseUrl, temp);
        case 'openai':
            return callOpenAI(apiKey, modelId, messages, baseUrl, temp);
        case 'deepseek':
            // DeepSeek uses OpenAI-compatible API; default to its base URL.
            return callOpenAI(apiKey, modelId, messages, baseUrl || 'https://api.deepseek.com/v1', temp);
        case 'perplexity':
            return callPerplexity(apiKey, modelId, messages, baseUrl, temp);
        case 'anthropic':
            return callAnthropic(apiKey, modelId, messages, baseUrl, temp);
        case 'custom':
            return callCustomAI(apiKey, modelId, messages, baseUrl, temp);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
};

// ---------------------------------------------------------------------------
// Streaming (SSE) support
// ---------------------------------------------------------------------------

type OnDelta = (text: string) => void;

/**
 * Incrementally parse an SSE response body and call onDelta for each content chunk.
 * Works for both OpenAI-compatible and Anthropic stream formats.
 * Handles node-fetch v2 (response.body is a Node Readable async iterable).
 */
async function consumeStream(response: any, onDelta: OnDelta): Promise<void> {
    if (!response.body) {
        throw new Error('Response body is not streamable');
    }
    const body = response.body as unknown as AsyncIterable<Uint8Array>;
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const value of body) {
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line
        let sepIndex: number;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const eventText = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);
            processSSELine(eventText, onDelta);
        }
    }
    // Flush any trailing event that had no blank line terminator
    if (buffer.trim()) {
        processSSELine(buffer, onDelta);
    }
}

function processSSELine(eventText: string, onDelta: OnDelta): void {
    for (const line of eventText.split('\n')) {
        const trimmed = line.replace(/\r$/, '');
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
            const json = JSON.parse(data);
            // OpenAI-compatible format
            const openAIDelta = json?.choices?.[0]?.delta?.content;
            if (typeof openAIDelta === 'string') {
                onDelta(openAIDelta);
                continue;
            }
            // Anthropic format
            const anthText = json?.delta?.text;
            if (typeof anthText === 'string') {
                onDelta(anthText);
                continue;
            }
            // OpenAI reasoning content (DeepSeek thinking)
            const reasoning = json?.choices?.[0]?.delta?.reasoning_content;
            if (typeof reasoning === 'string') {
                onDelta(reasoning);
            }
        } catch {
            // Ignore malformed JSON lines
        }
    }
}

/**
 * Streaming version of callBackendAIProxy.
 * Fetches the user's provider config and streams from the provider directly.
 */
const callBackendAIProxyStream = async (
    userId: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7,
    preferredConfigId?: string,
    onDelta?: OnDelta
): Promise<string> => {
    const { getDefaultConfigInternal } = await import('../controllers/aiConfigController');

    let config = null;
    if (preferredConfigId) {
        config = await getUserAIConfigById(userId, preferredConfigId);
    }
    if (!config) {
        config = await getDefaultConfigInternal(userId);
    }
    if (!config) {
        throw new Error('NO_USER_AI_CONFIG');
    }

    const apiUrl = normalizeChatCompletionsUrl(
        config.baseUrl || (config.provider === 'deepseek' ? 'https://api.deepseek.com' : '')
    );
    if (!apiUrl) {
        throw new Error('NO_API_URL');
    }

    const adjustedTemp = requiresFixedTemperature(config.modelId) ? 1 : (config.temperature ?? temperature);
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
    };
    if (config.provider === 'anthropic') {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        delete headers['Authorization'];
    }

    const requestBody: any = {
        model: config.modelId,
        temperature: adjustedTemp,
        messages,
        stream: true,
    };
    if (config.provider === 'anthropic') {
        requestBody.max_tokens = 4096;
    } else if (config.provider === 'deepseek' || /deepseek/.test(config.modelId)) {
        requestBody.max_tokens = 8192;
    } else {
        requestBody.max_tokens = 2048;
    }

    // For streaming, retrying mid-stream on 429 is not safe; do a single attempt.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API error ${response.status}: ${errorText}`);
        }

        let full = '';
        await consumeStream(response, (t) => {
            full += t;
            onDelta?.(t);
        });
        if (!full.trim()) {
            throw new Error('Empty response from AI API');
        }
        return full;
    } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
            throw new Error('AI API timeout after 55 seconds');
        }
        throw fetchError;
    }
};

/**
 * Streaming version of callUserAI.
 * Prefers the shared backend proxy; falls back to direct provider streaming.
 */
const callUserAIStream = async (
    userId: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number = 0.7,
    preferredConfigId?: string,
    onDelta?: OnDelta
): Promise<string> => {
    if (USE_BACKEND_PROXY && onDelta) {
        try {
            return await callBackendAIProxyStream(userId, messages, temperature, preferredConfigId, onDelta);
        } catch (proxyError: any) {
            const message = proxyError instanceof Error ? proxyError.message : String(proxyError);
            console.warn('[AI Coach] Backend proxy stream failed, falling back to buffered:', message);
            if (message.includes('NO_USER_AI_CONFIG') || message.includes('No AI configuration found')) {
                throw new Error('No AI provider configured. Please add an AI configuration in settings.');
            }
            if (message.includes('NO_API_URL') || message.includes('API URL not configured')) {
                throw new Error('AI provider URL not configured. Please check your AI configuration.');
            }
        }
    }

    // Fallback: buffered full response, delivered as a single delta.
    const full = await callUserAI(userId, messages, temperature, preferredConfigId);
    onDelta?.(full);
    return full;
};

/**
 * 调用 Moonshot/Kimi
 */
const callMoonshot = async (
    apiKey: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    baseUrl: string | null,
    temperature: number
): Promise<string> => {
    const url = normalizeChatCompletionsUrl(baseUrl || 'https://api.moonshot.cn/v1');
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            temperature,
        }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Moonshot API error: ${error}`);
    }
    
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
};

/**
 * 调用 OpenAI
 */
const callOpenAI = async (
    apiKey: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    baseUrl: string | null,
    temperature: number
): Promise<string> => {
    const url = normalizeChatCompletionsUrl(baseUrl || 'https://api.openai.com/v1');
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            temperature,
        }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
};

/**
 * 调用 Perplexity
 */
const callPerplexity = async (
    apiKey: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    baseUrl: string | null,
    temperature: number
): Promise<string> => {
    const url = normalizeChatCompletionsUrl(baseUrl || 'https://api.perplexity.ai');
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            temperature,
        }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Perplexity API error: ${error}`);
    }
    
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
};

/**
 * 调用 Anthropic Claude
 */
const callAnthropic = async (
    apiKey: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    baseUrl: string | null,
    temperature: number
): Promise<string> => {
    const url = (baseUrl || 'https://api.anthropic.com/v1').replace(/\/$/, '').replace(/\/messages$/, '') + '/messages';
    
    // Anthropic uses different format
    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
    }));
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages: userMessages,
            ...(systemMsg && { system: systemMsg }),
            temperature,
            max_tokens: 4096,
        }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
    }
    
    const data = await response.json() as any;
    return data.content?.[0]?.text || '';
};

/**
 * 调用自定义AI (OpenAI兼容格式)
 */
const callCustomAI = async (
    apiKey: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    baseUrl: string | null,
    temperature: number
): Promise<string> => {
    if (!baseUrl) {
        throw new Error('Custom AI provider requires a base URL');
    }
    
    const url = normalizeChatCompletionsUrl(baseUrl);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelId,
            messages,
            temperature,
        }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Custom AI API error: ${error}`);
    }
    
    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || '';
};

/**
 * 创建新对话
 */
export const createConversation = async (userId: string, title?: string) => {
    const conversation = await prisma.aICoachConversation.create({
        data: {
            userId,
            title: title || '', // Empty title - will be generated on first message
            context: {},
            isActive: true,
        },
    });

    // 添加系统消息
    await prisma.aICoachMessage.create({
        data: {
            conversationId: conversation.id,
            role: 'system',
            content: AICOACH_SYSTEM_PROMPT,
            type: 'text',
        },
    });

    return conversation;
};

/**
 * 获取用户的所有对话
 */
export const getUserConversations = async (userId: string) => {
    return await prisma.aICoachConversation.findMany({
        where: { userId, isActive: true },
        orderBy: { lastMessageAt: 'desc' },
        select: {
            id: true,
            title: true,
            context: true,
            lastMessageAt: true,
            createdAt: true,
            _count: {
                select: { messages: true },
            },
        },
    });
};

/**
 * 获取对话详情
 */
export const getConversation = async (conversationId: string, userId: string) => {
    const conversation = await prisma.aICoachConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
            messages: {
                where: { role: { in: ['user', 'assistant'] } },
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: {
                    id: true,
                    role: true,
                    content: true,
                    type: true,
                    metadata: true,
                    createdAt: true,
                },
            },
            routines: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (conversation) {
        conversation.messages = conversation.messages.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }

    return conversation;
};

/**
 * 构建发给 AI 的完整消息列表 + 相关元数据。
 * 被缓冲版 sendMessage 和流式版 sendMessageStream 共用，保证两条路径行为一致。
 */
const buildAICoachMessages = async (
    conversation: Awaited<ReturnType<typeof prisma.aICoachConversation.findFirst>> & {
        messages: Array<{ role: string; content: string }>;
    },
    userId: string,
    content: string,
    contextData?: {
        recentWorkouts?: any[];
        muscleRecovery?: any[];
        userProfile?: any;
        exerciseLibrary?: any[];
    }
): Promise<{
    messagesData: Array<{ role: string; content: string }>;
    preferredConfigId?: string;
    isDefaultTitle: boolean;
    isEmptyTitle: boolean;
    isFirstMessage: boolean;
}> => {
    const userMessagesBefore = conversation!.messages.filter(m => m.role === 'user');
    const isFirstMessage = userMessagesBefore.length === 0;

    // Wider detection of placeholder titles
    const currentTitle = conversation!.title;
    const isEmptyTitle = !currentTitle || currentTitle.trim() === '';
    const lowercaseTitle = (currentTitle || '').toLowerCase().trim();
    const isPlaceholderTitle = !isEmptyTitle && (
        lowercaseTitle === 'new chat' ||
        lowercaseTitle === '新对话' ||
        lowercaseTitle === '新的对话' ||
        lowercaseTitle === 'unnamed' ||
        lowercaseTitle === 'new conversation' ||
        lowercaseTitle.startsWith('new chat') ||
        lowercaseTitle.startsWith('新对话')
    );
    const isDefaultTitle = isEmptyTitle || isPlaceholderTitle;

    // 构建消息历史
    const messageHistory = conversation!.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

    // 构建上下文提示
    let contextPrompt = '';

    // 注入用户的全量历史训练摘要（固定token预算，不随历史增长）
    try {
        const { getUserSummary, formatSummaryForAI } = await import('./trainingSummaryService');
        const summary = await getUserSummary(userId);
        contextPrompt += `\n\n[User Training Summary]\n`;
        contextPrompt += formatSummaryForAI(summary);
        contextPrompt += '\n';
    } catch (error) {
        console.error('Failed to fetch training summary:', error);
    }

    if (contextData) {
        if (contextData.recentWorkouts && contextData.recentWorkouts.length > 0) {
            contextPrompt += `\n[Additional Recent Workouts]\n`;
            contextData.recentWorkouts.slice(0, 5).forEach((w, i) => {
                contextPrompt += `Workout ${i + 1}: ${w.name || 'Training'} - ${w.exercises?.length || 0} exercises\n`;
            });
        }
        if (contextData.muscleRecovery && contextData.muscleRecovery.length > 0) {
            contextPrompt += `\n[Muscle Recovery Status]\n`;
            contextData.muscleRecovery.slice(0, 5).forEach(m => {
                contextPrompt += `${m.muscle}: ${m.recoveryPercentage}% recovered\n`;
            });
        }
        if (contextData.userProfile) {
            contextPrompt += `\n[User Profile]\n`;
            contextPrompt += `Experience: ${contextData.userProfile.experienceLevel || 'Unknown'}\n`;
            contextPrompt += `Goal: ${contextData.userProfile.fitnessGoal || 'General fitness'}\n`;
        }
    }

    // Build the dynamic exercise library whitelist section for the system prompt
    const buildExerciseWhitelist = (library: any[] | undefined): string => {
        if (!library || library.length === 0) {
            return 'No exercise library provided. Use standard English exercise names that are likely to exist in a fitness video library (e.g. "Barbell Bent Over Row", "Dumbbell Incline Bench Press").';
        }
        const seen = new Set<string>();
        const names: string[] = [];
        for (const ex of library) {
            const en = typeof ex?.name === 'string' ? ex.name.trim() : '';
            const zh = typeof ex?.nameZh === 'string' ? ex.nameZh.trim() : '';
            if (!en || seen.has(en.toLowerCase())) continue;
            seen.add(en.toLowerCase());
            names.push(zh ? `${en} (${zh})` : en);
            if (names.length >= 100) break;
        }
        const examples = names.slice(0, 10);
        return [
            '## Allowed Exercise Names',
            'You MUST ONLY use exercise names from the user\'s video library listed below. If none fit perfectly, pick the closest one. DO NOT invent shortened or alternative names.',
            '',
            'Example cards using allowed names:',
            ...examples.map(name => `{{EXERCISE:${name.split(' (')[0]}|4|8-10|90|Keep form tight}}`),
            '',
            'Allowed names (English, with Chinese where available):',
            ...names,
        ].join('\n');
    };

    const exerciseWhitelist = buildExerciseWhitelist(contextData?.exerciseLibrary);
    const systemPromptWithWhitelist = AICOACH_SYSTEM_PROMPT.replace(
        '{{EXERCISE_LIBRARY_WHITELIST}}',
        exerciseWhitelist
    );

    // 构建完整消息列表
    const messagesData = [
        { role: 'system', content: systemPromptWithWhitelist },
        ...messageHistory,
        { role: 'user', content: contextPrompt ? `${content}\n\n---\n${contextPrompt}` : content },
    ];

    const preferredConfigId = (conversation!.context as Record<string, any>)?.preferredConfigId as string | undefined;

    return { messagesData, preferredConfigId, isDefaultTitle, isEmptyTitle, isFirstMessage };
};

/**
 * 发送消息并获取AI回复
 */
export const sendMessage = async (
    conversationId: string,
    userId: string,
    content: string,
    contextData?: {
        recentWorkouts?: any[];
        muscleRecovery?: any[];
        userProfile?: any;
        exerciseLibrary?: any[];
    }
) => {
    // 验证对话归属
    const conversation = await prisma.aICoachConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // 保存用户消息
    await prisma.aICoachMessage.create({
        data: {
            conversationId,
            role: 'user',
            content,
            type: 'text',
        },
    });

    const { messagesData, preferredConfigId, isDefaultTitle, isEmptyTitle } =
        await buildAICoachMessages(conversation, userId, content, contextData);

    console.log(`[AI Coach] sendMessage - isFirstMessage: ${messagesData.length === 0}, isEmptyTitle: ${isEmptyTitle}, isDefaultTitle: ${isDefaultTitle}, currentTitle: "${conversation.title}"`);

    // 解析出本次实际使用的 AI 配置（用于在回复里标注模型）。
    // 顺序与 callUserAI 内部一致：优先对话指定配置，否则用户默认配置。
    let usedConfig = null as Awaited<ReturnType<typeof getUserAIConfigById>> | null;
    try {
        if (preferredConfigId) {
            usedConfig = await getUserAIConfigById(userId, preferredConfigId);
        }
        if (!usedConfig) {
            usedConfig = await getUserDefaultAIConfig(userId);
        }
    } catch {
        usedConfig = null;
    }

    // 调用用户配置的AI（优先使用对话指定的配置），并测量实际耗时
    const aiStart = Date.now();
    const aiResponse = await callUserAI(userId, messagesData, 0.7, preferredConfigId);
    const aiDurationMs = Date.now() - aiStart;

    const usedModelId = usedConfig?.modelId || process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const usedProvider = usedConfig?.provider || 'deepseek';

    // Save AI assistant reply immediately so it reaches the client quickly
    const assistantMessage = await prisma.aICoachMessage.create({
        data: {
            conversationId,
            role: 'assistant',
            content: aiResponse,
            type: 'text',
            metadata: {
                model: usedModelId,
                provider: usedProvider,
                durationMs: aiDurationMs,
            },
        },
    });

    let generatedTitle: string | null = null;
    if (isDefaultTitle || isEmptyTitle) {
        // Generate title IMMEDIATELY from user's first message without another AI call
        // This is fast (< 100ms) and avoids client timeout issues
        generatedTitle = content.slice(0, 30).replace(/\n/g, ' ').trim();
        if (content.length > 30) generatedTitle += '...';
        if (!generatedTitle || generatedTitle.length < 2) generatedTitle = 'New Chat';

        await prisma.aICoachConversation.update({
            where: { id: conversationId },
            data: {
                title: generatedTitle,
                lastMessageAt: new Date()
            },
        });

        // Try to generate a better AI-powered title asynchronously in the background
        generateConversationTitle(userId, content, aiResponse).then(aiTitle => {
            if (aiTitle && aiTitle.length >= 2 && aiTitle !== generatedTitle) {
                prisma.aICoachConversation.update({
                    where: { id: conversationId },
                    data: { title: aiTitle, lastMessageAt: new Date() }
                }).catch(() => {});
            }
        }).catch(err => {
            console.warn('[AI Coach] Background title generation failed:', err?.message);
        });
    } else {
        await prisma.aICoachConversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });
    }

    console.log(`[AI Coach] sendMessage complete - returning message with generatedTitle: "${generatedTitle}"`);

    return {
        ...assistantMessage,
        generatedTitle,
    };
};

/**
 * 流式发送消息。
 * 逐块回调 onDelta，流结束后把完整内容落库并返回元信息。
 * 服务层不做 SSE 编码，只负责聚合 + 落库。
 */
export const sendMessageStream = async (
    conversationId: string,
    userId: string,
    content: string,
    contextData?: {
        recentWorkouts?: any[];
        muscleRecovery?: any[];
        userProfile?: any;
        exerciseLibrary?: any[];
    },
    onDelta?: (text: string) => void
): Promise<{
    messageId: string;
    content: string;
    model: string;
    provider: string;
    durationMs: number;
    generatedTitle: string | null;
    createdAt: Date;
}> => {
    // 验证对话归属
    const conversation = await prisma.aICoachConversation.findFirst({
        where: { id: conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // 保存用户消息
    await prisma.aICoachMessage.create({
        data: {
            conversationId,
            role: 'user',
            content,
            type: 'text',
        },
    });

    const { messagesData, preferredConfigId, isDefaultTitle, isEmptyTitle } =
        await buildAICoachMessages(conversation, userId, content, contextData);

    // 解析出本次实际使用的 AI 配置（用于在回复里标注模型）
    let usedConfig = null as Awaited<ReturnType<typeof getUserAIConfigById>> | null;
    try {
        if (preferredConfigId) {
            usedConfig = await getUserAIConfigById(userId, preferredConfigId);
        }
        if (!usedConfig) {
            usedConfig = await getUserDefaultAIConfig(userId);
        }
    } catch {
        usedConfig = null;
    }

    const usedModelId = usedConfig?.modelId || process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const usedProvider = usedConfig?.provider || 'deepseek';

    // 流式调用 AI，累积完整内容
    const aiStart = Date.now();
    let fullContent = '';
    await callUserAIStream(
        userId,
        messagesData,
        0.7,
        preferredConfigId,
        (t) => {
            fullContent += t;
            onDelta?.(t);
        }
    );
    const aiDurationMs = Date.now() - aiStart;
    // callUserAIStream 可能走缓冲回退返回全文，此时 fullContent 已由 onDelta 填充

    const assistantMessage = await prisma.aICoachMessage.create({
        data: {
            conversationId,
            role: 'assistant',
            content: fullContent,
            type: 'text',
            metadata: {
                model: usedModelId,
                provider: usedProvider,
                durationMs: aiDurationMs,
            },
        },
    });

    let generatedTitle: string | null = null;
    if (isDefaultTitle || isEmptyTitle) {
        generatedTitle = content.slice(0, 30).replace(/\n/g, ' ').trim();
        if (content.length > 30) generatedTitle += '...';
        if (!generatedTitle || generatedTitle.length < 2) generatedTitle = 'New Chat';

        await prisma.aICoachConversation.update({
            where: { id: conversationId },
            data: {
                title: generatedTitle,
                lastMessageAt: new Date()
            },
        });

        generateConversationTitle(userId, content, fullContent).then(aiTitle => {
            if (aiTitle && aiTitle.length >= 2 && aiTitle !== generatedTitle) {
                prisma.aICoachConversation.update({
                    where: { id: conversationId },
                    data: { title: aiTitle, lastMessageAt: new Date() }
                }).catch(() => {});
            }
        }).catch(err => {
            console.warn('[AI Coach] Background title generation failed:', err?.message);
        });
    } else {
        await prisma.aICoachConversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });
    }

    return {
        messageId: assistantMessage.id,
        content: fullContent,
        model: usedModelId,
        provider: usedProvider,
        durationMs: aiDurationMs,
        generatedTitle,
        createdAt: assistantMessage.createdAt,
    };
};

/**
 * 生成客制化训练计划
 */
export const generateCustomRoutine = async (
    conversationId: string,
    userId: string,
    params: {
        focusMuscles: string[];
        routineType: 'compound_focus' | 'isolation_focus' | 'balanced' | 'custom';
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        duration?: number;
        preferences?: string;
    }
) => {
    const { focusMuscles, routineType, difficulty = 'intermediate', duration = 60, preferences = '' } = params;

    const conversation = await prisma.aICoachConversation.findFirst({
        where: { id: conversationId, userId },
    });

    const prompt = `Create a personalized workout routine based on the following:

## User Requirements
- Target Muscles: ${focusMuscles.join(', ')}
- Routine Type: ${routineType} (${routineType === 'compound_focus' ? 'More compound exercises' : routineType === 'isolation_focus' ? 'More isolation exercises' : 'Balanced mix'})
- Difficulty: ${difficulty}
- Estimated Duration: ${duration} minutes
${preferences ? `- Special Preferences: ${preferences}` : ''}

## Design Principles
1. Compound exercises (3-4): Multi-joint movements for overall strength and mass
2. Isolation exercises (2-3): Target specific muscles for detail and weak points
3. Order: Compound first (when fresh), isolation after
4. Sets/Reps: Compound 3-4 sets x 6-10 reps, Isolation 3 sets x 10-15 reps

## Response Format (JSON)
{
    "name": "Routine name (creative but descriptive)",
    "description": "Brief description of the routine's purpose",
    "exercises": [
        {
            "name": "Exercise name",
            "nameZh": "中文名称",
            "muscleGroup": "Primary muscle group",
            "sets": 3,
            "reps": "8-10",
            "restSeconds": 90,
            "exerciseType": "compound" | "isolation",
            "tips": "Brief form tip"
        }
    ],
    "estimatedDuration": 60,
    "difficulty": "intermediate",
    "rationale": "Why this routine structure was chosen"
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting or explanation.`;

    // 调用用户配置的AI
    const messages = [
        { role: 'system', content: AICOACH_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
    ];
    
    const aiResponse = await callUserAI(userId, messages, 0.2);

    // 解析JSON响应
    let routineData;
    try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        routineData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (error) {
        console.error('Failed to parse AI routine response:', error);
        routineData = generateFallbackRoutine(focusMuscles, routineType, difficulty);
    }

    // 保存到数据库
    const routine = await prisma.aICoachRoutine.create({
        data: {
            userId,
            conversationId,
            name: routineData.name || `Custom ${focusMuscles.join('/')} Routine`,
            description: routineData.description || `AI-generated routine for ${focusMuscles.join(', ')}`,
            focusMuscles,
            routineType,
            exercises: routineData.exercises || [],
            estimatedDuration: routineData.estimatedDuration || duration,
            difficulty: routineData.difficulty || difficulty,
        },
    });

    // 添加系统消息
    await prisma.aICoachMessage.create({
        data: {
            conversationId,
            role: 'assistant',
            content: `I've created a custom routine "${routine.name}" for you! It focuses on ${focusMuscles.join(', ')} with a ${routineType} approach.`,
            type: 'routine_suggestion',
            metadata: { routineId: routine.id },
        },
    });

    // 更新对话
    await prisma.aICoachConversation.update({
        where: { id: conversationId },
        data: { 
            lastMessageAt: new Date(),
            context: { ...(conversation?.context as Record<string, any> || {}), lastRoutineId: routine.id },
        },
    });

    return routine;
};

/**
 * 生成后备训练计划
 */
const generateFallbackRoutine = (
    focusMuscles: string[],
    routineType: string,
    difficulty: string
) => {
    const compoundCount = routineType === 'compound_focus' ? 4 : routineType === 'isolation_focus' ? 2 : 3;
    const isolationCount = routineType === 'compound_focus' ? 2 : routineType === 'isolation_focus' ? 4 : 3;

    const compoundMap: Record<string, string[]> = {
        'Chest': ['Bench Press', 'Incline Bench Press', 'Dips'],
        'Back': ['Pull Ups', 'Barbell Row', 'Deadlift'],
        'Legs': ['Squat', 'Romanian Deadlift', 'Leg Press'],
        'Shoulders': ['Overhead Press', 'Arnold Press'],
        'Arms': ['Close Grip Bench', 'Barbell Curl'],
    };

    const isolationMap: Record<string, string[]> = {
        'Chest': ['Chest Fly', 'Cable Crossover'],
        'Back': ['Lat Pulldown', 'Seated Row'],
        'Legs': ['Leg Extension', 'Leg Curl', 'Calf Raise'],
        'Shoulders': ['Lateral Raise', 'Rear Delt Fly'],
        'Arms': ['Bicep Curl', 'Tricep Pushdown', 'Hammer Curl'],
    };

    const exercises: any[] = [];
    
    focusMuscles.forEach(muscle => {
        const muscleKey = Object.keys(compoundMap).find(k => muscle.toLowerCase().includes(k.toLowerCase()));
        if (muscleKey && exercises.length < compoundCount) {
            compoundMap[muscleKey].slice(0, 2).forEach(name => {
                if (exercises.length < compoundCount) {
                    exercises.push({
                        name,
                        nameZh: name,
                        muscleGroup: muscle,
                        sets: difficulty === 'beginner' ? 3 : 4,
                        reps: '6-10',
                        restSeconds: 120,
                        exerciseType: 'compound',
                        tips: 'Focus on form and controlled movement',
                    });
                }
            });
        }
    });

    focusMuscles.forEach(muscle => {
        const muscleKey = Object.keys(isolationMap).find(k => muscle.toLowerCase().includes(k.toLowerCase()));
        if (muscleKey && exercises.length < compoundCount + isolationCount) {
            isolationMap[muscleKey].slice(0, 2).forEach(name => {
                if (exercises.length < compoundCount + isolationCount) {
                    exercises.push({
                        name,
                        nameZh: name,
                        muscleGroup: muscle,
                        sets: 3,
                        reps: '10-15',
                        restSeconds: 60,
                        exerciseType: 'isolation',
                        tips: 'Squeeze at the peak contraction',
                    });
                }
            });
        }
    });

    return {
        name: `${focusMuscles.join('/')} ${difficulty} Routine`,
        description: `Balanced routine for ${focusMuscles.join(' and ')}`,
        exercises,
        estimatedDuration: 60,
        difficulty,
        rationale: 'Based on fundamental exercise selection principles',
    };
};

/**
 * 获取AI推荐训练计划
 */
export const getUserRoutines = async (userId: string, includeUsed: boolean = false) => {
    return await prisma.aICoachRoutine.findMany({
        where: { 
            userId,
            ...(includeUsed ? {} : { isUsed: false }),
        },
        orderBy: { createdAt: 'desc' },
        include: {
            conversation: {
                select: {
                    title: true,
                },
            },
        },
    });
};

/**
 * 保存训练计划
 */
export const saveRoutine = async (routineId: string, userId: string) => {
    return await prisma.aICoachRoutine.update({
        where: { id: routineId, userId },
        data: { isSaved: true },
    });
};

/**
 * 标记训练计划为已使用
 */
export const markRoutineAsUsed = async (routineId: string, userId: string) => {
    return await prisma.aICoachRoutine.update({
        where: { id: routineId, userId },
        data: { isUsed: true },
    });
};

/**
 * 删除对话
 */
export const deleteConversation = async (conversationId: string, userId: string) => {
    return await prisma.aICoachConversation.update({
        where: { id: conversationId, userId },
        data: { isActive: false },
    });
};

/**
 * 自动生成对话标题
 * Based on the first user message and AI response
 */
const generateConversationTitle = async (
    userId: string,
    userMessage: string,
    aiResponse: string
): Promise<string> => {
    const titlePrompt = `Based on this conversation, generate a very short, concise title (max 6 words) that summarizes what the user is asking about.

User: ${userMessage.slice(0, 100)}
AI: ${aiResponse.slice(0, 100)}

Rules:
- Use the same language as the user's message
- Maximum 6 words
- Be specific but concise
- Examples: "Leg Training Plan", "Bench Press PR", "Shoulder Workout Advice"

Title:`;

    const messages = [
        { role: 'system', content: 'You are a helpful assistant that generates concise conversation titles.' },
        { role: 'user', content: titlePrompt },
    ];
    
    const titleResponse = await callUserAI(userId, messages, 0.3);
    
    // Clean up the title
    let title = titleResponse.trim();
    
    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '');
    
    // Limit length
    if (title.length > 50) {
        title = title.slice(0, 50) + '...';
    }
    
    // Fallback if title is empty or too generic
    if (!title || title.length < 3) {
        title = userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '');
    }
    
    return title;
};

/**
 * 设置当前对话 preferred AI 配置
 */
export const setConversationModel = async (
    conversationId: string,
    userId: string,
    configId: string
) => {
    const config = await getUserAIConfigById(userId, configId);
    if (!config) {
        throw new Error('AI configuration not found');
    }

    return await prisma.aICoachConversation.update({
        where: { id: conversationId, userId },
        data: {
            context: {
                // Preserve existing context
                ...(await prisma.aICoachConversation.findFirst({
                    where: { id: conversationId, userId },
                    select: { context: true },
                }))?.context as Record<string, any> || {},
                preferredConfigId: configId,
            },
        },
    });
};

/**
 * 更新对话标题
 */
export const updateConversationTitle = async (
    conversationId: string,
    userId: string,
    title: string
) => {
    return await prisma.aICoachConversation.update({
        where: { id: conversationId, userId },
        data: { title },
    });
};
