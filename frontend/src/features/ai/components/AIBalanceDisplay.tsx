import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { aiConfigBackendService, type AIProviderConfig, type BalanceResponse } from '../services/AIConfigBackendService';

interface AIBalanceDisplayProps {
    config?: AIProviderConfig | null;
    compact?: boolean;
}

const AIBalanceDisplay: React.FC<AIBalanceDisplayProps> = ({ config, compact = false }) => {
    const [balance, setBalance] = useState<BalanceResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (config?.balanceInfo) {
            setBalance({
                balance: config.balanceInfo,
                lastUpdated: config.lastBalanceCheck || new Date().toISOString()
            });
        }
    }, [config]);

    const handleRefresh = async () => {
        if (!config?.id) return;
        
        try {
            setLoading(true);
            setError(null);
            const data = await aiConfigBackendService.getBalance(config.id);
            setBalance(data);
        } catch (err) {
            setError('Failed to fetch balance');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!config) return null;

    // 只显示 Moonshot/Kimi 的余额
    if (config.provider !== 'kimi' && config.provider !== 'custom') return null;

    const formattedBalance = balance 
        ? aiConfigBackendService.formatBalance(balance.balance)
        : config.balanceInfo 
            ? aiConfigBackendService.formatBalance(config.balanceInfo)
            : null;

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg">
                    <Wallet size={14} className="text-emerald-400" />
                    {formattedBalance ? (
                        <span className="text-sm font-medium text-emerald-400">{formattedBalance}</span>
                    ) : (
                        <span className="text-xs text-slate-500">--</span>
                    )}
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        );
    }

    return (
        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-400" />
                    <span className="text-sm text-slate-400">Balance</span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            
            {error ? (
                <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
            ) : formattedBalance ? (
                <div className="mt-2">
                    <span className="text-2xl font-bold text-emerald-400">{formattedBalance}</span>
                    {balance?.balance?.voucher_balance && (
                        <p className="text-xs text-slate-500 mt-1">
                            Voucher: ¥{parseFloat(balance.balance.voucher_balance).toFixed(2)}
                        </p>
                    )}
                    {balance?.lastUpdated && (
                        <p className="text-xs text-slate-600 mt-1">
                            Updated {new Date(balance.lastUpdated).toLocaleString()}
                        </p>
                    )}
                </div>
            ) : (
                <p className="mt-2 text-sm text-slate-500">Click refresh to check balance</p>
            )}
        </div>
    );
};

export default AIBalanceDisplay;
