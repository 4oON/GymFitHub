import type { AIConfig, AIModel } from '@/shared/types';
import { AIProvider } from '@/shared/types';
import { iOSStorage } from '@/services/iOSStorageService';

/**
 * AI Configuration Storage Service
 * Manages persistent storage of AI configuration using localStorage
 */

const STORAGE_KEY = 'zenfit_ai_config';

// Available AI Models (preset models for known providers)
export const PRESET_MODELS: AIModel[] = [
    {
        id: 'sonar',
        name: 'Sonar',
        provider: AIProvider.PERPLEXITY,
        description: 'Perplexity Sonar - Real-time knowledge, great for fitness advice',
        maxTokens: 4096
    },
    {
        id: 'sonar-pro',
        name: 'Sonar Pro',
        provider: AIProvider.PERPLEXITY,
        description: 'Perplexity Sonar Pro - Advanced reasoning with citations',
        maxTokens: 8192
    },
    {
        id: 'kimi-k2-0711-preview',
        name: 'Kimi K2',
        provider: AIProvider.KIMI,
        description: 'Moonshot Kimi K2 - Long context, excellent Chinese support',
        maxTokens: 128000
    },
    {
        id: 'kimi-k1.5',
        name: 'Kimi K1.5',
        provider: AIProvider.KIMI,
        description: 'Moonshot Kimi K1.5 - Advanced reasoning and coding',
        maxTokens: 128000
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: AIProvider.OPENAI,
        description: 'OpenAI GPT-4o - Multimodal, fast and capable',
        maxTokens: 8192
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: AIProvider.OPENAI,
        description: 'OpenAI GPT-4o Mini - Cost-effective, fast responses',
        maxTokens: 4096
    },
    {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: AIProvider.ANTHROPIC,
        description: 'Anthropic Claude 3.5 Sonnet - Excellent reasoning',
        maxTokens: 8192
    },
    {
        id: 'deepseek-v4-flash',
        name: 'DeepSeek V4 Flash',
        provider: AIProvider.DEEPSEEK,
        description: 'DeepSeek V4 Flash - Fast, cost-effective reasoning model',
        maxTokens: 8192
    },
    {
        id: 'deepseek-v4-pro',
        name: 'DeepSeek V4 Pro',
        provider: AIProvider.DEEPSEEK,
        description: 'DeepSeek V4 Pro - Most capable reasoning model',
        maxTokens: 8192
    }
];

// Default configuration
export const DEFAULT_AI_CONFIG: AIConfig = {
    provider: AIProvider.CUSTOM,
    modelId: '',
    apiKey: '',
    temperature: 0.2,
    enabled: false,
    baseUrl: ''
};

