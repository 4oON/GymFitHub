import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';
import fetch, { Response as FetchResponse } from 'node-fetch';

const prisma = new PrismaClient();

/**
 * 获取用户的所有 AI 配置
 */
export const getAIConfigs = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const configs = await prisma.aIProviderConfig.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        // 隐藏完整的 API Key，只显示前 10 位
        const sanitizedConfigs = configs.map(config => ({
            ...config,
            apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : ''
        }));

        return res.json({ configs: sanitizedConfigs });
    } catch (error) {
        console.error('Get AI configs error:', error);
        return res.status(500).json({ error: 'Failed to get AI configs' });
    }
};

/**
 * 创建新的 AI 配置
 */
export const createAIConfig = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, provider, baseUrl, apiKey, modelId, temperature, isDefault } = req.body;

        if (!name || !provider || !apiKey || !modelId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 如果设置为默认，先将其他配置设为非默认
        if (isDefault) {
            await prisma.aIProviderConfig.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
        }

        // 检查是否是该用户的第一个配置，如果是则设为默认
        const existingCount = await prisma.aIProviderConfig.count({
            where: { userId }
        });
        const shouldBeDefault = isDefault || existingCount === 0;

        const config = await prisma.aIProviderConfig.create({
            data: {
                userId,
                name,
                provider,
                baseUrl,
                apiKey,
                modelId,
                temperature: temperature || 0.2,
                isDefault: shouldBeDefault
            }
        });

        return res.status(201).json({
            config: {
                ...config,
                apiKey: `${config.apiKey.substring(0, 10)}...`
            }
        });
    } catch (error) {
        console.error('Create AI config error:', error);
        return res.status(500).json({ error: 'Failed to create AI config' });
    }
};

/**
 * 更新 AI 配置
 */
export const updateAIConfig = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { name, provider, baseUrl, apiKey, modelId, temperature, isDefault } = req.body;

        // 验证配置属于当前用户
        const existingConfig = await prisma.aIProviderConfig.findFirst({
            where: { id, userId }
        });

        if (!existingConfig) {
            return res.status(404).json({ error: 'Config not found' });
        }

        // 如果设置为默认，先将其他配置设为非默认
        if (isDefault) {
            await prisma.aIProviderConfig.updateMany({
                where: { userId, NOT: { id } },
                data: { isDefault: false }
            });
        }

        const updateData: any = {
            name,
            provider,
            baseUrl,
            modelId,
            temperature,
            isDefault
        };

        // 只有提供了新的 API Key 才更新
        if (apiKey && !apiKey.includes('...')) {
            updateData.apiKey = apiKey;
        }

        const config = await prisma.aIProviderConfig.update({
            where: { id },
            data: updateData
        });

        return res.json({
            config: {
                ...config,
                apiKey: `${config.apiKey.substring(0, 10)}...`
            }
        });
    } catch (error) {
        console.error('Update AI config error:', error);
        return res.status(500).json({ error: 'Failed to update AI config' });
    }
};

/**
 * 删除 AI 配置
 */
export const deleteAIConfig = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // 验证配置属于当前用户
        const existingConfig = await prisma.aIProviderConfig.findFirst({
            where: { id, userId }
        });

        if (!existingConfig) {
            return res.status(404).json({ error: 'Config not found' });
        }

        await prisma.aIProviderConfig.delete({
            where: { id }
        });

        return res.json({ message: 'Config deleted successfully' });
    } catch (error) {
        console.error('Delete AI config error:', error);
        return res.status(500).json({ error: 'Failed to delete AI config' });
    }
};

/**
 * 设置默认配置
 */
export const setDefaultConfig = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // 验证配置属于当前用户
        const existingConfig = await prisma.aIProviderConfig.findFirst({
            where: { id, userId }
        });

        if (!existingConfig) {
            return res.status(404).json({ error: 'Config not found' });
        }

        // 先将所有配置设为非默认
        await prisma.aIProviderConfig.updateMany({
            where: { userId },
            data: { isDefault: false }
        });

        // 设置指定配置为默认
        const config = await prisma.aIProviderConfig.update({
            where: { id },
            data: { isDefault: true }
        });

        return res.json({
            config: {
                ...config,
                apiKey: `${config.apiKey.substring(0, 10)}...`
            }
        });
    } catch (error) {
        console.error('Set default config error:', error);
        return res.status(500).json({ error: 'Failed to set default config' });
    }
};

/**
 * 获取 Moonshot 余额
 */
export const getMoonshotBalance = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { configId } = req.params;

        // 获取配置
        const config = await prisma.aIProviderConfig.findFirst({
            where: { id: configId, userId }
        });

        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }

        // 支持 Moonshot/Kimi、DeepSeek 以及指向这些服务的 custom 配置
        const provider = config.provider;
        const baseUrlRaw = (config.baseUrl || '').replace(/\/$/, '').replace('/chat/completions', '');
        const isDeepSeek =
            provider === 'deepseek' ||
            baseUrlRaw.includes('deepseek.com');
        const isKimiLike =
            provider === 'kimi' ||
            provider === 'custom' ||
            baseUrlRaw.includes('moonshot.cn');

        if (!isDeepSeek && !isKimiLike) {
            return res.status(400).json({ error: 'Balance check only supported for Moonshot/Kimi/DeepSeek providers' });
        }

        // 构建余额查询 URL
        // - Moonshot/Kimi: {base}/users/me/balance
        // - DeepSeek:      https://api.deepseek.com/user/balance
        let balanceUrl: string;
        if (isDeepSeek) {
            const root = baseUrlRaw && baseUrlRaw.includes('deepseek.com')
                ? baseUrlRaw.replace(/\/v1$/, '')
                : 'https://api.deepseek.com';
            balanceUrl = `${root}/user/balance`;
        } else {
            const baseUrl = config.baseUrl || 'https://api.moonshot.cn/v1';
            balanceUrl = baseUrl.replace(/\/$/, '').replace('/chat/completions', '') + '/users/me/balance';
        }

        const response = await fetch(balanceUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Moonshot balance API error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: 'Failed to fetch balance',
                details: errorText
            });
        }

        const balanceData = await response.json() as any;
        console.log('[Balance] Raw response:', JSON.stringify(balanceData));

        // 归一化不同 provider 的余额结构
        let balanceInfo: any;
        if (isDeepSeek) {
            // DeepSeek: { is_available, balance_infos: [{ currency, total_balance, granted_balance, topped_up_balance }] }
            const infos = Array.isArray(balanceData.balance_infos) ? balanceData.balance_infos : [];
            const cny = infos.find((b: any) => (b.currency || '').toUpperCase() === 'CNY') || infos[0] || {};
            balanceInfo = {
                currency: cny.currency || 'CNY',
                total_balance: cny.total_balance ?? '0',
                available_balance: cny.total_balance ?? '0',
                granted_balance: cny.granted_balance,
                topped_up_balance: cny.topped_up_balance,
                is_available: balanceData.is_available,
            };
        } else {
            // Moonshot 可能返回 { data: {...} } 或直接 {...}
            balanceInfo = balanceData.data || balanceData;
        }
        console.log('[Balance] Extracted:', JSON.stringify(balanceInfo));

        // 更新数据库中的余额信息
        try {
            await prisma.aIProviderConfig.update({
                where: { id: configId },
                data: {
                    balanceInfo: balanceInfo,
                    lastBalanceCheck: new Date()
                }
            });
            console.log('[Balance] Saved to DB');
        } catch (dbError) {
            console.error('[Balance] DB update error:', dbError);
            // 继续返回余额，不中断
        }

        return res.json({
            balance: balanceInfo,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get Moonshot balance error:', error);
        return res.status(500).json({ error: 'Failed to get balance' });
    }
};

