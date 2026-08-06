/**
 * Routine Sync Service
 *
 * 负责前端 Routine 数据与后端数据库的同步
 * Handles synchronization of routine data between frontend and backend
 */

import apiClient from './apiClient';
import type { Routine, Exercise } from '@/shared/types';
import type { CreateRoutineInput, UpdateRoutineInput, BackendRoutine } from '../types/routine';

export class RoutineSyncService {
    /**
     * 将 Routine 同步到后端
     * Sync routine to backend
     */
    static async syncRoutineToBackend(routine: Routine): Promise<string | null> {
        try {
            console.log('🔄 Syncing routine to backend:', routine);

            // 转换前端数据格式到后端 API 格式
            // 🆕 后端使用 'workouts' 字段而不是 'exercises'
            const routineData: any = {
                name: routine.name,
                description: `Created at ${new Date(routine.createdAt).toLocaleString()}`,
                workouts: routine.exercises.map((ex, index) => ({
                    exerciseId: ex.id,
                    exerciseName: ex.name,
                    order: index
                }))
            };

            const response = await apiClient.createRoutine(routineData);

            if (response.success && response.routine) {
                console.log('✅ Routine synced successfully:', response.routine.id);
                return response.routine.id;
            }

            return null;
        } catch (error: any) {
            // 如果是认证错误（401/404），静默失败，不抛出异常
            if (error.message?.includes('401') || error.message?.includes('404') ||
                error.message?.includes('Unauthorized') || error.message?.includes('Not Found')) {
                console.warn('⚠️ Authentication required or endpoint not found, skipping sync:', error.message);
                return null;
            }
            console.error('❌ Failed to sync routine to backend:', error);
            throw error;
        }
    }

    /**
     * 从后端加载所有 Routine
     * Load all routines from backend
     */
    static async loadRoutinesFromBackend(exerciseLibrary: Exercise[]): Promise<Routine[]> {
        try {
            console.log('📥 Loading routines from backend...');

            const response = await apiClient.getRoutines();

            if (response.success && response.routines) {
                console.log(`✅ Loaded ${response.routines.length} routines from backend`);

                // Track missing exercises across all routines and warn once
                const missingExerciseIds: string[] = [];

                // 转换后端数据格式到前端格式
                const routines: Routine[] = response.routines.map((backendRoutine) => {
                    // 🆕 后端使用 'workouts' 字段，前端期望 'exercises'
                    // 兼容两种字段名
                    const backendExercises = (backendRoutine as any).exercises || (backendRoutine as any).workouts || [];

                    // 根据 exerciseId 从 exerciseLibrary 中查找完整的 Exercise 对象
                    const exercises = backendExercises
                        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((ex: any) => {
                            // 尝试从库中找到完整的 Exercise 对象
                            const fullExercise = exerciseLibrary.find(e => e.id === ex.exerciseId);

                            if (fullExercise) {
                                return fullExercise;
                            }

                            // 如果找不到，创建一个基本的 Exercise 对象
                            if (!missingExerciseIds.includes(ex.exerciseId)) {
                                missingExerciseIds.push(ex.exerciseId);
                            }
                            return {
                                id: ex.exerciseId,
                                name: ex.exerciseName,
                                muscleGroup: 'Chest' as any, // 默认值
                                equipment: 'Unknown',
                            } as Exercise;
                        });

                    return {
                        id: backendRoutine.id,
                        name: backendRoutine.name,
                        exercises: exercises,
                        createdAt: new Date(backendRoutine.createdAt).getTime()
                    };
                });

                if (missingExerciseIds.length > 0) {
                    console.warn(`⚠️ ${missingExerciseIds.length} exercises not found in library, using basic info: ${missingExerciseIds.slice(0, 10).join(', ')}${missingExerciseIds.length > 10 ? '...' : ''}`);
                }

                console.log(`✅ Successfully converted ${routines.length} routines`);
                return routines;
            }

            return [];
        } catch (error: any) {
            // 如果是认证错误，静默处理
            if (error.message?.includes('401') || error.message?.includes('404') ||
                error.message?.includes('Unauthorized') || error.message?.includes('Not Found')) {
                console.warn('⚠️ Failed to load routines from backend (authentication required):', error.message);
                return [];
            }
            console.error('❌ Failed to load routines from backend:', error);
            return [];
        }
    }

