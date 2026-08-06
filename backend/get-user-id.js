/**
 * 获取用户ID的辅助脚本
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('='.repeat(60));
    console.log('ZenFit 用户ID查询工具');
    console.log('='.repeat(60));

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
                _count: {
                    select: {
                        workouts: true,
                        routines: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (users.length === 0) {
            console.log('\n❌ 没有找到任何用户');
            console.log('提示: 请先注册一个账号');
            return;
        }

        console.log(`\n找到 ${users.length} 个用户:\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   用户ID: ${user.id}`);
            console.log(`   训练记录: ${user._count.workouts} 条`);
            console.log(`   训练计划: ${user._count.routines} 个`);
            console.log(`   注册时间: ${user.createdAt.toISOString().split('T')[0]}`);
            console.log('');
        });

        console.log('='.repeat(60));
        console.log('使用方法:');
        console.log('  node import-from-pdf.js <用户ID>');
        console.log('\n示例:');
        console.log(`  node import-from-pdf.js ${users[0].id}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ 查询失败:', error.message);
    }
}

main()
    .catch(error => {
        console.error('程序错误:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
