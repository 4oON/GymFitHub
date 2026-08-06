import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealthKit } from '../hooks/useHealthKit';
import { Capacitor } from '@capacitor/core';

const HealthSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualWeight, setManualWeight] = useState('');
    const [manualBodyFat, setManualBodyFat] = useState('');

    const {
        isAvailable,
        isAuthorized,
        isLoading,
        error,
        healthData,
        lastSync,
        requestAuthorization,
        syncData,
        saveWeight,
        saveBodyFat
    } = useHealthKit();

    // 检查是否在 iOS 原生环境
    const isNative = Capacitor.isNativePlatform();

    // 处理授权请求
    const handleEnableSync = async () => {
        const success = await requestAuthorization();
        if (success) {
            // 授权成功后立即同步数据
            await syncData();
        }
    };

    // 处理手动同步
    const handleManualSync = async () => {
        await syncData();
    };

    // 处理保存手动输入
    const handleSaveManual = async () => {
        const weight = parseFloat(manualWeight);
        const bodyFat = parseFloat(manualBodyFat);

        if (!isNaN(weight)) {
            await saveWeight(weight);
        }
        if (!isNaN(bodyFat)) {
            await saveBodyFat(bodyFat);
        }

        setShowManualInput(false);
        setManualWeight('');
        setManualBodyFat('');
    };

    // 格式化日期
    const formatDate = (date: Date | null) => {
        if (!date) return '从未';
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-white">健康数据 <span className="text-emerald-400">同步</span></h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 平台提示 */}
                {!isNative && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-2xl mb-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>当前在 Web 模式，iOS Health 同步功能仅在 iOS App 中可用</span>
                        </div>
                    </div>
                )}

                {/* 错误提示 */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-2xl mb-6 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                {/* 同步状态卡片 */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isAuthorized ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                            <h2 className="text-xl font-bold text-white">同步状态</h2>
                        </div>
                        {isAuthorized ? (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">已启用</span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-sm font-medium">未启用</span>
                        )}
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">平台支持</span>
                            <span className="text-white font-medium">
                                {isNative ? 'iOS 原生应用' : 'Web 浏览器'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">授权状态</span>
                            <span className="text-white font-medium">
                                {isAuthorized ? '已授权' : '未授权'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">最后同步</span>
                            <span className="text-white font-medium">
                                {formatDate(lastSync)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        {!isAuthorized ? (
                            <button
                                onClick={handleEnableSync}
                                disabled={isLoading || !isNative}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/50"
                            >
                                {isLoading ? '启用中...' : '启用健康数据同步'}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowManualInput(true)}
                                    className="flex-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/50"
                                >
                                    手动输入数据
                                </button>
                                <button
                                    onClick={handleManualSync}
                                    disabled={isLoading}
                                    className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/50"
                                >
                                    {isLoading ? '同步中...' : '立即同步'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 最新健康数据卡片 */}
                {healthData && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">最新健康数据</h2>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-2xl border border-emerald-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="text-emerald-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                    </svg>
                                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">体重</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <div className="text-3xl font-black text-white">{healthData.weight?.toFixed(1) || '--'}</div>
                                    <div className="text-lg font-bold text-emerald-400 mb-1">kg</div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-900/30 to-slate-900 p-4 rounded-2xl border border-amber-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="text-amber-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">体脂率</span>
                                </div>
                                <div className="flex items-end gap-1">
                                    <div className="text-3xl font-black text-white">{healthData.bodyFatPercent?.toFixed(1) || '--'}</div>
                                    <div className="text-lg font-bold text-amber-400 mb-1">%</div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 p-4 rounded-2xl border border-purple-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="text-purple-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">BMI</span>
                                </div>
                                <div className="text-3xl font-black text-white">{healthData.bmi?.toFixed(1) || '--'}</div>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-slate-500">
                            同步时间：{formatDate(lastSync)}
                        </div>
                    </div>
                )}

                {/* 说明卡片 */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                    <div className="flex gap-3">
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-300">
                            <p className="font-medium mb-2">关于 iOS Health 同步</p>
                            <ul className="space-y-1.5 text-blue-300/80">
                                <li>• <strong className="text-blue-200">双向同步：</strong>ZenFit 可以读取和写入 iOS 健康应用</li>
                                <li>• <strong className="text-blue-200">自动同步：</strong>每天打开应用会自动读取最新数据</li>
                                <li>• <strong className="text-blue-200">数据安全：</strong>所有数据通过 HealthKit 安全 API 访问</li>
                                <li>• <strong className="text-blue-200">隐私保护：</strong>您可以随时在 iOS 设置中撤销授权</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>

            {/* 手动输入模态框 */}
            {showManualInput && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl p-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">手动输入数据</h2>
                            <button
                                onClick={() => setShowManualInput(false)}
                                className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <p className="text-xs text-amber-300">
                                <strong>注意：</strong>手动输入的数据会同时保存到 ZenFit 和 iOS 健康应用（如果已授权）。
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">体重 (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualWeight}
                                    onChange={(e) => setManualWeight(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    placeholder="70.5"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">体脂率 (%)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualBodyFat}
                                    onChange={(e) => setManualBodyFat(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    placeholder="20.5"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveManual}
                                    disabled={isLoading}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/50"
                                >
                                    {isLoading ? '保存中...' : '保存数据'}
                                </button>
                                <button
                                    onClick={() => setShowManualInput(false)}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all font-bold"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthSettingsPage;
