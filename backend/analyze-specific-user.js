const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSpecificUser() {
    console.log('🔍 分析123@123.com用户的详细数据...\n');

    try {
        // 查找特定用户
        const user = await prisma.user.findUnique({
            where: { email: '123@123.com' },
            include: {
                profile: true,
                workouts: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!user) {
            console.log('❌ 未找到用户 123@123.com');
            return;
        }

        console.log(`👤 用户信息:`);
        console.log(`- 邮箱: ${user.email}`);
        console.log(`- ID: ${user.id}`);
        console.log(`- 体重: ${user.profile?.weight}kg`);
        console.log(`- 训练记录数: ${user.workouts.length}\n`);

        // 分析每个训练记录
        user.workouts.forEach((workout, index) => {
            console.log(`🏋️ 训练记录 ${index + 1}:`);
            console.log(`- 日期: ${workout.date?.toISOString().split('T')[0] || workout.createdAt.toISOString().split('T')[0]}`);
            console.log(`- 名称: ${workout.name}`);
            console.log(`- 描述: ${workout.description || '无'}`);

            // 详细分析exercises JSON数据
            console.log(`- 原始exercises数据:`, JSON.stringify(workout.exercises, null, 2));

            if (workout.exercises && Array.isArray(workout.exercises)) {
                console.log(`- 动作数量: ${workout.exercises.length}`);

                workout.exercises.forEach((exercise, exIndex) => {
                    console.log(`  动作 ${exIndex + 1}:`);
                    console.log(`    - 名称: "${exercise.name || exercise.exerciseName || 'Unknown'}"`);
                    console.log(`    - 类型: ${exercise.type || '未知'}`);
                    console.log(`    - 肌肉群: ${exercise.muscleGroup || '未知'}`);

                    if (exercise.sets && Array.isArray(exercise.sets)) {
                        console.log(`    - 组数: ${exercise.sets.length}`);
                        exercise.sets.forEach((set, setIndex) => {
                            console.log(`      组 ${setIndex + 1}: ${set.weight || 0}kg × ${set.reps || 0}次`);
                        });
                    } else {
                        console.log(`    - 组数据: ${JSON.stringify(exercise.sets)}`);
                    }
                });
            } else {
                console.log(`- exercises数据格式异常: ${typeof workout.exercises}`);
            }

            console.log('');
        });

        // 查找硬拉相关记录
        console.log(`🎯 硬拉动作分析:`);
        let foundDeadlifts = false;
        let maxWeight = 0;

        user.workouts.forEach(workout => {
            if (workout.exercises && Array.isArray(workout.exercises)) {
                workout.exercises.forEach(exercise => {
                    const exerciseName = (exercise.name || exercise.exerciseName || '').toLowerCase();

                    if (exerciseName.includes('deadlift') ||
                        exerciseName.includes('硬拉') ||
                        exerciseName.includes('barbell deadlift')) {

                        foundDeadlifts = true;
                        console.log(`✅ 找到硬拉: ${exercise.name || exercise.exerciseName}`);

                        if (exercise.sets && Array.isArray(exercise.sets)) {
                            exercise.sets.forEach(set => {
                                const weight = parseFloat(set.weight) || 0;
                                if (weight > maxWeight) {
                                    maxWeight = weight;
                                }
                            });
                        }
                    }
                });
            }
        });

        if (!foundDeadlifts) {
            console.log('❌ 未找到硬拉记录，但发现120kg最大重量');
            console.log('🔍 可能的原因:');
            console.log('1. 动作名称不包含"deadlift"或"硬拉"');
            console.log('2. 数据结构问题');
            console.log('3. 动作名称为空或Unknown');
        } else {
            console.log(`💪 硬拉最大重量: ${maxWeight}kg`);
            const recommendedWeight = Math.round(maxWeight * 0.8);
            console.log(`🎯 推荐重量 (80%): ${recommendedWeight}kg`);
        }

        // 测试推荐服务
        console.log(`\n🧪 测试推荐服务:`);

        // 重新编译并测试
        console.log('需要重新编译TypeScript代码...');

    } catch (error) {
        console.error('❌ 分析过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeSpecificUser();