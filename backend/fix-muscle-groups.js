/**
 * 修复历史数据的肌肉群字段
 * Fix muscle groups for historical workout data
 * 
 * 使用方法：
 * node fix-muscle-groups.js <用户ID>
 */

const { PrismaClient } = require('@prisma/client');
const { identifyMuscleGroup } = require('./muscle-group-mapper');

const prisma = new PrismaClient();

/**
 * 修复指定用户的所有训练记录的肌肉群信息
 * @param {string} userId - 用户ID
 */
async function fixMuscleGroups(userId) {
    console.log('='.repeat(60));
    console.log('修复肌肉群数据工具');
    console.log('Fix Muscle Groups Tool');
    console.log('='.repeat(60));
    console.log('\n用户ID:', userId);

    try {
        // 验证用户是否存在
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.error(`❌ 错误: 找不到用户 ${userId}`);
            process.exit(1);
        }

        console.log('✅ 用户验证通过:', user.email);

        // 获取所有训练记录
        const workouts = await prisma.workout.findMany({
            where: { userId: userId },
            orderBy: { date: 'desc' }
        });

        console.log(`\n找到 ${workouts.length} 条训练记录\n`);

        if (workouts.length === 0) {
            console.log('没有需要修复的记录');
            return;
        }

        let fixedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // 遍历每条记录
        for (const workout of workouts) {
            try {
                console.log(`\n处理记录: ${workout.name} (${workout.date ? workout.date.toISOString().split('T')[0] : '无日期'})`);

                if (!workout.exercises || workout.exercises.length === 0) {
                    console.log('  ⚠️  跳过：没有练习数据');
                    skippedCount++;
                    continue;
                }

                // 检查是否需要修复
                const needsFix = workout.exercises.some(ex =>
                    !ex.muscleGroup ||
                    !ex.muscleGroups ||
                    ex.muscleGroups.length === 0
                );

                if (!needsFix) {
                    console.log('  ✓ 跳过：肌肉群数据已完整');
                    skippedCount++;
                    continue;
                }

                // 修复每个练习的肌肉群
                const updatedExercises = workout.exercises.map(ex => {
                    const muscleGroup = identifyMuscleGroup(ex.name);
                    console.log(`    - ${ex.name} → ${muscleGroup}`);

                    return {
                        ...ex,
                        muscleGroup: muscleGroup,
                        muscleGroups: [muscleGroup]
                    };
                });

                // 更新数据库
                await prisma.workout.update({
                    where: { id: workout.id },
                    data: { exercises: updatedExercises }
                });

                console.log('  ✅ 修复成功');
                fixedCount++;

            } catch (error) {
                console.error(`  ❌ 修复失败:`, error.message);
                errorCount++;
            }
        }

        // 总结
        console.log('\n' + '='.repeat(60));
        console.log('修复完成！');
        console.log('='.repeat(60));
        console.log(`✅ 成功修复: ${fixedCount} 条记录`);
        console.log(`⚠️  跳过: ${skippedCount} 条记录`);
        console.log(`❌ 失败: ${errorCount} 条记录`);
        console.log(`📊 总计: ${workouts.length} 条记录`);

        // 显示修复后的数据示例
        if (fixedCount > 0) {
            console.log('\n查询修复后的数据...');
            const updatedWorkouts = await prisma.workout.findMany({
                where: { userId: userId },
                orderBy: { date: 'desc' },
                take: 3
            });

            console.log('\n最近3条记录的肌肉群分布:');
            updatedWorkouts.forEach((w, i) => {
                const muscleGroups = new Set();
                w.exercises.forEach(ex => {
                    if (ex.muscleGroup) muscleGroups.add(ex.muscleGroup);
                });
                console.log(`  ${i + 1}. ${w.name} - ${w.date ? w.date.toISOString().split('T')[0] : '无日期'}`);
                console.log(`     肌肉群: ${Array.from(muscleGroups).join(', ')}`);
            });
        }

    } catch (error) {
        console.error('\n❌ 程序错误:', error);
        throw error;
    }
}

/**
 * 预览模式：只显示需要修复的记录，不实际修改
 * @param {string} userId - 用户ID
 */
async function previewFix(userId) {
    console.log('='.repeat(60));
    console.log('预览模式 - 不会修改数据');
    console.log('Preview Mode - No Changes Will Be Made');
    console.log('='.repeat(60));
    console.log('\n用户ID:', userId);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            console.error(`❌ 错误: 找不到用户 ${userId}`);
            process.exit(1);
        }

        console.log('✅ 用户验证通过:', user.email);

        const workouts = await prisma.workout.findMany({
            where: { userId: userId },
            orderBy: { date: 'desc' }
        });

        console.log(`\n找到 ${workouts.length} 条训练记录\n`);

        let needsFixCount = 0;

        for (const workout of workouts) {
            if (!workout.exercises || workout.exercises.length === 0) continue;

            const needsFix = workout.exercises.some(ex =>
                !ex.muscleGroup ||
                !ex.muscleGroups ||
                ex.muscleGroups.length === 0
            );

            if (needsFix) {
                needsFixCount++;
                console.log(`${needsFixCount}. ${workout.name} (${workout.date ? workout.date.toISOString().split('T')[0] : '无日期'})`);
                workout.exercises.forEach(ex => {
                    const currentMuscle = ex.muscleGroup || '未设置';
                    const newMuscle = identifyMuscleGroup(ex.name);
                    console.log(`   - ${ex.name}: ${currentMuscle} → ${newMuscle}`);
                });
                console.log('');
            }
        }

        console.log('='.repeat(60));
        console.log(`需要修复的记录: ${needsFixCount}/${workouts.length}`);
        console.log('='.repeat(60));
        console.log('\n提示: 运行 node fix-muscle-groups.js <用户ID> 来执行修复');

    } catch (error) {
        console.error('\n❌ 程序错误:', error);
        throw error;
    }
}

// 主程序
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\n使用方法:');
        console.log('  node fix-muscle-groups.js <用户ID>           # 修复数据');
        console.log('  node fix-muscle-groups.js <用户ID> --preview # 预览模式');
        console.log('\n示例:');
        console.log('  node fix-muscle-groups.js abc-123-def-456');
        console.log('  node fix-muscle-groups.js abc-123-def-456 --preview');
        process.exit(1);
    }

    const userId = args[0];
    const isPreview = args.includes('--preview') || args.includes('-p');

    if (isPreview) {
        await previewFix(userId);
    } else {
        // 确认操作
        console.log('\n⚠️  警告: 此操作将修改数据库中的训练记录');
        console.log('建议先运行预览模式: node fix-muscle-groups.js', userId, '--preview\n');

        await fixMuscleGroups(userId);
    }
}

// 运行主函数
main()
    .catch(error => {
        console.error('程序错误:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
