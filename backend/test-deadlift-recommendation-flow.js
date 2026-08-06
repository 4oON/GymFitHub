const { PrismaClient } = require('@prisma/client');
const { getExerciseRecommendationWithHistory } = require('./dist/services/enhancedRecommendationService');

const prisma = new PrismaClient();

async function testDeadliftRecommendation() {
  console.log('🧪 测试硬拉推荐流程...\n');

  try {
    // 1. 获取用户信息
    const users = await prisma.user.findMany({
      include: { profile: true },
      take: 1
    });

    if (users.length === 0) {
      console.log('❌ 没有找到用户');
      return;
    }

    const user = users[0];
    const userId = user.id;
    const userWeight = user.profile?.weight || 70;

    console.log(`👤 用户ID: ${userId}`);
    console.log(`⚖️ 用户体重: ${userWeight}kg\n`);

    // 2. 模拟前端请求参数
    const requestParams = {
      userId: userId,
      exerciseName: 'Barbell Deadlift',
      userWeight: userWeight,
      experienceLevel: 'Intermediate',
      mechanic: 'Compound'
    };

    console.log('📤 请求参数:');
    console.log(JSON.stringify(requestParams, null, 2));
    console.log('');

    // 3. 调用增强推荐服务
    console.log('🤖 调用增强推荐服务...');
    const recommendation = await getExerciseRecommendationWithHistory(requestParams);

    console.log('✅ 推荐结果:');
    console.log(JSON.stringify(recommendation, null, 2));
    console.log('');

    // 4. 分析结果
    console.log('📊 结果分析:');
    console.log(`- 推荐重量: ${recommendation.weight}kg`);
    console.log(`- APP显示: 85kg`);
    console.log(`- 是否一致: ${recommendation.weight === 85 ? '✅ 是' : '❌ 否'}`);
    console.log(`- 推荐理由: ${recommendation.reason}`);

    // 5. 计算预期值
    console.log('\n🧮 预期计算:');
    console.log(`- 体重: ${userWeight}kg`);
    console.log(`- Intermediate + Compound: ${userWeight} × 0.6 = ${userWeight * 0.6}kg`);
    console.log(`- 四舍五入到2.5kg: ${Math.round((userWeight * 0.6) / 2.5) * 2.5}kg`);

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeadliftRecommendation();