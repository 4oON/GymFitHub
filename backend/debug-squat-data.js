const { PrismaClient } = require('@prisma/client');

async function debugSquatData() {
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });

    try {
        console.log('🔍 开始调试深蹲数据...\n');

        // 1. 检查数据库连接
        console.log('1. 测试数据库连接...');
        await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ 数据库连接成功\n');

        // 2. 查看用户数据
        console.log('2. 查看用户数据...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                profile: {
                    select: {
                        weight: true,
                        experienceLevel: true
                    }
                },
                _count: {
                    select: {
                        workouts: true
                    }
                }
            },
            take: 5
        });

        console.log(`找到 ${users.length} 个用户:`);
        users.forEach(user => {
            const weight = user.profile?.weight || '未设置';
            const experience = user.profile?.experienceLevel || '未设置';
            console.log(`  - ID: ${user.id}, 邮箱: ${user.email}, 体重: ${weight}kg, 经验: ${experience}, 训练记录: ${user._count.workouts}条`);
        });

        if (users.length === 0) {
            console.log('❌ 没有找到用户数据，请先创建用户');
            return;
        }

        // 3. 查看所有训练记录
        const userId = users[0].id;
        console.log(`\n3. 查看用户 ${userId} 的所有训练记录...`);

        const allWorkouts = await prisma.workout.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 10
        });

        console.log(`找到 ${allWorkouts.length} 条训练记录:`);
        allWorkouts.forEach((workout, index) => {
            const workoutDate = workout.date ? workout.date.toISOString().split('T')[0] : workout.createdAt.toISOString().split('T')[0];
            console.log(`\n  ${index + 1}. 日期: ${workoutDate}`);
            console.log(`     训练名称: ${workout.name}`);
            console.log(`     时长: ${workout.durationMin || 0}分钟`);

            // 解析JSON格式的exercises数据
            try {
                const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
                console.log(`     动作数量: ${exercises.length}`);

                exercises.forEach(exercise => {
                    if (exercise.sets && exercise.sets.length > 0) {
                        const weights = exercise.sets.map(set => set.weight || 0);
                        const maxWeight = Math.max(...weights);
                        console.log(`     - ${exercise.exerciseName}: ${exercise.sets.length}组, 最大重量: ${maxWeight}kg`);
                    }
                });
            } catch (error) {
                console.log(`     ❌ 解析训练数据失败: ${error.message}`);
            }
        });

        // 4. 专门查找深蹲相关训练
        console.log(`\n4. 查找深蹲相关训练...`);

        const squatWorkouts = [];
        for (const workout of allWorkouts) {
            try {
                const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
                const squatExercises = exercises.filter(ex =>
                    ex.exerciseName && (
                        ex.exerciseName.toLowerCase().includes('squat') ||
                        ex.exerciseName.includes('深蹲')
                    )
                );

                if (squatExercises.length > 0) {
                    squatWorkouts.push({
                        ...workout,
                        squatExercises
                    });
                }
            } catch (error) {
                console.log(`解析训练 ${workout.id} 失败: ${error.message}`);
            }
        }

        console.log(`找到 ${squatWorkouts.length} 条深蹲训练记录:`);

        if (squatWorkouts.length > 0) {
            squatWorkouts.forEach((workout, index) => {
                const workoutDate = workout.date ? workout.date.toISOString().split('T')[0] : workout.createdAt.toISOString().split('T')[0];
                console.log(`\n  ${index + 1}. 日期: ${workoutDate}`);

                workout.squatExercises.forEach(exercise => {
                    console.log(`     动作: ${exercise.exerciseName}`);
                    if (exercise.sets && exercise.sets.length > 0) {
                        const weights = exercise.sets.map(set => set.weight || 0);
                        const maxWeight = Math.max(...weights);
                        const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

                        console.log(`     最大重量: ${maxWeight}kg`);
                        console.log(`     平均重量: ${avgWeight.toFixed(1)}kg`);
                        console.log(`     建议重量 (80%): ${(maxWeight * 0.8).toFixed(1)}kg`);
                        console.log(`     组数详情: ${exercise.sets.map(set => `${set.weight || 0}kg×${set.reps}`).join(', ')}`);
                    }
                });
            });

            // 5. 分析AI推荐问题
            console.log(`\n5. AI推荐问题分析:`);
            const latestSquat = squatWorkouts[0].squatExercises[0];
            if (latestSquat && latestSquat.sets && latestSquat.sets.length > 0) {
                const weights = latestSquat.sets.map(set => set.weight || 0);
                const maxWeight = Math.max(...weights);
                const recommendedWeight = Math.round(maxWeight * 0.8 * 4) / 4; // 四舍五入到0.25kg

                console.log(`  - 最近一次深蹲最大重量: ${maxWeight}kg`);
                console.log(`  - 理想推荐重量 (80%): ${recommendedWeight}kg`);
                console.log(`  - 当前AI推荐: 79.5kg`);
                console.log(`  - 差异: ${Math.abs(recommendedWeight - 79.5).toFixed(1)}kg`);

                if (Math.abs(recommendedWeight - 79.5) > 5) {
                    console.log(`  ❌ 推荐重量差异过大，需要修复算法`);
                } else {
                    console.log(`  ✅ 推荐重量基本合理`);
                }
            }
        } else {
            console.log('❌ 没有找到深蹲训练记录');

            // 查看所有动作名称
            console.log('\n所有动作名称:');
            const allExerciseNames = new Set();

            for (const workout of allWorkouts) {
                try {
                    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
                    exercises.forEach(ex => {
                        if (ex.exerciseName) {
                            allExerciseNames.add(ex.exerciseName);
                        }
                    });
                } catch (error) {
                    // 忽略解析错误
                }
            }

            Array.from(allExerciseNames).forEach(name => {
                console.log(`  - ${name}`);
            });
        }

    } catch (error) {
        console.error('❌ 调试过程中出现错误:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔚 调试完成');
    }
}

debugSquatData();