/**
 * 修复6号、8号、10号训练记录的数据格式
 * 将旧格式转换为前端期望的格式
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// 生成UUID
function uuidv4() {
    return crypto.randomUUID();
}

// 根据练习名称推断肌肉群
function inferMuscleGroup(exerciseName) {
    const name = exerciseName.toLowerCase();

    // 胸部
    if (name.includes('卧推') || name.includes('飞鸟') || name.includes('推胸')) {
        return 'Chest';
    }

    // 背部
    if (name.includes('引体') || name.includes('划船') || name.includes('硬拉')) {
        return 'Lats';
    }

    // 腿部
    if (name.includes('深蹲')) {
        return 'Quads';
    }
    if (name.includes('腿举')) {
        return 'Quads';
    }
    if (name.includes('腿弯举') || name.includes('腿屈伸')) {
        return 'Hamstrings';
    }

    // 肩部
    if (name.includes('推举') || name.includes('肩')) {
        return 'Shoulders';
    }

    // 手臂
    if (name.includes('弯举') || name.includes('二头')) {
        return 'Biceps';
    }
    if (name.includes('臂屈伸') || name.includes('三头')) {
        return 'Triceps';
    }

    // 默认返回Chest
    return 'Chest';
}

// 转换单个练习数据
function transformExercise(oldExercise, index) {
    const exerciseName = oldExercise.notes || '未知练习';
    const muscleGroup = inferMuscleGroup(exerciseName);
    const now = Date.now();

    // 创建sets数组
    const setsArray = [];
    const numSets = oldExercise.sets || 3;

    for (let i = 0; i < numSets; i++) {
        setsArray.push({
            id: uuidv4(),
            weight: oldExercise.weight || 0,
            reps: oldExercise.reps || 10,
            completed: true
        });
    }

    return {
        id: uuidv4(),
        exerciseId: oldExercise.exerciseId || `exercise-${uuidv4()}`,
        exerciseName: exerciseName,
        muscleGroup: muscleGroup,
        sets: setsArray,
        createdAt: now + index
    };
}

async function fixWorkoutData() {
    console.log('='.repeat(60));
    console.log('修复训练记录数据格式');
    console.log('='.repeat(60));

    try {
        const user = await prisma.user.findUnique({
            where: { email: '123@123.com' }
        });

        if (!user) {
            console.log('❌ 找不到用户');
            return;
        }

        console.log(`✅ 用户ID: ${user.id}`);

        // 获取需要修复的记录
        const workouts = await prisma.workout.findMany({
            where: {
                userId: user.id,
                OR: [
                    { name: '胸部训练' },
                    { name: '背部训练' },
                    { name: '腿部训练' }
                ]
            },
            orderBy: { date: 'asc' }
        });

        console.log(`\n找到 ${workouts.length} 条需要修复的记录`);

        for (const workout of workouts) {
            const date = new Date(workout.date);
            console.log(`\n${'='.repeat(40)}`);
            console.log(`处理: ${workout.name} (${date.toISOString().split('T')[0]})`);
            console.log(`${'='.repeat(40)}`);

            // 解析旧数据
            let oldExercises;
            try {
                oldExercises = typeof workout.exercises === 'string'
                    ? JSON.parse(workout.exercises)
                    : workout.exercises;
            } catch (error) {
                console.log('❌ 解析失败，跳过');
                continue;
            }

            if (!Array.isArray(oldExercises)) {
                console.log('❌ exercises不是数组，跳过');
                continue;
            }

            console.log(`旧格式练习数量: ${oldExercises.length}`);

            // 转换为新格式
            const newExercises = oldExercises.map((ex, index) => transformExercise(ex, index));

            console.log(`新格式练习数量: ${newExercises.length}`);

            // 显示转换结果
            newExercises.forEach((ex, i) => {
                console.log(`  ${i + 1}. ${ex.exerciseName} (${ex.muscleGroup}) - ${ex.sets.length}组`);
            });

            // 更新数据库
            try {
                await prisma.workout.update({
                    where: { id: workout.id },
                    data: {
                        exercises: newExercises
                    }
                });
                console.log('✅ 更新成功');
            } catch (error) {
                console.log('❌ 更新失败:', error.message);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('修复完成！');
        console.log(`${'='.repeat(60)}`);

    } catch (error) {
        console.error('修复失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行修复
fixWorkoutData();