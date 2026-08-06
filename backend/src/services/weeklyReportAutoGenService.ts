import prisma from '../db/client';

/**
 * Weekly Report Auto-Generation Service
 * 每周日自动为用户生成上一周的训练报告
 */

// 肌肉组类型
enum MuscleGroup {
    CHEST = 'chest',
    BACK = 'back',
    SHOULDERS = 'shoulders',
    BICEPS = 'biceps',
    TRICEPS = 'triceps',
    LEGS = 'legs',
    CORE = 'core',
    FOREARMS = 'forearms',
    TRAPS = 'traps'
}

// 周报告数据结构
interface WeeklyReportData {
    userId: string;
    weekNumber: number;
    year: number;
    dateRangeStart: string;
    dateRangeEnd: string;
    stats: {
        totalVolume: number;
        totalSets: number;
        totalReps: number;
        totalExercises: number;
        totalDuration: number;
        totalCalories: number;
        workoutDays: number;
    };
    muscleDistribution: Array<{
        muscle: MuscleGroup;
        totalWeight: number;
        percentage: number;
        sets: number;
        exercises: string[];
    }>;
    weeklyProgress?: {
        volumeChange: number;
        setsChange: number;
        repsChange: number;
        prevWeekId?: string;
    };
    sessions: any[];
}

/**
 * 获取ISO周数和年份
 * 周从周一开始，周日结束
 */
function getWeekInfo(date: Date): { year: number; weekNumber: number } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return {
        year: d.getFullYear(),
        weekNumber
    };
}

/**
 * 获取指定周的日期范围
 */
function getWeekDateRange(year: number, weekNumber: number): { start: string; end: string } {
    const jan4 = new Date(year, 0, 4);
    const week1Monday = new Date(jan4);
    const jan4Day = jan4.getDay();
    const daysFromMonday = jan4Day === 0 ? 6 : jan4Day - 1;
    week1Monday.setDate(jan4.getDate() - daysFromMonday);

    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);

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
}

/**
 * 计算训练容量
 */
function calculateVolumeLoad(exercises: any): number {
    if (!Array.isArray(exercises)) return 0;
    
    return exercises.reduce((total: number, ex: any) => {
        if (!ex.sets) return total;
        const completedSets = ex.sets.filter((s: any) => s.completed);
        const setVolume = completedSets.reduce((sum: number, s: any) => {
            return sum + ((s.weight || 0) * (s.reps || 0));
        }, 0);
        return total + setVolume;
    }, 0);
}

/**
 * 计算卡路里消耗
 * 基于训练负荷、组数、体重等因素
 */
function calculateWorkoutCalories(workout: any, userProfile: any): number {
    const totalSets = workout.exercises?.reduce((sum: number, ex: any) =>
        sum + (ex.sets?.filter((s: any) => s.completed).length || 0), 0) || 0;

    const avgWeight = workout.exercises?.reduce((sum: number, ex: any) => {
        const completedSets = ex.sets?.filter((s: any) => s.completed) || [];
        if (completedSets.length === 0) return sum;
        const avgSetWeight = completedSets.reduce((s: number, set: any) => s + (set.weight || 0), 0) / completedSets.length;
        return sum + avgSetWeight;
    }, 0) / (workout.exercises?.length || 1) || 0;

    const bodyWeight = userProfile?.weight || 70;
    const intensityFactor = avgWeight / bodyWeight;
    const baseCaloriesPerSet = 5;
    const intensityMultiplier = Math.max(1, intensityFactor * 0.5);
    const durationMinutes = workout.durationMinutes || 45;
    const durationFactor = durationMinutes / 60;

    return Math.round(totalSets * baseCaloriesPerSet * intensityMultiplier * durationFactor * 10);
}

/**
 * 计算周统计
 */
