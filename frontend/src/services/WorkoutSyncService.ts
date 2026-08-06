/**
 * Workout Sync Service
 *
 * 负责前端训练数据与后端数据库的同步
 * Handles synchronization of workout data between frontend and backend
 */

import apiClient from './apiClient';
import ExerciseLookupService from './ExerciseLookupService';
import { VolumeCalculationService } from '@/features/workout/services/VolumeCalculationService';
import type { WorkoutSession, ActiveExercise } from '@/shared/types';
import type { CreateWorkoutInput, UpdateWorkoutInput } from '../types/workout';

export class WorkoutSyncService {
    /**
     * 验证训练记录数据质量
     * Validate workout session data quality
     */
    private static validateWorkoutSession(session: WorkoutSession): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // 验证1：训练时长合理性（5分钟 - 10小时）
        if (!session.durationMinutes || session.durationMinutes < 5 || session.durationMinutes > 600) {
            errors.push(`Invalid duration: ${session.durationMinutes}min (expected 5-600)`);
        }

        // 验证2：总volume合理性（100kg - 100,000kg）
        if (!session.volumeLoad || session.volumeLoad < 100 || session.volumeLoad > 100000) {
            errors.push(`Invalid volume: ${session.volumeLoad}kg (expected 100-100000)`);
        }

        // 验证3：至少有一个动作
        if (!session.exercises || session.exercises.length === 0) {
            errors.push('No exercises found');
        }

        // 验证4：每个动作至少有一个完成的组
        const hasCompletedSets = session.exercises.some(ex =>
            ex.sets.some(s => s.completed)
        );
        if (!hasCompletedSets) {
            errors.push('No completed sets found');
        }

        // 验证5：单个动作的volume不超过50,000kg
        session.exercises.forEach((ex, index) => {
            const exerciseVolume = ex.sets
                .filter(s => s.completed)
                .reduce((sum, s) => sum + (s.weight * s.reps), 0);

            if (exerciseVolume > 50000) {
                errors.push(`Exercise ${index + 1} (${ex.exerciseName}) has abnormal volume: ${exerciseVolume}kg`);
            }

            // 验证6：单组重量不超过500kg（腿部训练除外）
            ex.sets.forEach((set, setIndex) => {
                if (set.completed && set.weight > 500 && !['QUADS', 'GLUTES', 'HAMSTRINGS'].includes(ex.muscleGroup)) {
                    errors.push(`Exercise ${index + 1} (${ex.exerciseName}), Set ${setIndex + 1}: weight ${set.weight}kg exceeds limit`);
                }
                // 腿部训练最大1000kg
                if (set.completed && set.weight > 1000) {
                    errors.push(`Exercise ${index + 1} (${ex.exerciseName}), Set ${setIndex + 1}: weight ${set.weight}kg exceeds maximum limit`);
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 将训练记录同步到后端
     * Sync workout session to backend
     */
    static async syncWorkoutToBackend(session: WorkoutSession): Promise<string | null> {
        try {
            console.log('🔄 Syncing workout to backend:', session);

            // ✅ 添加数据验证
            const validation = this.validateWorkoutSession(session);
            if (!validation.isValid) {
                console.error('❌ Invalid workout session:', validation.errors);
                throw new Error(`Invalid workout data: ${validation.errors.join(', ')}`);
            }

            // 转换前端数据格式到后端 API 格式
            const workoutData: CreateWorkoutInput = {
                name: this.generateWorkoutName(session),
                date: new Date(session.date).toISOString(),
                status: 'completed',
                durationMin: session.durationMinutes,
                notes: `Volume: ${session.volumeLoad}kg`,
                exercises: session.exercises.map((ex, index) => ({
                    exerciseId: ex.exerciseId,
                    sets: ex.sets.filter(s => s.completed).length,
                    reps: this.calculateAverageReps(ex),
                    weight: this.calculateAverageWeight(ex),
                    notes: ex.exerciseName,
                    order: index
                }))
            };

            const response = await apiClient.createWorkout(workoutData);

            if (response.success && response.workout) {
                console.log('✅ Workout synced successfully:', response.workout.id);
                return response.workout.id;
            }

            return null;
        } catch (error) {
            console.error('❌ Failed to sync workout to backend:', error);
            throw error;
        }
    }

    /**
     * 从后端加载所有训练记录
     * Load all workout sessions from backend
     */
    static async loadWorkoutsFromBackend(): Promise<WorkoutSession[]> {
        try {
            console.log('📥 Loading workouts from backend...');

            // 🆕 确保 ExerciseLookupService 已初始化
            await ExerciseLookupService.initialize();

            const response = await apiClient.getWorkouts('completed');

            if (response.success && response.workouts) {
                console.log(`✅ Loaded ${response.workouts.length} workouts from backend`);

                // 统计总的exercise数量
                let totalExercises = 0;

                // 🆕 数据质量验证+转换后端数据格式到前端格式
                const sessions: WorkoutSession[] = (await Promise.all(
                    response.workouts.map(async (workout) => {
                        // ===== 数据质量验证 =====
                        // 1. 验证exercises字段
                        if (!workout.exercises || !Array.isArray(workout.exercises) || workout.exercises.length === 0) {
                            console.warn('⚠️ Skipping workout with empty exercises:', workout.id);
                            return null;
                        }

                        // 2. 验证date字段（如果为null则使用createdAt作为fallback）
                        const workoutDate = workout.date || workout.createdAt;
                        if (!workoutDate) {
                            console.warn('⚠️ Skipping workout with null date and createdAt:', workout.id);
                            return null;
                        }

                        // 3. 计算volume并验证合理性
                        const calculatedVolume = this.calculateVolumeFromBackend(workout);
                        if (calculatedVolume > 100000) {
                            console.warn('⚠️ Skipping workout with abnormal volume:', workout.id, calculatedVolume);
                            return null;
                        }
                        
                        // 🆕 3b. 过滤掉volume为0的记录（误点但无数据）
                        if (calculatedVolume <= 0) {
                            console.warn('⚠️ Skipping workout with zero volume:', workout.id);
                            return null;
                        }
                        
                        // 🆕 3c. 验证训练时长合理性
                        const duration = workout.durationMin || 0;
                        if (duration < 5 || duration > 600) {
                            console.warn('⚠️ Skipping workout with invalid duration:', workout.id, duration);
                            return null;
                        }

                        // 4. 验证是否有完成的组数（兼容新旧格式）
                        const hasCompletedSets = workout.exercises.some((ex: any) => {
                            if (Array.isArray(ex.sets)) {
                                // 新格式：sets是数组
                                return ex.sets.some((set: any) => set.completed === true && set.weight > 0 && set.reps > 0);
                            } else {
                                // 旧格式：sets是数字
                                return (ex.sets || 0) > 0;
                            }
                        });
                        if (!hasCompletedSets) {
                            console.warn('⚠️ Skipping workout with no completed sets:', workout.id);
                            return null;
                        }

                        // ===== 数据转换 =====
                        const exercises = await Promise.all(
                            workout.exercises.map(async (ex: any) => {
                                totalExercises++;

                                // 🆕 优先使用数据库中的肌肉群信息（新格式），否则查找（旧格式）
                                let muscleGroup: string;
                                let mechanic: string;
                                let secondaryMuscles: string[] | undefined;
                                let exerciseName: string;

                                if (ex.muscleGroup && ex.exerciseName) {
                                    // 新格式：数据库中已有完整信息，直接使用，不查找
                                    muscleGroup = ex.muscleGroup;
                                    exerciseName = ex.exerciseName;
                                    // 新格式数据使用默认值，避免查找不存在的exerciseId
                                    mechanic = 'Compound'; // 默认为复合动作
                                    secondaryMuscles = undefined;
                                } else {
                                    // 旧格式：需要查找所有信息
                                    exerciseName = ex.notes || 'Unknown Exercise';
                                    muscleGroup = await ExerciseLookupService.getMuscleGroup(
                                        ex.exerciseId,
                                        ex.notes
                                    );
                                    mechanic = await ExerciseLookupService.getMechanic(
                                        ex.exerciseId,
                                        ex.notes
                                    );
                                    secondaryMuscles = await ExerciseLookupService.getSecondaryMuscles(
                                        ex.exerciseId,
                                        ex.notes
                                    );
                                }

                                return {
                                    id: ex.id,
                                    exerciseId: ex.exerciseId,
                                    exerciseName: exerciseName,
                                    exerciseNameZh: '',
                                    muscleGroup: muscleGroup,
                                    secondaryMuscles: secondaryMuscles,
                                    mechanic: mechanic,
                                    recommendedRestSeconds: mechanic === 'Compound' ? 180 : 90,
                                    createdAt: new Date(ex.createdAt).getTime(),
                                    sets: this.reconstructSets(ex)
                                };
                            })
                        );

                        // ===== 日期转换（使用date或createdAt作为fallback） =====
                        const parsedDate = new Date(workoutDate);
                        const dateTimestamp = parsedDate.getTime();

                        // 验证日期是否有效
                        if (isNaN(dateTimestamp)) {
                            console.warn('⚠️ Skipping workout with invalid date:', workout.id, workoutDate);
                            return null;
                        }

                        // 🆕 安全的createdAt转换
                        let createdAtTimestamp: number;
                        try {
                            const parsedCreatedAt = new Date(workout.createdAt);
                            createdAtTimestamp = isNaN(parsedCreatedAt.getTime())
                                ? Date.now()
                                : parsedCreatedAt.getTime();
                        } catch (error) {
                            console.error('❌ CreatedAt parsing error, using current time:', workout.id, error);
                            createdAtTimestamp = Date.now();
                        }

                        return {
                            id: workout.id,
                            date: dateTimestamp,
                            createdAt: createdAtTimestamp,
                            syncStatus: 'synced',
                            durationMinutes: workout.durationMin || 0,
                            volumeLoad: calculatedVolume,
                            exercises: exercises
                        };
                    })
                )).filter(Boolean) as WorkoutSession[]; // 过滤掉null值

                const filteredCount = response.workouts.length - sessions.length;
                console.log(`✅ Successfully converted ${sessions.length} workouts (${totalExercises} exercises) with correct muscle groups`);
                if (filteredCount > 0) {
                    console.log(`⚠️ Filtered out ${filteredCount} invalid workouts`);
                }
                return sessions;
            }

            return [];
        } catch (error) {
            console.error('❌ Failed to load workouts from backend:', error);
            return [];
        }
    }

    /**
     * 批量同步本地未同步的训练记录
     * Batch sync local unsync workouts
     */
    static async syncPendingWorkouts(sessions: WorkoutSession[]): Promise<number> {
        const pendingSessions = sessions.filter(s => s.syncStatus === 'pending');

        if (pendingSessions.length === 0) {
            console.log('✅ No pending workouts to sync');
            return 0;
        }

        console.log(`🔄 Syncing ${pendingSessions.length} pending workouts...`);

        let syncedCount = 0;
        for (const session of pendingSessions) {
            try {
                const backendId = await this.syncWorkoutToBackend(session);
                if (backendId) {
                    syncedCount++;
                }
            } catch (error) {
                console.error(`Failed to sync session ${session.id}:`, error);
            }
        }

        console.log(`✅ Synced ${syncedCount}/${pendingSessions.length} workouts`);
        return syncedCount;
    }

    /**
     * 批量同步本地所有训练记录到后端
     * Batch sync all local workouts to backend
     */
    static async batchSyncLocalWorkouts(): Promise<{
        success: boolean;
        stats: {
            total: number;
            created: number;
            skipped: number;
            failed: number;
        };
        message: string;
    }> {
        try {
            console.log('🔄 Starting batch sync of local workouts...');

            // 从localStorage加载所有本地训练记录
            const localWorkoutsJson = localStorage.getItem('workout-sessions');
            if (!localWorkoutsJson) {
                return {
                    success: true,
                    stats: { total: 0, created: 0, skipped: 0, failed: 0 },
                    message: '没有本地训练记录需要同步'
                };
            }

            const localSessions: WorkoutSession[] = JSON.parse(localWorkoutsJson);

            if (localSessions.length === 0) {
                return {
                    success: true,
                    stats: { total: 0, created: 0, skipped: 0, failed: 0 },
                    message: '没有本地训练记录需要同步'
                };
            }

            console.log(`📦 Found ${localSessions.length} local workouts to sync`);

            // 转换为后端API格式
            const workoutsToSync = localSessions.map(session => ({
                name: this.generateWorkoutName(session),
                date: new Date(session.date).toISOString(),
                createdAt: new Date(session.createdAt).toISOString(),
                status: 'completed',
                durationMin: session.durationMinutes,
                notes: `Volume: ${session.volumeLoad}kg`,
                exercises: session.exercises.map((ex, index) => ({
                    exerciseId: ex.exerciseId,
                    sets: ex.sets.filter(s => s.completed).length,
                    reps: this.calculateAverageReps(ex),
                    weight: this.calculateAverageWeight(ex),
                    notes: ex.exerciseName,
                    order: index
                }))
            }));

            // 调用批量同步API
            const response = await apiClient.batchSyncWorkouts(workoutsToSync);

            if (response.success) {
                const { stats } = response;
                console.log(`✅ Batch sync completed:`, stats);

                return {
                    success: true,
                    stats,
                    message: `成功同步 ${stats.created} 条新记录，跳过 ${stats.skipped} 条重复记录${stats.failed > 0 ? `，${stats.failed} 条失败` : ''}`
                };
            }

            return {
                success: false,
                stats: { total: 0, created: 0, skipped: 0, failed: 0 },
                message: '批量同步失败'
            };
        } catch (error) {
            console.error('❌ Batch sync failed:', error);
            return {
                success: false,
                stats: { total: 0, created: 0, skipped: 0, failed: 0 },
                message: error instanceof Error ? error.message : '批量同步失败'
            };
        }
    }

    /**
     * 合并本地和远程数据
     * Merge local and remote workout data
     *
     * 🆕 使用智能去重策略：
     * 1. 基于日期+动作内容生成指纹
     * 2. 相同指纹的训练只保留一条
     * 3. 优先保留后端数据（syncStatus === 'synced'）
     * 4. 🆕 对于同一天同一动作组的重复记录，保留volume最大的那个
     * 5. 🆕 过滤掉明显无效的记录（volume=0, duration=0等）
     */
    static mergeWorkoutData(
        localSessions: WorkoutSession[],
        remoteSessions: WorkoutSession[]
    ): WorkoutSession[] {
        // 🆕 过滤掉明显无效的记录
        const isValidSession = (session: WorkoutSession): boolean => {
            // 1. 必须有动作
            if (!session.exercises || session.exercises.length === 0) {
                return false;
            }
            // 2. 必须有完成的组
            const hasCompletedSets = session.exercises.some(ex =>
                ex.sets && ex.sets.some(s => s.completed)
            );
            if (!hasCompletedSets) {
                return false;
            }
            // 3. 训练时长必须在合理范围内（5分钟到10小时）
            if (!session.durationMinutes || session.durationMinutes < 5 || session.durationMinutes > 600) {
                return false;
            }
            // 4. Volume必须大于0（过滤掉误点的记录）
            if (!session.volumeLoad || session.volumeLoad <= 0) {
                return false;
            }
            return true;
        };

        // 🆕 生成训练指纹：日期(精确到分钟) + 动作ID列表 + 总组数
        // 使用精确到分钟而不是到天，避免同一天的多个训练被错误合并
        const generateFingerprint = (session: WorkoutSession): string => {
            const date = new Date(session.date);
            // 精确到分钟，这样同一分钟内相同内容的训练会被去重
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
            const exerciseIds = session.exercises
                .map(ex => ex.exerciseId)
                .sort()
                .join(',');
            const totalSets = session.exercises.reduce(
                (sum, ex) => sum + ex.sets.filter(s => s.completed).length,
                0
            );
            return `${dateKey}|${exerciseIds}|${totalSets}`;
        };

        // 🆕 生成宽松指纹用于检测同一天的相似训练（用于合并脏数据）
        const generateLooseFingerprint = (session: WorkoutSession): string => {
            const date = new Date(session.date);
            // 只精确到天
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const exerciseIds = session.exercises
                .map(ex => ex.exerciseId)
                .sort()
                .join(',');
            return `${dateKey}|${exerciseIds}`;
        };

        const fingerprintMap = new Map<string, WorkoutSession>();
        const looseFingerprintMap = new Map<string, WorkoutSession[]>();

        // 合并所有会话（远程优先）
        const allSessions = [...remoteSessions, ...localSessions];
        
        // 先按日期排序（最新的在前），这样当遇到重复时，优先保留最新的
        allSessions.sort((a, b) => b.date - a.date);

        // 第一轮：严格指纹去重
        for (const session of allSessions) {
            // 过滤无效记录
            if (!isValidSession(session)) {
                console.log(`⚠️ 过滤无效记录: ${session.id}, volume=${session.volumeLoad}, duration=${session.durationMinutes}`);
                continue;
            }

            const fingerprint = generateFingerprint(session);

            if (!fingerprintMap.has(fingerprint)) {
                fingerprintMap.set(fingerprint, session);
            } else {
                // 已存在相同指纹，保留volume更大的那个（更完整的数据）
                const existing = fingerprintMap.get(fingerprint)!;
                if (session.volumeLoad > existing.volumeLoad) {
                    console.log(`📝 替换为更大volume的记录: ${session.volumeLoad} > ${existing.volumeLoad}`);
                    fingerprintMap.set(fingerprint, session);
                }
            }
        }

        // 第二轮：宽松指纹检测并合并同一天的相似训练
        // 将严格去重后的结果按宽松指纹分组
        for (const session of fingerprintMap.values()) {
            const looseFp = generateLooseFingerprint(session);
            if (!looseFingerprintMap.has(looseFp)) {
                looseFingerprintMap.set(looseFp, []);
            }
            looseFingerprintMap.get(looseFp)!.push(session);
        }

        // 对于每个宽松指纹组，如果有多条记录，只保留volume最大的那条
        const finalSessions: WorkoutSession[] = [];
        for (const [looseFp, sessions] of looseFingerprintMap) {
            if (sessions.length > 1) {
                // 按volume排序，保留最大的
                sessions.sort((a, b) => b.volumeLoad - a.volumeLoad);
                const kept = sessions[0];
                console.log(`🔄 合并同一天相似训练 (${looseFp}): 保留 volume=${kept.volumeLoad}, 过滤掉 ${sessions.length - 1} 条重复记录`);
                finalSessions.push(kept);
            } else {
                finalSessions.push(sessions[0]);
            }
        }

        // 按日期排序（最新的在前）
        const result = finalSessions.sort((a, b) => b.date - a.date);

        const totalInput = remoteSessions.length + localSessions.length;
        console.log(`✅ Merged workouts: ${remoteSessions.length} remote + ${localSessions.length} local = ${result.length} unique sessions (过滤掉 ${totalInput - result.length} 条)`);

        return result;
    }

    // ===== 辅助方法 =====

    private static generateWorkoutName(session: WorkoutSession): string {
        const date = new Date(session.date);
        const muscles = new Set(session.exercises.map(ex => ex.muscleGroup));
        const muscleList = Array.from(muscles).join(', ');
        return `${muscleList} - ${date.toLocaleDateString()}`;
    }

    private static calculateAverageReps(exercise: ActiveExercise): number {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return 0;

        const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);
        return Math.round(totalReps / completedSets.length);
    }

    private static calculateAverageWeight(exercise: ActiveExercise): number {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return 0;

        const totalWeight = completedSets.reduce((sum, s) => sum + s.weight, 0);
        return Math.round(totalWeight / completedSets.length);
    }

    private static calculateVolumeFromBackend(workout: any): number {
        if (!workout.exercises) return 0;

        return workout.exercises.reduce((total: number, ex: any) => {
            // 创建临时 exercise 对象用于类型识别
            const tempExercise = {
                id: ex.exerciseId || ex.id || '',
                name: ex.exerciseName || ex.name || '',
                muscleGroup: ex.muscleGroup,
                equipment: ex.equipment
            };

            // 兼容新旧格式
            if (Array.isArray(ex.sets)) {
                // 新格式：sets是数组，需要遍历计算
                // 使用 VolumeCalculationService 来处理特殊运动类型
                const exerciseVolume = ex.sets
                    .filter((set: any) => set.completed === true)
                    .reduce((sum: number, set: any) => {
                        const effectiveWeight = VolumeCalculationService.getEffectiveWeight(
                            tempExercise,
                            { weight: set.weight || 0, reps: set.reps || 0, completed: true, id: '' }
                        );
                        return sum + (effectiveWeight * (set.reps || 0));
                    }, 0);
                return total + exerciseVolume;
            } else {
                // 旧格式：sets是数字
                const sets = ex.sets || 0;
                const reps = ex.reps || 0;
                const weight = ex.weight || 0;
                
                // 对于旧格式，使用基本的 volume 计算
                // 因为无法确定运动类型
                return total + (sets * reps * weight);
            }
        }, 0);
    }

    private static reconstructSets(backendExercise: any): any[] {
        // 兼容新旧格式
        if (Array.isArray(backendExercise.sets)) {
            // 新格式：sets已经是数组，直接返回
            return backendExercise.sets;
        } else {
            // 旧格式：sets是数字，需要重建数组
            const sets = backendExercise.sets || 1;
            const reps = backendExercise.reps || 0;
            const weight = backendExercise.weight || 0;

            // 重建 sets 数组
            return Array.from({ length: sets }, (_, i) => ({
                id: `${backendExercise.id}-set-${i}`,
                weight,
                reps,
                completed: true,
                completedAt: new Date(backendExercise.createdAt).getTime()
            }));
        }
    }
}

export default WorkoutSyncService;