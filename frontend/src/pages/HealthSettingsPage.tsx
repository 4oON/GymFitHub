import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHealthKit } from '../hooks/useHealthKit';
import { Capacitor } from '@capacitor/core';

interface MetricCardProps {
    label: string;
    value?: number;
    unit: string;
    color: string;
}

const colorMap: Record<string, { text: string; border: string; bg: string }> = {
    emerald: { text: 'text-emerald-400', border: 'border-emerald-700/50', bg: 'from-emerald-900/30' },
    amber: { text: 'text-amber-400', border: 'border-amber-700/50', bg: 'from-amber-900/30' },
    purple: { text: 'text-purple-400', border: 'border-purple-700/50', bg: 'from-purple-900/30' },
    teal: { text: 'text-teal-400', border: 'border-teal-700/50', bg: 'from-teal-900/30' },
    blue: { text: 'text-blue-400', border: 'border-blue-700/50', bg: 'from-blue-900/30' },
    rose: { text: 'text-rose-400', border: 'border-rose-700/50', bg: 'from-rose-900/30' },
    red: { text: 'text-red-400', border: 'border-red-700/50', bg: 'from-red-900/30' },
    pink: { text: 'text-pink-400', border: 'border-pink-700/50', bg: 'from-pink-900/30' },
    cyan: { text: 'text-cyan-400', border: 'border-cyan-700/50', bg: 'from-cyan-900/30' },
    orange: { text: 'text-orange-400', border: 'border-orange-700/50', bg: 'from-orange-900/30' },
    indigo: { text: 'text-indigo-400', border: 'border-indigo-700/50', bg: 'from-indigo-900/30' },
    violet: { text: 'text-violet-400', border: 'border-violet-700/50', bg: 'from-violet-900/30' },
    yellow: { text: 'text-yellow-400', border: 'border-yellow-700/50', bg: 'from-yellow-900/30' },
    lime: { text: 'text-lime-400', border: 'border-lime-700/50', bg: 'from-lime-900/30' },
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, color }) => {
    const c = colorMap[color] ?? colorMap.emerald;
    const display = value !== undefined ? value.toFixed(1) : '--';
    return (
        <div className={`bg-gradient-to-br ${c.bg} to-slate-900 p-4 rounded-2xl border ${c.border}`}>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</div>
            <div className="flex items-end gap-1">
                <div className="text-2xl font-black text-white">{display}</div>
                {unit && <div className={`text-sm font-bold ${c.text} mb-1`}>{unit}</div>}
            </div>
        </div>
    );
};

const HealthSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualWeight, setManualWeight] = useState('');
    const [manualBodyFat, setManualBodyFat] = useState('');
    const [manualHeight, setManualHeight] = useState('');

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
        saveBodyFat,
        saveHeight,
        openHealthSettings,
    } = useHealthKit();

    const isNative = Capacitor.isNativePlatform();

    const handleEnableSync = async () => {
        const success = await requestAuthorization();
        if (success) {
            await syncData();
        }
    };

    const handleManualSync = async () => {
        await syncData();
    };

    const handleOpenHealthSettings = async () => {
        await openHealthSettings();
    };

    const handleSaveManual = async () => {
        const weight = parseFloat(manualWeight);
        const bodyFat = parseFloat(manualBodyFat);
        const heightCm = parseFloat(manualHeight);

        if (!isNaN(weight)) {
            await saveWeight(weight);
        }
        if (!isNaN(bodyFat)) {
            await saveBodyFat(bodyFat);
        }
        if (!isNaN(heightCm)) {
            await saveHeight(heightCm / 100);
        }

        setShowManualInput(false);
        setManualWeight('');
        setManualBodyFat('');
        setManualHeight('');
    };

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
        <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
                            <span className="text-white font-medium">{isNative ? 'iOS 原生应用' : 'Web 浏览器'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">授权状态</span>
                            <span className="text-white font-medium">{isAuthorized ? '已授权' : '未授权'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">最后同步</span>
                            <span className="text-white font-medium">{formatDate(lastSync)}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3 flex-wrap">
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
                                <button
                                    onClick={handleOpenHealthSettings}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-slate-900/50"
                                >
                                    健康权限
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 最新健康数据卡片 */}
                {healthData && (
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">最新健康数据</h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <MetricCard label="体重" value={healthData.body.weight} unit="kg" color="emerald" />
                            <MetricCard label="体脂率" value={healthData.body.bodyFatPercent} unit="%" color="amber" />
                            <MetricCard label="BMI" value={healthData.body.bmi} unit="" color="purple" />
                            <MetricCard label="瘦体重" value={healthData.body.leanBodyMass} unit="kg" color="teal" />
                            <MetricCard label="身高" value={healthData.body.height ? healthData.body.height * 100 : undefined} unit="cm" color="blue" />
                            <MetricCard label="腰围" value={healthData.body.waistCircumference ? healthData.body.waistCircumference * 100 : undefined} unit="cm" color="rose" />
                            <MetricCard label="静息心率" value={healthData.heart.restingHeartRate} unit="bpm" color="red" />
                            <MetricCard label="心率变异性" value={healthData.heart.heartRateVariability} unit="ms" color="pink" />
                            <MetricCard label="血氧" value={healthData.heart.oxygenSaturation} unit="%" color="cyan" />
                            <MetricCard label="步数" value={healthData.activity.steps} unit="步" color="emerald" />
                            <MetricCard label="活动能量" value={healthData.activity.activeEnergyBurned} unit="kcal" color="orange" />
                            <MetricCard label="运动时长" value={healthData.activity.appleExerciseTime} unit="min" color="indigo" />
                            <MetricCard label="睡眠时长" value={healthData.sleep.totalSleepTime ? Math.round(healthData.sleep.totalSleepTime) : undefined} unit="min" color="violet" />
                            <MetricCard label="卡路里" value={healthData.nutrition.calories} unit="kcal" color="yellow" />
                            <MetricCard label="蛋白质" value={healthData.nutrition.protein} unit="g" color="lime" />
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

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">身高 (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={manualHeight}
                                    onChange={(e) => setManualHeight(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    placeholder="175"
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
