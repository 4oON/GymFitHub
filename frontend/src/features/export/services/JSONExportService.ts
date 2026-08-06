import type { WorkoutSession, UserProfile, WeeklyReport } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { calculateAdvancedCalories } from '../../profile/services/CalorieCalculationService';
import { getMuscleColorRGB } from '../../anatomy/constants/muscleColors';

/**
 * JSON Export Service for Holographic Report Data
 * 
 * Exports complete workout session data in JSON format
 * for cloud upload and data portability
 */

interface HolographicReportData {
    // Session metadata
    sessionId: string;
    exportTimestamp: string;
    version: string;

    // User data
    userProfile: {
        weight: number;
        unit: string;
    };

    // Session data
    session: {
        id: string;
        date: string;
        durationMinutes: number;
        volumeLoad: number;
        exerciseCount: number;
        totalSets: number;
        totalReps: number;
    };

    // Calculated metrics
    metrics: {
        estimatedCalories: number;
        calorieCalculationMethod: string;
        averageIntensity: number;
        trainingDensity: number;
    };

    // Exercise details
    exercises: Array<{
        id: string;
        name: string;
        muscleGroup: MuscleGroup;
        secondaryMuscles?: MuscleGroup[];
        sets: Array<{
            weight: number;
            reps: number;
            completed: boolean;
        }>;
        totalVolume: number;
        completedSets: number;
    }>;

    // Muscle distribution
    muscleDistribution: Array<{
        muscle: MuscleGroup;
        totalWeight: number;
        totalSets: number;
        exerciseCount: number;
        percentage: number;
        color: string;
        colorRGB: [number, number, number];
    }>;

    // Visual data for reconstruction
    chartData: Array<{
        name: string;
        value: number;
        percentage: string;
        color: string;
    }>;
}

/**
 * Group exercises by primary muscle group with detailed analysis
 */
const analyzeExercisesByMuscle = (exercises: any[], totalVolume: number) => {
    const grouped = new Map<MuscleGroup, any>();

    exercises.forEach(ex => {
        const completedSets = ex.sets.filter((s: any) => s.completed);
        if (completedSets.length === 0) return;

        const exerciseVolume = completedSets.reduce((sum: number, s: any) => sum + (s.weight * s.reps), 0);

        if (!grouped.has(ex.muscleGroup)) {
            grouped.set(ex.muscleGroup, {
                muscle: ex.muscleGroup,
                totalWeight: 0,
                totalSets: 0,
                exerciseCount: 0,
                exercises: []
            });
        }

        const data = grouped.get(ex.muscleGroup)!;
        data.totalWeight += exerciseVolume;
        data.totalSets += completedSets.length;
        data.exerciseCount += 1;
        data.exercises.push(ex.exerciseName);

        // Secondary muscles get proportional weight
        if (ex.secondaryMuscles && ex.secondaryMuscles.length > 0) {
            const secondaryWeight = exerciseVolume * 0.3 / ex.secondaryMuscles.length;
            ex.secondaryMuscles.forEach((muscle: MuscleGroup) => {
                if (!grouped.has(muscle)) {
                    grouped.set(muscle, {
                        muscle: muscle,
                        totalWeight: 0,
                        totalSets: 0,
                        exerciseCount: 0,
                        exercises: []
                    });
                }
                const secondaryData = grouped.get(muscle)!;
                secondaryData.totalWeight += secondaryWeight;
            });
        }
    });

    // Convert to array with percentages and colors
    return Array.from(grouped.values()).map(item => ({
        ...item,
        percentage: totalVolume > 0 ? ((item.totalWeight / totalVolume) * 100) : 0,
        color: `#${getMuscleColorRGB(item.muscle).map(c => c.toString(16).padStart(2, '0')).join('')}`,
        colorRGB: getMuscleColorRGB(item.muscle)
    })).sort((a, b) => b.totalWeight - a.totalWeight);
};

/**
 * Generate holographic report data
 */
