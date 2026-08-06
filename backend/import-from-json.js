/**
 * JSON数据导入工具
 * 从JSON文件中导入训练数据到数据库
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 验证训练数据格式
 */
function validateWorkoutData(workout) {
    const errors = [];

    if (!workout.name || typeof workout.name !== 'string') {
        errors.push('训练名称(name)必须是字符串');
    }

    if (!workout.date) {
        errors.push('训练日期(date)是必需的');
    }

    if (!workout.exercises || !Array.isArray(workout.exercises)) {
        errors.push('练习列表(exercises)必须是数组');
    } else if (workout.exercises.length === 0) {
        errors.push('至少需要一个练习');
    }

    // 验证每个练习
    workout.exercises?.forEach((ex, i) => {
        if (!ex.name) {
            errors.push(`练习${i + 1}: 缺少名称(name)`);
        }
        if (!ex.muscleGroup) {
            errors.push(`练习${i + 1}: 缺少肌肉群(muscleGroup)`);
        }
        if (!ex.sets || !Array.isArray(ex.sets)) {
            errors.push(`练习${i + 1}: sets必须是数组`);
        }
    });

    return errors;
}

/**
 * 转换JSON数据为数据库格式
 */
function transformWorkoutData(workout) {
    return {
        name: workout.name,
        description: workout.description || '',
        date: new Date(workout.date),
        durationMin: workout.durationMin || 0,
        exercises: workout.exercises.map(ex => ({
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: ex.sets.map(s => ({
                reps: s.reps,
                weight: s.weight,
                completed: s.completed !== false // 默认为true
            }))
        }))
    };
}

/**
 * 导入单个训练
 */
async function importWorkout(userId, workoutData) {
    console.log(`\n导入训练: ${workoutData.name} (${workoutData.date})`);

    try {
        const workout = await prisma.workout.create({
            data: {
                userId: userId,
                name: workoutData.name,
                description: workoutData.description,
                date: workoutData.date,
                durationMin: workoutData.durationMin,
                exercises: workoutData.exercises
            }
        });

        console.log(`✅ 导入成功! ID: ${workout.id}`);
        console.log(`   - ${workoutData.exercises.length} 个练习`);
        console.log(`   - ${workoutData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} 组`);

        return workout;
    } catch (error) {
        console.error(`❌ 导入失败:`, error.message);
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(60));
    console.log('ZenFit JSON数据导入工具');
    console.log('='.repeat(60));

    // 获取命令行参数
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log('\n使用方法:');
        console.log('  node import-from-json.js <用户ID> <JSON文件路径>');
        console.log('\n示例:');
        console.log('  node import-from-json.js abc-123-def-456 workouts.json');
        console.log('  node import-from-json.js abc-123-def-456 C:\\project\\report\\workouts.json');
        process.exit(1);
    }

    const userId = args[0];
    const jsonFilePath = args[1];

    console.log('\n用户ID:', userId);
    console.log('JSON文件:', jsonFilePath);

    // 验证用户
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        console.error(`\n❌ 错误: 找不到用户 ${userId}`);
        console.log('\n提示: 运行以下命令查看所有用户:');
        console.log('  node get-user-id.js');
        process.exit(1);
    }

    console.log('✅ 用户验证通过:', user.email);

    // 读取JSON文件
    if (!fs.existsSync(jsonFilePath)) {
        console.error(`\n❌ 错误: 文件不存在 ${jsonFilePath}`);
        process.exit(1);
    }

    let workouts;
    try {
        const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
        workouts = JSON.parse(jsonContent);

        // 如果是单个对象，转换为数组
        if (!Array.isArray(workouts)) {
            workouts = [workouts];
        }

        console.log(`\n✅ JSON文件读取成功，找到 ${workouts.length} 个训练记录`);
    } catch (error) {
        console.error(`\n❌ JSON文件解析失败:`, error.message);
        console.log('\n提示: 请检查JSON格式是否正确');
        console.log('可以使用在线工具验证: https://jsonlint.com');
        process.exit(1);
    }

    // 验证所有训练数据
    console.log('\n验证数据格式...');
    let hasErrors = false;

    workouts.forEach((workout, i) => {
        const errors = validateWorkoutData(workout);
        if (errors.length > 0) {
            console.error(`\n❌ 训练 ${i + 1} (${workout.name || '未命名'}) 验证失败:`);
            errors.forEach(err => console.error(`   - ${err}`));
            hasErrors = true;
        } else {
            console.log(`✅ 训练 ${i + 1} (${workout.name}) 验证通过`);
        }
    });

    if (hasErrors) {
        console.error('\n❌ 数据验证失败，请修正后重试');
        process.exit(1);
    }

    // 导入数据
    console.log('\n' + '='.repeat(60));
    console.log('开始导入数据...');
    console.log('='.repeat(60));

    let successCount = 0;
    let failCount = 0;

    for (const workout of workouts) {
        try {
            const transformedData = transformWorkoutData(workout);
            await importWorkout(userId, transformedData);
            successCount++;
        } catch (error) {
            console.error(`处理失败: ${workout.name}`, error.message);
            failCount++;
        }
    }

    // 总结
    console.log('\n' + '='.repeat(60));
    console.log('导入完成!');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${successCount} 个训练`);
    console.log(`❌ 失败: ${failCount} 个训练`);
    console.log(`📊 总计: ${workouts.length} 个训练`);

    // 查询并显示导入的数据
    console.log('\n查询用户的所有训练记录...');
    const allWorkouts = await prisma.workout.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' }
    });

    console.log(`\n用户共有 ${allWorkouts.length} 条训练记录:`);
    allWorkouts.slice(0, 10).forEach((w, i) => {
        const exerciseCount = Array.isArray(w.exercises) ? w.exercises.length : 0;
        console.log(`  ${i + 1}. ${w.name} - ${w.date ? w.date.toISOString().split('T')[0] : '无日期'} (${exerciseCount} 个练习)`);
    });

    if (allWorkouts.length > 10) {
        console.log(`  ... 还有 ${allWorkouts.length - 10} 条记录`);
    }
}

// 运行主函数
main()
    .catch(error => {
        console.error('\n程序错误:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
