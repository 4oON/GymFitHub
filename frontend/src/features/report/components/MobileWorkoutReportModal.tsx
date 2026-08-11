import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, ChevronRight, TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MuscleGroup } from '@/shared/types';
import type { WorkoutSession, UserProfile } from '@/shared/types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getMuscleColor } from '../../anatomy/constants/muscleColors';
import CalorieCalculationService from '@/services/CalorieCalculationService';
import { VolumeCalculationService } from '@/features/workout/services/VolumeCalculationService';
import { exportHolographicJSONWithOptions, isMobileApp, openJSONInBrowser, saveJSONToDevice, shareJSONToOtherApps } from '../../export/services/JSONExportService';
import { JSONExportOptionsModal } from '../../export/components/JSONExportOptionsModal';
import {
    generateWorkoutPDF,
    openPDFInBrowser,
    savePDFToDevice,
    shareToOtherApps
} from '../../export/services/PDFExportService';
import { PDFExportOptionsModal } from '../../export/components/PDFExportOptionsModal';
import { exerciseNameMapping } from '../../exercise/services/ExerciseNameMappingService';

interface WorkoutReportModalProps {
    session: WorkoutSession;
    userProfile: UserProfile;
    isOpen: boolean;
    onClose: () => void;
}

interface MuscleGroupData {
    muscle: MuscleGroup;
    totalWeight: number;
    totalSets: number;
    exerciseCount: number;
}

const groupByMuscle = (session: WorkoutSession): MuscleGroupData[] => {
    const grouped = new Map<MuscleGroup, MuscleGroupData>();
    let totalSessionVolume = 0;

    session.exercises.forEach(ex => {
        const completedSets = ex.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        // Use VolumeCalculationService for accurate volume calculation
        const exerciseVolume = VolumeCalculationService.calculateActiveExerciseVolume(
            ex,
            [], // Exercise library not available in this context
            {} // Use default bodyweight
        );

        if (exerciseVolume === 0) return;
        totalSessionVolume += exerciseVolume;

        if (!grouped.has(ex.muscleGroup)) {
            grouped.set(ex.muscleGroup, {
                muscle: ex.muscleGroup,
                totalWeight: 0,
                totalSets: 0,
                exerciseCount: 0
            });
        }

        const data = grouped.get(ex.muscleGroup)!;
        data.totalWeight += exerciseVolume;
        data.totalSets += completedSets.length;
        data.exerciseCount += 1;

        if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
            const secondaryWeight = exerciseVolume * 0.3 / ex.secondaryMuscles.length;
            ex.secondaryMuscles.forEach(muscle => {
                if (!grouped.has(muscle)) {
                    grouped.set(muscle, {
                        muscle: muscle,
                        totalWeight: 0,
                        totalSets: 0,
                        exerciseCount: 0
                    });
                }
                const secondaryData = grouped.get(muscle)!;
                secondaryData.totalWeight += secondaryWeight;
            });
        }
    });

    const result = Array.from(grouped.values());
    const actualTotal = result.reduce((sum, item) => sum + item.totalWeight, 0);

    if (actualTotal > 0 && totalSessionVolume > 0) {
        result.forEach(item => {
            item.totalWeight = Math.round((item.totalWeight / actualTotal) * totalSessionVolume);
        });
    }

    return result.sort((a, b) => b.totalWeight - a.totalWeight);
};

export const MobileWorkoutReportModal: React.FC<WorkoutReportModalProps> = ({
    session,
    userProfile,
    isOpen,
    onClose
}) => {
    const [isExportingJSON, setIsExportingJSON] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [enhancedSession, setEnhancedSession] = useState<WorkoutSession>(session);
    const [language, setLanguage] = useState<'CN' | 'EN'>('CN');
    const [activeTab, setActiveTab] = useState<'overview' | 'muscles' | 'exercises'>('overview');

    const [showPDFOptions, setShowPDFOptions] = useState(false);
    const [pdfData, setPdfData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);

    // JSON导出选项Modal状态
    const [showJSONOptions, setShowJSONOptions] = useState(false);
    const [jsonData, setJsonData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);

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

    useEffect(() => {
        const enhanceExerciseNames = async () => {
            try {
                await exerciseNameMapping.initialize();
                const enhanced: WorkoutSession = {
                    ...session,
                    exercises: session.exercises.map(exercise => ({
                        ...exercise,
                        exerciseNameZh: exerciseNameMapping.getChineseName(exercise.exerciseName)
                    }))
                };
                setEnhancedSession(enhanced);
            } catch (error) {
                console.error('❌ Failed to enhance exercise names:', error);
                setEnhancedSession(session);
            }
        };

        if (isOpen) {
            enhanceExerciseNames();
        }
    }, [isOpen, session]);

    if (!isOpen) return null;

    const handleJSONExport = async () => {
        setIsExportingJSON(true);
        setJsonError(null);

        try {
            const result = exportHolographicJSONWithOptions(enhancedSession, userProfile, language);
            setJsonData({ blob: result.blob, fileName: result.fileName });
            setShowJSONOptions(true);
            console.log('✅ JSON生成成功，显示导出选项');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '导出JSON失败';
            console.error('❌ JSON导出错误:', error);
            setJsonError(errorMessage);
            // ❌ Removed alert() - iOS WebView blocks this
        } finally {
            setIsExportingJSON(false);
        }
    };

    // 在浏览器中打开JSON
    const handleOpenJSONInBrowser = () => {
        if (!jsonData) return;

        setIsExportingJSON(true);
        setJsonError(null);

        try {
            const success = openJSONInBrowser(jsonData.blob);
            if (success) {
                console.log('✅ JSON已在浏览器中打开');
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
            setIsExportingJSON(false);
        }
    };

    // 保存JSON到设备
    const handleSaveJSONToDevice = async () => {
        if (!jsonData) return;

        setIsExportingJSON(true);
        setJsonError(null);

        try {
            const success = await saveJSONToDevice(jsonData.blob, jsonData.fileName);
            if (success) {
                console.log('✅ JSON已保存到设备');
                setShowJSONOptions(false);
                setJsonData(null);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '保存失败';
            console.error('❌ 保存JSON错误:', error);
            setJsonError(errorMessage);
        } finally {
            setIsExportingJSON(false);
        }
    };

    // 用其他应用打开JSON
    const handleShareJSONToApp = async () => {
        if (!jsonData) return;

        setIsExportingJSON(true);
        setJsonError(null);

        try {
            const success = await shareJSONToOtherApps(jsonData.blob, jsonData.fileName);
            if (success) {
                console.log('✅ JSON已分享');
                setShowJSONOptions(false);
                setJsonData(null);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '分享失败';
            console.error('❌ 分享JSON错误:', error);
            setJsonError(errorMessage);
        } finally {
            setIsExportingJSON(false);
        }
    };

    const handlePDFExport = async (forceMode: boolean = false) => {
        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const isMobile = isMobileApp(forceMode);
            console.log(`📱 环境检测: ${isMobile ? '移动App' : '桌面浏览器'}`);

            if (isMobile) {
                const result = await generateWorkoutPDF(enhancedSession, userProfile, undefined, true);
                if (result && 'blob' in result) {
                    setPdfData(result);
                    setShowPDFOptions(true);
                } else {
                    throw new Error('PDF生成失败');
                }
            } else {
                await generateWorkoutPDF(enhancedSession, userProfile, undefined, false);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '导出PDF失败';
            console.error('❌ PDF导出错误:', error);
            setPdfError(errorMessage);
            // ❌ Removed alert() - iOS WebView blocks this
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleOpenInBrowser = () => {
        if (!pdfData) return;
        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const success = openPDFInBrowser(pdfData.blob);
            if (success) {
                setShowPDFOptions(false);
                setPdfData(null);
            } else {
                throw new Error('浏览器阻止了弹出窗口');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '打开PDF失败';
            setPdfError(errorMessage);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleSaveToDevice = async () => {
        if (!pdfData) return;
        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const success = await savePDFToDevice(pdfData.blob, pdfData.fileName);
            if (success) {
                setShowPDFOptions(false);
                setPdfData(null);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '保存失败';
            setPdfError(errorMessage);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleShareToApp = async () => {
        if (!pdfData) return;
        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const success = await shareToOtherApps(pdfData.blob, pdfData.fileName);
            if (success) {
                setShowPDFOptions(false);
                setPdfData(null);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '分享失败';
            setPdfError(errorMessage);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const muscleData = groupByMuscle(enhancedSession);
    const sessionDate = new Date(enhancedSession.date);
    const dateStr = sessionDate.toLocaleDateString(language === 'CN' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const chartData = muscleData.map(d => ({
        name: d.muscle,
        value: d.totalWeight,
        percentage: enhancedSession.volumeLoad > 0 ? ((d.totalWeight / enhancedSession.volumeLoad) * 100).toFixed(1) : '0.0'
    }));

    const totalExercises = enhancedSession.exercises.length;
    const totalSets = enhancedSession.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = enhancedSession.exercises.reduce((sum, ex) =>
        sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.reps, 0), 0);

    const estimatedCalories = (() => {
        const profile = {
            weight: userProfile.weight || 75,
            unit: 'kg' as const,
            bodyFatPercentage: 15
        };

        try {
            return CalorieCalculationService.calculateWorkoutCalories(enhancedSession, profile);
        } catch (error) {
            const duration = enhancedSession.durationMinutes || 0;
            return Math.round(duration * 4);
        }
    })();

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
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} className="text-slate-300" />
                            </button>

                            <h1 className="text-lg font-bold text-white">
                                {language === 'CN' ? '训练报告' : 'Workout Report'}
                            </h1>

                            <button
                                onClick={() => setLanguage(language === 'CN' ? 'EN' : 'CN')}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium text-slate-300"
                            >
                                {language === 'CN' ? 'EN' : '中'}
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex px-4 pb-2 gap-2">
                            {[
                                { id: 'overview', labelCN: '概览', labelEN: 'Overview', icon: TrendingUp },
                                { id: 'muscles', labelCN: '肌群', labelEN: 'Muscles', icon: Target },
                                { id: 'exercises', labelCN: '动作', labelEN: 'Exercises', icon: Zap }
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
                                    <span>{language === 'CN' ? tab.labelCN : tab.labelEN}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="overflow-y-auto" style={{ height: 'calc(100vh - 180px - 80px)' }}>
                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 space-y-4 pb-8"
                                >
                                    {/* Date Card */}
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700">
                                        <div className="text-slate-400 text-sm mb-1">{dateStr}</div>
                                        <div className="text-slate-500 text-xs">体重: {userProfile.weight}kg</div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                labelCN: '总重量',
                                                labelEN: 'Volume',
                                                value: enhancedSession.volumeLoad,
                                                unit: 'kg',
                                                gradient: 'from-red-600 to-orange-500',
                                                icon: TrendingUp
                                            },
                                            {
                                                labelCN: '时长',
                                                labelEN: 'Duration',
                                                value: enhancedSession.durationMinutes || 0,
                                                unit: 'min',
                                                gradient: 'from-blue-600 to-cyan-500',
                                                icon: Clock
                                            },
                                            {
                                                labelCN: '动作',
                                                labelEN: 'Exercises',
                                                value: totalExercises,
                                                unit: '',
                                                gradient: 'from-purple-600 to-pink-500',
                                                icon: Target
                                            },
                                            {
                                                labelCN: '卡路里',
                                                labelEN: 'Calories',
                                                value: estimatedCalories,
                                                unit: 'kcal',
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
                                                            {language === 'CN' ? stat.labelCN : stat.labelEN}
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

                                    {/* Pie Chart */}
                                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                                        <h3 className="text-white font-semibold mb-4">
                                            {language === 'CN' ? '肌群分布' : 'Muscle Distribution'}
                                        </h3>
                                        <div className="flex items-center justify-center">
                                            <div className="relative w-48 h-48">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={chartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius="60%"
                                                            outerRadius="90%"
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                        >
                                                            {chartData.map((entry, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={getMuscleColor(entry.name as MuscleGroup)}
                                                                    stroke="rgba(15,23,42,0.9)"
                                                                    strokeWidth={2}
                                                                />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <div className="text-xs text-slate-500 mb-1">
                                                        {language === 'CN' ? '总量' : 'Total'}
                                                    </div>
                                                    <div className="text-3xl font-black text-white">
                                                        {enhancedSession.volumeLoad}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">kg</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'muscles' && (
                                <motion.div
                                    key="muscles"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 space-y-3 pb-8"
                                >
                                    {muscleData.map((data, index) => {
                                        const percentage = ((data.totalWeight / enhancedSession.volumeLoad) * 100).toFixed(1);
                                        const muscleExercises = enhancedSession.exercises.filter(ex =>
                                            ex.muscleGroup === data.muscle && ex.sets.some(s => s.completed)
                                        );

                                        return (
                                            <div
                                                key={data.muscle}
                                                className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                                        style={{
                                                            backgroundColor: getMuscleColor(data.muscle),
                                                            boxShadow: `0 0 12px ${getMuscleColor(data.muscle)}60`
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-white font-semibold">{data.muscle}</div>
                                                        <div className="text-slate-400 text-sm">
                                                            {Math.round(data.totalWeight)}kg · {percentage}%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            background: `linear-gradient(90deg, ${getMuscleColor(data.muscle)}, ${getMuscleColor(data.muscle)}dd)`
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    {muscleExercises.map((ex) => {
                                                        const completedSets = ex.sets.filter(s => s.completed);
                                                        const weights = completedSets.map(s => s.weight);
                                                        const weightsDisplay = weights.length > 0
                                                            ? weights.map(w => `${w}`).join(',') + 'kg'
                                                            : '0kg';

                                                        return (
                                                            <div
                                                                key={ex.id}
                                                                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                                                            >
                                                                <div className="text-slate-300 text-sm font-medium truncate flex-1">
                                                                    {language === 'CN' ? (ex.exerciseNameZh || ex.exerciseName) : ex.exerciseName}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm flex-shrink-0">
                                                                    <span className="text-slate-400">{completedSets.length}×</span>
                                                                    <span className="text-slate-300">{weightsDisplay}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {activeTab === 'exercises' && (
                                <motion.div
                                    key="exercises"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="p-4 space-y-2 pb-8"
                                >
                                    {enhancedSession.exercises.map((ex) => {
                                        const completedSets = ex.sets.filter(s => s.completed);
                                        if (completedSets.length === 0) return null;

                                        const weights = completedSets.map(s => s.weight);
                                        const reps = completedSets.map(s => s.reps);
                                        const weightsDisplay = weights.length > 0
                                            ? weights.map(w => `${w}`).join(',') + 'kg'
                                            : '0kg';
                                        const repsDisplay = reps.map(r => `${r}`).join(',');

                                        return (
                                            <div
                                                key={ex.id}
                                                className="bg-slate-900 rounded-2xl p-4 border border-slate-800"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: getMuscleColor(ex.muscleGroup) }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-white font-semibold">
                                                            {language === 'CN' ? (ex.exerciseNameZh || ex.exerciseName) : ex.exerciseName}
                                                        </div>
                                                        <div className="text-slate-400 text-sm">{ex.muscleGroup}</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="bg-slate-800/50 rounded-lg p-2">
                                                        <div className="text-slate-500 text-xs mb-1">
                                                            {language === 'CN' ? '组数' : 'Sets'}
                                                        </div>
                                                        <div className="text-white font-bold">{completedSets.length}</div>
                                                    </div>
                                                    <div className="bg-slate-800/50 rounded-lg p-2">
                                                        <div className="text-slate-500 text-xs mb-1">
                                                            {language === 'CN' ? '重量' : 'Weight'}
                                                        </div>
                                                        <div className="text-white font-bold text-xs">{weightsDisplay}</div>
                                                    </div>
                                                    <div className="bg-slate-800/50 rounded-lg p-2">
                                                        <div className="text-slate-500 text-xs mb-1">
                                                            {language === 'CN' ? '次数' : 'Reps'}
                                                        </div>
                                                        <div className="text-white font-bold text-xs">{repsDisplay}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Actions - Fixed */}
                    <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4">
                        <div className="flex gap-3">
                            <button
                                onClick={handleJSONExport}
                                disabled={isExportingJSON}
                                className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl transition-all duration-200 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                            >
                                {isExportingJSON ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FileText size={18} />
                                        <span>JSON</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handlePDFExport(true)}
                                disabled={isExportingPDF}
                                className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-xl transition-all duration-200 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                            >
                                {isExportingPDF ? (
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

                    <PDFExportOptionsModal
                        isOpen={showPDFOptions}
                        onClose={() => {
                            setShowPDFOptions(false);
                            setPdfData(null);
                            setPdfError(null);
                        }}
                        onOpenInBrowser={handleOpenInBrowser}
                        onSaveToDevice={handleSaveToDevice}
                        onShareToApp={handleShareToApp}
                        isLoading={isExportingPDF}
                        error={pdfError}
                    />

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
                        isLoading={isExportingJSON}
                        error={jsonError}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