const generateHolographicData = (
    session: WorkoutSession,
    userProfile: UserProfile,
    language: 'CN' | 'EN' = 'CN'
): HolographicReportData & {
    language: string;
    supportedLanguages: string[];
    uiLabels: any;
} => {
    // Calculate comprehensive metrics
    const totalExercises = session.exercises.length;
    const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = session.exercises.reduce((sum, ex) =>
        sum + ex.sets.filter(s => s.completed).reduce((s, set) => s + set.reps, 0), 0);

    // Calculate calories with method tracking
    let estimatedCalories = 0;
    let calculationMethod = 'fallback';

    try {
        estimatedCalories = calculateAdvancedCalories(session, userProfile);
        calculationMethod = 'advanced_met';
    } catch (error) {
        // Fallback calculation
        const met = 6.0;
        const durationHours = (session.durationMinutes || 0) / 60;
        estimatedCalories = Math.round(met * userProfile.weight * durationHours);
        calculationMethod = 'simple_met';
    }

    // Analyze muscle distribution
    const muscleAnalysis = analyzeExercisesByMuscle(session.exercises, session.volumeLoad);

    // Prepare chart data
    const chartData = muscleAnalysis.map(d => ({
        name: d.muscle,
        value: d.totalWeight,
        percentage: d.percentage.toFixed(1),
        color: d.color
    }));

    // Build comprehensive report data with bilingual support
    return {
        // Metadata
        sessionId: session.id,
        exportTimestamp: new Date().toISOString(),
        version: '2.0.0',
        language,
        supportedLanguages: ['CN', 'EN'],

        // User profile
        userProfile: {
            weight: userProfile.weight,
            unit: userProfile.unit
        },

        // Session summary
        session: {
            id: session.id,
            date: new Date(session.date).toISOString(),
            durationMinutes: session.durationMinutes || 0,
            volumeLoad: session.volumeLoad,
            exerciseCount: totalExercises,
            totalSets,
            totalReps
        },

        // Calculated metrics
        metrics: {
            estimatedCalories,
            calorieCalculationMethod: calculationMethod,
            averageIntensity: session.volumeLoad / (userProfile.weight * 10),
            trainingDensity: totalSets / ((session.durationMinutes || 60) / 60)
        },

        // Exercise details with bilingual names
        exercises: session.exercises.map(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

            return {
                id: ex.id,
                name: ex.exerciseName,
                nameZh: (ex as any).exerciseNameZh || ex.exerciseName,
                muscleGroup: ex.muscleGroup,
                secondaryMuscles: ex.secondaryMuscles,
                sets: ex.sets.map(s => ({
                    weight: s.weight,
                    reps: s.reps,
                    completed: s.completed
                })),
                totalVolume,
                completedSets: completedSets.length
            };
        }),

        // Muscle distribution analysis
        muscleDistribution: muscleAnalysis,

        // Chart data for visualization
        chartData,

        // Add bilingual labels for UI elements
        uiLabels: {
            CN: {
                workoutReport: '训练报告',
                date: '日期',
                weight: '体重',
                totalVolume: '总重量',
                topMuscleGroups: '主要肌群详情',
                allExerciseDetails: '所有动作详情',
                sets: '组数',
                reps: '次数',
                exercises: '个动作',
                minutes: '分钟',
                calories: '千卡',
                totalExercises: '总动作数',
                totalSets: '总组数',
                totalReps: '总次数',
                duration: '训练时长',
                estimatedCalories: '预估卡路里'
            },
            EN: {
                workoutReport: 'Workout Report',
                date: 'Date',
                weight: 'Weight',
                totalVolume: 'Total Volume',
                topMuscleGroups: 'Top Muscle Groups',
                allExerciseDetails: 'All Exercise Details',
                sets: 'Sets',
                reps: 'Reps',
                exercises: ' exercises',
                minutes: 'min',
                calories: 'kcal',
                totalExercises: 'Total Exercises',
                totalSets: 'Total Sets',
                totalReps: 'Total Reps',
                duration: 'Duration',
                estimatedCalories: 'Est. Calories'
            }
        }
    };
};

/**
 * Export holographic report data as JSON with options
 * Returns blob and filename for modal-based export
 */
export const exportHolographicJSONWithOptions = (
    session: WorkoutSession,
    userProfile: UserProfile,
    language: 'CN' | 'EN' = 'CN'
): { blob: Blob; fileName: string; data: any } => {
    const reportData = generateHolographicData(session, userProfile, language);

    // Generate filename with timestamp and language
    const sessionDate = new Date(session.date);
    const dateStr = sessionDate.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const filename = `ZenFit_HolographicReport_${language}_${dateStr}_${timeStr}.json`;

    // Create JSON blob
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    return { blob, fileName: filename, data: reportData };
};

/**
 * Export holographic report data as JSON (legacy direct download)
 */