/**
 * POST /api/ai/configs/fetch-models
 * 后端代理拉取可用模型列表（解决浏览器 CORS 直连失败问题）。
 * Body: { baseUrl?: string, apiKey: string, provider?: string }
 * 新建/编辑配置时还没有 configId，因此通过 body 传 baseUrl+apiKey。
 */
export const fetchModelsProxy = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { baseUrl: rawBaseUrl, apiKey, provider } = req.body || {};
        if (!apiKey || typeof apiKey !== 'string') {
            return res.status(400).json({ error: 'apiKey is required' });
        }

        // 解析 base URL；deepseek 有默认值
        let baseUrl = (rawBaseUrl || '').trim().replace(/\/$/, '').replace('/chat/completions', '');
        if (!baseUrl) {
            if (provider === 'deepseek') {
                baseUrl = 'https://api.deepseek.com';
            } else {
                return res.status(400).json({ error: 'baseUrl is required for this provider' });
            }
        }
        const modelsUrl = `${baseUrl}/models`;

        const response = await fetch(modelsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Models proxy API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to fetch models',
                details: errorText
            });
        }

        const data = await response.json() as any;
        let models: Array<{ id: string; name: string }> = [];
        if (Array.isArray(data?.data)) {
            models = data.data.map((m: any) => ({ id: m.id, name: m.name || m.id }));
        } else if (Array.isArray(data)) {
            models = data.map((m: any) => ({ id: m.id, name: m.name || m.id }));
        }

        return res.json({ models });
    } catch (error) {
        console.error('Fetch models proxy error:', error);
        return res.status(500).json({ error: 'Failed to fetch models' });
    }
};

/**
 * 获取当前用户的默认 AI 配置（包含完整 API Key，用于后端调用）
 */
export const getDefaultConfigInternal = async (userId: string) => {
    try {
        const config = await prisma.aIProviderConfig.findFirst({
            where: { userId, isDefault: true }
        });

        if (!config) {
            // 如果没有默认配置，返回第一个配置
            const firstConfig = await prisma.aIProviderConfig.findFirst({
                where: { userId }
            });
            return firstConfig;
        }

        return config;
    } catch (error) {
        console.error('Get default config error:', error);
        return null;
    }
};

/**
 * 检查模型是否需要固定 temperature=1
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
 * 构建请求头
 */
const buildHeaders = (apiKey: string, provider: string): Record<string, string> => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };
    
    // Anthropic uses a different header format
    if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        delete headers['Authorization'];
    }
    
    return headers;
};

/**
 * 构建请求体
 */
const buildRequestBody = (
    messages: Array<{role: string; content: string}>,
    model: string, 
    temperature: number, 
    provider: string
) => {
    // Adjust temperature for models that require it to be 1
    const adjustedTemp = requiresFixedTemperature(model) ? 1 : temperature;
    if (requiresFixedTemperature(model) && temperature !== 1) {
        console.log(`[AI Proxy] Model ${model} requires temperature=1, adjusted from ${temperature}`);
    }
    
    switch (provider) {
        case 'anthropic':
            return {
                model,
                temperature: adjustedTemp,
                max_tokens: 4096,
                messages: messages.map(m => ({ role: m.role, content: m.content }))
            };
        case 'kimi':
        case 'openai':
        case 'perplexity':
        case 'custom':
        default:
            // All these providers use OpenAI-compatible format
            // max_tokens: 2048 is enough for ~6-8 exercise recommendations
            return {
                model,
                temperature: adjustedTemp,
                max_tokens: 2048,
                messages
            };
    }
};

/**
 * 解析响应
 */
const parseResponse = async (response: FetchResponse, provider: string): Promise<{content: string; usage?: any}> => {
    const data = await response.json() as any;
    
    console.log('[AI Proxy] Raw response keys:', Object.keys(data));
    console.log('[AI Proxy] Usage data:', data.usage);
    
    const usage = data.usage;
    
    switch (provider) {
        case 'anthropic':
            return { 
                content: data.content?.[0]?.text || '',
                usage
            };
        case 'kimi':
        case 'openai':
        case 'perplexity':
        case 'custom':
        default:
            // OpenAI-compatible format
            return { 
                content: data.choices?.[0]?.message?.content || '',
                usage
            };
    }
};

/**
 * POST /api/ai/generate
 * 通用 AI 生成接口 - 后端代理调用
 * 前端 -> 后端 -> AI API
 */
export const generateAIResponse = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { messages, temperature = 0.7 } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // 获取用户的默认 AI 配置
        const config = await getDefaultConfigInternal(userId);
        
        if (!config) {
            return res.status(400).json({ 
                error: 'No AI configuration found',
                message: 'Please configure an AI provider in your profile settings'
            });
        }

        console.log('[AI Proxy] Using config:', {
            name: config.name,
            provider: config.provider,
            model: config.modelId,
            baseUrl: config.baseUrl,
            apiKeyPresent: !!config.apiKey,
            apiKeyLength: config.apiKey?.length || 0
        });

        // 构建 API URL
        let apiUrl = config.baseUrl || '';
        // DeepSeek provider defaults to its official endpoint when no baseUrl is set.
        if (!apiUrl && config.provider === 'deepseek') {
            apiUrl = 'https://api.deepseek.com';
        }
        if (apiUrl && !apiUrl.endsWith('/chat/completions')) {
            apiUrl = apiUrl.replace(/\/$/, '') + '/chat/completions';
        }

        if (!apiUrl) {
            return res.status(400).json({ error: 'API URL not configured' });
        }

        // 构建请求
        const headers = buildHeaders(config.apiKey, config.provider);
        const requestBody = buildRequestBody(
            messages,
            config.modelId,
            temperature,
            config.provider
        );

        console.log('[AI Proxy] Calling AI API:', {
            url: apiUrl,
            provider: config.provider,
            model: config.modelId
        });

        // 调用 AI API（带 55 秒超时，给 Kimi 足够时间响应）
        // 带 429 限流重试
        let retries = 0;
        const maxRetries = 2;
        let lastError: any = null;
        
        while (retries <= maxRetries) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 55000);
            
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                // 处理 429 限流 - 指数退避重试
                if (response.status === 429) {
                    const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
                    console.log(`[AI Proxy] Rate limited (429), retrying in ${delay}ms... (attempt ${retries + 1}/${maxRetries + 1})`);
                    if (retries < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        retries++;
                        continue;
                    }
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('[AI Proxy] API Error:', response.status, errorText);
                    return res.status(response.status).json({
                        error: 'AI API Error',
                        status: response.status,
                        details: errorText
                    });
                }
                
                // 解析响应
                const { content, usage } = await parseResponse(response, config.provider);
                
                if (!content) {
                    return res.status(500).json({ error: 'Empty response from AI API' });
                }
                
                console.log('[AI Proxy] Success, content length:', content.length, 'usage:', usage);
                
                return res.json({
                    success: true,
                    content,
                    model: config.modelId,
                    provider: config.provider,
                    usage
                });
                
            } catch (fetchError: any) {
                clearTimeout(timeoutId);
                lastError = fetchError;
                
                if (fetchError.name === 'AbortError') {
                    console.error('[AI Proxy] Request timeout after 55 seconds');
                    return res.status(504).json({
                        error: 'AI API timeout',
                        message: 'The AI service took too long to respond. Please try again or use a faster model.'
                    });
                }
                
                throw fetchError;
            }
        }
        
        // 如果重试都失败了
        if (lastError) {
            throw lastError;
        }

        throw new Error('Unexpected error in AI proxy');

    } catch (error) {
        console.error('[AI Proxy] Error:', error);
        return res.status(500).json({
            error: 'Failed to generate AI response',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