    /**
     * 更新后端的 Routine
     * Update routine in backend
     */
    static async updateRoutineInBackend(routine: Routine): Promise<boolean> {
        try {
            console.log('🔄 Updating routine in backend:', routine);

            // 🆕 后端使用 'workouts' 字段而不是 'exercises'
            const routineData: any = {
                name: routine.name,
                workouts: routine.exercises.map((ex, index) => ({
                    exerciseId: ex.id,
                    exerciseName: ex.name,
                    order: index
                }))
            };

            const response = await apiClient.updateRoutine(routine.id, routineData);

            if (response.success) {
                console.log('✅ Routine updated successfully');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Failed to update routine in backend:', error);
            return false;
        }
    }

    /**
     * 从后端删除 Routine
     * Delete routine from backend
     */
    static async deleteRoutineFromBackend(routineId: string): Promise<boolean> {
        try {
            console.log('🗑️ Deleting routine from backend:', routineId);

            const response = await apiClient.deleteRoutine(routineId);

            if (response.success) {
                console.log('✅ Routine deleted successfully');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Failed to delete routine from backend:', error);
            return false;
        }
    }

    /**
     * 批量同步本地 Routine 到后端
     * Batch sync local routines to backend
     */
    static async syncLocalRoutinesToBackend(routines: Routine[]): Promise<number> {
        console.log(`🔄 Syncing ${routines.length} local routines to backend...`);

        let syncedCount = 0;
        let skippedCount = 0;

        for (const routine of routines) {
            try {
                // 检查 routine.id 是否是 UUID 格式（后端生成的）
                const isBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routine.id);

                if (!isBackendId) {
                    // 本地生成的 ID，需要创建新的
                    const backendId = await this.syncRoutineToBackend(routine);
                    if (backendId) {
                        syncedCount++;
                    } else {
                        skippedCount++;
                    }
                }
            } catch (error: any) {
                // 如果是认证错误，停止同步
                if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                    console.warn('⚠️ Authentication failed, stopping sync');
                    break;
                }
                console.error(`Failed to sync routine ${routine.id}:`, error);
                skippedCount++;
            }
        }

        if (skippedCount > 0) {
            console.log(`⚠️ Synced ${syncedCount}/${routines.length} routines (${skippedCount} skipped)`);
        } else {
            console.log(`✅ Synced ${syncedCount}/${routines.length} routines`);
        }
        return syncedCount;
    }

    /**
     * 合并本地和远程 Routine 数据（带智能去重）
     * Merge local and remote routine data with smart deduplication
     */
    static mergeRoutineData(
        localRoutines: Routine[],
        remoteRoutines: Routine[]
    ): Routine[] {
        const routineMap = new Map<string, Routine>();
        const nameMap = new Map<string, string>(); // 名称 -> ID 映射，用于检测重复

        // 先添加远程数据（优先级更高）
        remoteRoutines.forEach(routine => {
            const normalizedName = routine.name.toLowerCase().trim();
            routineMap.set(routine.id, routine);
            nameMap.set(normalizedName, routine.id);
        });

        // 再添加本地数据
        localRoutines.forEach(routine => {
            const normalizedName = routine.name.toLowerCase().trim();

            // 🆕 双重去重策略：
            // 1. 按ID去重（同一个routine的不同版本）
            // 2. 按名称去重（防止同名routine重复）

            if (routineMap.has(routine.id)) {
                // ID相同，说明是同一个routine的不同版本
                const existingRoutine = routineMap.get(routine.id)!;

                // 比较创建时间，保留最新的版本
                if (routine.createdAt > existingRoutine.createdAt) {
                    console.log(`🔄 Updating routine "${routine.name}" with newer local version`);
                    routineMap.set(routine.id, routine);
                } else {
                    console.log(`✓ Keeping remote version of routine "${routine.name}"`);
                }
            } else if (nameMap.has(normalizedName)) {
                // 🆕 名称相同但ID不同，说明是重复创建的routine
                const existingId = nameMap.get(normalizedName)!;
                const existingRoutine = routineMap.get(existingId)!;

                // 检查是否是后端ID（UUID格式）
                const isBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingId);
                const isLocalBackendId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routine.id);

                // 优先保留后端ID的版本
                if (isLocalBackendId && !isBackendId) {
                    console.log(`🔄 Replacing local routine "${routine.name}" with backend version`);
                    routineMap.delete(existingId);
                    routineMap.set(routine.id, routine);
                    nameMap.set(normalizedName, routine.id);
                } else if (!isLocalBackendId && isBackendId) {
                    console.log(`⏭️ Skipping duplicate local routine "${routine.name}" (backend version exists)`);
                } else {
                    // 都是后端ID或都是本地ID，保留最新的
                    if (routine.createdAt > existingRoutine.createdAt) {
                        console.log(`🔄 Replacing older routine "${routine.name}" with newer version`);
                        routineMap.delete(existingId);
                        routineMap.set(routine.id, routine);
                        nameMap.set(normalizedName, routine.id);
                    } else {
                        console.log(`⏭️ Skipping older duplicate routine "${routine.name}"`);
                    }
                }
            } else {
                // ID和名称都不同，说明是新的routine，直接添加
                routineMap.set(routine.id, routine);
                nameMap.set(normalizedName, routine.id);
                console.log(`➕ Adding local routine "${routine.name}" (ID: ${routine.id})`);
            }
        });

        // 按创建时间排序（最新的在前）
        const result = Array.from(routineMap.values()).sort((a, b) => b.createdAt - a.createdAt);

        const totalInput = remoteRoutines.length + localRoutines.length;
        const duplicatesRemoved = totalInput - result.length;

        if (duplicatesRemoved > 0) {
            console.log(`✅ Merged routines: ${remoteRoutines.length} remote + ${localRoutines.length} local = ${result.length} unique (removed ${duplicatesRemoved} duplicates)`);
        } else {
            console.log(`✅ Merged routines: ${remoteRoutines.length} remote + ${localRoutines.length} local = ${result.length} total routines`);
        }

        return result;
    }
}

export default RoutineSyncService;