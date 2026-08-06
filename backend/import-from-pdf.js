/**
 * PDF数据导入工具
 * 从ZenFit导出的PDF文件中提取训练数据并导入到数据库
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const { identifyMuscleGroup } = require('./muscle-group-mapper');

const prisma = new PrismaClient();

// PDF文件目录
const PDF_DIR = 'C:\\project\\report';

/**
 * 从PDF文本中提取训练数据
 * @param {string} text - PDF文本内容
 * @param {string} filename - PDF文件名
 * @returns {Object} 训练数据对象
 */
function extractWorkoutData(text, filename) {
    console.log('\n=== 开始解析PDF ===');
    console.log('文件名:', filename);

    // 从文件名提取日期 (格式: ZenFit_训练报告_2026-01-06.pdf)
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    const workoutDate = dateMatch ? new Date(dateMatch[1]) : new Date();

    console.log('训练日期:', workoutDate.toISOString());

    // 提取训练名称
    const nameMatch = text.match(/训练名称[：:]\s*(.+?)(?:\n|$)/);
    const workoutName = nameMatch ? nameMatch[1].trim() : '训练记录';

    console.log('训练名称:', workoutName);

    // 提取训练描述
    const descMatch = text.match(/训练描述[：:]\s*(.+?)(?:\n|$)/);
    const description = descMatch ? descMatch[1].trim() : '';

    // 提取训练时长
    const durationMatch = text.match(/训练时长[：:]\s*(\d+)\s*分钟/);
    const durationMin = durationMatch ? parseInt(durationMatch[1]) : 0;

    console.log('训练时长:', durationMin, '分钟');

    // 提取练习数据
    const exercises = [];

    // 匹配练习块 (格式可能是: 练习名称 | 组数 x 次数 | 重量kg)
    // 或者: 1. 练习名称 \n 3组 x 12次 \n 20kg

    // 方法1: 匹配表格格式
    const tableRegex = /([^\n|]+?)\s*\|\s*(\d+)\s*[组x×]\s*(\d+)\s*[次个]?\s*\|\s*(\d+(?:\.\d+)?)\s*kg/gi;
    let match;

    while ((match = tableRegex.exec(text)) !== null) {
        const exerciseName = match[1].trim();
        const muscleGroup = identifyMuscleGroup(exerciseName);

        const exercise = {
            name: exerciseName,
            sets: parseInt(match[2]),
            reps: parseInt(match[3]),
            weight: parseFloat(match[4]),
            muscleGroup: muscleGroup,
            muscleGroups: [muscleGroup] // 添加肌肉群识别
        };
        exercises.push(exercise);
        console.log('提取练习:', exercise.name, `${exercise.sets}x${exercise.reps}`, `${exercise.weight}kg`, `[${muscleGroup}]`);
    }

    // 方法2: 匹配列表格式
    if (exercises.length === 0) {
        const listRegex = /(?:^|\n)\s*\d+\.\s*(.+?)\s*\n\s*(\d+)\s*[组x×]\s*(\d+)\s*[次个]?\s*\n\s*(\d+(?:\.\d+)?)\s*kg/gi;

        while ((match = listRegex.exec(text)) !== null) {
            const exerciseName = match[1].trim();
            const muscleGroup = identifyMuscleGroup(exerciseName);

            const exercise = {
                name: exerciseName,
                sets: parseInt(match[2]),
                reps: parseInt(match[3]),
                weight: parseFloat(match[4]),
                muscleGroup: muscleGroup,
                muscleGroups: [muscleGroup]
            };
            exercises.push(exercise);
            console.log('提取练习:', exercise.name, `${exercise.sets}x${exercise.reps}`, `${exercise.weight}kg`, `[${muscleGroup}]`);
        }
    }

    // 方法3: 匹配更灵活的格式
    if (exercises.length === 0) {
        console.log('尝试使用灵活格式解析...');

        // 分割文本为行
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 查找包含"组"和"次"的行
            if (line.includes('组') && (line.includes('次') || line.includes('个'))) {
                // 前一行可能是练习名称
                const exerciseName = i > 0 ? lines[i - 1] : '未知练习';

                // 提取组数和次数
                const setsMatch = line.match(/(\d+)\s*组/);
                const repsMatch = line.match(/(\d+)\s*[次个]/);

                // 下一行可能是重量
                let weight = 0;
                if (i < lines.length - 1) {
                    const weightMatch = lines[i + 1].match(/(\d+(?:\.\d+)?)\s*kg/);
                    if (weightMatch) {
                        weight = parseFloat(weightMatch[1]);
                    }
                }

                if (setsMatch && repsMatch) {
                    const cleanName = exerciseName.replace(/^\d+\.\s*/, '').trim();
                    const muscleGroup = identifyMuscleGroup(cleanName);

                    const exercise = {
                        name: cleanName,
                        sets: parseInt(setsMatch[1]),
                        reps: parseInt(repsMatch[1]),
                        weight: weight,
                        muscleGroup: muscleGroup,
                        muscleGroups: [muscleGroup]
                    };
                    exercises.push(exercise);
                    console.log('提取练习:', exercise.name, `${exercise.sets}x${exercise.reps}`, `${exercise.weight}kg`, `[${muscleGroup}]`);
                }
            }
        }
    }

    console.log(`共提取 ${exercises.length} 个练习`);

    return {
        name: workoutName,
        description: description,
        date: workoutDate,
        durationMin: durationMin,
        exercises: exercises
    };
}

