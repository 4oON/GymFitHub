import { iOSStorage } from '@/services/iOSStorageService';
// 确保 BASE_URL 包含 /api 前缀
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// 本地存储的 key
const LOCAL_STORAGE_KEY = 'zenfit_ai_configs';

// iOS 兼容：内存回退存储（当 localStorage 不可用时）
const memoryStorage: Record<string, string> = {};

// iOS 兼容：安全的 localStorage 包装（处理隐私模式不可用的情况）
const safeStorage = {
    getItem(key: string): string | null {
        try {
            return iOSStorage.getItem(key);
        } catch {
            // iOS 隐私模式或禁用 localStorage，使用内存回退
            return memoryStorage[key] || null;
        }
    },
    setItem(key: string, value: string): boolean {
        try {
            iOSStorage.setItem(key, value);
            return true;
        } catch {
            // iOS 隐私模式，保存到内存
            memoryStorage[key] = value;
            console.warn('[safeStorage] Using memory fallback for', key);
            return true;
        }
    },
    removeItem(key: string): boolean {
        try {
            iOSStorage.removeItem(key);
            return true;
        } catch {
            delete memoryStorage[key];
            return true;
        }
    }
};

export interface AIProviderConfig {
    id: string;
    userId: string;
    name: string;
    isDefault: boolean;
    provider: 'perplexity' | 'kimi' | 'openai' | 'anthropic' | 'deepseek' | 'custom';
    baseUrl: string | null;
    apiKey: string; // 后端返回的是脱敏后的，如 "sk-abc123..."
    modelId: string;
    temperature: number;
    cachedModels: Array<{ id: string; name: string }> | null;
    balanceInfo: {
        available_balance?: string;
        total_balance?: string;
        cash_balance?: string;
        voucher_balance?: string;
    } | null;
    lastBalanceCheck: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAIConfigRequest {
    name: string;
    provider: string;
    baseUrl?: string;
    apiKey: string;
    modelId: string;
    temperature?: number;
    isDefault?: boolean;
}

export interface UpdateAIConfigRequest {
    name?: string;
    provider?: string;
    baseUrl?: string;
    apiKey?: string;
    modelId?: string;
    temperature?: number;
    isDefault?: boolean;
}

export interface BalanceResponse {
    balance: {
        available_balance?: string;
        total_balance?: string;
        cash_balance?: string;
        voucher_balance?: string;
    };
    lastUpdated: string;
}

// Get auth token from localStorage
const getAuthToken = () => {
    return safeStorage.getItem('zenfit-token') || safeStorage.getItem('token') || '';
};

// 生成 UUID
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// 本地存储模拟后端
class LocalStorageBackend {
    private getConfigs(): AIProviderConfig[] {
        try {
            const data = safeStorage.getItem(LOCAL_STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    private saveConfigs(configs: AIProviderConfig[]) {
        safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configs));
    }

    getAll(): AIProviderConfig[] {
        return this.getConfigs();
    }

    create(data: CreateAIConfigRequest): AIProviderConfig {
        const configs = this.getConfigs();
        
        // 如果设置为默认，取消其他默认
        if (data.isDefault) {
            configs.forEach(c => c.isDefault = false);
        }
        
        // 如果是第一个配置，设为默认
        const shouldBeDefault = data.isDefault || configs.length === 0;

        const newConfig: AIProviderConfig = {
            id: generateUUID(),
            userId: 'local-user',
            name: data.name,
            provider: data.provider as AIProviderConfig['provider'],
            baseUrl: data.baseUrl || null,
            apiKey: `${data.apiKey.substring(0, 10)}...`,
            modelId: data.modelId,
            temperature: data.temperature || 0.2,
            isDefault: shouldBeDefault,
            cachedModels: null,
            balanceInfo: null,
            lastBalanceCheck: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 保存完整 API Key 到另一个 key（仅本地使用）
        const apiKeys = JSON.parse(safeStorage.getItem('zenfit_ai_api_keys') || '{}');
        apiKeys[newConfig.id] = data.apiKey;
        safeStorage.setItem('zenfit_ai_api_keys', JSON.stringify(apiKeys));

        configs.push(newConfig);
        this.saveConfigs(configs);
        
        return newConfig;
    }

    update(id: string, data: UpdateAIConfigRequest): AIProviderConfig | null {
        const configs = this.getConfigs();
        const index = configs.findIndex(c => c.id === id);
        if (index === -1) return null;

        // 如果设置为默认，取消其他默认
        if (data.isDefault) {
            configs.forEach(c => {
                if (c.id !== id) c.isDefault = false;
            });
        }

        const config = configs[index];
        
        if (data.name !== undefined) config.name = data.name;
        if (data.provider !== undefined) config.provider = data.provider as AIProviderConfig['provider'];
        if (data.baseUrl !== undefined) config.baseUrl = data.baseUrl || null;
        if (data.modelId !== undefined) config.modelId = data.modelId;
        if (data.temperature !== undefined) config.temperature = data.temperature;
        if (data.isDefault !== undefined) config.isDefault = data.isDefault;
        
        // 更新 API Key（如果提供）
        if (data.apiKey && !data.apiKey.includes('...')) {
            const apiKeys = JSON.parse(safeStorage.getItem('zenfit_ai_api_keys') || '{}');
            apiKeys[id] = data.apiKey;
            safeStorage.setItem('zenfit_ai_api_keys', JSON.stringify(apiKeys));
            config.apiKey = `${data.apiKey.substring(0, 10)}...`;
        }

        config.updatedAt = new Date().toISOString();
        
        this.saveConfigs(configs);
        return config;
    }

    delete(id: string): boolean {
        const configs = this.getConfigs();
        const index = configs.findIndex(c => c.id === id);
        if (index === -1) return false;

        configs.splice(index, 1);
        this.saveConfigs(configs);
        
        // 同时删除保存的 API Key
        const apiKeys = JSON.parse(safeStorage.getItem('zenfit_ai_api_keys') || '{}');
        delete apiKeys[id];
        safeStorage.setItem('zenfit_ai_api_keys', JSON.stringify(apiKeys));
        
        return true;
    }

    setDefault(id: string): AIProviderConfig | null {
        return this.update(id, { isDefault: true });
    }

    getFullApiKey(id: string): string | null {
        const apiKeys = JSON.parse(safeStorage.getItem('zenfit_ai_api_keys') || '{}');
        return apiKeys[id] || null;
    }

    updateBalance(id: string, balance: BalanceResponse['balance']) {
        const configs = this.getConfigs();
        const config = configs.find(c => c.id === id);
        if (config) {
            config.balanceInfo = balance;
            config.lastBalanceCheck = new Date().toISOString();
            this.saveConfigs(configs);
        }
    }
}

const localBackend = new LocalStorageBackend();

// iOS 兼容：带超时的 fetch
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            // iOS WebView CORS 兼容
            mode: 'cors',
            credentials: 'include', // 跨域需要传递 auth token
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
};

// Generic fetch helper
const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetchWithTimeout(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    }, 15000); // 15秒超时

    if (!response.ok) {
        // 如果后端返回 404，可能是表不存在，使用本地模式
        if (response.status === 404) {
            throw new Error('BACKEND_NOT_READY');
        }
        const error = await response.text();
        throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json() as Promise<T>;
};

/**
 * AI 配置后端服务
 * 管理用户的多个 AI 提供商配置
 * 支持本地模式（localStorage）作为回退
 */
class AIConfigBackendService {
    private baseUrl = '/ai/configs';
    private useLocalMode = false;

    constructor() {
        // 检查是否应该使用本地模式
        this.checkLocalMode();
    }

    private async checkLocalMode() {
        try {
            // iOS 兼容：带超时的后端检查
            await fetchWithTimeout(`${API_BASE_URL}${this.baseUrl}`, {
                headers: { 'Authorization': `Bearer ${getAuthToken()}` }
            }, 5000); // 5秒超时
        } catch {
            this.useLocalMode = true;
            console.log('Using local mode for AI configs');
        }
    }

    /**
     * 获取用户的所有 AI 配置
     */
    async getConfigs(): Promise<AIProviderConfig[]> {
        // 如果本地有数据，直接返回（支持离线使用）
        const localConfigs = localBackend.getAll();
        if (localConfigs.length > 0) {
            return localConfigs;
        }

        try {
            const response = await fetchApi<{ configs: AIProviderConfig[] }>(this.baseUrl);
            // 同步到本地
            safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.configs));
            return response.configs;
        } catch (error) {
            if ((error as Error).message === 'BACKEND_NOT_READY') {
                this.useLocalMode = true;
                return localBackend.getAll();
            }
            throw error;
        }
    }

    /**
     * 创建新的 AI 配置
     */
    async createConfig(config: CreateAIConfigRequest): Promise<AIProviderConfig> {
        // 尝试同步到后端（先尝试后端，避免 ID 不一致）
        try {
            const response = await fetchApi<{ config: AIProviderConfig }>(this.baseUrl, {
                method: 'POST',
                body: JSON.stringify(config),
            });
            // 同步后端配置到本地
            const serverConfig = response.config;
            const allConfigs = localBackend.getAll();
            allConfigs.push(serverConfig);
            safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allConfigs));
            // 保存完整 API Key
            const apiKeys = JSON.parse(safeStorage.getItem('zenfit_ai_api_keys') || '{}');
            apiKeys[serverConfig.id] = config.apiKey;
            safeStorage.setItem('zenfit_ai_api_keys', JSON.stringify(apiKeys));
            return serverConfig;
        } catch (error) {
            if ((error as Error).message === 'BACKEND_NOT_READY') {
                this.useLocalMode = true;
            }
            // 后端失败，使用本地模式
            return localBackend.create(config);
        }
    }

    /**
     * 更新 AI 配置
     */
    async updateConfig(id: string, config: UpdateAIConfigRequest): Promise<AIProviderConfig> {
        try {
            const response = await fetchApi<{ config: AIProviderConfig }>(`${this.baseUrl}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(config),
            });
            // 同步更新本地
            const serverConfig = response.config;
            const allConfigs = localBackend.getAll();
            const index = allConfigs.findIndex(c => c.id === id);
            if (index !== -1) {
                allConfigs[index] = serverConfig;
                safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allConfigs));
            }
            // 更新 API Key（如果提供）
            if (config.apiKey && !config.apiKey.includes('...')) {
                const apiKeys = JSON.parse(safeStorage.getItem('zenfit_ai_api_keys') || '{}');
                apiKeys[id] = config.apiKey;
                safeStorage.setItem('zenfit_ai_api_keys', JSON.stringify(apiKeys));
            }
            return serverConfig;
        } catch (error) {
            if ((error as Error).message === 'BACKEND_NOT_READY') {
                this.useLocalMode = true;
            }
            // 后端失败，回退到本地更新
            const localConfig = localBackend.update(id, config);
            if (!localConfig) throw new Error('Config not found');
            return localConfig;
        }
    }

    /**
     * 删除 AI 配置
     */
    async deleteConfig(id: string): Promise<void> {
        // 先删除本地缓存
        localBackend.delete(id);

        try {
            await fetchApi(`${this.baseUrl}/${id}`, { method: 'DELETE' });
        } catch (error) {
            // 404 表示配置不存在，视为删除成功
            if ((error as Error).message?.includes('404')) {
                console.log('Config not found on backend, treating as deleted');
                return;
            }
            if ((error as Error).message === 'BACKEND_NOT_READY') {
                this.useLocalMode = true;
            }
            // 其他错误也忽略，因为本地已删除
            console.log('Backend delete failed, but local config removed:', error);
        }
    }

    /**
     * 设置默认配置
     */
    async setDefaultConfig(id: string): Promise<AIProviderConfig> {
        const localConfig = localBackend.setDefault(id);
        if (!localConfig) throw new Error('Config not found');

        try {
            const response = await fetchApi<{ config: AIProviderConfig }>(`${this.baseUrl}/${id}/default`, {
                method: 'POST',
            });
            return response.config;
        } catch (error) {
            if ((error as Error).message === 'BACKEND_NOT_READY') {
                this.useLocalMode = true;
            }
            return localConfig;
        }
    }

    /**
     * 获取 Moonshot 余额（本地模式模拟）
     */
    async getBalance(configId: string): Promise<BalanceResponse> {
        let config = localBackend.getAll().find(c => c.id === configId);
        
        // 如果本地没有，尝试从后端重新获取所有配置
        if (!config) {
            try {
                const response = await fetchApi<{ configs: AIProviderConfig[] }>(this.baseUrl);
                safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.configs));
                config = response.configs.find(c => c.id === configId);
            } catch (e) {
                console.log('Failed to refresh configs from backend');
            }
        }
        
        if (!config) throw new Error('Config not found');

        // 获取完整 API Key
        const apiKey = localBackend.getFullApiKey(configId);
        if (!apiKey) throw new Error('API Key not found');

        try {
            // 尝试调用后端
            console.log('[getBalance] Fetching balance for config:', configId);
            const balance = await fetchApi<BalanceResponse>(`${this.baseUrl}/${configId}/balance`);
            console.log('[getBalance] Success:', balance);
            
            // 更新本地缓存的余额
            localBackend.updateBalance(configId, balance.balance);
            
            return balance;
        } catch (error) {
            console.error('[getBalance] Error:', error);
            // 如果是 404，配置不存在
            if ((error as Error).message?.includes('404')) {
                console.log('Config not found on backend');
                throw new Error('Config not found on server. Please refresh the page.');
            }
            
            // 返回本地缓存的余额（如果有）
            if (config.balanceInfo) {
                console.log('[getBalance] Using cached balance');
                return {
                    balance: config.balanceInfo,
                    lastUpdated: config.lastBalanceCheck || new Date().toISOString()
                };
            }
            
            throw new Error(`Failed to fetch balance: ${(error as Error).message}`);
        }
    }

    /**
     * 获取完整 API Key（仅本地使用）
     */
    getFullApiKey(configId: string): string | null {
        return localBackend.getFullApiKey(configId);
    }

    /**
     * 通过后端代理拉取可用模型列表（避免浏览器 CORS 直连 AI provider 失败）
     * 新建/编辑配置时没有 configId，因此传 baseUrl + apiKey。
     */
    async fetchModelsProxy(params: { baseUrl?: string; apiKey: string; provider?: string }): Promise<Array<{ id: string; name: string }>> {
        const resp = await fetchApi<{ models: Array<{ id: string; name: string }> }>(
            `${this.baseUrl}/fetch-models`,
            {
                method: 'POST',
                body: JSON.stringify({
                    baseUrl: params.baseUrl,
                    apiKey: params.apiKey,
                    provider: params.provider,
                }),
            }
        );
        return resp.models || [];
    }

    /**
     * 格式化余额显示
     */
    formatBalance(balance: BalanceResponse['balance']): string {
        if (!balance) return '--';
        
        // 优先显示可用余额
        const available = balance.available_balance || balance.cash_balance || '0';
        
        // 转换为数字并格式化
        const availableNum = parseFloat(available);
        
        if (availableNum >= 10000) {
            return `¥${(availableNum / 10000).toFixed(2)}万`;
        }
        return `¥${availableNum.toFixed(2)}`;
    }

    /**
     * 获取默认配置
     */
    async getDefaultConfig(): Promise<AIProviderConfig | null> {
        const configs = await this.getConfigs();
        return configs.find(c => c.isDefault) || configs[0] || null;
    }
}

export const aiConfigBackendService = new AIConfigBackendService();
