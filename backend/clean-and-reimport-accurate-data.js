/**
 * ZenFit 数据清理和重新导入脚本
 * 
 * 功能：
 * 1. 删除2026-01-14之前的所有不准确数据
 * 2. 根据用户提供的准确SQL数据重新导入训练记录
 * 
 * 数据来源：
 * - 2025-12-30: 下肢训练 (ZenFit_Xun-Lian-Bao-Gao-_2026-01-10.pdf)
 * - 2026-01-05: 背部训练 (ZenFit_Xun-Lian-Bao-Gao-_2026-01-06.pdf)
 * - 2026-01-08: 胸肩腹训练 (ZenFit_Xun-Lian-Bao-Gao-_2026-01-08.pdf)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// 准确的训练数据
const ACCURATE_WORKOUTS = [
    // 2025-12-30 下肢训练
    {
        date: '2025-12-30',
        bodyWeight: 70.0,
        totalVolume: 13868,
        duration: 15,
        calories: 182,
        setsCount: 12,
        exercises: [
            {
                name: 'Barbell Squat',
                muscle: 'Quads',
                sets: 4,
                reps: [11, 11, 11, 11],
                weights: [115, 115, 115, 115],
                volume: 5060
            },
            {
                name: 'Barbell Deadlift',
                muscle: 'Hamstrings',
                sets: 3,
                reps: [9, 9, 9],
                weights: [120, 120, 120],
                volume: 3240
            },
            {
                name: 'Machine Hip And Glute Kickback',
                muscle: 'Glutes',
                sets: 3,
                reps: [16, 16, 16],
                weights: [109, 109, 109],
                volume: 5232
            },
            {
                name: 'Dumbbell Forward Lunge',
                muscle: 'Glutes',
                sets: 2,
                reps: [6, 6],
                weights: [28, 28],
                volume: 336
            }
        ]
    },

    // 2026-01-05 背部训练
    {
        date: '2026-01-05',
        bodyWeight: 70.0,
        totalVolume: 8302,
        duration: 18,
        calories: 135,
        setsCount: 16,
        exercises: [
            {
                name: 'Machine Assisted Pull Up',
                muscle: 'Lats',
                sets: 3,
                reps: [11, 11, 11],
                weights: [64, 64, 64],
                volume: 2112
            },
            {
                name: 'Barbell Bent Over Row',
                muscle: 'Lats',
                sets: 4,
                reps: [10, 10, 10, 10],
                weights: [40, 40, 40, 40],
                volume: 1600
            },
            {
                name: 'Machine Pulldown',
                muscle: 'Lats',
                sets: 4,
                reps: [12, 12, 12, 12],
                weights: [50, 50, 50, 50],
                volume: 2400
            },
            {
                name: 'Machine Reverse Fly',
                muscle: 'Shoulders',
                sets: 3,
                reps: [13, 13, 13],
                weights: [30, 30, 30],
                volume: 1170
            },
            {
                name: 'Cable 30 Degree Shrug',
                muscle: 'Traps',
                sets: 2,
                reps: [34, 34],
                weights: [15, 15],
                volume: 1020
            }
        ]
    },

    // 2026-01-08 胸肩腹训练
    {
        date: '2026-01-08',
        bodyWeight: 70.0,
        totalVolume: 9817.5,
        duration: 22,
        calories: 179,
        setsCount: 17,
        exercises: [
            {
                name: 'Dumbbell Seated Overhead Press',
                muscle: 'Shoulders',
                sets: 5,
                reps: [9, 10, 10, 11, 10],
                weights: [60, 60, 60, 60, 60],
                volume: 3000
            },
            {
                name: 'Barbell Bench Press',
                muscle: 'Chest',
                sets: 3,
                reps: [10, 10, 10],
                weights: [40, 60, 60],
                volume: 1600
            },
            {
                name: 'Machine Overhand Overhead Press',
                muscle: 'Abs',
                sets: 2,
                reps: [13, 10],
                weights: [42.5, 42.5],
                volume: 978
            },
            {
                name: 'Machine Pec Fly',
                muscle: 'Chest',
                sets: 4,
                reps: [11, 8, 9, 8],
                weights: [70, 85, 70, 70],
                volume: 2640
            },
            {
                name: 'Machine Assisted Parallel Bar Dip',
                muscle: 'Chest',
                sets: 3,
                reps: [11, 15, 6],
                weights: [50, 46, 60],
                volume: 1600
            }
        ]
    }
];

// 将练习数据转换为前端期望的格式
function convertToFrontendFormat(workout) {
    const now = Date.now();
    const exercises = [];

    workout.exercises.forEach((exercise, index) => {
        const sets = [];

        // 创建sets数组
        for (let i = 0; i < exercise.sets; i++) {
            sets.push({
                id: uuidv4(),
                weight: exercise.weights[i] || 0,
                reps: exercise.reps[i] || 0,
                completed: true
            });
        }

        exercises.push({
            id: uuidv4(),
            exerciseId: `exercise-${uuidv4()}`,
            exerciseName: exercise.name,
            muscleGroup: exercise.muscle,
            sets: sets,
            createdAt: now + index
        });
    });

    return exercises;
}

async function main() {
    try {
        console.log('🚀 开始清理和重新导入数据...\n');

        // 获取用户ID
        const user = await prisma.user.findFirst({
            where: { email: '123@123.com' }
        });

        if (!user) {
            console.error('❌ 找不到用户 leox1@gmail.com');
            return;
        }

        console.log(`✅ 找到用户: ${user.email} (ID: ${user.id})\n`);

        // STEP 1: 删除2026-01-14之前的所有数据
        console.log('📅 删除2026-01-14之前的所有数据...');

        const cutoffDate = new Date('2026-01-14T00:00:00.000Z');

        const deletedWorkouts = await prisma.workout.deleteMany({
            where: {
                userId: user.id,
                date: {
                    lt: cutoffDate
                }
            }
        });

        console.log(`✅ 已删除 ${deletedWorkouts.count} 条训练记录\n`);

        // STEP 2: 导入准确的训练数据
        console.log('📥 开始导入准确的训练数据...\n');

        for (const workout of ACCURATE_WORKOUTS) {
            console.log(`\n📅 导入 ${workout.date} 的训练数据...`);
            console.log(`   体重: ${workout.bodyWeight} KG`);
            console.log(`   总容量: ${workout.totalVolume} KG`);
            console.log(`   时长: ${workout.duration} MIN`);
            console.log(`   卡路里: ${workout.calories} KCAL`);
            console.log(`   总组数: ${workout.setsCount}`);
            console.log(`   练习数: ${workout.exercises.length}`);

            // 转换为前端格式
            const exercises = convertToFrontendFormat(workout);

            // 创建训练记录
            const workoutRecord = await prisma.workout.create({
                data: {
                    userId: user.id,
                    name: `${workout.date} 训练`,
                    description: `总容量: ${workout.totalVolume} KG, 时长: ${workout.duration} MIN, 卡路里: ${workout.calories} KCAL`,
                    date: new Date(workout.date + 'T00:00:00.000Z'),
                    durationMin: workout.duration,
                    exercises: exercises
                }
            });

            console.log(`   ✅ 成功创建训练记录 (ID: ${workoutRecord.id})`);

            // 显示每个练习的详细信息
            workout.exercises.forEach((exercise, index) => {
                console.log(`   ${index + 1}. ${exercise.name} (${exercise.muscle})`);
                console.log(`      - ${exercise.sets}组 × ${exercise.reps.join(',')}次 × ${exercise.weights.join(',')}kg`);
                console.log(`      - 容量: ${exercise.volume} KG`);
            });
        }

        console.log('\n\n✅ 数据清理和导入完成！');
        console.log('\n📊 导入摘要:');
        console.log(`   - 删除记录数: ${deletedWorkouts.count}`);
        console.log(`   - 导入记录数: ${ACCURATE_WORKOUTS.length}`);
        console.log(`   - 总练习数: ${ACCURATE_WORKOUTS.reduce((sum, w) => sum + w.exercises.length, 0)}`);

        // 验证导入的数据
        console.log('\n\n🔍 验证导入的数据...');

        const importedWorkouts = await prisma.workout.findMany({
            where: {
                userId: user.id,
                date: {
                    lt: cutoffDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log(`\n✅ 找到 ${importedWorkouts.length} 条训练记录:`);

        importedWorkouts.forEach((workout) => {
            const exercises = workout.exercises;
            console.log(`\n📅 ${workout.date.toISOString().split('T')[0]}`);
            console.log(`   体重: ${workout.bodyWeight} KG`);
            console.log(`   总容量: ${workout.totalVolume} KG`);
            console.log(`   时长: ${workout.duration} MIN`);
            console.log(`   卡路里: ${workout.caloriesBurned} KCAL`);
            console.log(`   练习数: ${exercises.length}`);

            exercises.forEach((exercise, index) => {
                console.log(`   ${index + 1}. ${exercise.exerciseName} (${exercise.muscleGroup})`);
                console.log(`      - ${exercise.sets.length}组`);
            });
        });

        console.log('\n\n🎉 所有操作完成！');
        console.log('\n📝 下一步操作:');
        console.log('   1. 打开 http://localhost:5174/refresh-clean-data.html');
        console.log('   2. 点击"清除缓存并重新加载干净数据"');
        console.log('   3. 刷新浏览器（F5）');
        console.log('   4. 进入Progress页面查看新导入的数据');

    } catch (error) {
        console.error('❌ 错误:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error('❌ 脚本执行失败:', error);
        process.exit(1);
    });
