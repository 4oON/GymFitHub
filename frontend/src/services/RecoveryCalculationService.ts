/**
 * Recovery Calculation Service
 * 
 * 基于训练历史实时计算肌肉恢复状态
 * 这样可以确保跨设备数据一致性，无需后端存储恢复状态
 */

import type { WorkoutSession, RecoveryStatus, MuscleGroup } from '@/shared/types';

class RecoveryCalculationService {
    /**
     * 从训练历史计算所有肌肉群的恢复状态
     * @param history 训练历史记录
     * @param recoveryHours 恢复所需小时数（默认72小时）
     * @returns 所有肌肉群的恢复状态
     */
    calculateRecoveryFromHistory(
        history: WorkoutSession[],
        recoveryHours: number = 72
    ): RecoveryStatus[] {
        // 创建肌肉群到最后训练时间的映射
        const muscleLastWorkedMap = new Map<MuscleGroup, number>();

        // 遍历所有训练记录
        history.forEach(session => {
            const sessionTime = new Date(session.date).getTime();

            session.exercises.forEach(exercise => {
                const primaryMuscle = exercise.muscleGroup;
                const secondaryMuscles = exercise.secondaryMuscles || [];

                // 只计算有效的训练数据：有 completed sets 且 weight > 0, reps > 0
                const validSets = exercise.sets?.filter(s => 
                    s.completed && s.weight > 0 && s.reps > 0
                ) || [];
                
                // 如果没有有效组数，跳过这个练习
                if (validSets.length === 0) return;

                // 更新主要肌肉群的最后训练时间
                const currentPrimaryTime = muscleLastWorkedMap.get(primaryMuscle) || 0;
                if (sessionTime > currentPrimaryTime) {
                    muscleLastWorkedMap.set(primaryMuscle, sessionTime);
                }

                // 更新次要肌肉群的最后训练时间（如果比主要训练时间更近）
                secondaryMuscles.forEach(secondaryMuscle => {
                    const currentSecondaryTime = muscleLastWorkedMap.get(secondaryMuscle) || 0;
                    // 次要肌肉群使用50%的恢复时间
                    const adjustedTime = sessionTime - (recoveryHours * 60 * 60 * 1000 / 2);
                    if (adjustedTime > currentSecondaryTime) {
                        muscleLastWorkedMap.set(secondaryMuscle, adjustedTime);
                    }
                });
            });
        });

        // 生成所有肌肉群的恢复状态
        const allMuscleGroups: MuscleGroup[] = [
            'Chest' as MuscleGroup,
            'Lats' as MuscleGroup,
            'Quads' as MuscleGroup,
            'Glutes' as MuscleGroup,
            'Shoulders' as MuscleGroup,
            'Biceps' as MuscleGroup,
            'Triceps' as MuscleGroup,
            'Abs' as MuscleGroup,
            'Hamstrings' as MuscleGroup,
            'Calves' as MuscleGroup,
            'Forearms' as MuscleGroup,
            'Traps' as MuscleGroup,
            'Lower Back' as MuscleGroup,
            'Cardio' as MuscleGroup,
        ];

        return allMuscleGroups.map(muscle => {
            const lastWorked = muscleLastWorkedMap.get(muscle) || 0;
            const recoveryPercentage = this.calculateRecoveryPercentage(lastWorked, recoveryHours);

            return {
                muscle,
                lastWorked,
                recoveryPercentage
            };
        });
    }

    /**
     * 计算单个肌肉群的恢复百分比
     * @param lastWorked 最后训练时间戳（毫秒）
     * @param durationHours 完全恢复所需小时数
     * @returns 恢复百分比 (0-100)
     */
    calculateRecoveryPercentage(lastWorked: number, durationHours: number = 72): number {
        // 处理未训练过的情况
        if (!lastWorked || typeof lastWorked !== 'number' || isNaN(lastWorked) || lastWorked === 0) {
            return 100;
        }

        const now = Date.now();
        const elapsed = now - lastWorked;
        const durationMs = durationHours * 60 * 60 * 1000;
        const percentage = (elapsed / durationMs) * 100;

        // 确保返回 0-100 之间的有效数字
        return Math.min(100, Math.max(0, isNaN(percentage) ? 100 : percentage));
    }

    /**
     * 更新恢复状态（训练完成后调用）
     * @param currentRecoveryState 当前恢复状态
     * @param primaryMuscles 主要训练的肌肉群
     * @param secondaryMuscles 次要训练的肌肉群
     * @param recoveryHours 恢复所需小时数
     * @returns 更新后的恢复状态
     */
    updateRecoveryAfterWorkout(
        currentRecoveryState: RecoveryStatus[],
        primaryMuscles: Set<MuscleGroup>,
        secondaryMuscles: Set<MuscleGroup>,
        recoveryHours: number = 72
    ): RecoveryStatus[] {
        const now = Date.now();

        return currentRecoveryState.map(status => {
            const isPrimary = primaryMuscles.has(status.muscle);
            const isSecondary = secondaryMuscles.has(status.muscle);

            if (isPrimary) {
                // 主要肌肉群：重置为0%恢复
                console.log(`🔄 Setting ${status.muscle} to 0% recovery, lastWorked: ${now}`);
                return {
                    ...status,
                    lastWorked: now,
                    recoveryPercentage: 0
                };
            } else if (isSecondary) {
                // 次要肌肉群：设置为50%恢复
                const halfDurationMs = (recoveryHours * 60 * 60 * 1000) / 2;
                const simulatedTime = now - halfDurationMs;

                // 只有当新的训练时间比现有的更近时才更新
                if (simulatedTime > status.lastWorked) {
                    console.log(`🔄 Setting ${status.muscle} to 50% recovery, lastWorked: ${simulatedTime}`);
                    return {
                        ...status,
                        lastWorked: simulatedTime,
                        recoveryPercentage: 50
                    };
                }
            }

            return status;
        });
    }

    /**
     * 获取需要恢复的肌肉群列表
     * @param recoveryState 恢复状态
     * @param threshold 恢复阈值（默认80%）
     * @returns 恢复度低于阈值的肌肉群
     */
    getMusclesNeedingRecovery(
        recoveryState: RecoveryStatus[],
        threshold: number = 80
    ): MuscleGroup[] {
        return recoveryState
            .filter(status => status.recoveryPercentage < threshold)
            .map(status => status.muscle);
    }

    /**
     * 获取已完全恢复的肌肉群列表
     * @param recoveryState 恢复状态
     * @param threshold 恢复阈值（默认80%）
     * @returns 恢复度高于阈值的肌肉群
     */
    getFullyRecoveredMuscles(
        recoveryState: RecoveryStatus[],
        threshold: number = 80
    ): MuscleGroup[] {
        return recoveryState
            .filter(status => status.recoveryPercentage >= threshold)
            .map(status => status.muscle);
    }

    /**
     * 获取恢复状态摘要
     * @param recoveryState 恢复状态
     * @returns 恢复状态统计信息
     */
    getRecoverySummary(recoveryState: RecoveryStatus[]): {
        fullyRecovered: number;
        partiallyRecovered: number;
        needsRecovery: number;
        averageRecovery: number;
    } {
        let fullyRecovered = 0;
        let partiallyRecovered = 0;
        let needsRecovery = 0;
        let totalRecovery = 0;

        recoveryState.forEach(status => {
            totalRecovery += status.recoveryPercentage;

            if (status.recoveryPercentage >= 80) {
                fullyRecovered++;
            } else if (status.recoveryPercentage >= 40) {
                partiallyRecovered++;
            } else {
                needsRecovery++;
            }
        });

        return {
            fullyRecovered,
            partiallyRecovered,
            needsRecovery,
            averageRecovery: totalRecovery / recoveryState.length
        };
    }
}

// 导出单例
export default new RecoveryCalculationService();