/**
 * Token Usage Badge Component
 *
 * 显示AI调用的token使用情况和成本
 * 可在任何AI相关组件中复用
 */

import React from 'react';
import { Coins, Zap, Sparkles, Cpu } from 'lucide-react';
import { type TokenUsage } from '../services/AIWorkoutRecommendationService';

interface TokenUsageBadgeProps {
    usage: TokenUsage | null;
    cost: { totalCost: number; currency: string } | null;
    showLabel?: boolean;
    variant?: 'default' | 'compact' | 'detailed' | 'premium' | 'minimal';
    className?: string;
}

/**
 * Token Usage Badge
 *
 * @example
 * // 默认显示
 * <TokenUsageBadge usage={usage} cost={cost} />
 *
 * @example
 * // 高级样式（渐变背景）
 * <TokenUsageBadge usage={usage} cost={cost} variant="premium" />
 *
 * @example
 * // 极简样式
 * <TokenUsageBadge usage={usage} cost={cost} variant="minimal" />
 */
export const TokenUsageBadge: React.FC<TokenUsageBadgeProps> = ({
    usage,
    cost,
    showLabel = true,
    variant = 'default',
    className = ''
}) => {
    if (!usage || !cost) return null;

    const formatCurrency = (amount: number, currency: string) => {
        const symbol = currency === 'CNY' ? '¥' : '$';
        if (amount < 0.01) return `${symbol}<0.01`;
        return `${symbol}${amount.toFixed(3)}`;
    };

    // 根据价格获取颜色主题
    const getPriceTheme = (amount: number) => {
        if (amount < 0.01) return {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            icon: 'text-emerald-400',
            glow: 'shadow-emerald-500/20'
        };
        if (amount < 0.05) return {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            text: 'text-blue-400',
            icon: 'text-blue-400',
            glow: 'shadow-blue-500/20'
        };
        return {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            icon: 'text-amber-400',
            glow: 'shadow-amber-500/20'
        };
    };

    const theme = getPriceTheme(cost.totalCost);

    // 紧凑模式 - 只显示价格和图标
    if (variant === 'compact') {
        return (
            <div className={`inline-flex items-center gap-1.5 text-xs ${theme.text} ${className}`}>
                <Coins className="w-3 h-3" />
                <span className="font-medium">{formatCurrency(cost.totalCost, cost.currency)}</span>
            </div>
        );
    }

    // 极简模式 - 最简洁的设计
    if (variant === 'minimal') {
        return (
            <div className={`flex items-center justify-between text-xs ${className}`}>
                <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-slate-400">{usage.total_tokens.toLocaleString()}</span>
                    <span className="text-slate-600">tokens</span>
                </div>
                <span className={`${theme.text} font-medium`}>
                    {formatCurrency(cost.totalCost, cost.currency)}
                </span>
            </div>
        );
    }

    // 高级模式 - 渐变背景和发光效果
    if (variant === 'premium') {
        return (
            <div className={`relative overflow-hidden rounded-xl border ${theme.border} ${theme.bg} backdrop-blur-sm ${className}`}>
                {/* 背景光效 */}
                <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg.replace('/10', '/5')} rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                
                <div className="relative px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${theme.bg} ${theme.icon}`}>
                                <Cpu className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-base font-bold text-white">
                                        {usage.total_tokens.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-slate-500">tokens</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span>Input: {(usage.prompt_tokens / 1000).toFixed(1)}k</span>
                                    <span>•</span>
                                    <span>Output: {(usage.completion_tokens / 1000).toFixed(1)}k</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className={`text-lg font-bold ${theme.text}`}>
                                {formatCurrency(cost.totalCost, cost.currency)}
                            </div>
                            {showLabel && (
                                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                                    <Sparkles className="w-3 h-3" />
                                    <span>AI Powered</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 详细模式 - 显示完整的input/output breakdown
    if (variant === 'detailed') {
        return (
            <div className={`bg-slate-800/50 rounded-lg px-3 py-2.5 text-xs border border-slate-700/50 ${className}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        Token Usage
                    </span>
                    <span className="text-slate-300 font-medium">
                        {usage.total_tokens.toLocaleString()} total
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 mb-2">
                    <div className="bg-slate-800/50 rounded px-2 py-1">
                        <span className="block text-slate-600">Input</span>
                        <span className="text-slate-300 font-medium">{usage.prompt_tokens.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded px-2 py-1">
                        <span className="block text-slate-600">Output</span>
                        <span className="text-slate-300 font-medium">{usage.completion_tokens.toLocaleString()}</span>
                    </div>
                </div>
                <div className={`flex items-center justify-between pt-2 border-t ${theme.border} border-dashed`}>
                    <span className="text-slate-500">Estimated Cost</span>
                    <span className={`${theme.text} font-bold`}>
                        {formatCurrency(cost.totalCost, cost.currency)}
                    </span>
                </div>
            </div>
        );
    }

    // 默认模式 - 优化的一行显示（推荐用于推荐面板）
    return (
        <div className={`
            flex items-center justify-between 
            text-xs 
            bg-gradient-to-r from-slate-800/50 to-slate-800/30 
            border border-slate-700/30 
            hover:border-slate-600/30 
            rounded-lg px-3 py-2.5
            transition-all duration-200
            ${className}
        `}>
            <div className="flex items-center gap-3">
                {/* Token 图标和数量 */}
                <div className="flex items-center gap-1.5">
                    <Zap className={`w-3.5 h-3.5 ${theme.icon}`} />
                    <span className="text-slate-300 font-medium">
                        {usage.total_tokens.toLocaleString()}
                    </span>
                    <span className="text-slate-500">tokens</span>
                </div>
                
                {/* 分隔符 */}
                <span className="text-slate-600">•</span>
                
                {/* 价格 - 根据价格变色 */}
                <span className={`font-bold ${theme.text}`}>
                    {formatCurrency(cost.totalCost, cost.currency)}
                </span>
            </div>
            
            {showLabel && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Sparkles className="w-3 h-3" />
                    <span className="uppercase tracking-wider">AI Powered</span>
                </div>
            )}
        </div>
    );
};

export default TokenUsageBadge;
