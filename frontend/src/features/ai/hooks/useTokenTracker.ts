/**
 * Token Tracker Hook
 *
 * 用于跟踪AI调用的token使用情况和成本
 * 可在任何AI相关组件中使用
 */

import { useState, useCallback } from 'react';
import { calculateTokenCost, type TokenUsage } from '../services/AIWorkoutRecommendationService';

export interface TokenTrackerState {
    usage: TokenUsage | null;
    cost: { totalCost: number; currency: string } | null;
}

export interface TokenTrackerActions {
    setUsage: (usage: TokenUsage, provider: string, model: string) => void;
    clear: () => void;
    incrementUsage: (additionalUsage: TokenUsage, provider: string, model: string) => void;
}

/**
 * Token Tracker Hook
 *
 * @example
 * // 基础用法
 * const { usage, cost, setUsage } = useTokenTracker();
 *
 * // 设置token使用
 * setUsage(
 *   { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 },
 *   'kimi',
 *   'kimi-k2-0711-preview'
 * );
 *
 * @example
 * // 累积多次调用
 * const { usage, cost, incrementUsage } = useTokenTracker();
 *
 * // 第一次调用
 * incrementUsage({ prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 }, 'kimi', 'kimi-k2');
 * // 第二次调用（累加）
 * incrementUsage({ prompt_tokens: 800, completion_tokens: 400, total_tokens: 1200 }, 'kimi', 'kimi-k2');
 * // usage 现在显示 2700 tokens
 */
export const useTokenTracker = (): TokenTrackerState & TokenTrackerActions => {
    const [usage, setUsageState] = useState<TokenUsage | null>(null);
    const [cost, setCost] = useState<{ totalCost: number; currency: string } | null>(null);

    /**
     * 设置token使用（覆盖现有值）
     */
    const setUsage = useCallback((newUsage: TokenUsage, provider: string, model: string) => {
        setUsageState(newUsage);
        const costInfo = calculateTokenCost(newUsage, provider, model);
        setCost({ totalCost: costInfo.totalCost, currency: costInfo.currency });
    }, []);

    /**
     * 清除token记录
     */
    const clear = useCallback(() => {
        setUsageState(null);
        setCost(null);
    }, []);

    /**
     * 累加token使用（用于多次AI调用）
     */
    const incrementUsage = useCallback((
        additionalUsage: TokenUsage,
        provider: string,
        model: string
    ) => {
        setUsageState(prev => {
            const newUsage: TokenUsage = prev
                ? {
                    prompt_tokens: prev.prompt_tokens + additionalUsage.prompt_tokens,
                    completion_tokens: prev.completion_tokens + additionalUsage.completion_tokens,
                    total_tokens: prev.total_tokens + additionalUsage.total_tokens
                }
                : additionalUsage;

            const costInfo = calculateTokenCost(newUsage, provider, model);
            setCost({ totalCost: costInfo.totalCost, currency: costInfo.currency });

            return newUsage;
        });
    }, []);

    return {
        usage,
        cost,
        setUsage,
        clear,
        incrementUsage
    };
};

export default useTokenTracker;