export const exportHolographicJSON = async (
    session: WorkoutSession,
    userProfile: UserProfile,
    language: 'CN' | 'EN' = 'CN'
): Promise<void> => {
    try {
        const { blob, fileName } = exportHolographicJSONWithOptions(session, userProfile, language);

        // Create and download JSON file
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';

        document.body.appendChild(link);

        const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });

        link.dispatchEvent(clickEvent);

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`✅ Holographic JSON export completed: ${fileName}`);
        }, 1000);

    } catch (error) {
        console.error('JSON export failed:', error);
        throw new Error('Failed to export holographic report data. Please try again.');
    }
};

/**
 * Generate weekly report JSON data
 */
const generateWeeklyReportData = (weeklyReport: WeeklyReport, language: 'CN' | 'EN' = 'CN') => {
    const reportDate = new Date(weeklyReport.createdAt);
    const dateStr = reportDate.toISOString().split('T')[0].replace(/-/g, '');

    return {
        // Metadata
        reportId: weeklyReport.id,
        exportTimestamp: new Date().toISOString(),
        version: '2.0.0',
        language,
        supportedLanguages: ['CN', 'EN'],

        // Week info
        weekInfo: {
            weekNumber: weeklyReport.weekNumber,
            year: weeklyReport.year,
            dateRange: weeklyReport.dateRange
        },

        // Statistics
        stats: weeklyReport.stats,

        // Muscle distribution
        muscleDistribution: weeklyReport.muscleDistribution,

        // Weekly progress
        weeklyProgress: weeklyReport.weeklyProgress,

        // Sessions
        sessions: weeklyReport.sessions.map(session => ({
            id: session.id,
            date: session.date,
            durationMinutes: session.durationMinutes,
            volumeLoad: session.volumeLoad,
            exercises: session.exercises.map(ex => ({
                id: ex.id,
                name: ex.exerciseName,
                muscleGroup: ex.muscleGroup,
                sets: ex.sets.filter(s => s.completed).map(s => ({
                    weight: s.weight,
                    reps: s.reps
                }))
            }))
        })),

        // Bilingual labels
        uiLabels: {
            CN: {
                weeklyReport: '周训练报告',
                week: '第 {week} 周',
                year: '{year}年',
                dateRange: '日期范围',
                totalVolume: '总重量',
                totalSets: '总组数',
                totalReps: '总次数',
                totalExercises: '总动作数',
                workoutDays: '训练天数',
                duration: '训练时长',
                calories: '卡路里',
                muscleDistribution: '肌群分布',
                weeklyProgress: '周进度对比',
                sessions: '训练详情'
            },
            EN: {
                weeklyReport: 'Weekly Training Report',
                week: 'Week {week}',
                year: '{year}',
                dateRange: 'Date Range',
                totalVolume: 'Total Volume',
                totalSets: 'Total Sets',
                totalReps: 'Total Reps',
                totalExercises: 'Total Exercises',
                workoutDays: 'Workout Days',
                duration: 'Duration',
                calories: 'Calories',
                muscleDistribution: 'Muscle Distribution',
                weeklyProgress: 'Weekly Progress',
                sessions: 'Workout Sessions'
            }
        }
    };
};

/**
 * Export weekly report data as JSON with options
 */
export const exportWeeklyReportJSONWithOptions = (
    weeklyReport: WeeklyReport,
    language: 'CN' | 'EN' = 'CN'
): { blob: Blob; fileName: string; data: any } => {
    const reportData = generateWeeklyReportData(weeklyReport, language);

    // Generate filename
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `ZenFit_WeeklyReport_${weeklyReport.year}_W${weeklyReport.weekNumber}_${language}_${dateStr}.json`;

    // Create JSON blob
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    return { blob, fileName: filename, data: reportData };
};

/**
 * Export weekly report data as JSON (legacy direct download)
 */
export const exportWeeklyReportJSON = async (weeklyReport: WeeklyReport, language: 'CN' | 'EN' = 'CN'): Promise<void> => {
    try {
        const { blob, fileName } = exportWeeklyReportJSONWithOptions(weeklyReport, language);

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`✅ Weekly Report JSON export completed: ${fileName}`);
        }, 1000);

    } catch (error) {
        console.error('Weekly JSON export failed:', error);
        throw new Error('Failed to export weekly report data. Please try again.');
    }
};

/**
 * Validate JSON export data structure
 */