function calculateWeeklyStats(sessions: any[], userProfile: any) {
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalExercises = 0;
    let totalDuration = 0;
    let totalCalories = 0;

    sessions.forEach(session => {
        totalVolume += session.volumeLoad || 0;
        totalDuration += session.durationMinutes || 0;

        session.exercises?.forEach((ex: any) => {
            totalExercises++;
            const completedSets = ex.sets?.filter((s: any) => s.completed) || [];
            totalSets += completedSets.length;
            totalReps += completedSets.reduce((sum: number, s: any) => sum + (s.reps || 0), 0);
        });

        const sessionCalories = calculateWorkoutCalories(session, userProfile);
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
}

/**
 * 计算肌肉分布
 */
function calculateMuscleDistribution(sessions: any[]) {
    const distribution = new Map<MuscleGroup, { weight: number; sets: number; exercises: Set<string> }>();

    sessions.forEach(session => {
        session.exercises?.forEach((ex: any) => {
            const completedSets = ex.sets?.filter((s: any) => s.completed) || [];
            if (completedSets.length === 0) return;

            const exerciseVolume = completedSets.reduce((sum: number, s: any) =>
                sum + ((s.weight || 0) * (s.reps || 0)), 0);

            const muscleGroup = ex.muscleGroup as MuscleGroup;
            if (!distribution.has(muscleGroup)) {
                distribution.set(muscleGroup, {
                    weight: 0,
                    sets: 0,
                    exercises: new Set()
                });
            }

            const data = distribution.get(muscleGroup)!;
            data.weight += exerciseVolume;
            data.sets += completedSets.length;
            data.exercises.add(ex.exerciseName);
        });
    });

    const totalWeight = Array.from(distribution.values()).reduce((sum, d) => sum + d.weight, 0);

    const result = Array.from(distribution.entries()).map(([muscle, data]) => ({
        muscle,
        totalWeight: data.weight,
        percentage: totalWeight > 0 ? (data.weight / totalWeight) * 100 : 0,
        sets: data.sets,
        exercises: Array.from(data.exercises)
    }));

    result.sort((a, b) => b.totalWeight - a.totalWeight);
    return result;
}

/**
 * 计算与上周的进度对比
 */
async function calculateWeeklyProgress(
    currentStats: any,
    userId: string,
    year: number,
    weekNumber: number
) {
    let prevWeek = weekNumber - 1;
    let prevYear = year;

    if (prevWeek < 1) {
        prevWeek = 52;
        prevYear = year - 1;
    }

    const prevReport = await prisma.weeklyReport.findUnique({
        where: {
            userId_year_weekNumber: {
                userId,
                year: prevYear,
                weekNumber: prevWeek
            }
        }
    });

    if (!prevReport) {
        return undefined;
    }

    const prevStats = prevReport.stats as any;
    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        volumeChange: calcChange(currentStats.totalVolume, prevStats.totalVolume),
        setsChange: calcChange(currentStats.totalSets, prevStats.totalSets),
        repsChange: calcChange(currentStats.totalReps, prevStats.totalReps),
        prevWeekId: prevReport.id
    };
}

/**
 * 为单个用户生成周报告
 */
async function generateWeeklyReportForUser(
    userId: string,
    year: number,
    weekNumber: number
): Promise<WeeklyReportData | null> {
    const dateRange = getWeekDateRange(year, weekNumber);

    // 获取该周的所有训练
    // 使用 OR 条件：date 在范围内 OR (date 为 null 且 createdAt 在范围内)
    const workouts = await prisma.workout.findMany({
        where: {
            userId,
            OR: [
                {
                    date: {
                        gte: new Date(dateRange.start),
                        lte: new Date(dateRange.end)
                    }
                },
                {
                    date: null,
                    createdAt: {
                        gte: new Date(dateRange.start),
                        lte: new Date(dateRange.end)
                    }
                }
            ]
        },
        orderBy: { date: 'asc' }
    });

    if (workouts.length === 0) {
        console.log(`⚠️ User ${userId}: No workouts found for week ${weekNumber}, ${year}`);
        return null;
    }

    // 获取用户资料用于卡路里计算
    const profile = await prisma.userProfile.findUnique({
        where: { userId }
    });

    const userProfile = profile ? {
        weight: profile.weight,
        bodyFat: profile.bodyFatPercent
    } : { weight: 70, bodyFat: 20 };

    // 计算统计数据
    const stats = calculateWeeklyStats(workouts, userProfile);
    const muscleDistribution = calculateMuscleDistribution(workouts);
    const weeklyProgress = await calculateWeeklyProgress(stats, userId, year, weekNumber);

    // 转换训练数据格式
    const sessions = workouts.map(w => ({
        id: w.id,
        date: w.date ? w.date.toISOString() : w.createdAt.toISOString(),
        durationMinutes: w.durationMin || 0,
        volumeLoad: calculateVolumeLoad(w.exercises),
        exercises: w.exercises || []
    }));

    return {
        userId,
        weekNumber,
        year,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        stats,
        muscleDistribution,
        weeklyProgress,
        sessions
    };
}

/**
 * 检查是否需要生成报告
 */
async function shouldGenerateReport(userId: string, year: number, weekNumber: number): Promise<boolean> {
    const existing = await prisma.weeklyReport.findUnique({
        where: {
            userId_year_weekNumber: {
                userId,
                year,
                weekNumber
            }
        }
    });

    return !existing;
}

/**
 * 为所有用户生成上一周的报告
 */
export async function generateWeeklyReportsForAllUsers(): Promise<{
    generated: number;
    skipped: number;
    errors: number;
    details: string[];
}> {
    const result = {
        generated: 0,
        skipped: 0,
        errors: 0,
        details: [] as string[]
    };

    try {
        // 获取上一周的信息
        const now = new Date();
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const { year, weekNumber } = getWeekInfo(lastWeek);

        console.log(`🗓️ Generating reports for Week ${weekNumber}, ${year}`);
        result.details.push(`Target: Week ${weekNumber}, ${year}`);

        // 获取所有有训练记录的用户
        const dateRange = getWeekDateRange(year, weekNumber);
        const usersWithWorkouts = await prisma.workout.groupBy({
            by: ['userId'],
            where: {
                OR: [
                    {
                        date: {
                            gte: new Date(dateRange.start),
                            lte: new Date(dateRange.end)
                        }
                    },
                    {
                        date: null,
                        createdAt: {
                            gte: new Date(dateRange.start),
                            lte: new Date(dateRange.end)
                        }
                    }
                ]
            }
        });

        console.log(`👥 Found ${usersWithWorkouts.length} users with workouts`);
        result.details.push(`Users with workouts: ${usersWithWorkouts.length}`);

        for (const { userId } of usersWithWorkouts) {
            try {
                // 检查是否已存在报告
                const shouldGenerate = await shouldGenerateReport(userId, year, weekNumber);

                if (!shouldGenerate) {
                    console.log(`⏭️ User ${userId}: Report already exists`);
                    result.skipped++;
                    continue;
                }

                // 生成报告
                const reportData = await generateWeeklyReportForUser(userId, year, weekNumber);

                if (!reportData) {
                    console.log(`⏭️ User ${userId}: No report data generated`);
                    result.skipped++;
                    continue;
                }

                // 保存到数据库
                await prisma.weeklyReport.create({
                    data: {
                        userId: reportData.userId,
                        weekNumber: reportData.weekNumber,
                        year: reportData.year,
                        dateRangeStart: reportData.dateRangeStart,
                        dateRangeEnd: reportData.dateRangeEnd,
                        stats: reportData.stats,
                        muscleDistribution: reportData.muscleDistribution,
                        weeklyProgress: reportData.weeklyProgress,
                        sessions: reportData.sessions
                    }
                });

                console.log(`✅ User ${userId}: Report generated successfully`);
                result.generated++;
                result.details.push(`Generated for user ${userId}`);

            } catch (error) {
                console.error(`❌ User ${userId}: Failed to generate report`, error);
                result.errors++;
                result.details.push(`Error for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

    } catch (error) {
        console.error('❌ Failed to generate weekly reports:', error);
        result.errors++;
        result.details.push(`Global error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * 启动自动报告生成定时器
 * 每周日 00:00 生成上一周的报告
 */
export function startWeeklyReportAutoGeneration(): void {
    console.log('🕐 Weekly Report Auto-Generation Service started');

    // 计算到下一个周日 00:00 的时间
    const now = new Date();
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    nextSunday.setHours(0, 0, 0, 0);

    if (nextSunday <= now) {
        nextSunday.setDate(nextSunday.getDate() + 7);
    }

    const msUntilNextSunday = nextSunday.getTime() - now.getTime();

    console.log(`⏰ Next generation scheduled for: ${nextSunday.toISOString()}`);

    // 设置定时器
    setTimeout(() => {
        // 首次执行
        generateWeeklyReportsForAllUsers().then(result => {
            console.log('📊 Weekly report generation completed:', result);
        });

        // 之后每周执行一次
        setInterval(() => {
            generateWeeklyReportsForAllUsers().then(result => {
                console.log('📊 Weekly report generation completed:', result);
            });
        }, 7 * 24 * 60 * 60 * 1000); // 7天

    }, msUntilNextSunday);
}

/**
 * 手动触发报告生成（用于测试或手动生成历史报告）
 */
export async function manuallyGenerateReport(
    userId: string,
    year: number,
    weekNumber: number
): Promise<{ success: boolean; message: string }> {
    try {
        const shouldGenerate = await shouldGenerateReport(userId, year, weekNumber);

        if (!shouldGenerate) {
            return { success: false, message: 'Report already exists for this week' };
        }

        const reportData = await generateWeeklyReportForUser(userId, year, weekNumber);

        if (!reportData) {
            return { success: false, message: 'No workouts found for this week' };
        }

        await prisma.weeklyReport.create({
            data: {
                userId: reportData.userId,
                weekNumber: reportData.weekNumber,
                year: reportData.year,
                dateRangeStart: reportData.dateRangeStart,
                dateRangeEnd: reportData.dateRangeEnd,
                stats: reportData.stats,
                muscleDistribution: reportData.muscleDistribution,
                weeklyProgress: reportData.weeklyProgress,
                sessions: reportData.sessions
            }
        });

        return { success: true, message: 'Report generated successfully' };

    } catch (error) {
        return {
            success: false,
            message: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export default {
    generateWeeklyReportsForAllUsers,
    startWeeklyReportAutoGeneration,
    manuallyGenerateReport
};
