/**
 * Exercise Lookup Service
 * 
 * 根据 exerciseId 查找动作的完整信息（肌肉群、机械类型等）
 * Lookup exercise details by exerciseId
 */

import { COMPREHENSIVE_EXERCISES_PROMISE } from '@/features/exercise/data/comprehensive_exercises';
import { INITIAL_EXERCISES } from '@/shared/constants/initial_exercises';
import type { Exercise } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

export class ExerciseLookupService {
    private static exerciseCache: Map<string, Exercise> = new Map();
    private static isInitialized = false;

    /**
     * 初始化动作缓存
     * Initialize exercise cache
     */
    static async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('🔄 Initializing ExerciseLookupService...');

            // 加载 comprehensive exercises
            const comprehensiveExercises = await COMPREHENSIVE_EXERCISES_PROMISE;

            // 合并所有动作到缓存
            const allExercises = [...INITIAL_EXERCISES, ...comprehensiveExercises];

            allExercises.forEach(exercise => {
                this.exerciseCache.set(exercise.id, exercise);
                // 也用名字作为备用查找键
                this.exerciseCache.set(exercise.name.toLowerCase(), exercise);
                if (exercise.nameZh) {
                    this.exerciseCache.set(exercise.nameZh.toLowerCase(), exercise);
                }
            });

            this.isInitialized = true;
            console.log(`✅ ExerciseLookupService initialized with ${this.exerciseCache.size} entries`);
        } catch (error) {
            console.error('❌ Failed to initialize ExerciseLookupService:', error);
            // 至少加载 INITIAL_EXERCISES
            INITIAL_EXERCISES.forEach(exercise => {
                this.exerciseCache.set(exercise.id, exercise);
                this.exerciseCache.set(exercise.name.toLowerCase(), exercise);
                if (exercise.nameZh) {
                    this.exerciseCache.set(exercise.nameZh.toLowerCase(), exercise);
                }
            });
            this.isInitialized = true;
        }
    }

    /**
     * 根据 exerciseId 查找动作
     * Lookup exercise by ID
     */
    static async lookupExercise(exerciseId: string): Promise<Exercise | null> {
        // 确保已初始化
        if (!this.isInitialized) {
            await this.initialize();
        }

        // 直接查找
        let exercise = this.exerciseCache.get(exerciseId);
        if (exercise) return exercise;

        // 尝试用小写查找
        exercise = this.exerciseCache.get(exerciseId.toLowerCase());
        if (exercise) return exercise;

        console.warn(`⚠️ Exercise not found: ${exerciseId}`);
        return null;
    }

    /**
     * 根据动作名称查找动作
     * Lookup exercise by name
     */
    static async lookupByName(exerciseName: string): Promise<Exercise | null> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const exercise = this.exerciseCache.get(exerciseName.toLowerCase());
        if (exercise) return exercise;

        console.warn(`⚠️ Exercise not found by name: ${exerciseName}`);
        return null;
    }

    /**
     * 获取动作的肌肉群
     * Get muscle group for exercise
     */
    static async getMuscleGroup(exerciseId: string, fallbackName?: string): Promise<MuscleGroup> {
        const exercise = await this.lookupExercise(exerciseId);
        if (exercise) return exercise.muscleGroup;

        // 尝试用名字查找
        if (fallbackName) {
            const exerciseByName = await this.lookupByName(fallbackName);
            if (exerciseByName) return exerciseByName.muscleGroup;
        }

        // 默认返回 CHEST（保持向后兼容）
        console.warn(`⚠️ Using fallback muscle group CHEST for: ${exerciseId}`);
        return MuscleGroup.CHEST;
    }

    /**
     * 获取动作的机械类型
     * Get mechanic type for exercise
     */
    static async getMechanic(exerciseId: string, fallbackName?: string): Promise<'Compound' | 'Isolation' | 'N/A'> {
        const exercise = await this.lookupExercise(exerciseId);
        if (exercise) return exercise.mechanic;

        if (fallbackName) {
            const exerciseByName = await this.lookupByName(fallbackName);
            if (exerciseByName) return exerciseByName.mechanic;
        }

        return 'Compound';
    }

    /**
     * 获取动作的次要肌肉群
     * Get secondary muscles for exercise
     */
    static async getSecondaryMuscles(exerciseId: string, fallbackName?: string): Promise<MuscleGroup[] | undefined> {
        const exercise = await this.lookupExercise(exerciseId);
        if (exercise) return exercise.secondaryMuscles;

        if (fallbackName) {
            const exerciseByName = await this.lookupByName(fallbackName);
            if (exerciseByName) return exerciseByName.secondaryMuscles;
        }

        return undefined;
    }
}

export default ExerciseLookupService;