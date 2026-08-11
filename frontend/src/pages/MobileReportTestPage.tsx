import React, { useState } from 'react';
import { MobileWorkoutReportModal } from '@/features/report/components/MobileWorkoutReportModal';
import type { WorkoutSession, UserProfile } from '@/shared/types';
import { MuscleGroup, ExperienceLevel, TrainingGoal } from '@/shared/types';

// Mock data for testing
const mockUserProfile: UserProfile = {
    name: 'Test User',
    weight: 75,
    unit: 'kg',
    age: 30,
    gender: 'Male',
    experienceLevel: ExperienceLevel.INTERMEDIATE,
    primaryGoal: TrainingGoal.STRENGTH,
    bodyFatPercentage: 15
};

const mockWorkoutSession: WorkoutSession = {
    id: 'session123',
    date: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    exercises: [
        {
            id: 'ex1',
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            exerciseNameZh: '卧推',
            muscleGroup: MuscleGroup.CHEST,
            secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
            sets: [
                { id: 'set1', weight: 80, reps: 8, completed: true, completedAt: Date.now() },
                { id: 'set2', weight: 80, reps: 6, completed: true, completedAt: Date.now() },
                { id: 'set3', weight: 70, reps: 10, completed: true, completedAt: Date.now() }
            ],
            createdAt: Date.now()
        },
        {
            id: 'ex2',
            exerciseId: 'squats',
            exerciseName: 'Squats',
            exerciseNameZh: '深蹲',
            muscleGroup: MuscleGroup.QUADS,
            secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS],
            sets: [
                { id: 'set4', weight: 100, reps: 10, completed: true, completedAt: Date.now() },
                { id: 'set5', weight: 100, reps: 8, completed: true, completedAt: Date.now() },
                { id: 'set6', weight: 90, reps: 12, completed: true, completedAt: Date.now() }
            ],
            createdAt: Date.now()
        },
        {
            id: 'ex3',
            exerciseId: 'deadlift',
            exerciseName: 'Deadlift',
            exerciseNameZh: '硬拉',
            muscleGroup: MuscleGroup.HAMSTRINGS,
            secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.LOWER_BACK],
            sets: [
                { id: 'set7', weight: 120, reps: 5, completed: true, completedAt: Date.now() },
                { id: 'set8', weight: 120, reps: 5, completed: true, completedAt: Date.now() },
                { id: 'set9', weight: 100, reps: 8, completed: true, completedAt: Date.now() }
            ],
            createdAt: Date.now()
        }
    ],
    durationMinutes: 60,
    volumeLoad: 5000
};

export const MobileReportTestPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="h-full overflow-y-auto bg-slate-900 p-4">
            <div className="max-w-md mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">移动端报告组件测试</h1>

                <div className="bg-slate-800 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">测试说明</h2>
                    <p className="text-slate-400 mb-4">
                        这是一个测试页面，用于验证移动端全息报告组件的功能。
                    </p>
                    <p className="text-slate-400 mb-6">
                        点击下面的按钮打开报告模态框，查看效果。
                    </p>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium text-white hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                    >
                        打开移动端报告
                    </button>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">组件特性</h2>
                    <ul className="text-slate-400 space-y-2">
                        <li className="flex items-start">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span>响应式设计，专为移动端优化</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span>流畅的入场和滚动触发动画</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span>全息科技风格的视觉效果</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span>完整的训练数据展示</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span>中英文双语支持</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span>JSON 和 PDF 导出功能</span>
                        </li>
                    </ul>
                </div>
            </div>

            <MobileWorkoutReportModal
                session={mockWorkoutSession}
                userProfile={mockUserProfile}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default MobileReportTestPage;