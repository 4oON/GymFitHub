/**
 * 检查数据库中的数据格式
 * 验证导入的数据是否符合前端期望的格式
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataFormat() {
    console.log('='.repeat(60));
    console.log('检查数据库中的数据格式');
    console.log('='.repeat(60));

    try {
        // 获取所有用户
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true
            }
        });

        console.log(`\n找到 ${users.length} 个用户:`);
        users.forEach((user, i) => {
            console.log(`  ${i + 1}. ${user.email} (ID: ${user.id})`);
        });

        if (users.length === 0) {
            console.log('\n❌ 没有找到用户');
            return;
        }

        // 检查每个用户的训练数据
        for (const user of users) {
            console.log(`\n${'='.repeat(40)}`);
            console.log(`检查用户: ${user.email}`);
            console.log(`${'='.repeat(40)}`);

            const workouts = await prisma.workout.findMany({
                where: { userId: user.id },
                orderBy: { date: 'desc' },
                take: 5 // 只检查最近5条记录
            });

            console.log(`\n找到 ${workouts.length} 条训练记录`);

            if (workouts.length === 0) {
                console.log('  没有训练记录');
                continue;
            }

            // 检查每条训练记录的格式
            workouts.forEach((workout, i) => {
                console.log(`\n--- 训练记录 ${i + 1}: ${workout.name} ---`);
                console.log(`日期: ${workout.date ? workout.date.toISOString().split('T')[0] : '无'}`);
                console.log(`时长: ${workout.durationMin || 0} 分钟`);
                console.log(`创建时间: ${workout.createdAt ? new Date(workout.createdAt).toISOString() : '无'}`);

                // 检查exercises字段
                if (!workout.exercises) {
                    console.log('❌ 缺少exercises字段');
                    return;
                }

                let exercises;
                try {
                    exercises = typeof workout.exercises === 'string'
                        ? JSON.parse(workout.exercises)
                        : workout.exercises;
                } catch (error) {
                    console.log('❌ exercises字段解析失败:', error.message);
                    return;
                }

                if (!Array.isArray(exercises)) {
                    console.log('❌ exercises不是数组');
                    return;
                }

                console.log(`练习数量: ${exercises.length}`);

                // 检查前3个练习的格式
                exercises.slice(0, 3).forEach((ex, j) => {
                    console.log(`\n  练习 ${j + 1}: ${ex.exerciseName || ex.name || '未命名'}`);

                    // 检查必需字段
                    const requiredFields = ['id', 'exerciseId', 'exerciseName', 'muscleGroup', 'sets', 'createdAt'];
                    const missingFields = [];

                    requiredFields.forEach(field => {
                        if (!ex[field]) {
                            missingFields.push(field);
                        }
                    });

                    if (missingFields.length > 0) {
                        console.log(`    ❌ 缺少字段: ${missingFields.join(', ')}`);
                    } else {
                        console.log(`    ✅ 所有必需字段都存在`);
                    }

                    // 检查sets格式
                    if (ex.sets && Array.isArray(ex.sets)) {
                        console.log(`    组数: ${ex.sets.length}`);

                        if (ex.sets.length > 0) {
                            const firstSet = ex.sets[0];
                            const setRequiredFields = ['id', 'weight', 'reps', 'completed'];
                            const setMissingFields = [];

                            setRequiredFields.forEach(field => {
                                if (firstSet[field] === undefined) {
                                    setMissingFields.push(field);
                                }
                            });

                            if (setMissingFields.length > 0) {
                                console.log(`    ❌ 第一组缺少字段: ${setMissingFields.join(', ')}`);
                            } else {
                                console.log(`    ✅ 组数据格式正确`);
                            }
                        }
                    } else {
                        console.log(`    ❌ sets不是数组或不存在`);
                    }
                });

                if (exercises.length > 3) {
                    console.log(`  ... 还有 ${exercises.length - 3} 个练习`);
                }
            });
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('检查完成');
        console.log(`${'='.repeat(60)}`);

    } catch (error) {
        console.error('检查失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行检查
checkDataFormat();