// API Base URLs for preset providers
export const PRESET_API_URLS: Record<AIProvider, string | null> = {
    [AIProvider.PERPLEXITY]: 'https://api.perplexity.ai/chat/completions',
    [AIProvider.KIMI]: 'https://api.moonshot.cn/v1/chat/completions',
    [AIProvider.OPENAI]: 'https://api.openai.com/v1/chat/completions',
    [AIProvider.ANTHROPIC]: 'https://api.anthropic.com/v1/messages',
    [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/chat/completions',
    [AIProvider.CUSTOM]: null  // User provides their own
};

class AIConfigStorageService {
    /**
     * Get AI configuration from storage
     */
    getConfig(): AIConfig {
        try {
            const stored = iOSStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all fields exist
                return { ...DEFAULT_AI_CONFIG, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load AI config:', error);
        }
        return { ...DEFAULT_AI_CONFIG };
    }

    /**
     * Save AI configuration to storage
     */
    saveConfig(config: AIConfig): void {
        try {
            iOSStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
            console.error('Failed to save AI config:', error);
        }
    }

    /**
     * Check if AI is properly configured (enabled + has API key + has model)
     */
    isConfigured(): boolean {
        const config = this.getConfig();
        const hasBaseUrl = config.provider === AIProvider.CUSTOM ? !!config.baseUrl : true;
        return config.enabled && config.apiKey.length > 0 && config.modelId.length > 0 && hasBaseUrl;
    }

    /**
     * Get the effective API URL for current config
     * For custom providers, user should provide the FULL base URL including version
     * We only append /chat/completions if not already present
     */
    getApiUrl(config?: AIConfig): string {
        const cfg = config || this.getConfig();
        
        if (cfg.provider === AIProvider.CUSTOM) {
            let url = cfg.baseUrl || '';
            
            if (!url) return '';
            
            // Remove trailing slash
            url = url.replace(/\/$/, '');
            
            // Only append /chat/completions if not already present
            if (!url.endsWith('/chat/completions')) {
                url = url + '/chat/completions';
            }
            
            console.log('Generated API URL:', url);
            return url;
        }
        
        return PRESET_API_URLS[cfg.provider] || '';
    }

    /**
     * Get the base URL without the /chat/completions suffix (for display/edit)
     */
    getEditableBaseUrl(config?: AIConfig): string {
        const cfg = config || this.getConfig();
        if (cfg.provider === AIProvider.CUSTOM && cfg.baseUrl) {
            return cfg.baseUrl;
        }
        return cfg.baseUrl || '';
    }

    /**
     * Get models for a specific provider
     */
    getPresetModelsByProvider(provider: AIProvider): AIModel[] {
        return PRESET_MODELS.filter(m => m.provider === provider);
    }

    /**
     * Fetch available models from API (for custom providers)
     * Note: This may fail due to CORS in browser environment
     */
    async fetchModels(baseUrl: string, apiKey: string): Promise<Array<{ id: string; name: string }>> {
        // Normalize URL for models endpoint
        // Remove /chat/completions if present, then add /models
        let modelsUrl = baseUrl.replace(/\/$/, '');
        modelsUrl = modelsUrl.replace('/chat/completions', '');
        modelsUrl = modelsUrl + '/models';

        console.log('Fetching models from:', modelsUrl);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(modelsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            console.log('Models API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Models API error:', response.status, errorText);
                
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.message || errorText;
                } catch {
                    errorMsg = errorText || `HTTP ${response.status}`;
                }
                
                throw new Error(errorMsg);
            }

            const data = await response.json();
            console.log('Models API response data:', data);
            
            let models: Array<{ id: string; name: string }> = [];
            
            if (data.data && Array.isArray(data.data)) {
                models = data.data.map((m: { id: string; name?: string }) => ({
                    id: m.id,
                    name: m.name || m.id
                }));
            } else if (Array.isArray(data)) {
                models = data.map((m: { id: string; name?: string }) => ({
                    id: m.id,
                    name: m.name || m.id
                }));
            } else if (data.models && Array.isArray(data.models)) {
                models = data.models.map((m: { id?: string; name?: string } | string) => ({
                    id: typeof m === 'string' ? m : (m.id || ''),
                    name: typeof m === 'string' ? m : (m.name || m.id || '')
                }));
            } else if (data.model_ids && Array.isArray(data.model_ids)) {
                models = data.model_ids.map((m: string) => ({
                    id: m,
                    name: m
                }));
            }

            models = models.filter(m => m.id && m.id.length > 0);
            models.sort((a, b) => a.name.localeCompare(b.name));
            
            console.log('Parsed models:', models);
            return models;
        } catch (error) {
            console.error('Failed to fetch models:', error);
            
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('CORS_ERROR: Cannot connect to API from browser. Please enter the model ID manually.');
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            }
            
            throw error;
        }
    }

    /**
     * Test API connection
     */
    async testConnection(baseUrl: string, apiKey: string, modelId: string): Promise<{ success: boolean; message: string }> {
        const apiUrl = this.getApiUrl({ 
            provider: AIProvider.CUSTOM, 
            baseUrl, 
            apiKey, 
            modelId,
            temperature: 0.2,
            enabled: true 
        });

        const testBody = {
            model: modelId,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testBody)
            });

            if (response.ok) {
                return { success: true, message: 'Connection successful!' };
            } else {
                const errorText = await response.text();
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.message || errorText;
                } catch {
                    errorMsg = errorText || `HTTP ${response.status}`;
                }
                return { success: false, message: errorMsg };
            }
        } catch (error) {
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Network error' 
            };
        }
    }

    /**
     * Get preset models for Kimi (since fetch often fails due to CORS)
     * Updated to currently available Moonshot models as of 2025-07.
     */
    getKimiPresetModels(): Array<{ id: string; name: string }> {
        return [
            { id: 'kimi-k3', name: 'Kimi K3 (1M context, latest)' },
            { id: 'kimi-k2.7-code', name: 'Kimi K2.7 Code' },
            { id: 'kimi-k2.7-code-highspeed', name: 'Kimi K2.7 Code Highspeed' },
            { id: 'kimi-k2.6', name: 'Kimi K2.6 (256K context)' },
            { id: 'kimi-k2.5', name: 'Kimi K2.5 (256K context)' },
            { id: 'moonshot-v1-auto', name: 'Moonshot V1 Auto' },
            { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K' },
            { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K' },
            { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K' },
        ];
    }

    /**
     * Get preset models for Kimi Code
     * @deprecated Use getKimiPresetModels instead; kept for backward compatibility.
     */
    getKimiCodePresetModels(): Array<{ id: string; name: string }> {
        return [
            { id: 'kimi-k2.7-code', name: 'Kimi K2.7 Code' },
            { id: 'kimi-k2.7-code-highspeed', name: 'Kimi K2.7 Code Highspeed' },
        ];
    }

    /**
     * Get current model details
     */
    getCurrentModel(config?: AIConfig): AIModel | { id: string; name: string; provider: AIProvider; description?: string } | undefined {
        const cfg = config || this.getConfig();
        
        // First check preset models
        const preset = PRESET_MODELS.find(m => m.id === cfg.modelId && m.provider === cfg.provider);
        if (preset) return preset;
        
        // Then check cached models
        const cached = cfg.cachedModels?.find(m => m.id === cfg.modelId);
        if (cached) return { ...cached, provider: cfg.provider };
        
        // Return generic
        if (cfg.modelId) {
            return { 
                id: cfg.modelId, 
                name: cfg.modelId, 
                provider: cfg.provider 
            };
        }
        
        return undefined;
    }

    /**
     * Clear configuration (reset to defaults)
     */
    clearConfig(): void {
        try {
            iOSStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear AI config:', error);
        }
    }

    /**
     * Test if API key format is valid (basic validation)
     */
    validateApiKey(provider: AIProvider, apiKey: string): boolean {
        if (!apiKey || apiKey.length < 10) return false;
        
        switch (provider) {
            case AIProvider.PERPLEXITY:
                return apiKey.startsWith('pplx-');
            case AIProvider.KIMI:
                return apiKey.startsWith('sk-');
            case AIProvider.OPENAI:
                return apiKey.startsWith('sk-');
            case AIProvider.ANTHROPIC:
                return apiKey.startsWith('sk-ant-');
            case AIProvider.DEEPSEEK:
                return apiKey.startsWith('sk-');
            case AIProvider.CUSTOM:
                // Custom provider - accept any reasonable key format
                return apiKey.length >= 20;
            default:
                return true;
        }
    }

    /**
     * Get provider display name
     */
    getProviderDisplayName(provider: AIProvider): string {
        switch (provider) {
            case AIProvider.PERPLEXITY:
                return 'Perplexity';
            case AIProvider.KIMI:
                return 'Moonshot Kimi';
            case AIProvider.OPENAI:
                return 'OpenAI';
            case AIProvider.ANTHROPIC:
                return 'Anthropic';
            case AIProvider.DEEPSEEK:
                return 'DeepSeek';
            case AIProvider.CUSTOM:
                return 'Custom (OpenAI Compatible)';
            default:
                return provider;
        }
    }

    /**
     * Get provider color/theme
     */
    getProviderColor(provider: AIProvider): string {
        switch (provider) {
            case AIProvider.PERPLEXITY:
                return 'teal';
            case AIProvider.KIMI:
                return 'indigo';
            case AIProvider.OPENAI:
                return 'emerald';
            case AIProvider.ANTHROPIC:
                return 'orange';
            case AIProvider.DEEPSEEK:
                return 'blue';
            case AIProvider.CUSTOM:
                return 'purple';
            default:
                return 'slate';
        }
    }
}

// Export singleton instance
export const aiConfigStorage = new AIConfigStorageService();
