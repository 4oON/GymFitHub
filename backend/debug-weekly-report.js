/**
 * Debug script for weekly report generation
 * Run this to check workout data and test report generation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getWeekInfo(date) {
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

function getWeekDateRange(year, weekNumber) {
    const jan4 = new Date(year, 0, 4);
    const week1Monday = new Date(jan4);
    const jan4Day = jan4.getDay();
    const daysFromMonday = jan4Day === 0 ? 6 : jan4Day - 1;
    week1Monday.setDate(jan4.getDate() - daysFromMonday);

    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7);

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    const formatDate = (d) => {
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

async function debugWeeklyReport(userId) {
    console.log(`\n🔍 Debugging weekly report for user: ${userId}\n`);

    // 1. 获取当前周和上一周的信息
    const now = new Date();
    const currentWeek = getWeekInfo(now);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekInfo = getWeekInfo(lastWeek);

    console.log('📅 Current week:', currentWeek);
    console.log('📅 Last week:', lastWeekInfo);

    // 2. 获取用户所有训练
    const allWorkouts = await prisma.workout.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 20
    });

    console.log(`\n💪 Total workouts found: ${allWorkouts.length}`);

    // 3. 显示最近的训练
    console.log('\n📋 Recent workouts:');
    allWorkouts.forEach((w, i) => {
        const weekInfo = getWeekInfo(w.date || w.createdAt);
        console.log(`  ${i + 1}. ${w.name}`);
        console.log(`     Date: ${w.date?.toISOString() || 'null'}`);
        console.log(`     CreatedAt: ${w.createdAt.toISOString()}`);
        console.log(`     Week: ${weekInfo.year}-W${weekInfo.weekNumber}`);
        console.log(`     Exercises: ${(w.exercises || []).length}`);
    });

    // 4. 检查当前周和上周的训练
    const currentWeekRange = getWeekDateRange(currentWeek.year, currentWeek.weekNumber);
    const lastWeekRange = getWeekDateRange(lastWeekInfo.year, lastWeekInfo.weekNumber);

    console.log(`\n🔍 Checking current week (${currentWeekRange.start} to ${currentWeekRange.end}):`);
    const currentWeekWorkouts = await prisma.workout.findMany({
        where: {
            userId,
            date: {
                gte: new Date(currentWeekRange.start),
                lte: new Date(currentWeekRange.end)
            }
        }
    });
    console.log(`  Found: ${currentWeekWorkouts.length} workouts`);

    console.log(`\n🔍 Checking last week (${lastWeekRange.start} to ${lastWeekRange.end}):`);
    const lastWeekWorkouts = await prisma.workout.findMany({
        where: {
            userId,
            date: {
                gte: new Date(lastWeekRange.start),
                lte: new Date(lastWeekRange.end)
            }
        }
    });
    console.log(`  Found: ${lastWeekWorkouts.length} workouts`);

    // 5. 检查是否已有报告
    const existingCurrentWeekReport = await prisma.weeklyReport.findUnique({
        where: {
            userId_year_weekNumber: {
                userId,
                year: currentWeek.year,
                weekNumber: currentWeek.weekNumber
            }
        }
    });

    const existingLastWeekReport = await prisma.weeklyReport.findUnique({
        where: {
            userId_year_weekNumber: {
                userId,
                year: lastWeekInfo.year,
                weekNumber: lastWeekInfo.weekNumber
            }
        }
    });

    console.log(`\n📊 Reports status:`);
    console.log(`  Current week report: ${existingCurrentWeekReport ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`  Last week report: ${existingLastWeekReport ? 'EXISTS' : 'NOT FOUND'}`);

    // 6. 检查训练数据的日期字段
    const workoutsWithNullDate = await prisma.workout.count({
        where: {
            userId,
            date: null
        }
    });

    console.log(`\n⚠️ Workouts with null date field: ${workoutsWithNullDate}`);

    await prisma.$disconnect();
}

// 从命令行获取 userId
const userId = process.argv[2];
if (!userId) {
    console.log('Usage: node debug-weekly-report.js <userId>');
    process.exit(1);
}

debugWeeklyReport(userId).catch(console.error);
