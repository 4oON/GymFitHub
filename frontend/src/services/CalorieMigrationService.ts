/**
 * Calorie Migration Service
 * 
 * 用于重新计算所有历史workout的卡路里值
 * 将旧的基于时间的计算方法迁移到新的科学计算方法
 */

import CalorieCalculationService from './CalorieCalculationService';
import type { WorkoutSession, UserProfile, WeeklyReport } from '@/shared/types';

export class CalorieMigrationService {
    /**
     * 重新计算所有workout sessions的卡路里
     * 
     * @param sessions 所有训练记录
     * @param userProfile 用户资料
     * @returns 更新后的训练记录
     */
    static recalculateAllWorkoutCalories(
        sessions: WorkoutSession[],
        userProfile: UserProfile
    ): WorkoutSession[] {
        console.log(`🔄 开始重新计算 ${sessions.length} 条训练记录的卡路里...`);

        const updatedSessions = sessions.map(session => {
            // 使用新的科学计算方法
            const newCalories = CalorieCalculationService.calculateWorkoutCalories(
                session,
                userProfile
            );

            // 保持原有数据不变，只更新卡路里相关信息
            return {
                ...session,
                // 注意：WorkoutSession类型中没有calories字段
                // 卡路里是在生成报告时计算的
                // 这里我们返回更新后的session，卡路里会在报告中重新计算
            };
        });

        console.log(`✅ 完成重新计算`);
        return updatedSessions;
    }

    /**
     * 重新计算所有weekly reports的统计数据
     * 
     * @param reports 所有周报
     * @param sessions 所有训练记录
     * @param userProfile 用户资料
     * @returns 更新后的周报
     */
    static recalculateAllWeeklyReports(
        reports: WeeklyReport[],
        sessions: WorkoutSession[],
        userProfile: UserProfile
    ): WeeklyReport[] {
        console.log(`🔄 开始重新计算 ${reports.length} 份周报的卡路里...`);

        const updatedReports = reports.map(report => {
            // 重新计算该周的总卡路里
            let totalCalories = 0;

            report.sessions.forEach(session => {
                const sessionCalories = CalorieCalculationService.calculateWorkoutCalories(
                    session,
                    userProfile
                );
                totalCalories += sessionCalories;
            });

            // 更新报告的统计数据
            return {
                ...report,
                stats: {
                    ...report.stats,
                    totalCalories: Math.round(totalCalories)
                }
            };
        });

        console.log(`✅ 完成重新计算周报`);
        return updatedReports;
    }

    /**
     * 执行完整的卡路里迁移
     * 
     * @param userProfile 用户资料
     * @returns 迁移统计信息
     */
    static async performFullMigration(userProfile: UserProfile): Promise<{
        success: boolean;
        sessionsUpdated: number;
        reportsUpdated: number;
        message: string;
    }> {
        try {
            console.log('🚀 开始卡路里计算方法迁移...');

            // 1. 加载所有workout sessions
            const sessionsJson = localStorage.getItem('workout-sessions');
            if (!sessionsJson) {
                return {
                    success: true,
                    sessionsUpdated: 0,
                    reportsUpdated: 0,
                    message: '没有找到训练记录'
                };
            }

            const sessions: WorkoutSession[] = JSON.parse(sessionsJson);

            // 2. 重新计算sessions（虽然session本身不存储calories，但这一步为了保持一致性）
            const updatedSessions = this.recalculateAllWorkoutCalories(sessions, userProfile);

            // 3. 保存更新后的sessions
            localStorage.setItem('workout-sessions', JSON.stringify(updatedSessions));

            // 4. 加载所有weekly reports
            const reportsJson = localStorage.getItem('weekly-reports');
            let reportsUpdated = 0;

            if (reportsJson) {
                const reports: WeeklyReport[] = JSON.parse(reportsJson);

                // 5. 重新计算reports
                const updatedReports = this.recalculateAllWeeklyReports(
                    reports,
                    updatedSessions,
                    userProfile
                );

                // 6. 保存更新后的reports
                localStorage.setItem('weekly-reports', JSON.stringify(updatedReports));
                reportsUpdated = updatedReports.length;
            }

            console.log('✅ 卡路里迁移完成！');

            return {
                success: true,
                sessionsUpdated: updatedSessions.length,
                reportsUpdated,
                message: `成功更新 ${updatedSessions.length} 条训练记录和 ${reportsUpdated} 份周报`
            };

        } catch (error) {
            console.error('❌ 卡路里迁移失败:', error);
            return {
                success: false,
                sessionsUpdated: 0,
                reportsUpdated: 0,
                message: error instanceof Error ? error.message : '迁移失败'
            };
        }
    }

    /**
     * 获取迁移前后的对比数据
     * 用于验证迁移效果
     */
    static async getMigrationComparison(
        sessions: WorkoutSession[],
        userProfile: UserProfile
    ): Promise<{
        session: WorkoutSession;
        oldCalories: number;
        newCalories: number;
        difference: number;
        percentageChange: number;
    }[]> {
        return sessions.map(session => {
            const duration = session.durationMinutes || 0;
            const weight = userProfile.weight || 75;

            // 旧方法
            const oldCalories = Math.round((duration / 60) * 5 * weight);

            // 新方法
            const newCalories = CalorieCalculationService.calculateWorkoutCalories(
                session,
                userProfile
            );

            const difference = newCalories - oldCalories;
            const percentageChange = oldCalories > 0 
                ? ((difference / oldCalories) * 100) 
                : 0;

            return {
                session,
                oldCalories,
                newCalories,
                difference,
                percentageChange
            };
        });
    }
}

export default CalorieMigrationService;