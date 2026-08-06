const { PrismaClient } = require('@prisma/client');
const { getExerciseRecommendationWithHistory } = require('./dist/services/enhancedRecommendationService');

const prisma = new PrismaClient();

async function testFixedRecommendation() {
    console.log('🧪 测试修复后的推荐功能...\n');

    try {
        // 测试123@123.com用户的硬拉推荐
        const testParams = {
            userId: '83381e3a-c430-48ca-9fba-b799bc64cc4b', // 123@123.com
            exerciseName: 'Barbell Deadlift',
            userWeight: 85,
            experienceLevel: 'Intermediate',
            mechanic: 'Compound'
        };

        console.log('📤 测试参数:');
        console.log(JSON.stringify(testParams, null, 2));
        console.log('');

        console.log('🤖 调用修复后的推荐服务...');
        const recommendation = await getExerciseRecommendationWithHistory(testParams);

        console.log('✅ 推荐结果:');
        console.log(JSON.stringify(recommendation, null, 2));
        console.log('');

        // 分析结果
        console.log('📊 结果分析:');
        console.log(`- 推荐重量: ${recommendation.weight}kg`);
        console.log(`- 预期重量: 96kg (120kg × 0.8)`);
        console.log(`- 是否正确: ${recommendation.weight === 96 ? '✅ 是' : '❌ 否'}`);
        console.log(`- 推荐理由: ${recommendation.reason}`);
        console.log(`- 组数: ${recommendation.sets}`);
        console.log(`- 次数: ${recommendation.reps}`);

        // 测试其他动作
        console.log('\n🏋️ 测试其他动作推荐:');

        const otherExercises = [
            'Barbell Squat',
            'Barbell Bench Press',
            'Machine Pec Fly'
        ];

        for (const exerciseName of otherExercises) {
            console.log(`\n📋 测试 ${exerciseName}:`);

            const otherRecommendation = await getExerciseRecommendationWithHistory({
                ...testParams,
                exerciseName
            });

            console.log(`  推荐重量: ${otherRecommendation.weight}kg`);
            console.log(`  推荐理由: ${otherRecommendation.reason}`);
        }

    } catch (error) {
        console.error('❌ 测试过程中出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFixedRecommendation();