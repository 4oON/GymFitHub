import React, { useMemo, useState, useEffect } from 'react';
import { MuscleGroup } from '@/shared/types';
import type { RecoveryStatus, WorkoutSession, ActiveExercise } from '@/shared/types';
import { Battery, Clock, Calendar as CalendarIcon, Flame, Scale, Activity, CheckCircle2, Download, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Zap, Eye, Copy } from 'lucide-react';
import { RecoveryHeatmapView } from './RecoveryHeatmapView';
import { AchievementHall } from '@/features/pr';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { usePDFExport } from '@/shared/hooks/usePDFExport';
import { WorkoutReportModal } from './WorkoutReportModal';
import { MUSCLE_COLORS, getMuscleColor, LEGACY_COLORS } from '../../anatomy/constants/muscleColors';
import CalorieCalculationService from '@/services/CalorieCalculationService';
import { VolumeCalculationService } from '@/features/workout/services/VolumeCalculationService';
import {
    generateWorkoutPDF,
    isMobileApp,
    openPDFInBrowser,
    savePDFToDevice,
    shareToOtherApps
} from '../../export/services/PDFExportService';
import { PDFExportOptionsModal } from '../../export/components/PDFExportOptionsModal';

interface ProgressViewProps {
    history: WorkoutSession[];
    recoveryState: RecoveryStatus[];
    userProfile: { weight: number, unit: 'kg' | 'lbs' };
    onDeleteSession: (sessionId: string) => void;
    onCopyToActiveWorkout?: (exercises: ActiveExercise[]) => void;
}

// --- HELPERS ---
const estimateCalories = (session: WorkoutSession, bodyWeightKg: number = 75): number => {
    // 使用新的科学计算服务
    const userProfile = {
        weight: bodyWeightKg,
        unit: 'kg' as const,
        bodyFatPercentage: 15 // 默认体脂率
    };

    try {
        const calories = CalorieCalculationService.calculateWorkoutCalories(session, userProfile);
        // 移除频繁的 console.log 以提高性能
        // console.log(`✅ ProgressView calories (new method): ${calories}`);
        return calories;
    } catch (error) {
        console.error('❌ ProgressView calorie calculation failed:', error);
        // 简单fallback
        const duration = session.durationMinutes || 0;
        return Math.round(duration * 4);
    }
};

const calculateMuscleDistribution = (exercises: ActiveExercise[]) => {
    const distribution: Record<string, number> = {};
    let totalVolume = 0;

    exercises.forEach(ex => {
        // Use VolumeCalculationService for accurate calculation
        const exerciseVolume = VolumeCalculationService.calculateActiveExerciseVolume(
            ex,
            [], // Exercise library not available in this context
            {} // Use default bodyweight
        );

        if (exerciseVolume === 0) return;

        // Primary muscle gets full weight
        distribution[ex.muscleGroup] = (distribution[ex.muscleGroup] || 0) + exerciseVolume;
        totalVolume += exerciseVolume;

        // Secondary muscles get proportional weight (but don't add to total volume)
        if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
            const secondaryWeight = exerciseVolume * 0.3 / ex.secondaryMuscles.length;
            ex.secondaryMuscles.forEach(muscle => {
                distribution[muscle] = (distribution[muscle] || 0) + secondaryWeight;
            });
        }
    });

    // Normalize to ensure total equals 100%
    const result = Object.keys(distribution).map(key => ({
        name: key,
        value: Math.round(distribution[key])
    }));

    // Calculate actual total and normalize
    const actualTotal = result.reduce((sum, item) => sum + item.value, 0);
    if (actualTotal > 0) {
        result.forEach(item => {
            item.value = Math.round((item.value / actualTotal) * totalVolume);
        });
    }

    return result.sort((a, b) => b.value - a.value);
};

