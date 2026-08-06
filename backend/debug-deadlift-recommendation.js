const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDeadliftRecommendation() {
    console.log('🔍 调试硬拉推荐问题...\n');

    try {
        // 1. 查找用户ID
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });

        if (users.length === 0) {
            console.log('❌ 没有找到用户');
            return;
        }

        const userId = users[0].id;
        console.log(`👤 用户ID: ${userId}`);
        console.log(`📧 邮箱: ${users[0].email}\n`);

        // 2. 查找硬拉相关的训练记录
        const workouts = await prisma.workout.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: 10
        });

        console.log(`📊 总训练记录数: ${workouts.length}\n`);

        // 3. 分析硬拉数据
        let deadliftWorkouts = [];
        let maxDeadliftWeight = 0;

        workouts.forEach((workout, index) => {
            console.log(`🏋️ 训练 ${index + 1}: ${workout.date.toISOString().split('T')[0]}`);

            if (workout.exercises && Array.isArray(workout.exercises)) {
                workout.exercises.forEach(exercise => {
                    const exerciseName = exercise.name?.toLowerCase() || '';

                    // 检查是否为硬拉相关动作
                    if (exerciseName.includes('deadlift') ||
                        exerciseName.includes('硬拉') ||
                        exerciseName.includes('barbell deadlift')) {

                        console.log(`  ✅ 找到硬拉: ${exercise.name}`);

                        if (exercise.sets && Array.isArray(exercise.sets)) {
                            exercise.sets.forEach((set, setIndex) => {
                                const weight = parseFloat(set.weight) || 0;
                                console.log(`    组 ${setIndex + 1}: ${weight}kg × ${set.reps}次`);

                                if (weight > maxDeadliftWeight) {
                                    maxDeadliftWeight = weight;
                                }
                            });
                        }

                        deadliftWorkouts.push({
                            date: workout.date,
                            exercise: exercise.name,
                            sets: exercise.sets
                        });
                    }
                });
            }
            console.log('');
        });

        console.log(`🎯 硬拉训练记录总数: ${deadliftWorkouts.length}`);
        console.log(`💪 历史最大硬拉重量: ${maxDeadliftWeight}kg\n`);

        // 4. 计算推荐重量
        let recommendedWeight;

        if (maxDeadliftWeight > 0) {
            recommendedWeight = Math.round(maxDeadliftWeight * 0.8);
            console.log(`🧮 基于历史数据推荐: ${maxDeadliftWeight} × 0.8 = ${recommendedWeight}kg`);
        } else {
            // Fallback逻辑 - 从UserProfile获取体重
            const userProfile = await prisma.userProfile.findUnique({
                where: { userId: userId },
                select: { weight: true }
            });

            const userWeight = userProfile?.weight || 70;
            recommendedWeight = Math.round(userWeight * 1.2); // 硬拉通常比体重重
            console.log(`⚠️  无历史数据，使用fallback: ${userWeight} × 1.2 = ${recommendedWeight}kg`);
        }

        console.log(`\n🎯 最终推荐重量: ${recommendedWeight}kg`);
        console.log(`📱 APP显示重量: 85kg`);
        console.log(`❓ 是否一致: ${recommendedWeight === 85 ? '✅ 是' : '❌ 否'}`);

        // 5. 检查AI服务调用
        console.log('\n🤖 检查AI推荐服务...');

        // 模拟AI推荐请求
        const mockRequest = {
            exerciseName: 'Barbell Deadlift',
            exerciseType: 'compound',
            muscleGroups: ['hamstrings', 'lower_back'],
            userLevel: 'intermediate',
            equipment: 'barbell'
        };

        console.log('📤 模拟请求参数:', JSON.stringify(mockRequest, null, 2));

    } catch (error) {
        console.error('❌ 调试过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugDeadliftRecommendation();