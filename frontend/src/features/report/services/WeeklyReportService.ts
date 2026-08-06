import type { WorkoutSession, WeeklyReport, WeeklyStats, MuscleDistributionData, WeeklyProgress, UserProfile } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { generateUUID, getCurrentTimestamp } from '@/shared/utils/uuid';
import { reportStorage } from './ReportStorageService';
import CalorieCalculationService from '@/services/CalorieCalculationService';

/**
 * Weekly Report Generation Service
 * Handles automatic weekly report generation and statistics calculation
 */

/**
 * Get the ISO week number and year for a given date
 * Week starts on Monday, ends on Sunday
 */
export const getWeekInfo = (date: Date): { year: number; weekNumber: number } => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // Set to nearest Thursday (current date + 4 - current day number)
    // Make Sunday = day 7
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));

    // Get first day of year
    const yearStart = new Date(d.getFullYear(), 0, 1);

    // Calculate full weeks to nearest Thursday
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    // 🔧 修复：确保返回的year是Thursday所在的年份，而不是原始日期的年份
    // 这样可以正确处理跨年的周（例如2025年12月29日-2026年1月4日应该是2026年第1周）
    return {
        year: d.getFullYear(), // 使用Thursday的年份
        weekNumber
    };
};

/**
 * Get Monday and Sunday of a given week
 */
export const getWeekDateRange = (year: number, weekNumber: number): { start: string; end: string } => {
    // 🔧 修复：使用ISO 8601标准计算周的日期范围
    // Jan 4 is always in week 1
    const jan4 = new Date(year, 0, 4);

    // Get Monday of week 1 (ISO week starts on Monday)
    const week1Monday = new Date(jan4);
    const jan4Day = jan4.getDay();
    // If Sunday (0), treat as 7
    const daysFromMonday = jan4Day === 0 ? 6 : jan4Day - 1;
    week1Monday.setDate(jan4.getDate() - daysFromMonday);

    // Get Monday of target week
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);

    // Get Sunday of target week
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start: formatDate(targetMonday),
        end: formatDate(targetSunday)
    };
};

/**
 * 🆕 改进的周报告检查逻辑
 * 
 * 新逻辑：
 * 1. 获取所有训练记录
 * 2. 找出所有有训练的周
 * 3. 检查哪些周还没有生成报告
 * 4. 返回最早的缺失周
 * 
 * 这样可以确保：
 * - 自动检测所有缺失的周报告
 * - 不限于最近4周
 * - 按时间顺序生成报告
 */
export const checkForNewWeek = async (allSessions: WorkoutSession[]): Promise<{ year: number; weekNumber: number } | null> => {
    const now = new Date();
    const currentWeek = getWeekInfo(now);

    console.log('🔍 Checking for missing weekly reports...');
    console.log('📅 Current week:', currentWeek);

    // 获取所有已有的报告
    const allReports = await reportStorage.getAllReports();
    console.log('📊 Existing reports:', allReports.length);

    // 找出所有有训练的周
    const weeksWithWorkouts = new Map<string, { year: number; weekNumber: number; sessions: WorkoutSession[] }>();

    allSessions.forEach(session => {
        const sessionWeek = getWeekInfo(new Date(session.date));
        const weekKey = `${sessionWeek.year}-W${sessionWeek.weekNumber}`;

        if (!weeksWithWorkouts.has(weekKey)) {
            weeksWithWorkouts.set(weekKey, {
                year: sessionWeek.year,
                weekNumber: sessionWeek.weekNumber,
                sessions: []
            });
        }

        weeksWithWorkouts.get(weekKey)!.sessions.push(session);
    });

    console.log(`🏋️ Found ${weeksWithWorkouts.size} weeks with workouts`);

    // 找出没有报告的周，按时间排序
    const missingWeeks: { year: number; weekNumber: number; sessionCount: number }[] = [];

    for (const [weekKey, weekData] of weeksWithWorkouts) {
        // 不为当前周生成报告（等到下周再生成）
        if (weekData.year === currentWeek.year && weekData.weekNumber === currentWeek.weekNumber) {
            console.log(`⏭️ Skipping current week: ${weekKey}`);
            continue;
        }

        const existingReport = allReports.find(
            r => r.year === weekData.year && r.weekNumber === weekData.weekNumber
        );

        if (!existingReport) {
            missingWeeks.push({
                year: weekData.year,
                weekNumber: weekData.weekNumber,
                sessionCount: weekData.sessions.length
            });
            console.log(`📝 Missing report for ${weekKey} (${weekData.sessions.length} workouts)`);
        }
    }

    if (missingWeeks.length === 0) {
        console.log('✅ All weeks with workouts have reports');
        return null;
    }

    // 按时间排序，返回最早的缺失周
    missingWeeks.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
    });

    const firstMissing = missingWeeks[0];
    console.log(`🎯 Will generate report for Week ${firstMissing.weekNumber}, ${firstMissing.year} (${firstMissing.sessionCount} workouts)`);
    console.log(`📋 Total missing reports: ${missingWeeks.length}`);

    return { year: firstMissing.year, weekNumber: firstMissing.weekNumber };
};

/**
 * Get the previous week
 */
const getPreviousWeek = (week: { year: number; weekNumber: number }): { year: number; weekNumber: number } => {
    if (week.weekNumber > 1) {
        return { year: week.year, weekNumber: week.weekNumber - 1 };
    } else {
        return { year: week.year - 1, weekNumber: 52 }; // Assuming 52 weeks per year
    }
};

/**
 * 🆕 获取N周前的周信息
 */
const getPreviousWeekN = (week: { year: number; weekNumber: number }, n: number): { year: number; weekNumber: number } => {
    let result = { ...week };
    for (let i = 0; i < n; i++) {
        result = getPreviousWeek(result);
    }
    return result;
};

/**
 * Get the next week
 */
const getNextWeek = (week: { year: number; weekNumber: number }): { year: number; weekNumber: number } => {
    if (week.weekNumber < 52) {
        return { year: week.year, weekNumber: week.weekNumber + 1 };
    } else {
        return { year: week.year + 1, weekNumber: 1 };
    }
};

/**
 * Calculate weekly statistics from sessions
 */
const calculateWeeklyStats = (sessions: WorkoutSession[], userProfile: UserProfile): WeeklyStats => {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalExercises = 0;
    let totalDuration = 0;
    let totalCalories = 0;

    sessions.forEach(session => {
        totalVolume += session.volumeLoad;
        totalDuration += session.durationMinutes || 0;

        session.exercises.forEach(ex => {
            totalExercises++;
            const completedSets = ex.sets.filter(s => s.completed);
            totalSets += completedSets.length;
            totalReps += completedSets.reduce((sum, s) => sum + s.reps, 0);
        });

        // 🆕 使用科学的卡路里计算方法
        // 基于实际训练负荷、组数、体重、体脂率等因素
        const sessionCalories = CalorieCalculationService.calculateWorkoutCalories(session, userProfile);
        totalCalories += sessionCalories;
    });

    return {
        totalVolume,
        totalSets,
        totalReps,
        totalExercises,
        totalDuration,
        totalCalories: Math.round(totalCalories),
        workoutDays: sessions.length
    };
};

/**
 * Calculate muscle group distribution
 */
const calculateMuscleDistribution = (sessions: WorkoutSession[]): MuscleDistributionData[] => {
    const distribution = new Map<MuscleGroup, { weight: number; sets: number; exercises: Set<string> }>();

    sessions.forEach(session => {
        session.exercises.forEach(ex => {
            const completedSets = ex.sets.filter(s => s.completed);
            if (completedSets.length === 0) return;

            const exerciseVolume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

            if (!distribution.has(ex.muscleGroup)) {
                distribution.set(ex.muscleGroup, {
                    weight: 0,
                    sets: 0,
                    exercises: new Set()
                });
            }

            const data = distribution.get(ex.muscleGroup)!;
            data.weight += exerciseVolume;
            data.sets += completedSets.length;
            data.exercises.add(ex.exerciseName);
        });
    });

    const totalWeight = Array.from(distribution.values()).reduce((sum, d) => sum + d.weight, 0);

    const result: MuscleDistributionData[] = Array.from(distribution.entries()).map(([muscle, data]) => ({
        muscle,
        totalWeight: data.weight,
        percentage: (data.weight / totalWeight) * 100,
        sets: data.sets,
        exercises: Array.from(data.exercises)
    }));

    // Sort by total weight descending
    result.sort((a, b) => b.totalWeight - a.totalWeight);

    return result;
};

/**
 * Calculate progress compared to previous week
 */
const calculateWeeklyProgress = async (
    currentStats: WeeklyStats,
    year: number,
    weekNumber: number
): Promise<WeeklyProgress | undefined> => {
    // Get previous week's report
    let prevWeek = weekNumber - 1;
    let prevYear = year;

    if (prevWeek < 1) {
        prevWeek = 52;
        prevYear = year - 1;
    }

    const prevReport = await reportStorage.getReportByWeek(prevYear, prevWeek);

    if (!prevReport) {
        return undefined;
    }

    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        volumeChange: calcChange(currentStats.totalVolume, prevReport.stats.totalVolume),
        setsChange: calcChange(currentStats.totalSets, prevReport.stats.totalSets),
        repsChange: calcChange(currentStats.totalReps, prevReport.stats.totalReps),
        prevWeekId: prevReport.id
    };
};

/**
 * Generate a weekly report for given sessions
 */
export const generateWeeklyReport = async (
    sessions: WorkoutSession[],
    year: number,
    weekNumber: number,
    userProfile: UserProfile
): Promise<WeeklyReport> => {
    const dateRange = getWeekDateRange(year, weekNumber);
    const stats = calculateWeeklyStats(sessions, userProfile);
    const muscleDistribution = calculateMuscleDistribution(sessions);
    const weeklyProgress = await calculateWeeklyProgress(stats, year, weekNumber);

    const report: WeeklyReport = {
        id: generateUUID(),
        weekNumber,
        year,
        dateRange,
        sessions,
        stats,
        muscleDistribution,
        weeklyProgress,
        createdAt: getCurrentTimestamp(),
        syncStatus: 'pending'
    };

    return report;
};

