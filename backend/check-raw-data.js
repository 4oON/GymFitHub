/**
 * 深度检查特定记录的原始JSON数据
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRawData() {
    console.log('='.repeat(60));
    console.log('深度检查原始JSON数据');
    console.log('='.repeat(60));

    try {
        const user = await prisma.user.findUnique({
            where: { email: '123@123.com' }
        });

        if (!user) {
            console.log('❌ 找不到用户');
            return;
        }

        // 获取6号、8号、10号的记录
        const workouts = await prisma.workout.findMany({
            where: {
                userId: user.id,
                OR: [
                    { name: '胸部训练' },
                    { name: '背部训练' },
                    { name: '腿部训练' }
                ]
            },
            orderBy: { date: 'desc' }
        });

        console.log(`找到 ${workouts.length} 条目标记录:`);

        workouts.forEach((workout, i) => {
            const date = new Date(workout.date);
            console.log(`\n${'='.repeat(40)}`);
            console.log(`记录 ${i + 1}: ${workout.name}`);
            console.log(`日期: ${date.toISOString().split('T')[0]}`);
            console.log(`ID: ${workout.id}`);
            console.log(`${'='.repeat(40)}`);

            console.log('\n原始exercises字段:');
            console.log('类型:', typeof workout.exercises);

            if (typeof workout.exercises === 'string') {
                console.log('字符串长度:', workout.exercises.length);
                console.log('前100字符:', workout.exercises.substring(0, 100));

                try {
                    const parsed = JSON.parse(workout.exercises);
                    console.log('\n解析后的数据:');
                    console.log('类型:', typeof parsed);
                    console.log('是否为数组:', Array.isArray(parsed));

                    if (Array.isArray(parsed)) {
                        console.log('数组长度:', parsed.length);

                        parsed.forEach((ex, j) => {
                            console.log(`\n  练习 ${j + 1}:`);
                            console.log('    完整对象:', JSON.stringify(ex, null, 2));
                        });
                    } else {
                        console.log('完整对象:', JSON.stringify(parsed, null, 2));
                    }
                } catch (error) {
                    console.log('❌ JSON解析失败:', error.message);
                    console.log('原始数据:', workout.exercises);
                }
            } else {
                console.log('完整对象:', JSON.stringify(workout.exercises, null, 2));
            }
        });

    } catch (error) {
        console.error('检查失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRawData();