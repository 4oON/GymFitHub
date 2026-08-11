import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    FileText,
    ArrowLeft,
    TrendingUp,
    Clock,
    Zap,
    Target,
    Calendar,
    Dumbbell,
    Activity,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WeeklyReport, UserProfile, WorkoutSession } from '@/shared/types';
import { reportStorage } from '../services/ReportStorageService';
import { generateWeeklyReportSVG, exportWeeklyReportSVG } from '../../export/services/SVGExportService';
import { generateVectorWeeklyReportPDF } from '../../export/services/VectorPDFExportService';
import { exportWeeklyReportJSONWithOptions, isMobileApp, openJSONInBrowser, saveJSONToDevice, shareJSONToOtherApps } from '../../export/services/JSONExportService';
import { JSONExportOptionsModal } from '../../export/components/JSONExportOptionsModal';
import WorkoutSyncService from '@/services/WorkoutSyncService';
import { WeeklyReportBackendService } from '../services/WeeklyReportBackendService';
import { generateAllMissingWeeklyReports } from '../services/WeeklyReportService';
import { iOSStorage } from '@/services/iOSStorageService';

interface WeeklyReportViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

const WeeklyReportViewer: React.FC<WeeklyReportViewerProps> = ({ isOpen, onClose }) => {
    const [reports, setReports] = useState<WeeklyReport[]>([]);
    const [currentReportIndex, setCurrentReportIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [svgPreview, setSvgPreview] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

    // JSON导出选项Modal状态
    const [showJSONOptions, setShowJSONOptions] = useState(false);
    const [jsonData, setJsonData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Load reports on component mount
    useEffect(() => {
        if (isOpen) {
            loadReports();
        }
    }, [isOpen]);

    // Generate SVG preview when current report changes
    useEffect(() => {
        if (reports.length > 0 && currentReportIndex < reports.length) {
            const currentReport = reports[currentReportIndex];
            const svg = generateWeeklyReportSVG(currentReport);
            setSvgPreview(svg);
        }
    }, [reports, currentReportIndex]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollY = window.scrollY;
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    const loadReports = async () => {
        try {
            setLoading(true);
            const allReports = await reportStorage.getAllReports();

            // 🔧 修复：按年份和周数降序排序（最新的在前）
            const sortedReports = allReports.sort((a, b) => {
                if (a.year !== b.year) {
                    return b.year - a.year; // 年份降序
                }
                return b.weekNumber - a.weekNumber; // 周数降序
            });

            console.log('📊 Loaded reports:', sortedReports.map(r => `Week ${r.weekNumber}, ${r.year}`));

            setReports(sortedReports);
            setCurrentReportIndex(0); // 默认显示最新的报告
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    // 安全解析 localStorage 数据
    const safeParse = <T,>(key: string, fallback: T): T => {
        try {
            const saved = iOSStorage.getItem(key);
            return saved ? JSON.parse(saved) : fallback;
        } catch (e) {
            console.error(`Error parsing ${key}:`, e);
            return fallback;
        }
    };

    // 🆕 同步训练数据并刷新报告
    const handleSyncAndRefresh = async () => {
        try {
            setIsSyncing(true);
            setSyncMessage('同步训练数据到后端...');

            // 1. 批量同步本地训练数据到后端
            const syncResult = await WorkoutSyncService.batchSyncLocalWorkouts();
            console.log('✅ Workout sync result:', syncResult);

            if (syncResult.success) {
                setSyncMessage(`已同步 ${syncResult.stats.created} 条训练记录，正在生成缺失的报告...`);
            } else {
                setSyncMessage('同步完成，正在生成缺失的报告...');
            }

            // 2. 获取用户配置和训练历史
            const userProfile = safeParse<UserProfile>('zenfit_user_profile', { weight: 70, unit: 'kg' });
            const history = safeParse<WorkoutSession[]>('zenfit_workout_history', []);
            
            console.log('👤 User profile:', userProfile);
            console.log(`🏋️ Found ${history.length} workouts in history`);

            // 3. 生成所有缺失的周报告
            if (history.length > 0) {
                const result = await generateAllMissingWeeklyReports(history, userProfile);
                console.log(`📊 Generated ${result.generated}/${result.totalMissing} missing reports`);
                
                if (result.generated > 0) {
                    setSyncMessage(`已生成 ${result.generated} 个新报告！`);
                } else {
                    setSyncMessage('所有报告都已是最新！');
                }
            } else {
                setSyncMessage('暂无训练记录');
            }

            // 4. 重新加载报告列表
            await loadReports();

            setTimeout(() => setSyncMessage(''), 3000);
        } catch (error) {
            console.error('❌ Sync failed:', error);
            setSyncMessage('同步失败，请重试');
            setTimeout(() => setSyncMessage(''), 3000);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExportPDF = async () => {
        if (reports.length === 0) return;

        try {
            setIsExporting(true);
            const currentReport = reports[currentReportIndex];
            await generateVectorWeeklyReportPDF(currentReport);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            // ❌ Removed alert() - iOS WebView blocks this
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportJSON = async () => {
        if (reports.length === 0) return;

        setIsExporting(true);
        setJsonError(null);

        try {
            const currentReport = reports[currentReportIndex];
            const result = exportWeeklyReportJSONWithOptions(currentReport, 'CN');

            // 所有设备都显示选项Modal，让用户选择保存方式
            setJsonData({ blob: result.blob, fileName: result.fileName });
            setShowJSONOptions(true);
            console.log('✅ Weekly Report JSON生成成功，显示导出选项');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '导出JSON失败';
            console.error('❌ Weekly Report JSON导出错误:', error);
            setJsonError(errorMessage);
            // ❌ Removed alert() - iOS WebView blocks this
        } finally {
            setIsExporting(false);
        }
    };

    // 在浏览器中打开JSON
    const handleOpenJSONInBrowser = () => {
        if (!jsonData) return;

        setIsExporting(true);
        setJsonError(null);

        try {
            const success = openJSONInBrowser(jsonData.blob);
            if (success) {
                console.log('✅ Weekly Report JSON已在浏览器中打开');
                setShowJSONOptions(false);
                setJsonData(null);
            } else {
                throw new Error('浏览器阻止了弹出窗口');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '打开JSON失败';
            console.error('❌ 打开JSON错误:', error);
            setJsonError(errorMessage);
        } finally {
            setIsExporting(false);
        }
    };

    // 保存JSON到设备
    const handleSaveJSONToDevice = async () => {
        if (!jsonData) return;

        setIsExporting(true);
        setJsonError(null);

        try {
            const success = await saveJSONToDevice(jsonData.blob, jsonData.fileName);
            if (success) {
                console.log('✅ Weekly Report JSON已保存到设备');
                setShowJSONOptions(false);
                setJsonData(null);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '保存失败';
            console.error('❌ 保存JSON错误:', error);
            setJsonError(errorMessage);
        } finally {
            setIsExporting(false);
        }
    };

    // 用其他应用打开JSON
    const handleShareJSONToApp = async () => {
        if (!jsonData) return;

        setIsExporting(true);
        setJsonError(null);

        try {
            const success = await shareJSONToOtherApps(jsonData.blob, jsonData.fileName);
            if (success) {
                console.log('✅ Weekly Report JSON已分享');
                setShowJSONOptions(false);
                setJsonData(null);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '分享失败';
            console.error('❌ 分享JSON错误:', error);
            setJsonError(errorMessage);
        } finally {
            setIsExporting(false);
        }
    };

    const handlePreviousReport = () => {
        if (currentReportIndex < reports.length - 1) {
            setCurrentReportIndex(currentReportIndex + 1);
        }
    };

    const handleNextReport = () => {
        if (currentReportIndex > 0) {
            setCurrentReportIndex(currentReportIndex - 1);
        }
    };

    if (!isOpen) return null;

    const currentReport = reports[currentReportIndex];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-slate-950 pt-safe"
                >
                    {/* Header - Fixed */}
                    <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800">
                        <div className="flex items-center justify-between px-4 py-3">
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                                <ArrowLeft size={20} className="text-slate-300" />
                            </button>

                            <h1 className="text-lg font-bold text-white">
                                Weekly Reports
                            </h1>

                            {/* 🆕 同步按钮 */}
                            <button
                                onClick={handleSyncAndRefresh}
                                disabled={isSyncing}
                                className="flex items-center justify-center w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 transition-colors"
                                title="同步训练数据并刷新报告"
                            >
                                {isSyncing ? (
                                    <RefreshCw size={20} className="text-white animate-spin" />
                                ) : (
                                    <RefreshCw size={20} className="text-white" />
                                )}
                            </button>
                        </div>

                        {/* 🆕 同步状态消息 */}
                        {syncMessage && (
                            <div className="px-4 pb-2">
                                <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-2 rounded-lg text-sm text-center">
                                    {syncMessage}
                                </div>
                            </div>
                        )}

                        {/* Tab Navigation */}
                        <div className="flex px-4 pb-2 gap-2">
                            {[
                                { id: 'overview', label: 'Overview', icon: TrendingUp },
                                { id: 'details', label: 'Details', icon: Target }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="overflow-y-auto" style={{
                        height: reports.length > 1
                            ? 'calc(100vh - 180px - 140px)' // Header + Navigation + Export buttons
                            : 'calc(100vh - 180px - 80px)'  // Header + Export buttons only
                    }}>
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-slate-400">Loading reports...</p>
                                </div>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center px-4">
                                    <Calendar size={64} className="text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">No Reports Yet</h3>
                                    <p className="text-slate-400">Complete some workouts to generate your first weekly report!</p>
                                </div>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {activeTab === 'overview' && (
                                    <motion.div
                                        key="overview"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-4 space-y-4 pb-8"
                                    >
                                        {/* Report History List */}
                                        <div className="bg-slate-900 rounded-2xl border border-slate-800">
                                            <div className="p-4 border-b border-slate-800">
                                                <h3 className="font-bold text-white">Report History</h3>
                                                <p className="text-sm text-slate-400">{reports.length} reports available</p>
                                            </div>

                                            <div className="divide-y divide-slate-800">
                                                {reports.map((report, index) => (
                                                    <button
                                                        key={report.id}
                                                        onClick={() => setCurrentReportIndex(index)}
                                                        className={`w-full p-4 text-left transition-colors ${index === currentReportIndex
                                                            ? 'bg-gradient-to-r from-red-600/10 to-orange-500/10'
                                                            : 'hover:bg-slate-800/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-bold text-white">
                                                                Week {report.weekNumber}, {report.year}
                                                            </span>
                                                            {index === currentReportIndex && (
                                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-400 mb-2">
                                                            {report.dateRange.start} to {report.dateRange.end}
                                                        </p>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500">
                                                                {report.stats.workoutDays} workouts
                                                            </span>
                                                            <span className="text-red-400 font-bold">
                                                                {report.stats.totalVolume}kg
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Current Report Stats */}
                                        {currentReport && (
                                            <>
                                                {/* Date Card */}
                                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700">
                                                    <div className="text-slate-400 text-sm mb-1">
                                                        Week {currentReport.weekNumber}, {currentReport.year}
                                                    </div>
                                                    <div className="text-slate-500 text-xs">
                                                        {currentReport.dateRange.start} to {currentReport.dateRange.end}
                                                    </div>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        {
                                                            label: 'Volume',
                                                            value: currentReport.stats.totalVolume,
                                                            unit: 'kg',
                                                            gradient: 'from-red-600 to-orange-500',
                                                            icon: TrendingUp
                                                        },
                                                        {
                                                            label: 'Duration',
                                                            value: currentReport.stats.totalDuration,
                                                            unit: 'min',
                                                            gradient: 'from-blue-600 to-cyan-500',
                                                            icon: Clock
                                                        },
                                                        {
                                                            label: 'Exercises',
                                                            value: currentReport.stats.totalExercises,
                                                            unit: '',
                                                            gradient: 'from-purple-600 to-pink-500',
                                                            icon: Target
                                                        },
                                                        {
                                                            label: 'Workouts',
                                                            value: currentReport.stats.workoutDays,
                                                            unit: '',
                                                            gradient: 'from-green-600 to-emerald-500',
                                                            icon: Zap
                                                        }
                                                    ].map((stat, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="relative bg-slate-900 rounded-2xl p-4 border border-slate-800 overflow-hidden"
                                                        >
                                                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-10`} />
                                                            <div className="relative">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <stat.icon size={16} className="text-slate-400" />
                                                                    <div className="text-slate-400 text-xs font-medium">
                                                                        {stat.label}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-baseline gap-1">
                                                                    <div className="text-3xl font-black text-white">{stat.value}</div>
                                                                    {stat.unit && <div className="text-sm text-slate-500">{stat.unit}</div>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Additional Stats */}
                                                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                                                    <h3 className="text-white font-semibold mb-3">Additional Stats</h3>
                                                    <div className="grid grid-cols-2 gap-3 text-center">
                                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                                            <div className="text-slate-500 text-xs mb-1">Sets</div>
                                                            <div className="text-white font-bold text-lg">{currentReport.stats.totalSets}</div>
                                                        </div>
                                                        <div className="bg-slate-800/50 rounded-lg p-3">
                                                            <div className="text-slate-500 text-xs mb-1">Reps</div>
                                                            <div className="text-white font-bold text-lg">{currentReport.stats.totalReps}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'details' && currentReport && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="p-4 space-y-4 pb-8"
                                    >
                                        {/* 🆕 移动端友好的详细数据展示 */}

                                        {/* Muscle Distribution */}
                                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                            <div className="p-4 border-b border-slate-800">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    <Activity size={18} className="text-red-500" />
                                                    Muscle Distribution
                                                </h3>
                                            </div>
                                            <div className="p-4 space-y-3">
                                                {currentReport.muscleDistribution.slice(0, 5).map((muscle, idx) => (
                                                    <div key={idx} className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-white font-medium">{muscle.muscle}</span>
                                                            <span className="text-slate-400">{muscle.percentage.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${muscle.percentage}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                                            <span>{muscle.totalWeight}kg</span>
                                                            <span>•</span>
                                                            <span>{muscle.sets} sets</span>
                                                            <span>•</span>
                                                            <span>{muscle.exercises.length} exercises</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Workout Sessions */}
                                        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                                            <div className="p-4 border-b border-slate-800">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    <Dumbbell size={18} className="text-blue-500" />
                                                    Workout Sessions
                                                </h3>
                                            </div>
                                            <div className="divide-y divide-slate-800">
                                                {currentReport.sessions.map((session, idx) => (
                                                    <div key={idx} className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-white font-medium">
                                                                {new Date(session.date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                            <span className="text-slate-400 text-sm">
                                                                {session.durationMinutes}min
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                                            <span>{session.exercises.length} exercises</span>
                                                            <span>•</span>
                                                            <span>{session.volumeLoad}kg volume</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Progress Comparison */}
                                        {currentReport.weeklyProgress && (
                                            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                                                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                                                    <TrendingUp size={18} className="text-green-500" />
                                                    Progress vs Last Week
                                                </h3>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { label: 'Volume', value: currentReport.weeklyProgress.volumeChange },
                                                        { label: 'Sets', value: currentReport.weeklyProgress.setsChange },
                                                        { label: 'Reps', value: currentReport.weeklyProgress.repsChange }
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="bg-slate-800/50 rounded-lg p-3 text-center">
                                                            <div className="text-slate-500 text-xs mb-1">{item.label}</div>
                                                            <div className={`font-bold text-lg ${item.value > 0 ? 'text-green-400' :
                                                                item.value < 0 ? 'text-red-400' :
                                                                    'text-slate-400'
                                                                }`}>
                                                                {item.value > 0 ? '+' : ''}{item.value.toFixed(1)}%
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Bottom Actions - Fixed */}
                    {reports.length > 0 && (
                        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 space-y-3">
                            {/* 🔧 改进：导航按钮行 - 始终显示,即使只有1个报告 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePreviousReport}
                                    disabled={currentReportIndex >= reports.length - 1}
                                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ArrowLeft size={18} />
                                    <span>Older</span>
                                </button>

                                {/* 🆕 周数指示器 */}
                                <div className="flex items-center justify-center px-4 bg-slate-800/50 rounded-xl min-w-[120px]">
                                    <span className="text-white text-sm font-bold">
                                        {currentReportIndex + 1} / {reports.length}
                                    </span>
                                </div>

                                <button
                                    onClick={handleNextReport}
                                    disabled={currentReportIndex <= 0}
                                    className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <span>Newer</span>
                                    <ArrowLeft size={18} className="rotate-180" />
                                </button>
                            </div>

                            {/* 导出按钮行 */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleExportJSON}
                                    disabled={isExporting}
                                    className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl transition-all duration-200 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                                >
                                    {isExporting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <FileText size={18} />
                                            <span>JSON</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-xl transition-all duration-200 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                                >
                                    {isExporting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Download size={18} />
                                            <span>PDF</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* JSON导出选项Modal */}
                    <JSONExportOptionsModal
                        isOpen={showJSONOptions}
                        onClose={() => {
                            setShowJSONOptions(false);
                            setJsonData(null);
                            setJsonError(null);
                        }}
                        onOpenInBrowser={handleOpenJSONInBrowser}
                        onSaveToDevice={handleSaveJSONToDevice}
                        onShareToApp={handleShareJSONToApp}
                        isLoading={isExporting}
                        error={jsonError}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WeeklyReportViewer;
