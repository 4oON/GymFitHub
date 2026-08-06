/**
 * 调试前端加载数据的流程
 * 模拟前端WorkoutSyncService.loadWorkoutsFromBackend的行为
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 模拟前端加载数据流程...\n');

        // 获取用户
        const user = await prisma.user.findFirst({
            where: { email: '123@123.com' }
        });

        if (!user) {
            console.error('❌ 找不到用户');
            return;
        }

        console.log(`✅ 用户: ${user.email} (ID: ${user.id})\n`);

        // 获取所有训练记录
        const workouts = await prisma.workout.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        console.log(`📊 找到 ${workouts.length} 条训练记录\n`);

        workouts.forEach((workout, index) => {
            const date = new Date(workout.date).toISOString().split('T')[0];
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`记录 ${index + 1}: ${date}`);
            console.log(`ID: ${workout.id}`);
            console.log(`Name: ${workout.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            console.log(`原始数据库结构:`);
            console.log(`  date: ${workout.date}`);
            console.log(`  exercises (JSON):`, JSON.stringify(workout.exercises, null, 2));

            // 模拟前端的验证逻辑
            console.log(`\n模拟前端验证逻辑:`);

            // 1. 验证exercises字段
            if (!workout.exercises || !Array.isArray(workout.exercises) || workout.exercises.length === 0) {
                console.log(`  ❌ 验证失败: exercises为空或非数组`);
                return;
            } else {
                console.log(`  ✅ exercises验证通过: ${workout.exercises.length} 个练习`);
            }

            // 2. 验证date字段
            const workoutDate = workout.date || workout.createdAt;
            if (!workoutDate) {
                console.log(`  ❌ 验证失败: 日期为空`);
                return;
            } else {
                console.log(`  ✅ 日期验证通过: ${new Date(workoutDate).toISOString()}`);
            }

            // 3. 验证volume
            const calculatedVolume = calculateVolumeFromBackend(workout);
            if (calculatedVolume > 100000) {
                console.log(`  ❌ 验证失败: 异常体积 ${calculatedVolume}`);
                return;
            } else {
                console.log(`  ✅ 体积验证通过: ${calculatedVolume}kg`);
            }

            // 4. 验证是否有完成的组数 (这是关键问题!)
            console.log(`  验证完成组数:`);
            const hasCompletedSets = workout.exercises.some((ex) => {
                console.log(`    检查练习: ${ex.exerciseName || '未知'}`);
                console.log(`      ex.sets 类型: ${typeof ex.sets}`);
                console.log(`      ex.sets 值:`, ex.sets);

                if (Array.isArray(ex.sets)) {
                    console.log(`      sets数组长度: ${ex.sets.length}`);
                    const completedCount = ex.sets.filter(set => set.completed === true).length;
                    console.log(`      完成组数: ${completedCount}`);
                    return completedCount > 0;
                } else {
                    console.log(`      ⚠️ sets不是数组，而是: ${ex.sets} (类型: ${typeof ex.sets})`);
                    // 如果不是数组，检查是否是数字（旧格式）
                    if (typeof ex.sets === 'number') {
                        console.log(`      检查数字格式的sets: ${ex.sets}`);
                        return ex.sets > 0;
                    }
                    return false;
                }
            });

            if (!hasCompletedSets) {
                console.log(`  ❌ 验证失败: 没有完成的组数`);
            } else {
                console.log(`  ✅ 完成组数验证通过`);
            }
        });

    } catch (error) {
        console.error('❌ 错误:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// 复制自WorkoutSyncService的calculateVolumeFromBackend方法
function calculateVolumeFromBackend(workout) {
    if (!workout.exercises) return 0;

    return workout.exercises.reduce((total, ex) => {
        const sets = ex.sets || 0;
        const reps = ex.reps || 0;
        const weight = ex.weight || 0;
        console.log(`  计算练习体积: sets=${sets}, reps=${reps}, weight=${weight}`);
        return total + (sets * reps * weight);
    }, 0);
}

main()
    .catch((error) => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });
