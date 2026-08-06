/**
 * 检查特定日期的训练记录
 * 查看6号、8号、10号的肌肉群数据
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpecificDates() {
    console.log('='.repeat(60));
    console.log('检查特定日期的训练记录');
    console.log('='.repeat(60));

    try {
        // 获取用户123@123.com的数据
        const user = await prisma.user.findUnique({
            where: { email: '123@123.com' }
        });

        if (!user) {
            console.log('❌ 找不到用户 123@123.com');
            return;
        }

        console.log(`✅ 用户ID: ${user.id}`);

        // 获取所有训练记录
        const workouts = await prisma.workout.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' }
        });

        console.log(`\n找到 ${workouts.length} 条训练记录:`);

        // 检查每条记录
        workouts.forEach((workout, i) => {
            const date = new Date(workout.date);
            const day = date.getDate();
            const month = date.getMonth() + 1;

            console.log(`\n--- 记录 ${i + 1}: ${workout.name} ---`);
            console.log(`日期: ${date.toISOString().split('T')[0]} (${month}月${day}号)`);
            console.log(`ID: ${workout.id}`);

            // 重点检查6号、8号、10号
            if (day === 6 || day === 8 || day === 10) {
                console.log(`🔍 重点检查 ${day} 号的数据:`);

                let exercises;
                try {
                    exercises = typeof workout.exercises === 'string'
                        ? JSON.parse(workout.exercises)
                        : workout.exercises;
                } catch (error) {
                    console.log('❌ exercises字段解析失败:', error.message);
                    return;
                }

                if (Array.isArray(exercises)) {
                    console.log(`  练习数量: ${exercises.length}`);

                    exercises.forEach((ex, j) => {
                        console.log(`\n  练习 ${j + 1}:`);
                        console.log(`    名称: ${ex.exerciseName || ex.name || '未知'}`);
                        console.log(`    肌肉群: ${ex.muscleGroup || '未设置'}`);
                        console.log(`    次要肌肉: ${ex.secondaryMuscles ? JSON.stringify(ex.secondaryMuscles) : '无'}`);
                        console.log(`    组数: ${ex.sets ? ex.sets.length : 0}`);

                        // 检查组数据
                        if (ex.sets && ex.sets.length > 0) {
                            const completedSets = ex.sets.filter(set => set.completed);
                            console.log(`    完成组数: ${completedSets.length}/${ex.sets.length}`);

                            if (completedSets.length > 0) {
                                const firstSet = completedSets[0];
                                console.log(`    第一组: ${firstSet.weight}kg x ${firstSet.reps}次`);
                            }
                        }
                    });
                } else {
                    console.log('  ❌ exercises不是数组');
                }
            }
        });

    } catch (error) {
        console.error('检查失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行检查
checkSpecificDates();