/**
 * Calorie Calculation Service
 * 
 * 科学的卡路里消耗计算服务
 * 基于实际训练负荷、组数、体重、体脂率等因素
 */

import type { WorkoutSession, UserProfile } from '@/shared/types';
import { VolumeCalculationService } from '@/features/workout/services/VolumeCalculationService';

export class CalorieCalculationService {
    /**
     * 计算训练消耗的卡路里
     * 
     * 计算公式基于以下因素：
     * 1. 训练负荷（重量 × 次数 × 组数）
     * 2. 用户体重和体脂率
     * 3. 训练类型（复合动作 vs 孤立动作）
     * 4. 实际完成的组数
     * 
     * @param session 训练记录
     * @param userProfile 用户资料
     * @returns 消耗的卡路里（kcal）
     */
    static calculateWorkoutCalories(session: WorkoutSession, userProfile: UserProfile): number {
        const userWeight = userProfile.weight || 75; // 默认75kg
        const bodyFat = userProfile.bodyFatPercentage || 20; // 默认20%体脂
        const leanMass = userWeight * (1 - bodyFat / 100); // 瘦体重

        let totalCalories = 0;

        // 1. 基于训练负荷的卡路里消耗
        session.exercises.forEach(exercise => {
            const completedSets = exercise.sets.filter(s => s.completed);

            if (completedSets.length === 0) return;

            // 计算该动作的总负荷（使用 VolumeCalculationService 处理特殊运动类型）
            const exerciseVolume = VolumeCalculationService.calculateActiveExerciseVolume(
                exercise,
                [], // Exercise library not available here, will use name-based identification
                { userBodyweight: userWeight }
            );

            // 根据动作类型调整系数
            // 复合动作（Compound）消耗更多卡路里
            const mechanicMultiplier = exercise.mechanic === 'Compound' ? 1.3 : 1.0;

            // 基础公式：每1000kg负荷 ≈ 消耗 5-8 kcal（取决于瘦体重）
            // 瘦体重越高，代谢效率越高
            const leanMassMultiplier = 0.05 + (leanMass / 1000); // 0.05 - 0.15
            const exerciseCalories = (exerciseVolume / 1000) * 6.5 * mechanicMultiplier * leanMassMultiplier;

            totalCalories += exerciseCalories;
        });

        // 2. 基于组数的额外消耗
        // 每组训练本身也有基础代谢消耗
        const totalSets = session.exercises.reduce((sum, ex) => {
            return sum + ex.sets.filter(s => s.completed).length;
        }, 0);

        // 每组消耗约 3-5 kcal（取决于体重）
        const setCalories = totalSets * (3 + (userWeight / 100));
        totalCalories += setCalories;

        // 3. 基于时间的基础代谢
        // 训练期间的基础代谢率提升
        const durationHours = (session.durationMinutes || 0) / 60;
        const bmrDuringWorkout = this.calculateBMR(userWeight, bodyFat) * 1.5; // 训练时BMR提升50%
        const timeBasedCalories = bmrDuringWorkout * durationHours;
        totalCalories += timeBasedCalories;

        // 4. EPOC效应（运动后过量氧耗）
        // 高强度训练后会持续燃烧卡路里
        const epocBonus = totalCalories * 0.15; // 额外15%的EPOC效应
        totalCalories += epocBonus;

        return Math.round(totalCalories);
    }

    /**
     * 计算基础代谢率（BMR）
     * 使用 Katch-McArdle 公式（考虑体脂率）
     * 
     * @param weight 体重（kg）
     * @param bodyFat 体脂率（%）
     * @returns 每小时BMR（kcal/h）
     */
    private static calculateBMR(weight: number, bodyFat: number): number {
        const leanMass = weight * (1 - bodyFat / 100);
        // Katch-McArdle: BMR = 370 + (21.6 × lean mass in kg)
        const dailyBMR = 370 + (21.6 * leanMass);
        return dailyBMR / 24; // 转换为每小时
    }

    /**
     * 估算训练强度等级
     * 
     * @param session 训练记录
     * @returns 强度等级 (1-5)
     */
    static calculateIntensityLevel(session: WorkoutSession): number {
        const totalSets = session.exercises.reduce((sum, ex) => {
            return sum + ex.sets.filter(s => s.completed).length;
        }, 0);

        const avgVolume = session.volumeLoad / totalSets;
        const duration = session.durationMinutes || 0;

        // 基于负荷密度（volume per minute）
        const volumeDensity = session.volumeLoad / duration;

        if (volumeDensity > 500) return 5; // 极高强度
        if (volumeDensity > 350) return 4; // 高强度
        if (volumeDensity > 200) return 3; // 中等强度
        if (volumeDensity > 100) return 2; // 低强度
        return 1; // 极低强度
    }

    /**
     * 获取训练强度描述
     */
    static getIntensityDescription(level: number): string {
        const descriptions = {
            1: '轻度训练',
            2: '低强度训练',
            3: '中等强度训练',
            4: '高强度训练',
            5: '极高强度训练'
        };
        return descriptions[level as keyof typeof descriptions] || '未知';
    }

    /**
     * 计算训练效率分数
     * 基于单位时间内的负荷和卡路里消耗
     * 
     * @param session 训练记录
     * @param calories 消耗的卡路里
     * @returns 效率分数 (0-100)
     */
    static calculateEfficiencyScore(session: WorkoutSession, calories: number): number {
        const duration = session.durationMinutes || 1;

        // 每分钟负荷
        const volumePerMin = session.volumeLoad / duration;

        // 每分钟卡路里
        const caloriesPerMin = calories / duration;

        // 综合评分（归一化到0-100）
        const volumeScore = Math.min((volumePerMin / 300) * 50, 50); // 最高50分
        const calorieScore = Math.min((caloriesPerMin / 15) * 50, 50); // 最高50分

        return Math.round(volumeScore + calorieScore);
    }
}

export default CalorieCalculationService;