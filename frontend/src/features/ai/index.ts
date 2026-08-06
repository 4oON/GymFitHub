// AI Feature Exports

// Components
export { default as AIProviderConfigManager } from './components/AIProviderConfigManager';
export { default as AIBalanceDisplay } from './components/AIBalanceDisplay';
export { default as AIControlBar } from './components/AIControlBar';
export { default as AICoachChatModal } from './components/AICoachChatModal';
export { default as AICustomRoutineCard } from './components/AICustomRoutineCard';

// Services
export { 
    aiConfigStorage, 
    PRESET_MODELS, 
    DEFAULT_AI_CONFIG,
    PRESET_API_URLS
} from './services/AIConfigStorageService';

export { aiConfigBackendService } from './services/AIConfigBackendService';

// Re-export Kimi preset models helper
export const getKimiPresetModels = () => [
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

export {
    getAiWorkoutRecommendation,
    getAiExerciseAlternative,
    isAIConfigured,
    getAIConfigInfo
} from './services/perplexityService';

// Re-export types
export type { AIConfig, AIModel } from '@/shared/types';
export type { AIProviderConfig, BalanceResponse } from './services/AIConfigBackendService';
export type { 
  AICoachConversation, 
  AICoachMessage, 
  AICustomRoutine, 
  AICustomExercise 
} from './services/AICoachService';
export { AIProvider } from '@/shared/types';
export { default as AICoachService } from './services/AICoachService';