/**
 * Auto-generate weekly report if needed
 * Call this on app startup or when starting a new workout
 */
export const autoGenerateWeeklyReport = async (
    allSessions: WorkoutSession[],
    userProfile: UserProfile
): Promise<WeeklyReport | null> => {
    const newWeekInfo = await checkForNewWeek(allSessions);

    if (!newWeekInfo) {
        console.log('ℹ️ No new report needed');
        return null; // No new report needed
    }

    console.log(`📊 Generating report for Week ${newWeekInfo.weekNumber}, ${newWeekInfo.year}`);

    // Filter sessions from the target week
    const weekSessions = allSessions.filter(session => {
        const sessionWeek = getWeekInfo(new Date(session.date));
        return sessionWeek.year === newWeekInfo.year && sessionWeek.weekNumber === newWeekInfo.weekNumber;
    });

    console.log(`🏋️ Found ${weekSessions.length} workouts in target week`);

    if (weekSessions.length === 0) {
        console.log('⚠️ No workouts found in target week, skipping report generation');
        return null; // No workouts last week
    }

    // Generate and save report
    const report = await generateWeeklyReport(weekSessions, newWeekInfo.year, newWeekInfo.weekNumber, userProfile);
    await reportStorage.saveReport(report);

    console.log('✅ Weekly report generated and saved:', report.id);

    return report;
};

/**
 * 🆕 生成所有缺失的周报告
 * 主动为所有有训练但没有报告的周生成报告
 * 
 * @returns 生成的报告数量和详细信息
 */
export const generateAllMissingWeeklyReports = async (
    allSessions: WorkoutSession[],
    userProfile: UserProfile
): Promise<{
    generated: number;
    totalMissing: number;
    reports: WeeklyReport[];
}> => {
    const now = new Date();
    const currentWeek = getWeekInfo(now);
    
    console.log('🔍 Checking for all missing weekly reports...');
    console.log('📅 Current week:', currentWeek);

    // 获取所有已有的报告
    const allReports = await reportStorage.getAllReports();
    console.log('📊 Existing reports:', allReports.length);

    // 找出所有有训练的周
    const weeksWithWorkouts = new Map<string, { year: number; weekNumber: number; sessions: WorkoutSession[] }>();

    allSessions.forEach(session => {
        const sessionWeek = getWeekInfo(new Date(session.date));
        const weekKey = `${sessionWeek.year}-W${sessionWeek.weekNumber}`;

        if (!weeksWithWorkouts.has(weekKey)) {
            weeksWithWorkouts.set(weekKey, {
                year: sessionWeek.year,
                weekNumber: sessionWeek.weekNumber,
                sessions: []
            });
        }

        weeksWithWorkouts.get(weekKey)!.sessions.push(session);
    });

    console.log(`🏋️ Found ${weeksWithWorkouts.size} weeks with workouts`);

    // 找出所有没有报告的周
    const missingWeeks: { year: number; weekNumber: number; sessions: WorkoutSession[] }[] = [];

    for (const [weekKey, weekData] of weeksWithWorkouts) {
        // 不为当前周生成报告（等到下周再生成）
        if (weekData.year === currentWeek.year && weekData.weekNumber === currentWeek.weekNumber) {
            console.log(`⏭️ Skipping current week: ${weekKey}`);
            continue;
        }

        const existingReport = allReports.find(
            r => r.year === weekData.year && r.weekNumber === weekData.weekNumber
        );

        if (!existingReport) {
            missingWeeks.push({
                year: weekData.year,
                weekNumber: weekData.weekNumber,
                sessions: weekData.sessions
            });
            console.log(`📝 Missing report for ${weekKey} (${weekData.sessions.length} workouts)`);
        }
    }

    if (missingWeeks.length === 0) {
        console.log('✅ All weeks with workouts already have reports');
        return { generated: 0, totalMissing: 0, reports: [] };
    }

    // 按时间排序（从最早的开始）
    missingWeeks.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.weekNumber - b.weekNumber;
    });

    console.log(`🎯 Generating ${missingWeeks.length} missing reports...`);

    // 生成所有缺失的报告
    const generatedReports: WeeklyReport[] = [];

    for (const weekData of missingWeeks) {
        try {
            console.log(`📊 Generating report for Week ${weekData.weekNumber}, ${weekData.year} (${weekData.sessions.length} workouts)`);
            
            const report = await generateWeeklyReport(
                weekData.sessions,
                weekData.year,
                weekData.weekNumber,
                userProfile
            );
            
            await reportStorage.saveReport(report);
            generatedReports.push(report);
            
            console.log(`✅ Report saved: Week ${weekData.weekNumber}, ${weekData.year}`);
        } catch (error) {
            console.error(`❌ Failed to generate report for Week ${weekData.weekNumber}, ${weekData.year}:`, error);
        }
    }

    console.log(`🎉 Generated ${generatedReports.length}/${missingWeeks.length} reports`);

    return {
        generated: generatedReports.length,
        totalMissing: missingWeeks.length,
        reports: generatedReports
    };
};