/**
 * 读取并解析PDF文件
 * @param {string} filePath - PDF文件路径
 * @returns {Promise<Object>} 训练数据
 */
async function parsePDF(filePath) {
    console.log('\n读取PDF文件:', filePath);

    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse();
    const data = await parser.parse(dataBuffer);

    console.log('PDF页数:', data.numpages);
    console.log('PDF文本长度:', data.text.length);

    // 显示前500个字符用于调试
    console.log('\n--- PDF文本预览 ---');
    console.log(data.text.substring(0, 500));
    console.log('--- 预览结束 ---\n');

    const filename = path.basename(filePath);
    return extractWorkoutData(data.text, filename);
}

/**
 * 导入训练数据到数据库
 * @param {string} userId - 用户ID
 * @param {Object} workoutData - 训练数据
 */
async function importWorkout(userId, workoutData) {
    console.log('\n=== 导入数据到数据库 ===');
    console.log('用户ID:', userId);
    console.log('训练名称:', workoutData.name);
    console.log('训练日期:', workoutData.date);

    try {
        const workout = await prisma.workout.create({
            data: {
                userId: userId,
                name: workoutData.name,
                description: workoutData.description || '',
                date: workoutData.date,
                durationMin: workoutData.durationMin,
                exercises: workoutData.exercises
            }
        });

        console.log('✅ 导入成功! Workout ID:', workout.id);
        return workout;
    } catch (error) {
        console.error('❌ 导入失败:', error.message);
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(60));
    console.log('ZenFit PDF数据导入工具');
    console.log('='.repeat(60));

    // 获取命令行参数
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\n使用方法:');
        console.log('  node import-from-pdf.js <用户ID> [PDF文件名]');
        console.log('\n示例:');
        console.log('  node import-from-pdf.js abc-123-def-456');
        console.log('  node import-from-pdf.js abc-123-def-456 ZenFit_训练报告_2026-01-06.pdf');
        console.log('\n如果不指定PDF文件名，将导入目录中的所有PDF文件。');
        process.exit(1);
    }

    const userId = args[0];
    const specificFile = args[1];

    console.log('\n用户ID:', userId);
    console.log('PDF目录:', PDF_DIR);

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        console.error(`❌ 错误: 找不到用户 ${userId}`);
        console.log('\n提示: 使用以下命令查看所有用户:');
        console.log('  node -e "const {PrismaClient}=require(\'@prisma/client\');const p=new PrismaClient();p.user.findMany().then(u=>console.log(u))"');
        process.exit(1);
    }

    console.log('✅ 用户验证通过:', user.email);

    // 获取PDF文件列表
    let pdfFiles = [];

    if (specificFile) {
        pdfFiles = [path.join(PDF_DIR, specificFile)];
    } else {
        const files = fs.readdirSync(PDF_DIR);
        pdfFiles = files
            .filter(f => f.endsWith('.pdf'))
            .map(f => path.join(PDF_DIR, f));
    }

    console.log(`\n找到 ${pdfFiles.length} 个PDF文件:`);
    pdfFiles.forEach(f => console.log('  -', path.basename(f)));

    // 导入每个PDF
    let successCount = 0;
    let failCount = 0;

    for (const pdfFile of pdfFiles) {
        try {
            console.log('\n' + '='.repeat(60));
            const workoutData = await parsePDF(pdfFile);

            if (workoutData.exercises.length === 0) {
                console.log('⚠️  警告: 未能从PDF中提取到练习数据，跳过导入');
                console.log('提示: 请检查PDF格式是否正确');
                failCount++;
                continue;
            }

            await importWorkout(userId, workoutData);
            successCount++;

        } catch (error) {
            console.error(`❌ 处理文件失败 ${path.basename(pdfFile)}:`, error.message);
            failCount++;
        }
    }

    // 总结
    console.log('\n' + '='.repeat(60));
    console.log('导入完成!');
    console.log('='.repeat(60));
    console.log(`✅ 成功: ${successCount} 个文件`);
    console.log(`❌ 失败: ${failCount} 个文件`);
    console.log(`📊 总计: ${pdfFiles.length} 个文件`);

    // 查询并显示导入的数据
    console.log('\n查询用户的所有训练记录...');
    const workouts = await prisma.workout.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' }
    });

    console.log(`\n用户共有 ${workouts.length} 条训练记录:`);
    workouts.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.name} - ${w.date ? w.date.toISOString().split('T')[0] : '无日期'} (${w.exercises.length} 个练习)`);
    });
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
