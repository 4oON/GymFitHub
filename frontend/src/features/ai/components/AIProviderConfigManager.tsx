import React, { useState, useEffect } from 'react';
import { 
    X, Plus, Trash2, Edit2, Check, AlertCircle, 
    Wallet, RefreshCw, Sparkles, Server, Bot,
    ChevronDown, Star, Loader2
} from 'lucide-react';
import { aiConfigBackendService, type AIProviderConfig, type BalanceResponse } from '../services/AIConfigBackendService';
import { aiConfigStorage, PRESET_MODELS } from '../services/AIConfigStorageService';
import { AIProvider } from '@/shared/types';

interface AIProviderConfigManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectConfig?: (config: AIProviderConfig) => void;
    selectionMode?: boolean;
}

const AIProviderConfigManager: React.FC<AIProviderConfigManagerProps> = ({
    isOpen,
    onClose,
    onSelectConfig,
    selectionMode = false
}) => {
    const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingConfig, setEditingConfig] = useState<AIProviderConfig | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [checkingBalance, setCheckingBalance] = useState<string | null>(null);
    const [balanceData, setBalanceData] = useState<Record<string, BalanceResponse>>({});
    
    // iOS 兼容：自定义确认对话框状态
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'error' | 'success' }>({ show: false, message: '', type: 'error' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        provider: AIProvider.KIMI,
        baseUrl: 'https://api.moonshot.cn/v1',
        apiKey: '',
        modelId: 'kimi-k3',
        temperature: 1,
        isDefault: false
    });

    // Fetch-models state (via backend proxy). When non-null, these models
    // replace the preset <option> list in the model dropdown.
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [fetchedModels, setFetchedModels] = useState<Array<{ id: string; name: string }> | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadConfigs();
        }
    }, [isOpen]);

    // 当没有配置时自动显示添加表单
    useEffect(() => {
        if (!loading && configs.length === 0 && isOpen) {
            setShowForm(true);
            setEditingConfig(null);
            resetForm();
        }
    }, [loading, configs.length, isOpen]);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await aiConfigBackendService.getConfigs();
            setConfigs(data || []); // 确保是数组，即使是空数组
            
            // 加载余额信息
            for (const config of data || []) {
                if (config.balanceInfo) {
                    setBalanceData(prev => ({
                        ...prev,
                        [config.id]: { balance: config.balanceInfo!, lastUpdated: config.lastBalanceCheck || new Date().toISOString() }
                    }));
                }
            }
        } catch (err: any) {
            // 401/403 表示未登录，其他错误才显示
            if (err.message?.includes('401') || err.message?.includes('403')) {
                setError('Please login to manage AI configurations');
            } else {
                // 空配置不是错误，新用户正常情况
                console.log('Load configs result:', err);
                setConfigs([]); // 设置为空数组
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // iOS 兼容：显示 Toast 提示
    const showToast = (message: string, type: 'error' | 'success' = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const handleCheckBalance = async (configId: string) => {
        try {
            setCheckingBalance(configId);
            const balance = await aiConfigBackendService.getBalance(configId);
            
            // 更新 balanceData state
            setBalanceData(prev => ({ ...prev, [configId]: balance }));
            
            // 同时更新 configs state，这样回到主页时余额能正确显示
            setConfigs(prev => prev.map(c => 
                c.id === configId 
                    ? { ...c, balanceInfo: balance.balance, lastBalanceCheck: balance.lastUpdated }
                    : c
            ));
        } catch (err) {
            console.error('Failed to check balance:', err);
            showToast('Failed to check balance. Please try again.');
        } finally {
            setCheckingBalance(null);
        }
    };

    // 通过后端代理拉取当前 provider 的模型列表
    const handleFetchModels = async () => {
        // DeepSeek 后端有默认 baseUrl，可省略；其他 provider 必须显式提供 baseUrl
        const needsExplicitUrl = formData.provider !== AIProvider.DEEPSEEK;
        if (!formData.apiKey) {
            showToast('Please enter your API Key first');
            return;
        }
        if (needsExplicitUrl && !formData.baseUrl) {
            showToast('Please enter the Base URL first');
            return;
        }

        // 该 provider 的预设模型，作为失败/空结果的 fallback
        const fallbackPresets = PRESET_MODELS
            .filter(m => m.provider === formData.provider)
            .map(m => ({ id: m.id, name: m.name }));

        try {
            setIsFetchingModels(true);
            const models = await aiConfigBackendService.fetchModelsProxy({
                baseUrl: formData.baseUrl,
                apiKey: formData.apiKey,
                provider: formData.provider,
            });

            if (models.length === 0) {
                setFetchedModels(fallbackPresets.length > 0 ? fallbackPresets : null);
                showToast('No models returned by provider. Using preset model list.');
                return;
            }

            setFetchedModels(models);
            // 若当前未选模型，自动选中第一个
            if (!formData.modelId) {
                setFormData(prev => ({ ...prev, modelId: models[0].id }));
            }
            showToast(`Fetched ${models.length} models`, 'success');
        } catch (err) {
            console.error('Failed to fetch models:', err);
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch models';
            setFetchedModels(fallbackPresets.length > 0 ? fallbackPresets : null);
            showToast(`${errorMsg} — using preset model list.`);
        } finally {
            setIsFetchingModels(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.name || !formData.apiKey || !formData.modelId) {
                showToast('Please fill in all required fields');
                return;
            }

            if (editingConfig) {
                await aiConfigBackendService.updateConfig(editingConfig.id, formData);
            } else {
                await aiConfigBackendService.createConfig(formData);
            }

            await loadConfigs();
            setShowForm(false);
            setEditingConfig(null);
            resetForm();
            showToast('Configuration saved successfully', 'success');
        } catch (err) {
            console.error('Failed to save config:', err);
            showToast('Failed to save configuration');
        }
    };

    // iOS 兼容：显示删除确认对话框
    const handleDeleteClick = (id: string) => {
        setDeleteConfirm({ show: true, id });
    };

    const handleConfirmDelete = async () => {
        const id = deleteConfirm.id;
        setDeleteConfirm({ show: false, id: '' });
        
        try {
            await aiConfigBackendService.deleteConfig(id);
            await loadConfigs();
            showToast('Configuration deleted', 'success');
        } catch (err) {
            console.error('Failed to delete config:', err);
            showToast('Failed to delete configuration');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await aiConfigBackendService.setDefaultConfig(id);
            await loadConfigs();
        } catch (err) {
            console.error('Failed to set default:', err);
        }
    };

    const handleEdit = (config: AIProviderConfig) => {
        setEditingConfig(config);
        setFormData({
            name: config.name,
            provider: config.provider as AIProvider,
            baseUrl: config.baseUrl || '',
            apiKey: '', // 不显示完整的 API Key
            modelId: config.modelId,
            temperature: config.temperature,
            isDefault: config.isDefault
        });
        setFetchedModels(null);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            provider: AIProvider.KIMI,
            baseUrl: 'https://api.moonshot.cn/v1',
            apiKey: '',
            modelId: 'kimi-k3',
            temperature: 1,
            isDefault: false
        });
        setFetchedModels(null);
    };

    const getProviderIcon = (provider: string) => {
        switch (provider) {
            case 'kimi':
                return <Bot size={20} className="text-indigo-400" />;
            case 'perplexity':
                return <Sparkles size={20} className="text-teal-400" />;
            case 'openai':
                return <Sparkles size={20} className="text-emerald-400" />;
            case 'anthropic':
                return <Bot size={20} className="text-orange-400" />;
            case 'deepseek':
                return <Bot size={20} className="text-blue-400" />;
            default:
                return <Server size={20} className="text-purple-400" />;
        }
    };

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'kimi':
                return 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400';
            case 'perplexity':
                return 'bg-teal-500/20 border-teal-500/30 text-teal-400';
            case 'openai':
                return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
            case 'anthropic':
                return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
            case 'deepseek':
                return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
            default:
                return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg">
                            <Server className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Provider Configurations</h2>
                            <p className="text-xs text-slate-400">Manage your AI models and API keys</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-400" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* Config List */}
                            {configs.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <Server size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-white font-medium mb-2">No AI configurations yet</p>
                                    <p className="text-sm text-slate-400 mb-6">Add your first AI provider to get started</p>
                                    <button
                                        onClick={() => {
                                            setEditingConfig(null);
                                            resetForm();
                                            setShowForm(true);
                                        }}
                                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-xl transition-colors inline-flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Add AI Provider
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {configs.map(config => {
                                        const balance = balanceData[config.id];
                                        const isChecking = checkingBalance === config.id;
                                        
                                        return (
                                            <div 
                                                key={config.id}
                                                className={`p-4 rounded-2xl border transition-all ${
                                                    config.isDefault 
                                                        ? 'bg-indigo-500/10 border-indigo-500/30' 
                                                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg ${getProviderColor(config.provider)}`}>
                                                            {getProviderIcon(config.provider)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-white">{config.name}</h3>
                                                                {config.isDefault && (
                                                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                                                                        <Star size={10} /> Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-400">
                                                                {config.provider} • {config.modelId}
                                                            </p>
                                                            
                                                            {/* Balance Display */}
                                                            {(config.provider === 'kimi' || config.provider === 'deepseek') && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleCheckBalance(config.id)}
                                                                        disabled={isChecking}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                                                                    >
                                                                        <Wallet size={14} />
                                                                        {balance ? (
                                                                            <span className="text-emerald-400 font-medium">
                                                                                {aiConfigBackendService.formatBalance(balance.balance)}
                                                                            </span>
                                                                        ) : (
                                                                            <span>Check Balance</span>
                                                                        )}
                                                                        {isChecking && <RefreshCw size={12} className="animate-spin ml-1" />}
                                                                    </button>
                                                                    {balance && (
                                                                        <span className="text-xs text-slate-500">
                                                                            Updated {new Date(balance.lastUpdated).toLocaleTimeString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1">
                                                        {!config.isDefault && (
                                                            <button
                                                                onClick={() => handleSetDefault(config.id)}
                                                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                                title="Set as default"
                                                            >
                                                                <Star size={18} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(config)}
                                                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(config.id)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors active:scale-95"
                                                            style={{ touchAction: 'manipulation' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add Button */}
                            {!showForm && (
                                <button
                                    onClick={() => {
                                        setEditingConfig(null);
                                        resetForm();
                                        setShowForm(true);
                                    }}
                                    className="w-full p-4 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                                >
                                    <Plus size={20} />
                                    <span>Add New Configuration</span>
                                </button>
                            )}

                            {/* Form */}
                            {showForm && (
                                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-4">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        {editingConfig ? <Edit2 size={18} /> : <Plus size={18} />}
                                        {editingConfig ? 'Edit Configuration' : 'New Configuration'}
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {/* Name */}
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Configuration Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., Moonshot CN"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Provider */}
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Provider</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                            { value: AIProvider.KIMI, label: 'Kimi' },
                                            { value: AIProvider.PERPLEXITY, label: 'Perplexity' },
                                            { value: AIProvider.OPENAI, label: 'OpenAI' },
                                            { value: AIProvider.ANTHROPIC, label: 'Anthropic' },
                                            { value: AIProvider.DEEPSEEK, label: 'DeepSeek' },
                                            { value: AIProvider.CUSTOM, label: 'Custom' },
                                        ].map(p => (
                                            <button
                                                key={p.value}
                                                onClick={() => {
                                                    // 切换 provider 时自动设置默认模型和 baseUrl
                                                    const defaultModels: Record<string, string> = {
                                                        [AIProvider.KIMI]: 'kimi-k3',
                                                        [AIProvider.PERPLEXITY]: 'sonar',
                                                        [AIProvider.OPENAI]: 'gpt-4o-mini',
                                                        [AIProvider.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
                                                        [AIProvider.DEEPSEEK]: 'deepseek-v4-flash',
                                                        [AIProvider.CUSTOM]: ''
                                                    };
                                                    const defaultBaseUrls: Record<string, string> = {
                                                        [AIProvider.KIMI]: 'https://api.moonshot.cn/v1',
                                                        [AIProvider.PERPLEXITY]: 'https://api.perplexity.ai',
                                                        [AIProvider.OPENAI]: 'https://api.openai.com/v1',
                                                        [AIProvider.ANTHROPIC]: 'https://api.anthropic.com/v1',
                                                        [AIProvider.DEEPSEEK]: 'https://api.deepseek.com',
                                                        [AIProvider.CUSTOM]: ''
                                                    };
                                                    setFormData({
                                                        ...formData,
                                                        provider: p.value,
                                                        modelId: defaultModels[p.value],
                                                        baseUrl: defaultBaseUrls[p.value]
                                                    });
                                                    // 切换 provider 后清空已拉取的模型列表
                                                    setFetchedModels(null);
                                                }}
                                                className={`p-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                                                    formData.provider === p.value
                                                        ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-400'
                                                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                            </div>
                                        </div>

                                        {/* Base URL (for custom) */}
                                        {(formData.provider === 'custom' || formData.provider === 'kimi') && (
                                            <div>
                                                <label className="text-xs text-slate-400 block mb-1">Base URL</label>
                                                <input
                                                    type="text"
                                                    value={formData.baseUrl}
                                                    onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                                                    placeholder="https://api.moonshot.cn/v1"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        )}

                                        {/* API Key */}
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">
                                                API Key {editingConfig && '(leave empty to keep current)'}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.apiKey}
                                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                                placeholder="sk-..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Model ID */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-xs text-slate-400 block">Model</label>
                                                <button
                                                    type="button"
                                                    onClick={handleFetchModels}
                                                    disabled={isFetchingModels || !formData.apiKey || (formData.provider !== AIProvider.DEEPSEEK && !formData.baseUrl)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs hover:bg-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Fetch available models from the provider via backend proxy"
                                                >
                                                    {isFetchingModels ? (
                                                        <>
                                                            <Loader2 size={12} className="animate-spin" />
                                                            Fetching...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw size={12} />
                                                            Fetch Models
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    value={formData.modelId}
                                                    onChange={e => setFormData({ ...formData, modelId: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                                                >
                                                    {fetchedModels ? (
                                                        <>
                                                            <option value="">-- Select a model --</option>
                                                            {fetchedModels.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name}</option>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <>
                                                    {formData.provider === AIProvider.KIMI && (
                                                        <>
                                                            <option value="kimi-k3">kimi-k3 (Latest, 1M context)</option>
                                                            <option value="kimi-k2.7-code">kimi-k2.7-code</option>
                                                            <option value="kimi-k2.7-code-highspeed">kimi-k2.7-code-highspeed</option>
                                                            <option value="kimi-k2.6">kimi-k2.6</option>
                                                            <option value="kimi-k2.5">kimi-k2.5 (Recommended)</option>
                                                            <option value="moonshot-v1-auto">moonshot-v1-auto</option>
                                                            <option value="moonshot-v1-128k">moonshot-v1-128k</option>
                                                            <option value="moonshot-v1-32k">moonshot-v1-32k</option>
                                                            <option value="moonshot-v1-8k">moonshot-v1-8k</option>
                                                        </>
                                                    )}
                                                    {formData.provider === AIProvider.PERPLEXITY && (
                                                        <>
                                                            <option value="sonar">sonar</option>
                                                            <option value="sonar-pro">sonar-pro</option>
                                                            <option value="sonar-reasoning">sonar-reasoning</option>
                                                            <option value="llama-3.1-sonar-small-128k-online">llama-3.1-sonar-small-128k-online</option>
                                                            <option value="llama-3.1-sonar-large-128k-online">llama-3.1-sonar-large-128k-online</option>
                                                        </>
                                                    )}
                                                    {formData.provider === AIProvider.OPENAI && (
                                                        <>
                                                            <option value="gpt-4o">gpt-4o</option>
                                                            <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cheap)</option>
                                                            <option value="gpt-4-turbo">gpt-4-turbo</option>
                                                            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                                        </>
                                                    )}
                                                    {formData.provider === AIProvider.ANTHROPIC && (
                                                        <>
                                                            <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet</option>
                                                            <option value="claude-3-opus-20240229">claude-3-opus</option>
                                                            <option value="claude-3-sonnet-20240229">claude-3-sonnet</option>
                                                            <option value="claude-3-haiku-20240307">claude-3-haiku (Fast)</option>
                                                        </>
                                                    )}
                                                    {formData.provider === AIProvider.DEEPSEEK && (
                                                        <>
                                                            <option value="deepseek-v4-flash">deepseek-v4-flash (Fast)</option>
                                                            <option value="deepseek-v4-pro">deepseek-v4-pro (Powerful)</option>
                                                        </>
                                                    )}
                                                    {formData.provider === AIProvider.CUSTOM && (
                                                        <option value="">-- Select or type below --</option>
                                                    )}
                                                        </>
                                                    )}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                            </div>
                                            {/* Custom model input for Custom provider */}
                                            {formData.provider === AIProvider.CUSTOM && (
                                                <input
                                                    type="text"
                                                    value={formData.modelId}
                                                    onChange={e => setFormData({ ...formData, modelId: e.target.value })}
                                                    placeholder="Enter model name (e.g., gpt-4)"
                                                    className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                                />
                                            )}
                                        </div>

                                        {/* Is Default */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="isDefault"
                                                checked={formData.isDefault}
                                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                                className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="isDefault" className="text-sm text-slate-300">
                                                Set as default configuration
                                            </label>
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleSave}
                                            className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowForm(false);
                                                setEditingConfig(null);
                                            }}
                                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* iOS 兼容：自定义删除确认对话框 */}
            {deleteConfirm.show && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setDeleteConfirm({ show: false, id: '' })}
                >
                    <div 
                        className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-full">
                                <Trash2 className="text-red-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Delete Configuration</h3>
                        </div>
                        <p className="text-slate-400 mb-6">
                            Are you sure you want to delete this AI configuration? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, id: '' })}
                                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-medium rounded-xl transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS 兼容：Toast 提示 */}
            {toast.show && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 transition-all ${
                    toast.type === 'error' 
                        ? 'bg-red-500/90 text-white' 
                        : 'bg-emerald-500/90 text-white'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'error' ? (
                            <AlertCircle size={18} />
                        ) : (
                            <Check size={18} />
                        )}
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIProviderConfigManager;
