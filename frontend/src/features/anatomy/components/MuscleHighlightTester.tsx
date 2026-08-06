import React, { useState } from 'react';
import { generateMuscleHighlights, getMuscleDistributionData } from '../services/MuscleHighlightService';
import { generateEnhancedHTMLReport } from '@/features/export/services/HTMLTemplateService';
import type { MuscleGroup, WorkoutSession, UserProfile } from '@/shared/types';

interface Exercise {
    name: string;
    muscleGroups: string[];
    sets: number;
    reps: number;
}

interface TestWorkout {
    date: string;
    exercises: Exercise[];
}

const MuscleHighlightTester: React.FC = () => {
    const [selectedTest, setSelectedTest] = useState<string>('chest');
    const [previewHtml, setPreviewHtml] = useState<string>('');

    // 测试用的训练数据
    const testWorkouts: Record<string, TestWorkout> = {
        chest: {
            date: '2024-12-01',
            exercises: [
                { name: 'Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], sets: 4, reps: 10 },
                { name: 'Incline Dumbbell Press', muscleGroups: ['chest', 'shoulders'], sets: 3, reps: 12 },
                { name: 'Chest Flyes', muscleGroups: ['chest'], sets: 3, reps: 15 }
            ]
        },
        back: {
            date: '2024-12-01',
            exercises: [
                { name: 'Pull-ups', muscleGroups: ['lats', 'rhomboids', 'biceps'], sets: 4, reps: 8 },
                { name: 'Barbell Rows', muscleGroups: ['lats', 'rhomboids', 'traps'], sets: 4, reps: 10 },
                { name: 'Lat Pulldowns', muscleGroups: ['lats', 'biceps'], sets: 3, reps: 12 }
            ]
        },
        legs: {
            date: '2024-12-01',
            exercises: [
                { name: 'Squats', muscleGroups: ['quadriceps', 'glutes', 'hamstrings'], sets: 4, reps: 10 },
                { name: 'Deadlifts', muscleGroups: ['hamstrings', 'glutes', 'erector_spinae'], sets: 4, reps: 8 },
                { name: 'Leg Curls', muscleGroups: ['hamstrings'], sets: 3, reps: 15 }
            ]
        },
        arms: {
            date: '2024-12-01',
            exercises: [
                { name: 'Bicep Curls', muscleGroups: ['biceps'], sets: 4, reps: 12 },
                { name: 'Tricep Dips', muscleGroups: ['triceps'], sets: 4, reps: 10 },
                { name: 'Hammer Curls', muscleGroups: ['biceps', 'forearms'], sets: 3, reps: 12 }
            ]
        },
        shoulders: {
            date: '2024-12-01',
            exercises: [
                { name: 'Shoulder Press', muscleGroups: ['shoulders', 'triceps'], sets: 4, reps: 10 },
                { name: 'Lateral Raises', muscleGroups: ['shoulders'], sets: 4, reps: 15 },
                { name: 'Rear Delt Flyes', muscleGroups: ['shoulders', 'rhomboids'], sets: 3, reps: 15 }
            ]
        }
    };

    const generatePreview = async (testType: string) => {
        const workout = testWorkouts[testType];
        if (!workout) return;

        try {
            const now = Date.now();

            // 转换为系统期望的格式
            const workoutSession: WorkoutSession = {
                id: 'test-session',
                date: now,
                createdAt: now,
                exercises: workout.exercises.map(ex => ({
                    id: `ex-${ex.name}`,
                    exerciseId: `exercise-${ex.name}`,
                    exerciseName: ex.name,
                    muscleGroup: ex.muscleGroups[0] as MuscleGroup, // 使用第一个肌肉群
                    sets: Array.from({ length: ex.sets }, (_, i) => ({
                        id: `set-${i}`,
                        reps: ex.reps,
                        weight: 50, // 默认重量
                        completed: true
                    })),
                    createdAt: now
                })),
                volumeLoad: workout.exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * 50), 0),
                durationMinutes: 60
            };

            // 模拟用户资料
            const userProfile: UserProfile = {
                name: 'Test User',
                age: 30,
                weight: 70,
                unit: 'kg',
                gender: 'Male'
            };

            // 生成肌肉高亮数据
            const muscleData = getMuscleDistributionData([workoutSession]);

            // 生成HTML模板
            const html = await generateEnhancedHTMLReport([workoutSession], userProfile, 'daily');

            setPreviewHtml(html);
        } catch (error) {
            console.error('生成预览失败:', error);
        }
    };

    const handleTestChange = (testType: string) => {
        setSelectedTest(testType);
        generatePreview(testType);
    };

    React.useEffect(() => {
        generatePreview(selectedTest);
    }, []);

    return (
        <div className="muscle-highlight-tester p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">肌肉高亮测试器</h2>

            {/* 测试选择器 */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择测试场景:
                </label>
                <select
                    value={selectedTest}
                    onChange={(e) => handleTestChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="chest">胸部训练</option>
                    <option value="back">背部训练</option>
                    <option value="legs">腿部训练</option>
                    <option value="arms">手臂训练</option>
                    <option value="shoulders">肩部训练</option>
                </select>
            </div>

            {/* 训练详情 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">训练详情</h3>
                {testWorkouts[selectedTest] && (
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            日期: {testWorkouts[selectedTest].date}
                        </p>
                        <div className="space-y-2">
                            {testWorkouts[selectedTest].exercises.map((exercise, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                                    <span className="font-medium">{exercise.name}</span>
                                    <div className="text-sm text-gray-600">
                                        <span>{exercise.sets} 组 × {exercise.reps} 次</span>
                                        <span className="ml-2 text-blue-600">
                                            [{exercise.muscleGroups.join(', ')}]
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 预览按钮 */}
            <div className="mb-6">
                <button
                    onClick={() => generatePreview(selectedTest)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    生成肌肉高亮预览
                </button>
            </div>

            {/* HTML预览 */}
            {previewHtml && (
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-3 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">HTML预览</h3>
                    </div>
                    <div className="h-96 overflow-auto">
                        <iframe
                            srcDoc={previewHtml}
                            className="w-full h-full border-0"
                            title="肌肉高亮预览"
                        />
                    </div>
                </div>
            )}

            {/* 测试说明 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-blue-800">测试说明</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 选择不同的训练场景查看对应的肌肉高亮效果</li>
                    <li>• 验证高亮的肌肉群是否与训练内容匹配</li>
                    <li>• 检查颜色强度是否反映训练强度</li>
                    <li>• 确认前视图和后视图的肌肉位置准确性</li>
                </ul>
            </div>
        </div>
    );
};

export default MuscleHighlightTester;