export const validateExportData = (data: any): boolean => {
    const requiredFields = [
        'sessionId', 'exportTimestamp', 'version',
        'userProfile', 'session', 'metrics',
        'exercises', 'muscleDistribution', 'chartData'
    ];

    return requiredFields.every(field => data.hasOwnProperty(field));
};

// ============================================
// Mobile Export Helpers (similar to PDFExportService)
// ============================================

/**
 * 检测是否在移动App环境中
 */
export const isMobileApp = (forceMobile: boolean = false): boolean => {
    if (forceMobile) {
        console.log('🧪 强制移动模式已启用（测试模式）');
        return true;
    }

    const ua = navigator.userAgent;
    const hasAppUA = /ZenFit|WebView|wv/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    return (hasAppUA || isStandalone || isIOSStandalone) && isMobile;
};

/**
 * 在浏览器中打开JSON
 */
export const openJSONInBrowser = (blob: Blob): boolean => {
    try {
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
            console.error('❌ 浏览器阻止了弹出窗口');
            return false;
        }

        setTimeout(() => {
            URL.revokeObjectURL(url);
            console.log('✅ JSON 在浏览器中打开成功');
        }, 3000);

        return true;
    } catch (error) {
        console.error('❌ 在浏览器中打开JSON失败:', error);
        return false;
    }
};

/**
 * 保存JSON到设备
 */
export const saveJSONToDevice = async (blob: Blob, fileName: string): Promise<boolean> => {
    try {
        console.log(`📥 开始保存JSON到设备: ${fileName}`);

        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        // iOS设备：优先使用原生分享对话框
        if (isIOS && navigator.share) {
            console.log('📱 检测到iOS设备，使用原生分享对话框...');
            try {
                const file = new File([blob], fileName, { type: 'application/json' });

                await navigator.share({
                    files: [file],
                    title: 'ZenFit 训练数据',
                    text: '保存您的训练数据'
                });

                console.log('✅ iOS原生保存对话框已打开');
                return true;
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('ℹ️ 用户取消了保存操作');
                    return false;
                }
                console.warn('⚠️ iOS原生分享失败，尝试备用方案:', error);
            }
        }

        // Android或其他移动设备：使用Web Share API
        if (navigator.share && isMobileApp()) {
            console.log('📱 使用Web Share API...');
            try {
                const file = new File([blob], fileName, { type: 'application/json' });

                await navigator.share({
                    files: [file],
                    title: 'ZenFit 训练数据'
                });

                console.log('✅ 分享成功');
                return true;
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('ℹ️ 用户取消了分享');
                    return false;
                }
                console.warn('⚠️ Web Share API失败，尝试备用方案:', error);
            }
        }

        // 备用方案：标准下载方法
        return fallbackDownload(blob, fileName);

    } catch (error) {
        console.error('❌ 保存JSON到设备失败:', error);
        return false;
    }
};

/**
 * 用其他应用打开JSON
 */
export const shareJSONToOtherApps = async (blob: Blob, fileName: string): Promise<boolean> => {
    try {
        console.log(`📤 分享JSON到其他应用: ${fileName}`);

        if (!navigator.share) {
            console.warn('⚠️ 当前浏览器不支持分享功能');
            alert('您的浏览器不支持分享功能，请使用"保存到设备"选项');
            return false;
        }

        const file = new File([blob], fileName, { type: 'application/json' });

        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            console.warn('⚠️ 无法分享JSON文件');
            alert('无法分享JSON文件，请使用"保存到设备"选项');
            return false;
        }

        await navigator.share({
            files: [file],
            title: 'ZenFit 训练数据',
            text: '分享训练数据'
        });

        console.log('✅ 分享成功');
        return true;

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('ℹ️ 用户取消了分享');
            return false;
        }

        console.error('❌ 分享失败:', error);
        alert('分享失败，请重试');
        return false;
    }
};

/**
 * 备用下载方法
 */
const fallbackDownload = (blob: Blob, fileName: string): boolean => {
    try {
        console.log('📥 使用标准下载方法...');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);

        setTimeout(() => {
            link.click();
            console.log('✅ 下载已触发');

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log(`✅ JSON 保存成功: ${fileName}`);
            }, 100);
        }, 0);

        return true;
    } catch (error) {
        console.error('❌ 备用下载方法失败:', error);
        return false;
    }
};

export default exportHolographicJSON;
