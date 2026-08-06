import React, { useState, useEffect } from 'react';
import { Bot, ChevronRight, Wallet, Plus, AlertCircle, Loader2, Zap } from 'lucide-react';
import { aiConfigBackendService, type AIProviderConfig } from '../services/AIConfigBackendService';
import AIProviderConfigManager from './AIProviderConfigManager';

const AIControlBar: React.FC = () => {
    const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManager, setShowManager] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(() => {
        try {
            return localStorage.getItem('zenfit_ai_enabled') !== 'false';
        } catch {
            return true; // iOS 隐私模式下默认启用 AI
        }
    });

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            let data = await aiConfigBackendService.getConfigs();
            
            // 尝试获取支持余额查询的 provider（Kimi / DeepSeek / Custom）的余额（如果没有的话）
            for (const config of data) {
                if (config.provider === 'kimi' || config.provider === 'deepseek' || config.provider === 'custom') {
                    // 如果已经有余额信息且是最近1小时内更新的，跳过
                    if (config.balanceInfo && config.lastBalanceCheck) {
                        const lastCheck = new Date(config.lastBalanceCheck).getTime();
                        const oneHour = 60 * 60 * 1000;
                        if (Date.now() - lastCheck < oneHour) {
                            continue;
                        }
                    }
                    
                    try {
                        const balance = await aiConfigBackendService.getBalance(config.id);
                        // 更新 config 对象
                        config.balanceInfo = balance.balance;
                        config.lastBalanceCheck = balance.lastUpdated;
                    } catch (e) {
                        console.log('Failed to load balance for', config.name);
                    }
                }
            }
            
            setConfigs([...data]); // 使用新数组触发 React 更新
        } catch (err) {
            console.error('Failed to load AI configs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAI = () => {
        const newState = !aiEnabled;
        setAiEnabled(newState);
        try {
            localStorage.setItem('zenfit_ai_enabled', String(newState));
            // Trigger storage event for other components to detect change
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'zenfit_ai_enabled',
                newValue: String(newState)
            }));
        } catch {
            // iOS 隐私模式下忽略存储错误
        }
    };

    const defaultConfig = configs.find(c => c.isDefault) || configs[0];

    const formatBalance = (config: AIProviderConfig) => {
        // OpenAI, Perplexity, Anthropic 等按量付费的显示 Free（因为通常是信用卡扣费，没有余额概念）
        // Kimi / DeepSeek / Custom 有余额查询，显示余额
        if (config.provider !== 'kimi' && config.provider !== 'custom' && config.provider !== 'deepseek') {
            return { type: 'free', label: 'Free' };
        }
        
        // Kimi 和 Custom 显示余额
        if (!config.balanceInfo) return { type: 'loading', label: '--' };
        
        const available = config.balanceInfo.available_balance || config.balanceInfo.cash_balance || '0';
        const num = parseFloat(available);
        
        if (num >= 10000) return { type: 'balance', label: `¥${(num / 10000).toFixed(1)}万` };
        return { type: 'balance', label: `¥${num.toFixed(0)}` };
    };

    // 没有配置时显示添加提示
    if (configs.length === 0 && !loading) {
        return (
            <>
                <div 
                    onClick={() => setShowManager(true)}
                    className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 cursor-pointer hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-2.5 rounded-xl border border-amber-500/30">
                                <Bot size={22} className="text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">AI Coach</h3>
                                <p className="text-amber-400/80 text-xs">Click to add AI configuration</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Plus size={18} className="text-amber-400" />
                            <ChevronRight size={18} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                <AIProviderConfigManager
                    isOpen={showManager}
                    onClose={() => {
                        setShowManager(false);
                        loadConfigs();
                    }}
                />
            </>
        );
    }

    return (
        <>
            <div className={`mb-8 rounded-2xl p-4 transition-all duration-300 backdrop-blur-sm ${
                aiEnabled 
                    ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30' 
                    : 'bg-gradient-to-r from-slate-700/30 to-slate-800/30 border border-slate-600/30'
            }`}>
                <div className="flex items-center justify-between">
                    {/* Left: AI Icon and Status */}
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                            aiEnabled 
                                ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-indigo-500/40' 
                                : 'bg-slate-700/50 border-slate-600/50'
                        }`}>
                            {loading ? (
                                <Loader2 size={22} className="animate-spin text-slate-400" />
                            ) : (
                                <Bot size={22} className={aiEnabled ? 'text-indigo-400' : 'text-slate-500'} />
                            )}
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm transition-colors ${aiEnabled ? 'text-white' : 'text-slate-400'}`}>
                                AI Coach
                            </h3>
                            <p className={`text-xs transition-colors ${aiEnabled ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {loading ? 'Loading...' : aiEnabled ? (defaultConfig?.name || 'Ready') : 'Disabled'}
                            </p>
                        </div>
                    </div>

                    {/* Middle: Balance (if enabled and has config) */}
                    {aiEnabled && defaultConfig && (
                        <div className="flex-1 flex justify-center">
                            {(() => {
                                const balance = formatBalance(defaultConfig);
                                return (
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                                        balance.type === 'balance' ? 'bg-slate-800/50' : 'bg-blue-500/10'
                                    }`}>
                                        {balance.type === 'free' ? (
                                            <Zap size={14} className="text-blue-400" />
                                        ) : (
                                            <Wallet size={14} className="text-emerald-400" />
                                        )}
                                        <span className={`text-sm font-medium ${
                                            balance.type === 'balance' ? 'text-emerald-400' : 'text-blue-400'
                                        }`}>
                                            {balance.label}
                                        </span>
                                        {balance.type === 'balance' && (
                                            <span className="text-xs text-slate-500">
                                                {defaultConfig.provider === 'deepseek' ? 'DeepSeek' : defaultConfig.provider === 'kimi' ? 'Kimi' : defaultConfig.name}
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Right: Toggle and Edit */}
                    <div className="flex items-center gap-3">
                        {/* Enable/Disable Toggle */}
                        <button
                            onClick={handleToggleAI}
                            disabled={configs.length === 0}
                            className={`w-12 h-7 rounded-full transition-all relative ${
                                aiEnabled 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                                    : 'bg-slate-600'
                            } ${configs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                                aiEnabled ? 'left-6' : 'left-1'
                            }`} />
                        </button>

                        {/* Edit Button */}
                        <button
                            onClick={() => setShowManager(true)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Warning if no configs */}
                {configs.length === 0 && !loading && (
                    <div className="mt-3 flex items-center gap-2 text-amber-400/80 text-xs bg-amber-500/10 rounded-lg px-3 py-2">
                        <AlertCircle size={14} />
                        <span>No AI configuration found. Click the arrow to add one.</span>
                    </div>
                )}
            </div>

            <AIProviderConfigManager
                isOpen={showManager}
                onClose={() => {
                    setShowManager(false);
                    loadConfigs();
                }}
            />
        </>
    );
};

export default AIControlBar;
