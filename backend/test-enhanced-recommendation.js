/**
 * 测试增强的AI推荐功能
 * 
 * 这个脚本会：
 * 1. 创建测试用户和训练数据
 * 2. 测试AI推荐算法
 * 3. 验证推荐结果是否合理
 */

const { PrismaClient } = require('@prisma/client');
const { getEnhancedExerciseRecommendation } = require('./dist/services/enhancedRecommendationService');

async function testEnhancedRecommendation() {
    const prisma = new PrismaClient({
        log: ['info', 'warn', 'error'],
    });

    try {
        console.log('🧪 开始测试增强的AI推荐功能...\n');

        // 1. 创建测试用户
        console.log('1. 创建测试用户...');

        const testUser = await prisma.user.upsert({
            where: { email: 'ai-test-user@example.com' },
            update: {},
            create: {
                email: 'ai-test-user@example.com',
                password: 'test123',
                profile: {
                    create: {
                        weight: 80,
                        experienceLevel: 'Intermediate',
                        age: 25,
                        gender: 'Male'
                    }
                }
            },
            include: {
                profile: true
            }
        });

        console.log(`✅ 测试用户创建成功: ${testUser.email}, 体重: ${testUser.profile?.weight}kg`);

        // 2. 创建历史训练数据
        console.log('\n2. 创建历史训练数据...');

        const testWorkouts = [
            {
                name: '腿部训练 - 3天前',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
                exercises: [
                    {
                        exerciseName: 'Barbell Squat',
                        sets: [
                            { weight: 100, reps: 8 },
                            { weight: 105, reps: 6 },
                            { weight: 110, reps: 5 },
                            { weight: 115, reps: 3 }
                        ]
                    },
                    {
                        exerciseName: 'Romanian Deadlift',
                        sets: [
                            { weight: 90, reps: 10 },
                            { weight: 95, reps: 8 },
                            { weight: 100, reps: 6 }
                        ]
                    }
                ]
            },
            {
                name: '腿部训练 - 10天前',
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10天前
                exercises: [
                    {
                        exerciseName: 'Barbell Squat',
                        sets: [
                            { weight: 95, reps: 8 },
                            { weight: 100, reps: 6 },
                            { weight: 105, reps: 5 }
                        ]
                    }
                ]
            }
        ];

        for (const workoutData of testWorkouts) {
            await prisma.workout.create({
                data: {
                    userId: testUser.id,
                    name: workoutData.name,
                    date: workoutData.date,
                    durationMin: 60,
                    exercises: workoutData.exercises
                }
            });
        }

        console.log(`✅ 创建了 ${testWorkouts.length} 条测试训练记录`);

        // 3. 测试AI推荐
        console.log('\n3. 测试AI推荐功能...');

        const testCases = [
            {
                name: '深蹲推荐测试',
                params: {
                    userId: testUser.id,
                    exerciseName: 'Barbell Squat',
                    userWeight: testUser.profile?.weight || 80,
                    experienceLevel: testUser.profile?.experienceLevel || 'Intermediate',
                    mechanic: 'Compound'
                },
                expectedWeightRange: [90, 100] // 期望推荐重量范围
            },
            {
                name: '新动作推荐测试',
                params: {
                    userId: testUser.id,
                    exerciseName: 'Bench Press',
                    userWeight: testUser.profile?.weight || 80,
                    experienceLevel: testUser.profile?.experienceLevel || 'Intermediate',
                    mechanic: 'Compound'
                },
                expectedWeightRange: [40, 60] // 没有历史数据，基于体重推荐
            }
        ];

        for (const testCase of testCases) {
            console.log(`\n📊 ${testCase.name}:`);
            console.log(`   参数:`, testCase.params);

            try {
                const recommendation = await getEnhancedExerciseRecommendation(testCase.params);

                console.log(`   推荐结果:`, recommendation);

                // 验证推荐结果
                const isWeightInRange = recommendation.weight >= testCase.expectedWeightRange[0] &&
                    recommendation.weight <= testCase.expectedWeightRange[1];

                if (isWeightInRange) {
                    console.log(`   ✅ 推荐重量 ${recommendation.weight}kg 在合理范围内 [${testCase.expectedWeightRange[0]}-${testCase.expectedWeightRange[1]}kg]`);
                } else {
                    console.log(`   ❌ 推荐重量 ${recommendation.weight}kg 超出预期范围 [${testCase.expectedWeightRange[0]}-${testCase.expectedWeightRange[1]}kg]`);
                }

                console.log(`   推荐理由: ${recommendation.reason}`);

            } catch (error) {
                console.error(`   ❌ 推荐失败:`, error.message);
            }
        }

        // 4. 对比原有推荐算法
        console.log('\n4. 对比测试 - 模拟原有79.5kg推荐问题...');

        const originalRecommendation = {
            weight: 79.5,
            reason: '基于体重的通用推荐'
        };

        const enhancedRecommendation = await getEnhancedExerciseRecommendation({
            userId: testUser.id,
            exerciseName: 'Barbell Squat',
            userWeight: 80,
            experienceLevel: 'Intermediate',
            mechanic: 'Compound'
        });

        console.log(`   原有推荐: ${originalRecommendation.weight}kg - ${originalRecommendation.reason}`);
        console.log(`   增强推荐: ${enhancedRecommendation.weight}kg - ${enhancedRecommendation.reason}`);

        const improvement = enhancedRecommendation.weight - originalRecommendation.weight;
        console.log(`   改进幅度: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}kg`);

        if (Math.abs(improvement) > 5) {
            console.log(`   ✅ 推荐算法显著改进！`);
        } else {
            console.log(`   ⚠️ 推荐改进不明显，可能需要进一步调整`);
        }

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据...');
        await prisma.workout.deleteMany({
            where: { userId: testUser.id }
        });
        await prisma.userProfile.delete({
            where: { userId: testUser.id }
        });
        await prisma.user.delete({
            where: { id: testUser.id }
        });
        console.log('✅ 测试数据清理完成');

    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔚 测试完成');
    }
}

// 运行测试
testEnhancedRecommendation();