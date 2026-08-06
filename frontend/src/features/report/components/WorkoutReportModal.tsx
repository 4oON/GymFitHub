import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { MuscleGroup } from '@/shared/types';
import type { WorkoutSession, UserProfile } from '@/shared/types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MUSCLE_COLORS, getMuscleColor } from '../../anatomy/constants/muscleColors';
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

    // First pass: calculate primary muscle volumes
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

        // Primary muscle gets full volume
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

        // Secondary muscles get proportional volume (but don't add to total session volume)
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

    // Convert to array and normalize to ensure total equals session volume
    const result = Array.from(grouped.values());
    const actualTotal = result.reduce((sum, item) => sum + item.totalWeight, 0);

    if (actualTotal > 0 && totalSessionVolume > 0) {
        result.forEach(item => {
            item.totalWeight = Math.round((item.totalWeight / actualTotal) * totalSessionVolume);
        });
    }

    return result.sort((a, b) => b.totalWeight - a.totalWeight);
};

export const WorkoutReportModal: React.FC<WorkoutReportModalProps> = ({
    session,
    userProfile,
    isOpen,
    onClose
}) => {
    const [isExportingJSON, setIsExportingJSON] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [enhancedSession, setEnhancedSession] = useState<WorkoutSession>(session);
    const [language, setLanguage] = useState<'CN' | 'EN'>('CN'); // Default to Chinese

    // 折叠状态
    const [showTopMuscles, setShowTopMuscles] = useState(true);
    const [showAllExercises, setShowAllExercises] = useState(false);

    // PDF导出选项Modal状态
    const [showPDFOptions, setShowPDFOptions] = useState(false);
    const [pdfData, setPdfData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);

    // JSON导出选项Modal状态
    const [showJSONOptions, setShowJSONOptions] = useState(false);
    const [jsonData, setJsonData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);

    // 测试模式：强制显示移动端Modal
    const [forceMobileMode, setForceMobileMode] = useState(false);

    // Initialize exercise name mapping and enhance session with Chinese names
    useEffect(() => {
        const enhanceExerciseNames = async () => {
            try {
                // Ensure mapping service is initialized
                await exerciseNameMapping.initialize();

                // Create enhanced session with Chinese exercise names
                const enhanced: WorkoutSession = {
                    ...session,
                    exercises: session.exercises.map(exercise => ({
                        ...exercise,
                        exerciseNameZh: exerciseNameMapping.getChineseName(exercise.exerciseName)
                    }))
                };

                setEnhancedSession(enhanced);
                console.log('✅ Enhanced session with Chinese exercise names');
            } catch (error) {
                console.error('❌ Failed to enhance exercise names:', error);
                setEnhancedSession(session); // Fallback to original session
            }
        };

        if (isOpen) {
            enhanceExerciseNames();
        }
    }, [isOpen, session]);

    if (!isOpen) return null;

    const handleJSONExport = async (forceMode: boolean = false) => {
        setIsExportingJSON(true);
        setJsonError(null);

        try {
            const result = exportHolographicJSONWithOptions(enhancedSession, userProfile, language);
            
            // 所有设备都显示选项Modal，让用户选择保存方式
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
                throw new Error('浏览器阻止了弹出窗口，请允许弹出窗口后重试');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '在浏览器中打开JSON失败';
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
            } else {
                console.log('ℹ️ 用户取消了保存操作');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '保存JSON到设备失败';
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
            } else {
                console.log('ℹ️ 用户取消了分享操作');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '分享JSON失败';
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
            // 检测环境（支持强制移动模式）
            const isMobile = isMobileApp(forceMode || forceMobileMode);
            console.log(`📱 环境检测: ${isMobile ? '移动App' : '桌面浏览器'}${forceMode || forceMobileMode ? ' (强制模式)' : ''}`);

            if (isMobile) {
                // 移动端：生成PDF并显示选项Modal
                const result = await generateWorkoutPDF(enhancedSession, userProfile, undefined, true);

                if (result && 'blob' in result) {
                    setPdfData(result);
                    setShowPDFOptions(true);
                    console.log('✅ PDF生成成功，显示导出选项');
                } else {
                    throw new Error('PDF生成失败：未返回有效数据');
                }
            } else {
                // 桌面端：直接下载
                await generateWorkoutPDF(enhancedSession, userProfile, undefined, false);
                console.log('✅ PDF已触发下载（桌面端）');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '导出PDF失败，请重试';
            console.error('❌ PDF导出错误:', error);
            setPdfError(errorMessage);
            // ❌ Removed alert() - iOS WebView blocks this
        } finally {
            setIsExportingPDF(false);
        }
    };

    // 在浏览器中打开PDF
    const handleOpenInBrowser = () => {
        if (!pdfData) return;

        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const success = openPDFInBrowser(pdfData.blob);
            if (success) {
                console.log('✅ PDF已在浏览器中打开');
                setShowPDFOptions(false);
                setPdfData(null);
            } else {
                throw new Error('浏览器阻止了弹出窗口，请允许弹出窗口后重试');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '在浏览器中打开PDF失败';
            console.error('❌ 打开PDF错误:', error);
            setPdfError(errorMessage);
        } finally {
            setIsExportingPDF(false);
        }
    };

    // 保存PDF到设备（iOS原生保存）
    const handleSaveToDevice = async () => {
        if (!pdfData) return;

        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const success = await savePDFToDevice(pdfData.blob, pdfData.fileName);
            if (success) {
                console.log('✅ PDF已保存到设备');
                setShowPDFOptions(false);
                setPdfData(null);
            } else {
                // 用户取消操作，不显示错误
                console.log('ℹ️ 用户取消了保存操作');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '保存PDF到设备失败';
            console.error('❌ 保存PDF错误:', error);
            setPdfError(errorMessage);
        } finally {
            setIsExportingPDF(false);
        }
    };

    // 用其他应用打开PDF
    const handleShareToApp = async () => {
        if (!pdfData) return;

        setIsExportingPDF(true);
        setPdfError(null);

        try {
            const success = await shareToOtherApps(pdfData.blob, pdfData.fileName);
            if (success) {
                console.log('✅ PDF已分享');
                setShowPDFOptions(false);
                setPdfData(null);
            } else {
                // 用户取消操作，不显示错误
                console.log('ℹ️ 用户取消了分享操作');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '分享PDF失败';
            console.error('❌ 分享PDF错误:', error);
            setPdfError(errorMessage);
        } finally {
            setIsExportingPDF(false);
        }
    };

    const muscleData = groupByMuscle(enhancedSession);
    const sessionDate = new Date(enhancedSession.date);
    const dateStr = sessionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Prepare chart data with proper percentage calculation
    const chartData = muscleData.map(d => ({
        name: d.muscle,
        value: d.totalWeight,
        percentage: enhancedSession.volumeLoad > 0 ? ((d.totalWeight / enhancedSession.volumeLoad) * 100).toFixed(1) : '0.0'
    }));

    // Calculate stats
    const totalExercises = enhancedSession.exercises.length;
    const totalSets = enhancedSession.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = enhancedSession.exercises.reduce((sum, ex) =>
        sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.reps, 0), 0);
    // 使用新的科学计算服务
    const estimatedCalories = (() => {
        const profile = {
            weight: userProfile.weight || 75,
            unit: 'kg' as const,
            bodyFatPercentage: 15 // 默认体脂率
        };

        try {
            const calories = CalorieCalculationService.calculateWorkoutCalories(enhancedSession, profile);
            console.log(`✅ Modal calories (new method): ${calories}`);
            return calories;
        } catch (error) {
            console.error('❌ Modal calorie calculation failed:', error);
            const duration = enhancedSession.durationMinutes || 0;
            return Math.round(duration * 4);
        }
    })();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto custom-scrollbar modal-scroll-container" onClick={(e) => e.stopPropagation()}>
                {/* Premium Minimalist Background */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-600/40 shadow-2xl p-3 sm:p-6">

                    {/* Subtle texture overlay */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-30">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(148,163,184,0.05)_0%,transparent_50%)]" />
                    </div>

                    {/* Enhanced Action Button Group */}
                    <div className="absolute top-4 right-4 z-10">
                        {/* Integrated Button Group with Premium Design */}
                        <div className="flex items-center bg-slate-800/90 backdrop-blur-xl border border-slate-600/40 rounded-xl p-1 shadow-2xl">
                            {/* Language Toggle */}
                            <div className="flex items-center bg-slate-700/50 rounded-lg p-0.5 mr-2">
                                <button
                                    onClick={() => setLanguage('CN')}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${language === 'CN'
                                        ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                                        }`}
                                >
                                    中文
                                </button>
                                <button
                                    onClick={() => setLanguage('EN')}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${language === 'EN'
                                        ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-500/25'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                                        }`}
                                >
                                    EN
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-6 bg-slate-600/50 mx-1"></div>

                            {/* Export Buttons */}
                            <div className="flex items-center gap-1">
                                {/* JSON Export Button */}
                                <button
                                    onClick={() => handleJSONExport(false)}
                                    disabled={isExportingJSON}
                                    className="p-2 bg-blue-600/80 hover:bg-blue-600 border border-blue-500/50 hover:border-blue-400 rounded-lg transition-all duration-200 text-blue-100 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
                                    title="Export JSON"
                                >
                                    {isExportingJSON ? (
                                        <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <FileText size={16} />
                                    )}
                                </button>

                                {/* PDF Export Button (Normal) */}
                                <button
                                    onClick={() => handlePDFExport(false)}
                                    disabled={isExportingPDF}
                                    className="p-2 bg-green-600/80 hover:bg-green-600 border border-green-500/50 hover:border-green-400 rounded-lg transition-all duration-200 text-green-100 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25"
                                    title="Export PDF"
                                >
                                    {isExportingPDF ? (
                                        <div className="w-4 h-4 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                </button>

                                {/* PDF Export Button (Test Mobile Mode) */}
                                <button
                                    onClick={() => handlePDFExport(true)}
                                    disabled={isExportingPDF}
                                    className="p-2 bg-purple-600/80 hover:bg-purple-600 border border-purple-500/50 hover:border-purple-400 rounded-lg transition-all duration-200 text-purple-100 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                                    title="测试移动端Modal (Test Mobile Mode)"
                                >
                                    {isExportingPDF ? (
                                        <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Globe size={16} />
                                    )}
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-6 bg-slate-600/50 mx-1"></div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="p-2 bg-slate-700/50 hover:bg-slate-600 border border-slate-600/50 hover:border-slate-500 rounded-lg transition-all duration-200 text-slate-400 hover:text-slate-200"
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Header - Compressed with Language Support */}
                    <div className="relative mb-2 sm:mb-3 p-2 sm:p-3 bg-slate-800/50 backdrop-blur-xl rounded-lg border border-slate-600/30">
                        <h1 className="text-lg sm:text-xl font-bold text-slate-100 mb-1 tracking-wide">
                            {language === 'CN' ? '训练报告' : 'Workout Report'}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400">{language === 'CN' ? '日期:' : 'Date:'}</span>
                                <span className="text-slate-200 font-medium">{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-slate-400">{language === 'CN' ? '体重:' : 'Weight:'}</span>
                                <span className="text-slate-200 font-medium">{userProfile.weight} kg</span>
                            </div>
                        </div>
                    </div>

                    {/* Bento Style Main Content */}
                    <div className="grid grid-cols-4 grid-rows-3 gap-3 sm:gap-4 mb-4 sm:mb-6 h-64 sm:h-80">

                        {/* Muscle Group Distribution - Optimized Layout */}
                        <div className="col-span-2 row-span-3 relative p-2 sm:p-3 bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-600/30 flex flex-col">
                            {/* Chart Section - Larger Donut */}
                            <div className="flex-1 flex items-center justify-center relative min-h-[120px]">
                                <div className="w-[120px] h-[120px]">
                                    <ResponsiveContainer width={120} height={120}>
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={30}
                                                outerRadius={45}
                                                paddingAngle={1}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={getMuscleColor(entry.name as MuscleGroup)}
                                                        stroke="rgba(51,65,85,0.8)"
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Center Label - Better Spacing with Language Support */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="text-xs text-slate-400 mb-0.5">
                                        {language === 'CN' ? '总重量' : 'Total Volume'}
                                    </div>
                                    <div className="text-lg font-bold text-slate-100">
                                        {enhancedSession.volumeLoad}kg
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Legend - Right Side */}
                            <div className="w-full sm:w-24 pl-1 sm:pl-2 flex flex-col justify-center mt-1 sm:mt-0">
                                <div className="max-h-24 sm:max-h-32 overflow-y-auto custom-scrollbar space-y-0.5 sm:space-y-1 pr-1">
                                    {muscleData.map((data) => (
                                        <div key={data.muscle} className="flex flex-col text-xs sm:text-sm">
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full border border-slate-600/50 flex-shrink-0"
                                                    style={{
                                                        backgroundColor: getMuscleColor(data.muscle)
                                                    }}
                                                />
                                                <span className="text-slate-300 font-medium truncate">{data.muscle}</span>
                                            </div>
                                            <div className="text-slate-400 ml-2 sm:ml-3">
                                                {Math.round(data.totalWeight)}kg {enhancedSession.volumeLoad > 0 ? ((data.totalWeight / enhancedSession.volumeLoad) * 100).toFixed(1) : '0.0'}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Bento Boxes - 6 small boxes (2x3 grid) with Language Support */}
                        {[
                            {
                                labelCN: '总动作数',
                                labelEN: 'Total Exercises',
                                value: totalExercises.toString(),
                                highlight: false
                            },
                            {
                                labelCN: '总组数',
                                labelEN: 'Total Sets',
                                value: totalSets.toString(),
                                highlight: false
                            },
                            {
                                labelCN: '总次数',
                                labelEN: 'Total Reps',
                                value: totalReps.toString(),
                                highlight: false
                            },
                            {
                                labelCN: '总重量',
                                labelEN: 'Total Volume',
                                value: `${enhancedSession.volumeLoad} kg`,
                                highlight: true
                            },
                            {
                                labelCN: '训练时长',
                                labelEN: 'Duration',
                                value: `${enhancedSession.durationMinutes || 0} ${language === 'CN' ? '分钟' : 'min'}`,
                                highlight: true
                            },
                            {
                                labelCN: '预估卡路里',
                                labelEN: 'Est. Calories',
                                value: `${estimatedCalories} ${language === 'CN' ? '千卡' : 'kcal'}`,
                                highlight: true
                            },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className={`relative p-2 sm:p-3 backdrop-blur-xl rounded-lg border transition-all ${stat.highlight
                                    ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50 hover:border-blue-400/70 shadow-lg shadow-blue-500/10'
                                    : 'bg-slate-800/40 border-slate-600/30 hover:border-slate-500/50'
                                    }`}
                            >
                                <div className={`text-xs sm:text-sm mb-0.5 ${stat.highlight ? 'text-blue-300' : 'text-slate-400'}`}>
                                    {language === 'CN' ? stat.labelCN : stat.labelEN}
                                </div>
                                <div className={`text-base sm:text-lg font-semibold ${stat.highlight ? 'text-blue-100' : 'text-slate-100'}`}>
                                    {stat.value}
                                </div>
                                {stat.highlight && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg pointer-events-none" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Top 3 Muscle Groups - Collapsible Compact Layout */}
                    <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-lg border border-slate-600/30 mb-2 sm:mb-3">
                        {/* Collapsible Header */}
                        <button
                            onClick={() => setShowTopMuscles(!showTopMuscles)}
                            className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-slate-700/30 transition-colors rounded-lg"
                        >
                            <h2 className="text-sm sm:text-base font-semibold text-slate-200">
                                {language === 'CN' ? '主要肌群详情' : 'Top Muscle Groups'}
                                <span className="text-xs text-slate-400 ml-1 sm:ml-2">
                                    ({muscleData.slice(0, 3).length} {language === 'CN' ? '个肌群' : 'groups'})
                                </span>
                            </h2>
                            {showTopMuscles ? (
                                <ChevronUp size={16} className="text-slate-400" />
                            ) : (
                                <ChevronDown size={16} className="text-slate-400" />
                            )}
                        </button>

                        {/* Collapsible Content */}
                        {showTopMuscles && (
                            <div className="px-2 pb-2 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-1 sm:gap-2">
                                {muscleData.slice(0, 3).map((muscleGroup, index) => {
                                    // Get exercises for this muscle group
                                    const muscleExercises = enhancedSession.exercises.filter(ex =>
                                        ex.muscleGroup === muscleGroup.muscle &&
                                        ex.sets.some(s => s.completed)
                                    );

                                    return (
                                        <div key={muscleGroup.muscle} className="bg-slate-900/50 rounded-md border border-slate-700/40 p-2">
                                            {/* Muscle Header - Ultra Compact */}
                                            <div className="flex items-center gap-1 mb-1">
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full border border-slate-600/50 flex-shrink-0"
                                                    style={{
                                                        backgroundColor: getMuscleColor(muscleGroup.muscle)
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xs font-semibold text-slate-200">{muscleGroup.muscle}</h3>
                                                        <span className="text-xs text-slate-400">
                                                            {Math.round(muscleGroup.totalWeight)}kg
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Exercise List - Ultra Compact */}
                                            <div className="space-y-0.5 max-h-24 overflow-y-auto custom-scrollbar text-xs">
                                                {muscleExercises.map((ex) => {
                                                    const completedSets = ex.sets.filter(s => s.completed);
                                                    const weights = completedSets.map(s => s.weight);
                                                    const reps = completedSets.map(s => s.reps);

                                                    // Format reps as x1,x2,x3 instead of ranges
                                                    const repsDisplay = reps.map((rep, idx) => `${rep}`).join(',');

                                                    // Format weights as y1,y2,y3 kg instead of ranges
                                                    const weightsDisplay = weights.length > 0
                                                        ? weights.map(w => `${w}`).join(',') + 'kg'
                                                        : '0kg';

                                                    return (
                                                        <div key={ex.id} className="bg-slate-800/30 rounded px-2 py-1">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="text-slate-300 font-medium truncate flex-1 min-w-0">
                                                                    {language === 'CN' ? (ex.exerciseNameZh || ex.exerciseName) : ex.exerciseName}
                                                                </span>
                                                                <span className="text-slate-400 text-xs flex-shrink-0">
                                                                    {completedSets.length}×{weightsDisplay}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* All Exercise Details - Collapsible Compressed Layout */}
                    <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-lg border border-slate-600/30">
                        {/* Collapsible Header */}
                        <button
                            onClick={() => setShowAllExercises(!showAllExercises)}
                            className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-slate-700/30 transition-colors rounded-lg"
                        >
                            <h2 className="text-sm sm:text-base font-semibold text-slate-200">
                                {language === 'CN' ? '所有动作详情' : 'All Exercise Details'}
                                <span className="text-xs text-slate-400 ml-1 sm:ml-2">
                                    ({enhancedSession.exercises.filter(ex => ex.sets.some(s => s.completed)).length} {language === 'CN' ? '个动作' : 'exercises'})
                                </span>
                            </h2>
                            {showAllExercises ? (
                                <ChevronUp size={16} className="text-slate-400" />
                            ) : (
                                <ChevronDown size={16} className="text-slate-400" />
                            )}
                        </button>

                        {/* Collapsible Content */}
                        {showAllExercises && (
                            <div className="px-2 pb-2 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto custom-scrollbar pr-1 modal-scroll-container">
                                {enhancedSession.exercises.map((ex) => {
                                    const completedSets = ex.sets.filter(s => s.completed);
                                    if (completedSets.length === 0) return null;

                                    const weights = completedSets.map(s => s.weight);
                                    const reps = completedSets.map(s => s.reps);

                                    // Format reps as x1,x2,x3 instead of ranges
                                    const repsDisplay = reps.map((rep, idx) => `${rep}`).join(',');

                                    // Format weights as y1,y2,y3 kg instead of ranges
                                    const weightsDisplay = weights.length > 0
                                        ? weights.map(w => `${w}`).join(',') + 'kg'
                                        : '0kg';

                                    return (
                                        <div
                                            key={ex.id}
                                            className="flex items-center justify-between p-2 bg-slate-900/40 rounded-md border border-slate-700/40 hover:border-slate-600/60 transition-all text-xs"
                                        >
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                <div
                                                    className="w-1 h-1 rounded-full border border-slate-600/50 flex-shrink-0"
                                                    style={{
                                                        backgroundColor: getMuscleColor(ex.muscleGroup)
                                                    }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-slate-200 font-medium truncate">
                                                        {language === 'CN' ? (ex.exerciseNameZh || ex.exerciseName) : ex.exerciseName}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 text-xs flex-shrink-0">
                                                <span className="text-slate-400">{completedSets.length}×</span>
                                                <span className="text-slate-300">{weightsDisplay}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PDF导出选项Modal */}
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
                isLoading={isExportingJSON}
                error={jsonError}
            />
        </div>
    );
};