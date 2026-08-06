/**
 * Achievement Service - 成就系统
 * 
 * 设计目标：激励用户继续训练，展示复合动作大重量成就
 * 包含：动作PR、里程碑、力量等级
 */

import type { WorkoutSession, ActiveExercise, WorkoutSet } from '@/shared/types';

// 成就类型
export interface Achievement {
    id: string;
    type: 'exercise_pr' | 'milestone' | 'strength_tier' | 'weekly_goal' | 'streak';
    title: string;
    subtitle: string;
    value: string;
    unit: string;
    exerciseName?: string;
    muscleGroup?: string;
    date: number;
    daysAgo: number;
    isNew: boolean;
    icon: string;
    color: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    progress?: {
        current: number;
        target: number;
        percentage: number;
    };
}

// 力量等级定义
const STRENGTH_TIERS = [
    { weight: 100, name: '100KG Club', color: 'from-blue-500 to-cyan-500', icon: '🥉', rarity: 'common' as const },
    { weight: 140, name: '140KG Club', color: 'from-purple-500 to-violet-500', icon: '🥈', rarity: 'rare' as const },
    { weight: 180, name: '180KG Club', color: 'from-amber-500 to-orange-500', icon: '🥇', rarity: 'epic' as const },
    { weight: 220, name: '220KG Club', color: 'from-rose-500 to-red-500', icon: '💎', rarity: 'legendary' as const },
];

// 复合动作列表
const COMPOUND_EXERCISES = [
    'Squat', 'Deadlift', 'Bench Press', 'Overhead Press',
    'Barbell Row', 'Front Squat', 'Romanian Deadlift', 'Incline Bench Press',
    '深蹲', '硬拉', '卧推', '推举', '杠铃划船'
];

export interface AchievementSummary {
    achievements: Achievement[];
    exercisePRs: Achievement[];      // 各动作PR
    milestones: Achievement[];        // 里程碑
    recentAchievements: Achievement[]; // 最近30天
    stats: {
        totalWorkouts: number;
        totalTons: number;
        heaviestLift: number;
        currentStreak: number;
        bestStreak: number;
    };
}

export class AchievementService {
    /**
     * 分析所有成就
     */
    static analyzeAchievements(workouts: WorkoutSession[]): AchievementSummary {
        if (!workouts || workouts.length === 0) {
            return {
                achievements: [],
                exercisePRs: [],
                milestones: [],
                recentAchievements: [],
                stats: {
                    totalWorkouts: 0,
                    totalTons: 0,
                    heaviestLift: 0,
                    currentStreak: 0,
                    bestStreak: 0
                }
            };
        }

        const allAchievements: Achievement[] = [];

        // 1. 分析每个动作的PR
        const exercisePRs = this.analyzeExercisePRs(workouts);
        allAchievements.push(...exercisePRs);

        // 2. 分析里程碑
        const milestones = this.analyzeMilestones(workouts);
        allAchievements.push(...milestones);

        // 3. 计算统计数据
        const stats = this.calculateStats(workouts);

        // 4. 找出最近30天的成就
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentAchievements = allAchievements
            .filter(a => a.date > thirtyDaysAgo)
            .sort((a, b) => b.date - a.date);

        // 按稀有度排序所有成就
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        allAchievements.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

        return {
            achievements: allAchievements,
            exercisePRs: exercisePRs.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]),
            milestones,
            recentAchievements,
            stats
        };
    }

    /**
     * 分析每个动作的PR - 重点展示复合动作大重量
     */
    private static analyzeExercisePRs(workouts: WorkoutSession[]): Achievement[] {
        const achievements: Achievement[] = [];
        
        // 收集每个动作的所有记录
        const exerciseRecords = new Map<string, {
            maxWeight: number;
            maxReps: number;
            date: number;
            sets: { weight: number; reps: number }[];
        }>();

        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                const name = exercise.exerciseName || exercise.exerciseId;
                if (!name) return;

                if (!exerciseRecords.has(name)) {
                    exerciseRecords.set(name, { maxWeight: 0, maxReps: 0, date: workout.date, sets: [] });
                }

                const record = exerciseRecords.get(name)!;
                
                exercise.sets?.forEach(set => {
                    if (set.completed && set.weight > 0) {
                        record.sets.push({ weight: set.weight, reps: set.reps });
                        if (set.weight > record.maxWeight) {
                            record.maxWeight = set.weight;
                            record.maxReps = set.reps;
                            record.date = workout.date;
                        }
                    }
                });
            });
        });

        // 为每个动作创建成就
        exerciseRecords.forEach((record, name) => {
            if (record.maxWeight === 0) return;

            const isCompound = COMPOUND_EXERCISES.some(e => 
                name.toLowerCase().includes(e.toLowerCase())
            );
            
            const daysAgo = this.calculateDaysAgo(record.date);
            const isNew = daysAgo <= 30;

            // 根据重量确定稀有度
            let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
            if (record.maxWeight >= 180) rarity = 'legendary';
            else if (record.maxWeight >= 140) rarity = 'epic';
            else if (record.maxWeight >= 100) rarity = 'rare';

            achievements.push({
                id: `pr_${name}_${record.date}`,
                type: 'exercise_pr',
                title: isCompound ? `${name} PR` : name,
                subtitle: isCompound ? 'Compound Lift' : 'Exercise PR',
                value: record.maxWeight.toString(),
                unit: 'kg',
                exerciseName: name,
                date: record.date,
                daysAgo,
                isNew,
                icon: this.getExerciseIcon(name, record.maxWeight),
                color: this.getRarityColor(rarity),
                rarity
            });
        });

        return achievements;
    }

    /**
     * 分析里程碑
     */
    private static analyzeMilestones(workouts: WorkoutSession[]): Achievement[] {
        const achievements: Achievement[] = [];
        
        // 找出最大重量
        let maxWeight = 0;
        let maxWeightDate = 0;
        
        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                exercise.sets?.forEach(set => {
                    if (set.completed && set.weight > maxWeight) {
                        maxWeight = set.weight;
                        maxWeightDate = workout.date;
                    }
                });
            });
        });

        // 检查达到的力量等级
        STRENGTH_TIERS.forEach(tier => {
            if (maxWeight >= tier.weight) {
                const daysAgo = this.calculateDaysAgo(maxWeightDate);
                achievements.push({
                    id: `tier_${tier.weight}`,
                    type: 'strength_tier',
                    title: tier.name,
                    subtitle: `Lifted ${maxWeight}kg`,
                    value: maxWeight.toString(),
                    unit: 'kg',
                    date: maxWeightDate,
                    daysAgo,
                    isNew: daysAgo <= 30,
                    icon: tier.icon,
                    color: tier.color,
                    rarity: tier.rarity
                });
            }
        });

        // 总容量里程碑
        const totalVolume = workouts.reduce((sum, w) => sum + (w.volumeLoad || 0), 0);
        const tons = Math.floor(totalVolume / 1000);
        
        if (tons >= 10) {
            achievements.push({
                id: 'total_tons',
                type: 'milestone',
                title: `${tons} Tons Lifted`,
                subtitle: 'Total Volume Milestone',
                value: tons.toString(),
                unit: 'tons',
                date: workouts[workouts.length - 1]?.date || Date.now(),
                daysAgo: 0,
                isNew: false,
                icon: '🏔️',
                color: 'from-emerald-500 to-teal-500',
                rarity: tons >= 100 ? 'legendary' : tons >= 50 ? 'epic' : 'rare'
            });
        }

        return achievements;
    }

    /**
     * 计算统计数据
     */
    private static calculateStats(workouts: WorkoutSession[]) {
        const totalVolume = workouts.reduce((sum, w) => sum + (w.volumeLoad || 0), 0);
        
        let heaviestLift = 0;
        workouts.forEach(w => {
            w.exercises?.forEach(e => {
                e.sets?.forEach(s => {
                    if (s.completed && s.weight > heaviestLift) {
                        heaviestLift = s.weight;
                    }
                });
            });
        });

        // 计算连续训练天数
        const dates = [...new Set(workouts.map(w => new Date(w.date).toDateString()))].sort();
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (dates.includes(today) || dates.includes(yesterday)) {
            currentStreak = 1;
            for (let i = dates.length - 2; i >= 0; i--) {
                const current = new Date(dates[i + 1]);
                const prev = new Date(dates[i]);
                const diffDays = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);
                
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        return {
            totalWorkouts: workouts.length,
            totalTons: Math.floor(totalVolume / 1000),
            heaviestLift,
            currentStreak,
            bestStreak
        };
    }

    private static getExerciseIcon(name: string, weight: number): string {
        if (name.toLowerCase().includes('squat')) return '🦵';
        if (name.toLowerCase().includes('deadlift')) return '☠️';
        if (name.toLowerCase().includes('bench')) return '🏋️';
        if (name.toLowerCase().includes('press') || name.toLowerCase().includes('overhead')) return '💪';
        if (name.toLowerCase().includes('row')) return '🚣';
        return weight >= 100 ? '🔥' : '💪';
    }

    private static getRarityColor(rarity: string): string {
        switch (rarity) {
            case 'legendary': return 'from-rose-500 to-red-500';
            case 'epic': return 'from-amber-500 to-orange-500';
            case 'rare': return 'from-purple-500 to-violet-500';
            default: return 'from-blue-500 to-cyan-500';
        }
    }

    private static calculateDaysAgo(timestamp: number): number {
        return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
    }
}

export default AchievementService;
