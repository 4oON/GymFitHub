const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveUserDataDebug() {
    console.log('🔍 全面用户数据调试...\n');

    try {
        // 1. 查找所有用户及其资料
        const users = await prisma.user.findMany({
            include: {
                profile: true,
                workouts: {
                    orderBy: { date: 'desc' },
                    take: 5
                }
            }
        });

        console.log(`👥 找到 ${users.length} 个用户\n`);

        for (const user of users) {
            console.log(`👤 用户: ${user.email}`);
            console.log(`📧 ID: ${user.id}`);
            console.log(`⚖️ 体重: ${user.profile?.weight || '未设置'}kg`);
            console.log(`📊 训练记录数: ${user.workouts.length}`);
            console.log('');

            // 2. 分析每个用户的硬拉记录
            let deadliftData = [];
            let maxDeadliftWeight = 0;
            let totalWorkouts = 0;

            // 获取更多训练记录进行分析
            const allWorkouts = await prisma.workout.findMany({
                where: { userId: user.id },
                orderBy: { date: 'desc' }
            });

            totalWorkouts = allWorkouts.length;
            console.log(`📈 总训练记录: ${totalWorkouts}`);

            allWorkouts.forEach((workout, index) => {
                if (workout.exercises && Array.isArray(workout.exercises)) {
                    workout.exercises.forEach(exercise => {
                        const exerciseName = exercise.name?.toLowerCase() || '';

                        // 检查硬拉相关动作
                        if (exerciseName.includes('deadlift') ||
                            exerciseName.includes('硬拉') ||
                            exerciseName.includes('barbell deadlift')) {

                            console.log(`  🏋️ 找到硬拉记录 ${index + 1}: ${exercise.name} (${workout.date?.toISOString().split('T')[0] || workout.createdAt.toISOString().split('T')[0]})`);

                            if (exercise.sets && Array.isArray(exercise.sets)) {
                                exercise.sets.forEach((set, setIndex) => {
                                    const weight = parseFloat(set.weight) || 0;
                                    console.log(`    组 ${setIndex + 1}: ${weight}kg × ${set.reps}次`);

                                    if (weight > maxDeadliftWeight) {
                                        maxDeadliftWeight = weight;
                                    }
                                });
                            }

                            deadliftData.push({
                                date: workout.date || workout.createdAt,
                                exercise: exercise.name,
                                sets: exercise.sets
                            });
                        }
                    });
                }
            });

            console.log(`\n💪 硬拉数据汇总:`);
            console.log(`- 硬拉训练次数: ${deadliftData.length}`);
            console.log(`- 历史最大重量: ${maxDeadliftWeight}kg`);

            if (maxDeadliftWeight > 0) {
                const recommendedWeight = Math.round(maxDeadliftWeight * 0.8);
                console.log(`- 推荐重量 (80%): ${recommendedWeight}kg`);
                console.log(`- 当前APP显示: 85kg`);
                console.log(`- 是否合理: ${recommendedWeight >= 85 ? '✅ 是' : '❌ 否，应该更重'}`);
            }

            // 3. 检查其他动作的历史记录
            console.log(`\n🏋️ 其他动作分析:`);
            const exerciseStats = {};

            allWorkouts.forEach(workout => {
                if (workout.exercises && Array.isArray(workout.exercises)) {
                    workout.exercises.forEach(exercise => {
                        const name = exercise.name || 'Unknown';
                        if (!exerciseStats[name]) {
                            exerciseStats[name] = { count: 0, maxWeight: 0 };
                        }
                        exerciseStats[name].count++;

                        if (exercise.sets && Array.isArray(exercise.sets)) {
                            exercise.sets.forEach(set => {
                                const weight = parseFloat(set.weight) || 0;
                                if (weight > exerciseStats[name].maxWeight) {
                                    exerciseStats[name].maxWeight = weight;
                                }
                            });
                        }
                    });
                }
            });

            // 显示前5个最常做的动作
            const topExercises = Object.entries(exerciseStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 5);

            topExercises.forEach(([name, stats]) => {
                const recommendedWeight = Math.round(stats.maxWeight * 0.8);
                console.log(`  ${name}: ${stats.count}次, 最大${stats.maxWeight}kg → 推荐${recommendedWeight}kg`);
            });

            console.log('\n' + '='.repeat(60) + '\n');
        }

        // 4. 测试推荐算法
        if (users.length > 0) {
            const testUser = users[0];
            console.log(`🧪 测试推荐算法 (用户: ${testUser.email})`);

            const testParams = {
                userId: testUser.id,
                exerciseName: 'Barbell Deadlift',
                userWeight: testUser.profile?.weight || 85,
                experienceLevel: 'Intermediate',
                mechanic: 'Compound'
            };

            console.log('📤 测试参数:', JSON.stringify(testParams, null, 2));

            // 这里我们需要导入并测试推荐服务
            console.log('\n⚠️ 需要编译后端代码来测试推荐服务...');
        }

    } catch (error) {
        console.error('❌ 调试过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

comprehensiveUserDataDebug();