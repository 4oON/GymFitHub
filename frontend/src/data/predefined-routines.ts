/**
 * Predefined Routines
 * 
 * 预定义的训练组，可以作为模板使用
 */

import type { Routine, Exercise } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

/**
 * 肩部训练组 1
 * 专注于肩部全面发展的训练计划
 */
export const SHOULDER_ROUTINE_1: Omit<Routine, 'id' | 'createdAt'> = {
    name: '肩部训练组 1',
    exercises: [
        {
            id: 'db-shoulder-press',
            name: 'Dumbbell Seated Overhead Press',
            nameZh: '坐姿哑铃推举',
            muscleGroup: MuscleGroup.SHOULDERS,
            secondaryMuscles: [MuscleGroup.TRICEPS],
            equipment: 'Dumbbell',
            mechanic: 'Compound',
            videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-seated-overhead-press-front.mp4'
        },
        {
            id: 'bb-bench-press',
            name: 'Barbell Bench Press',
            nameZh: '杠铃卧推',
            muscleGroup: MuscleGroup.CHEST,
            secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
            equipment: 'Barbell',
            mechanic: 'Compound',
            videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-front.mp4'
        },
        {
            id: 'bb-overhead-press',
            name: 'Barbell Overhead Press',
            nameZh: '杠铃推举',
            muscleGroup: MuscleGroup.SHOULDERS,
            secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.ABS],
            equipment: 'Barbell',
            mechanic: 'Compound',
            videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-overhead-press-front.mp4'
        },
        {
            id: 'mach-chest-press',
            name: 'Machine Chest Press',
            nameZh: '坐姿推胸机',
            muscleGroup: MuscleGroup.CHEST,
            secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
            equipment: 'Machine',
            mechanic: 'Compound',
            videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-chest-press-front.mp4'
        },
        {
            id: 'db-incline-fly',
            name: 'Dumbbell Incline Chest Fly',
            nameZh: '上斜哑铃飞鸟',
            muscleGroup: MuscleGroup.CHEST,
            secondaryMuscles: [MuscleGroup.SHOULDERS],
            equipment: 'Dumbbell',
            mechanic: 'Isolation',
            videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-chest-fly-front.mp4'
        },
        {
            id: 'db-lateral-raise',
            name: 'Dumbbell Lateral Raise',
            nameZh: '哑铃侧平举',
            muscleGroup: MuscleGroup.SHOULDERS,
            secondaryMuscles: [],
            equipment: 'Dumbbell',
            mechanic: 'Isolation',
            videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-lateral-raise-front.mp4'
        }
    ] as Exercise[]
};

/**
 * 所有预定义的训练组
 */
export const PREDEFINED_ROUTINES = [
    SHOULDER_ROUTINE_1
];

/**
 * 根据名称获取预定义训练组
 */
export function getPredefinedRoutine(name: string): Omit<Routine, 'id' | 'createdAt'> | undefined {
    return PREDEFINED_ROUTINES.find(r => r.name === name);
}

/**
 * 检查用户是否已有某个预定义训练组
 */
export function hasPredefinedRoutine(userRoutines: Routine[], routineName: string): boolean {
    return userRoutines.some(r => r.name === routineName);
}