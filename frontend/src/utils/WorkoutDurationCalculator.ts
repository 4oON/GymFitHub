/**
 * Workout Duration Calculator
 * 
 * 智能计算训练时长，基于组完成时间戳
 * 自动检测并排除暂停时间
 */

import type { ActiveExercise } from '@/shared/types';

export interface DurationCalculationResult {
    /** 训练时长（分钟） */
    durationMinutes: number;
    /** 实际开始时间（第一组完成时间） */
    actualStartTime: number;
    /** 实际结束时间（最后一组完成时间） */
    actualEndTime: number;
    /** 自动检测到的暂停次数 */
    autoDetectedPauses: number;
    /** 总暂停时长（分钟） */
    totalPauseMinutes: number;
}

export class WorkoutDurationCalculator {
    /** 暂停检测阈值（毫秒）- 超过此时间视为暂停 */
    private static readonly PAUSE_THRESHOLD_MS = 30 * 60 * 1000; // 30分钟

    /** 完成后的缓冲时间（毫秒）- 最后一组到点击完成的估算时间 */
    private static readonly COMPLETION_BUFFER_MS = 5 * 60 * 1000; // 5分钟

    /** 最小训练时长（分钟） */
    private static readonly MIN_DURATION_MINUTES = 5;

    /**
     * 智能计算训练时长
     * 
     * @param exercises 训练动作列表
     * @param pauseSegments 手动暂停记录（可选）
     * @returns 训练时长计算结果
     */
    static calculateSmartDuration(
        exercises: ActiveExercise[],
        pauseSegments?: Array<{ startTime: number; endTime?: number }>
    ): DurationCalculationResult {
        // 1. 收集所有完成组的时间戳
        const completedTimestamps = this.collectCompletedTimestamps(exercises);

        // 2. 如果没有完成的组，返回默认值
        if (completedTimestamps.length === 0) {
            const now = Date.now();
            return {
                durationMinutes: 0,
                actualStartTime: now,
                actualEndTime: now,
                autoDetectedPauses: 0,
                totalPauseMinutes: 0,
            };
        }

        // 3. 排序时间戳
        completedTimestamps.sort((a, b) => a - b);

        const firstSetTime = completedTimestamps[0];
        const lastSetTime = completedTimestamps[completedTimestamps.length - 1];

        // 4. 检测自动暂停（间隔超过阈值）
        const autoPauseResult = this.detectAutoPauses(completedTimestamps);

        // 5. 计算手动暂停时间
        const manualPauseTime = this.calculateManualPauseTime(pauseSegments);

        // 6. 计算总时长
        const totalTime = lastSetTime - firstSetTime;
        const totalPauseTime = autoPauseResult.totalPauseTime + manualPauseTime;
        const activeDuration = totalTime - totalPauseTime;

        // 7. 加上完成后的缓冲时间
        const finalDuration = activeDuration + this.COMPLETION_BUFFER_MS;

        // 8. 确保最小值
        const durationMinutes = Math.max(
            this.MIN_DURATION_MINUTES,
            Math.round(finalDuration / 60000)
        );

        // 9. 输出日志
        this.logCalculation({
            firstSetTime,
            lastSetTime,
            totalTime,
            autoPauseResult,
            manualPauseTime,
            durationMinutes,
        });

        return {
            durationMinutes,
            actualStartTime: firstSetTime,
            actualEndTime: lastSetTime,
            autoDetectedPauses: autoPauseResult.pauseCount,
            totalPauseMinutes: Math.round(totalPauseTime / 60000),
        };
    }

    /**
     * 收集所有完成组的时间戳
     */
    private static collectCompletedTimestamps(exercises: ActiveExercise[]): number[] {
        const timestamps: number[] = [];

        exercises.forEach((ex) => {
            ex.sets.forEach((set) => {
                if (set.completed && set.completedAt) {
                    timestamps.push(set.completedAt);
                }
            });
        });

        return timestamps;
    }

    /**
     * 检测自动暂停
     * 
     * @param sortedTimestamps 已排序的时间戳数组
     * @returns 暂停检测结果
     */
    private static detectAutoPauses(sortedTimestamps: number[]): {
        totalPauseTime: number;
        pauseCount: number;
        pauses: Array<{ startTime: number; endTime: number; duration: number }>;
    } {
        let totalPauseTime = 0;
        let pauseCount = 0;
        const pauses: Array<{ startTime: number; endTime: number; duration: number }> = [];

        for (let i = 1; i < sortedTimestamps.length; i++) {
            const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];

            // 如果间隔超过阈值，视为暂停
            if (gap > this.PAUSE_THRESHOLD_MS) {
                totalPauseTime += gap;
                pauseCount++;
                pauses.push({
                    startTime: sortedTimestamps[i - 1],
                    endTime: sortedTimestamps[i],
                    duration: gap,
                });

                console.log(
                    `🔍 Detected pause #${pauseCount}: ${Math.round(gap / 60000)}min ` +
                    `(${new Date(sortedTimestamps[i - 1]).toLocaleTimeString()} - ` +
                    `${new Date(sortedTimestamps[i]).toLocaleTimeString()})`
                );
            }
        }

        return { totalPauseTime, pauseCount, pauses };
    }

    /**
     * 计算手动暂停时间
     */
    private static calculateManualPauseTime(
        pauseSegments?: Array<{ startTime: number; endTime?: number }>
    ): number {
        if (!pauseSegments || pauseSegments.length === 0) {
            return 0;
        }

        let totalPauseTime = 0;

        pauseSegments.forEach((pause) => {
            if (pause.endTime) {
                const duration = pause.endTime - pause.startTime;
                totalPauseTime += duration;
                console.log(`⏸️ Manual pause: ${Math.round(duration / 60000)}min`);
            }
        });

        return totalPauseTime;
    }

    /**
     * 输出计算日志
     */
    private static logCalculation(params: {
        firstSetTime: number;
        lastSetTime: number;
        totalTime: number;
        autoPauseResult: { totalPauseTime: number; pauseCount: number };
        manualPauseTime: number;
        durationMinutes: number;
    }): void {
        const {
            firstSetTime,
            lastSetTime,
            totalTime,
            autoPauseResult,
            manualPauseTime,
            durationMinutes,
        } = params;

        console.log(`⏱️ Smart Duration Calculation:
            - First set: ${new Date(firstSetTime).toLocaleTimeString()}
            - Last set: ${new Date(lastSetTime).toLocaleTimeString()}
            - Total time span: ${Math.round(totalTime / 60000)}min
            - Auto pauses: ${Math.round(autoPauseResult.totalPauseTime / 60000)}min (${autoPauseResult.pauseCount} detected)
            - Manual pauses: ${Math.round(manualPauseTime / 60000)}min
            - Final duration: ${durationMinutes}min
        `);
    }

    /**
     * 重新计算历史训练的时长
     * 用于修复现有数据
     * 
     * @param exercises 训练动作列表
     * @returns 重新计算的时长（分钟）
     */
    static recalculateHistoricalDuration(exercises: ActiveExercise[]): number {
        const result = this.calculateSmartDuration(exercises);
        return result.durationMinutes;
    }
}

export default WorkoutDurationCalculator;