// --- CALENDAR WIDGET ---
const CalendarWidget: React.FC<{ history: WorkoutSession[], onSelectDate: (date: Date | null) => void, selectedDate: Date | null }> = ({ history, onSelectDate, selectedDate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExpanded, setIsExpanded] = useState(false);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const workoutDays = useMemo(() => {
        const days = new Set<number>();
        history.forEach(session => {
            const d = new Date(session.date);
            if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
                days.add(d.getDate());
            }
        });
        return days;
    }, [history, currentDate]);

    const prevMonth = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); };
    const nextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mb-6 transition-all duration-300">
            <div
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-800/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-slate-800 p-2 rounded-xl text-emerald-500">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Workout Calendar</h3>
                        <p className="text-slate-500 text-xs">
                            {selectedDate ? selectedDate.toLocaleDateString() : 'View History'}
                        </p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold text-sm">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white"><ChevronLeft size={18} /></button>
                            <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-white"><ChevronRight size={18} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                            <div key={`day-${idx}`} className="text-[10px] font-bold text-slate-600">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const hasWorkout = workoutDays.has(day);
                            const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();

                            return (
                                <button
                                    key={day}
                                    onClick={() => {
                                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                        onSelectDate(isSelected ? null : newDate);
                                    }}
                                    className={`aspect-square flex items-center justify-center relative rounded-xl transition-all
                                        ${isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/50' : (hasWorkout ? 'bg-slate-800 text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-800/50')}
                                    `}
                                >
                                    <span className="text-xs font-bold">{day}</span>
                                    {hasWorkout && !isSelected && (
                                        <div className="absolute bottom-1.5 w-1 h-1 bg-emerald-500 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


const ProgressView: React.FC<ProgressViewProps> = ({ history, recoveryState, userProfile, onDeleteSession, onCopyToActiveWorkout }) => {
    const [now, setNow] = useState(Date.now());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);
    const [selectedReportSession, setSelectedReportSession] = useState<WorkoutSession | null>(null);

    // 用于自动滚动到最新记录
    const latestSessionRef = React.useRef<HTMLDivElement>(null);

    // PDF导出相关状态
    const [showPDFOptions, setShowPDFOptions] = useState(false);
    const [pdfData, setPdfData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Filter History and ensure proper sorting
    const filteredHistory = useMemo(() => {
        console.log('📊 原始history数据:', history.map(s => {
            const dateObj = new Date(s.date);
            const isValidDate = !isNaN(dateObj.getTime());
            return {
                id: s.id,
                date: s.date,
                isValid: isValidDate,
                dateObj: isValidDate ? dateObj.toISOString() : 'Invalid Date',
                volume: s.volumeLoad
            };
        }));

        // 🆕 数据质量验证：过滤掉明显异常的记录
        const validHistory = history.filter(session => {
            // 1. 日期验证
            if (session.date === null || session.date === undefined) {
                console.warn('⚠️ 记录date字段为null/undefined，已过滤:', session.id);
                return false;
            }

            if (session.date === 0) {
                console.warn('⚠️ 记录date字段为0，已过滤:', session.id);
                return false;
            }

            const d = new Date(session.date);
            const isValidDate = !isNaN(d.getTime());

            if (!isValidDate) {
                console.warn('⚠️ 无效日期记录，已过滤:', {
                    id: session.id,
                    date: session.date,
                    type: typeof session.date
                });
                return false;
            }

            // 2. 数据合理性验证
            // 过滤掉明显异常的volume数据（> 100,000 kg 视为异常）
            // 正常训练volume范围：5,000-30,000kg，保守设置为100,000kg阈值
            if (session.volumeLoad > 100000) {
                console.warn('⚠️ 异常volume数据，已过滤:', {
                    id: session.id,
                    volume: session.volumeLoad,
                    date: d.toISOString()
                });
                return false;
            }

            // 🆕 3. 过滤掉volume为0或负数的记录（误点但无数据）
            if (!session.volumeLoad || session.volumeLoad <= 0) {
                console.warn('⚠️ Volume为0的记录，已过滤:', {
                    id: session.id,
                    volume: session.volumeLoad,
                    date: d.toISOString()
                });
                return false;
            }

            // 4. 过滤掉空训练记录（没有任何动作）
            if (!session.exercises || session.exercises.length === 0) {
                console.warn('⚠️ 空训练记录，已过滤:', {
                    id: session.id,
                    date: d.toISOString()
                });
                return false;
            }

            // 5. 过滤掉所有动作都没有完成组数的记录
            const hasCompletedSets = session.exercises.some(ex =>
                ex.sets && ex.sets.some(set => set.completed)
            );

            if (!hasCompletedSets) {
                console.warn('⚠️ 无完成组数的记录，已过滤:', {
                    id: session.id,
                    date: d.toISOString()
                });
                return false;
            }

            // 🆕 6. 过滤掉训练时长异常的记录（小于5分钟或大于10小时）
            const duration = session.durationMinutes || 0;
            if (duration < 5 || duration > 600) {
                console.warn('⚠️ 训练时长异常，已过滤:', {
                    id: session.id,
                    duration: duration,
                    date: d.toISOString()
                });
                return false;
            }

            return true;
        });

        // 🆕 去重：同一天相同动作组的重复记录，只保留volume最大的
        const generateFingerprint = (session: WorkoutSession): string => {
            const date = new Date(session.date);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const exerciseIds = session.exercises
                .map(ex => ex.exerciseId)
                .sort()
                .join(',');
            return `${dateKey}|${exerciseIds}`;
        };

        const fingerprintMap = new Map<string, WorkoutSession>();
        for (const session of validHistory) {
            const fingerprint = generateFingerprint(session);
            
            if (!fingerprintMap.has(fingerprint)) {
                fingerprintMap.set(fingerprint, session);
            } else {
                // 已存在相同日期的相同动作组，保留volume更大的
                const existing = fingerprintMap.get(fingerprint)!;
                if (session.volumeLoad > existing.volumeLoad) {
                    console.log(`🔄 替换为更大volume的重复记录: ${session.id} (${session.volumeLoad}) > ${existing.id} (${existing.volumeLoad})`);
                    fingerprintMap.set(fingerprint, session);
                } else {
                    console.log(`🔄 跳过重复记录: ${session.id} (volume: ${session.volumeLoad} <= ${existing.volumeLoad})`);
                }
            }
        }

        const dedupedHistory = Array.from(fingerprintMap.values());
        const dedupedCount = validHistory.length - dedupedHistory.length;

        console.log(`✅ 有效记录: ${validHistory.length}/${history.length}, 去重后: ${dedupedHistory.length} (过滤 ${history.length - validHistory.length} 条异常, 合并 ${dedupedCount} 条重复)`);

        let filtered = selectedDate
            ? dedupedHistory.filter(session => {
                const d = new Date(session.date);
                return d.getDate() === selectedDate.getDate() &&
                    d.getMonth() === selectedDate.getMonth() &&
                    d.getFullYear() === selectedDate.getFullYear();
            })
            : dedupedHistory;

        // 确保按日期降序排序（最新的在前）
        const sorted = [...filtered].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA; // 降序：最新的在前
        });

        console.log('✅ 排序后的数据:', sorted.map(s => {
            const dateObj = new Date(s.date);
            return {
                id: s.id,
                date: s.date,
                dateObj: dateObj.toISOString()
            };
        }));

        return sorted;
    }, [history, selectedDate]);

    // 自动滚动到最新记录（仅在首次加载且没有选择日期时）
    React.useEffect(() => {
        if (!selectedDate && filteredHistory.length > 0 && latestSessionRef.current) {
            // 使用更长的延迟确保所有内容都已渲染
            const scrollTimer = setTimeout(() => {
                if (latestSessionRef.current) {
                    console.log('🎯 自动滚动到最新记录');
                    latestSessionRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center' // 改为center，确保记录在视口中央
                    });
                }
            }, 800); // 增加延迟到800ms

            return () => clearTimeout(scrollTimer);
        }
    }, [selectedDate, filteredHistory.length]);

    const handleExportPDF = async (session: WorkoutSession) => {
        setExportingSessionId(session.id);
        setIsExportingPDF(true);
        setPdfError(null);

        try {
            // 检测环境
            const isMobile = isMobileApp();
            console.log(`📱 环境检测: ${isMobile ? '移动App' : '桌面浏览器'}`);

            if (isMobile) {
                // 移动端：生成PDF并显示选项Modal
                const result = await generateWorkoutPDF(session, userProfile, undefined, true);

                if (result && 'blob' in result) {
                    setPdfData(result);
                    setShowPDFOptions(true);
                    console.log('✅ PDF生成成功，显示导出选项');
                } else {
                    throw new Error('PDF生成失败：未返回有效数据');
                }
            } else {
                // 桌面端：直接下载
                await generateWorkoutPDF(session, userProfile, undefined, false);
                console.log('✅ PDF已触发下载（桌面端）');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '导出PDF失败，请重试';
            console.error('❌ PDF导出错误:', error);
            setPdfError(errorMessage);
            // 使用 setPdfError 状态来显示错误，而不是 alert()
            // PDFExportOptionsModal 会显示这个错误
        } finally {
            setExportingSessionId(null);
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

    const handleDelete = (sessionId: string) => {
        // 直接调用父组件的 deleteSession 函数
        // 父组件 (MainApp.tsx) 已经使用 ConfirmDialog 处理确认逻辑
        onDeleteSession(sessionId);
    };

    // Update timer every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    // 🆕 缓存卡路里计算结果，避免每次渲染重复计算
    const caloriesCache = useMemo(() => {
        const cache = new Map<string, number>();
        filteredHistory.forEach(session => {
            const calories = estimateCalories(session, userProfile.weight);
            cache.set(session.id, calories);
        });
        return cache;
    }, [filteredHistory, userProfile.weight]);

    const recoveryData = useMemo(() => {
        // 🆕 防御性检查：确保 recoveryState 是有效数组
        if (!Array.isArray(recoveryState) || recoveryState.length === 0) {
            console.warn('⚠️ recoveryState 为空或无效，使用默认值');
            return [];
        }

        return [...recoveryState].map(status => {
            // 🆕 验证 status 对象的完整性
            if (!status || typeof status !== 'object') {
                console.warn('⚠️ 无效的 recovery status:', status);
                return null;
            }

            const elapsedMs = now - (status.lastWorked || 0);
            // Use default 72 hours if recoveryDurationHours is undefined
            const durationMs = (status.recoveryDurationHours || 72) * 60 * 60 * 1000;

            // Handle first-time use case - if never worked before, set to 100%
            if (!status.lastWorked || status.lastWorked === 0 || isNaN(status.lastWorked)) {
                return {
                    ...status,
                    percentage: 100,
                    hoursLeft: 0
                };
            }

            let percentage = (elapsedMs / durationMs) * 100;

            // Prevent NaN values
            if (isNaN(percentage) || !isFinite(percentage)) {
                percentage = 100;
            } else {
                percentage = Math.min(100, Math.max(0, percentage));
            }

            const remainingMs = Math.max(0, durationMs - elapsedMs);
            const hoursLeft = Math.ceil(remainingMs / (1000 * 60 * 60));

            return {
                ...status,
                percentage: Math.round(percentage),
                hoursLeft: isNaN(hoursLeft) ? 0 : hoursLeft
            };
        }).filter(Boolean).sort((a, b) => a.percentage - b.percentage);
    }, [recoveryState, now]);

    return (
        <div className="animate-fade-in flex flex-col pb-20 px-4 space-y-6">
            {/* 🏆 ACHIEVEMENT HALL - New Achievement System */}
            <section>
                <AchievementHall workouts={history} />
            </section>

            {/* RECOVERY SECTION - Compact Heatmap */}
            <section>
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Battery className="text-emerald-500" size={20} />
                    Recovery
                </h2>
                {/* 🆕 添加错误边界：如果 recoveryState 无效，显示提示 */}
                {!recoveryState || recoveryState.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
                        <p className="text-slate-400 text-sm mb-3">恢复状态数据未初始化</p>
                        <p className="text-slate-500 text-xs">请返回主页重新加载数据</p>
                    </div>
                ) : (
                    <RecoveryHeatmapView recoveryState={recoveryState} now={now} />
                )}
            </section>

            {/* CALENDAR & HISTORY */}
            <section>
                <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <Activity className="text-blue-500" size={20} />
                    Workout Log
                </h2>

                <CalendarWidget
                    history={history}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                />

                <div className="space-y-4">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            {selectedDate ? `No workouts on ${selectedDate.toLocaleDateString()}` : 'No workouts recorded yet.'}
                        </div>
                    ) : (
                        filteredHistory.map((session, index) => {
                            const muscleData = calculateMuscleDistribution(session.exercises);
                            const calories = caloriesCache.get(session.id) || 0;
                            const dateObj = new Date(session.date);
                            // 第一条记录（最新的）添加ref
                            const isLatest = index === 0;

                            return (
                                <div
                                    ref={isLatest ? latestSessionRef : null}
                                    id={`session-card-${session.id}`}
                                    key={session.id}
                                    className="bg-slate-950 border border-slate-800 rounded-3xl p-5 relative group shadow-xl"
                                >
                                    {/* Delete Button - 右上角 */}
                                    <button
                                        onClick={() => handleDelete(session.id)}
                                        className="absolute top-4 right-4 p-2.5 bg-slate-900/80 text-rose-500 hover:text-rose-400 rounded-xl border border-slate-800 hover:border-rose-900/30 transition-all backdrop-blur-sm z-10"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    {/* Header: Date & Time */}
                                    <div className="flex items-start gap-4 mb-6 pr-12">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-2xl text-slate-400 border border-slate-700/50 shadow-lg">
                                                <CalendarIcon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg leading-tight mb-1">
                                                    {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                                                    <Clock size={12} />
                                                    <span>{session.durationMinutes} min</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-2">
                                                <Scale size={12} /> Volume
                                            </div>
                                            <div className="text-2xl font-black text-white">
                                                {(() => {
                                                    const tons = (session.volumeLoad || 0) / 1000;
                                                    if (tons >= 1) {
                                                        return `${tons.toFixed(1)}`;
                                                    }
                                                    return (session.volumeLoad || 0).toLocaleString();
                                                })()}
                                                <span className="text-sm font-normal text-slate-400 ml-1">
                                                    {(session.volumeLoad || 0) >= 1000 ? 'ton' : 'kg'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-2">
                                                <Flame size={12} /> Burn
                                            </div>
                                            <div className="text-2xl font-black text-white">
                                                ~{calories}
                                                <span className="text-sm font-normal text-slate-400 ml-1">kcal</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chart Section */}
                                    {muscleData.length > 0 && (
                                        <div className="bg-slate-900/30 rounded-2xl p-5 border border-slate-800/30 mb-5">
                                            <div className="flex items-center gap-5">
                                                {/* Donut Chart */}
                                                <div className="w-24 h-24 flex-shrink-0 relative">
                                                    <ResponsiveContainer width={96} height={96}>
                                                        <PieChart>
                                                            <Pie
                                                                data={muscleData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={24}
                                                                outerRadius={42}
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                                stroke="none"
                                                            >
                                                                {muscleData.map((entry, index) => {
                                                                    const muscleGroup = entry.name as MuscleGroup;
                                                                    const color = getMuscleColor(muscleGroup);
                                                                    return (
                                                                        <Cell key={`cell-${index}`} fill={color} />
                                                                    );
                                                                })}
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-xs font-bold text-slate-500">%</span>
                                                    </div>
                                                </div>

                                                {/* Legend */}
                                                <div className="flex-1 space-y-3">
                                                    <p className="text-[11px] text-slate-400 uppercase tracking-wide font-bold mb-2">Muscle Impact</p>
                                                    {muscleData.slice(0, 3).map((entry) => (
                                                        <div key={entry.name} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <div
                                                                    className="w-2.5 h-2.5 rounded-full"
                                                                    style={{
                                                                        backgroundColor: getMuscleColor(entry.name as MuscleGroup),
                                                                        boxShadow: `0 0 6px ${getMuscleColor(entry.name as MuscleGroup)}80`
                                                                    }}
                                                                />
                                                                <span className="text-slate-200 font-medium text-sm">{entry.name}</span>
                                                            </div>
                                                            <span className="text-slate-400 font-mono text-sm font-bold">
                                                                {session.volumeLoad > 0 ? Math.round((entry.value / session.volumeLoad) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions - 底部操作栏 */}
                                    <div className="flex gap-2">
                                        {onCopyToActiveWorkout && (
                                            <button
                                                onClick={() => onCopyToActiveWorkout(session.exercises)}
                                                className="flex-1 py-3 bg-slate-900 text-blue-400 hover:text-blue-300 rounded-xl border border-slate-800 hover:border-blue-500/30 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                                title="Copy to Active Workout"
                                            >
                                                <Copy size={16} />
                                                <span>Copy</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedReportSession(session)}
                                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 text-emerald-400 hover:text-emerald-300 rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                            title="View Report"
                                        >
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>
                                        <button
                                            onClick={() => handleExportPDF(session)}
                                            disabled={exportingSessionId === session.id}
                                            className="py-3 px-4 bg-slate-900 text-slate-400 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 transition-all disabled:opacity-50 flex items-center justify-center"
                                            title="Export PDF"
                                        >
                                            {exportingSessionId === session.id ? <Activity className="animate-spin" size={16} /> : <Download size={16} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Holographic Report Modal */}
            {selectedReportSession && (
                <WorkoutReportModal
                    session={selectedReportSession}
                    userProfile={userProfile}
                    isOpen={selectedReportSession !== null}
                    onClose={() => setSelectedReportSession(null)}
                />
            )}

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
        </div>
    );
};

export default ProgressView;