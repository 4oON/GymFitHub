import React from 'react';
import { PDFDebugger } from '@/features/export/components/PDFDebugger';
import type { WorkoutSession, UserProfile } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

/**
 * PDF 调试器测试页面
 * 提供模拟数据用于测试 PDF 布局调试功能
 */
const PDFDebuggerTestPage: React.FC = () => {
    // 模拟训练会话数据
    const mockSession: WorkoutSession = {
        id: 'test-session-001',
        date: Date.now(),
        createdAt: Date.now(),
        durationMinutes: 60,
        volumeLoad: 3080,
        exercises: [
            {
                id: 'ex-1',
                exerciseId: 'barbell-squat',
                exerciseName: '杠铃深蹲 / Barbell Squat',
                muscleGroup: MuscleGroup.QUADS,
                sets: [
                    { id: 's1', weight: 100, reps: 10, completed: true },
                    { id: 's2', weight: 100, reps: 10, completed: true },
                    { id: 's3', weight: 100, reps: 8, completed: true },
                    { id: 's4', weight: 100, reps: 8, completed: true }
                ],
                createdAt: Date.now()
            },
            {
                id: 'ex-2',
                exerciseId: 'bench-press',
                exerciseName: '卧推 / Bench Press',
                muscleGroup: MuscleGroup.CHEST,
                sets: [
                    { id: 's5', weight: 80, reps: 12, completed: true },
                    { id: 's6', weight: 80, reps: 10, completed: true },
                    { id: 's7', weight: 80, reps: 10, completed: true },
                    { id: 's8', weight: 80, reps: 8, completed: true }
                ],
                createdAt: Date.now()
            },
            {
                id: 'ex-3',
                exerciseId: 'deadlift',
                exerciseName: '硬拉 / Deadlift',
                muscleGroup: MuscleGroup.LOWER_BACK,
                sets: [
                    { id: 's9', weight: 120, reps: 8, completed: true },
                    { id: 's10', weight: 120, reps: 8, completed: true },
                    { id: 's11', weight: 120, reps: 6, completed: true }
                ],
                createdAt: Date.now()
            },
            {
                id: 'ex-4',
                exerciseId: 'shoulder-press',
                exerciseName: '肩推 / Shoulder Press',
                muscleGroup: MuscleGroup.SHOULDERS,
                sets: [
                    { id: 's12', weight: 20, reps: 12, completed: true },
                    { id: 's13', weight: 20, reps: 10, completed: true },
                    { id: 's14', weight: 20, reps: 10, completed: true }
                ],
                createdAt: Date.now()
            },
            {
                id: 'ex-5',
                exerciseId: 'bicep-curl',
                exerciseName: '二头弯举 / Bicep Curl',
                muscleGroup: MuscleGroup.BICEPS,
                sets: [
                    { id: 's15', weight: 15, reps: 15, completed: true },
                    { id: 's16', weight: 15, reps: 12, completed: true },
                    { id: 's17', weight: 15, reps: 12, completed: true }
                ],
                createdAt: Date.now()
            },
            {
                id: 'ex-6',
                exerciseId: 'crunches',
                exerciseName: '卷腹 / Crunches',
                muscleGroup: MuscleGroup.ABS,
                sets: [
                    { id: 's18', weight: 0, reps: 20, completed: true },
                    { id: 's19', weight: 0, reps: 20, completed: true },
                    { id: 's20', weight: 0, reps: 20, completed: true }
                ],
                createdAt: Date.now()
            }
        ]
    };

    // 模拟用户资料
    const mockProfile: UserProfile = {
        name: '测试用户',
        weight: 75,
        unit: 'kg',
        age: 30,
        gender: 'Male'
    };

    return (
        <div className="w-full h-full">
            <PDFDebugger session={mockSession} userProfile={mockProfile} />
        </div>
    );
};

export default PDFDebuggerTestPage;