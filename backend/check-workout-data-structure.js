/**
 * 检查workout数据结构
 * 验证exercises字段中的sets数组是否包含completed字段
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 检查workout数据结构...\n');

        // 获取用户
        const user = await prisma.user.findFirst({
            where: { email: '123@123.com' }
        });

        if (!user) {
            console.error('❌ 找不到用户');
            return;
        }

        console.log(`✅ 用户: ${user.email} (ID: ${user.id})\n`);

        // 获取14号之前的训练记录
        const cutoffDate = new Date('2026-01-14T00:00:00.000Z');

        const workouts = await prisma.workout.findMany({
            where: {
                userId: user.id,
                date: {
                    lt: cutoffDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log(`📊 找到 ${workouts.length} 条14号之前的训练记录\n`);

        workouts.forEach((workout, index) => {
            const date = new Date(workout.date).toISOString().split('T')[0];
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`记录 ${index + 1}: ${date}`);
            console.log(`ID: ${workout.id}`);
            console.log(`Name: ${workout.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            const exercises = workout.exercises;

            if (!Array.isArray(exercises)) {
                console.error('❌ exercises不是数组！');
                console.log('类型:', typeof exercises);
                console.log('值:', exercises);
                return;
            }

            console.log(`练习数量: ${exercises.length}\n`);

            exercises.forEach((exercise, exIndex) => {
                console.log(`  练习 ${exIndex + 1}: ${exercise.exerciseName || '未知'}`);
                console.log(`    肌肉群: ${exercise.muscleGroup || '未知'}`);
                console.log(`    exerciseId: ${exercise.exerciseId || '无'}`);
                console.log(`    id: ${exercise.id || '无'}`);
                console.log(`    createdAt: ${exercise.createdAt || '无'}`);

                // 检查sets数组
                if (!exercise.sets) {
                    console.log(`    ❌ 缺少sets字段`);
                    return;
                }

                if (!Array.isArray(exercise.sets)) {
                    console.log(`    ❌ sets不是数组！类型: ${typeof exercise.sets}`);
                    return;
                }

                console.log(`    sets数量: ${exercise.sets.length}`);

                // 检查第一组的结构
                if (exercise.sets.length > 0) {
                    const firstSet = exercise.sets[0];
                    console.log(`    第一组结构:`);
                    console.log(`      - id: ${firstSet.id || '无'}`);
                    console.log(`      - weight: ${firstSet.weight}`);
                    console.log(`      - reps: ${firstSet.reps}`);
                    console.log(`      - completed: ${firstSet.completed} (类型: ${typeof firstSet.completed})`);

                    // 检查completed字段
                    if (firstSet.completed === undefined) {
                        console.log(`      ⚠️ completed字段不存在！`);
                    } else if (firstSet.completed === null) {
                        console.log(`      ⚠️ completed字段为null！`);
                    } else if (typeof firstSet.completed !== 'boolean') {
                        console.log(`      ⚠️ completed字段类型错误！应该是boolean，实际是${typeof firstSet.completed}`);
                    } else if (firstSet.completed === false) {
                        console.log(`      ⚠️ completed字段为false！`);
                    } else {
                        console.log(`      ✅ completed字段正确`);
                    }
                }

                // 统计completed的组数
                const completedCount = exercise.sets.filter(set => set.completed === true).length;
                console.log(`    完成组数: ${completedCount}/${exercise.sets.length}`);

                if (completedCount === 0) {
                    console.log(`    ❌ 没有任何完成的组！这会导致前端过滤掉这条记录`);
                }

                console.log('');
            });
        });

        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 总结');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        let totalExercises = 0;
        let exercisesWithoutCompletedSets = 0;

        workouts.forEach(workout => {
            const exercises = workout.exercises;
            if (Array.isArray(exercises)) {
                exercises.forEach(exercise => {
                    totalExercises++;
                    if (Array.isArray(exercise.sets)) {
                        const hasCompleted = exercise.sets.some(set => set.completed === true);
                        if (!hasCompleted) {
                            exercisesWithoutCompletedSets++;
                        }
                    }
                });
            }
        });

        console.log(`总练习数: ${totalExercises}`);
        console.log(`没有完成组的练习数: ${exercisesWithoutCompletedSets}`);

        if (exercisesWithoutCompletedSets > 0) {
            console.log(`\n⚠️ 发现 ${exercisesWithoutCompletedSets} 个练习没有任何完成的组！`);
            console.log(`这会导致前端的WorkoutSyncService过滤掉这些记录。`);
            console.log(`\n建议：重新运行导入脚本，确保所有sets都有completed: true字段`);
        } else {
            console.log(`\n✅ 所有练习都有完成的组！`);
        }

    } catch (error) {
        console.error('❌ 错误:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });
