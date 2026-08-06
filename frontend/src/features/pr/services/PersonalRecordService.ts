/**
 * Personal Record Service
 * 
 * 分析用户所有 workout 历史，找出最闪亮的 PR（个人记录）
 * 包括：最大重量、最大 Volume、最长训练时间等
 */

import type { WorkoutSession, ActiveExercise, WorkoutSet } from '@/shared/types';

// Record type labels in English
const RECORD_TYPE_LABELS: Record<string, string> = {
    max_weight: 'Max Weight',
    max_volume: 'Max Volume',
    max_reps: 'Max Reps',
    longest_workout: 'Longest Workout',
    most_sets: 'Most Sets'
};

export interface PersonalRecord {
    id: string;
    type: 'max_weight' | 'max_volume' | 'max_reps' | 'longest_workout' | 'most_sets';
    title: string;
    value: string;
    exerciseName?: string;
    muscleGroup?: string;
    date: number;
    dateFormatted: string;
    daysAgo: number;
    description: string;
    icon: string;
    color: string;
}

export interface PRSummary {
    records: PersonalRecord[];
    totalWorkouts: number;
    totalWeightLifted: number;
    heaviestLift: number;
    bestExercise: string;
    recentPRs: PersonalRecord[]; // 最近30天内的 PR
}

export class PersonalRecordService {
    private static readonly RECORD_ICONS = {
        max_weight: '🏋️',
        max_volume: '💪',
        max_reps: '🔥',
        longest_workout: '⏱️',
        most_sets: '📊'
    };

    private static readonly RECORD_COLORS = {
        max_weight: 'from-amber-500 to-orange-500',
        max_volume: 'from-emerald-500 to-teal-500',
        max_reps: 'from-rose-500 to-pink-500',
        longest_workout: 'from-blue-500 to-cyan-500',
        most_sets: 'from-purple-500 to-violet-500'
    };

    /**
     * 分析所有 workout，找出所有 PR
     */
    static analyzePersonalRecords(workouts: WorkoutSession[]): PRSummary {
        if (!workouts || workouts.length === 0) {
            return {
                records: [],
                totalWorkouts: 0,
                totalWeightLifted: 0,
                heaviestLift: 0,
                bestExercise: '',
                recentPRs: []
            };
        }

        const records: PersonalRecord[] = [];
        
        // 1. 找出最大重量 PR
        const maxWeightPR = this.findMaxWeightPR(workouts);
        if (maxWeightPR) records.push(maxWeightPR);

        // 2. 找出最大 Volume 的训练 PR
        const maxVolumePR = this.findMaxVolumePR(workouts);
        if (maxVolumePR) records.push(maxVolumePR);

        // 3. 找出单组最大次数 PR
        const maxRepsPR = this.findMaxRepsPR(workouts);
        if (maxRepsPR) records.push(maxRepsPR);

        // 4. 找出最长训练时间 PR
        const longestWorkoutPR = this.findLongestWorkoutPR(workouts);
        if (longestWorkoutPR) records.push(longestWorkoutPR);

        // 5. 找出最多组数 PR
        const mostSetsPR = this.findMostSetsPR(workouts);
        if (mostSetsPR) records.push(mostSetsPR);

        // 计算统计数据
        const totalWeightLifted = workouts.reduce((sum, w) => sum + (w.volumeLoad || 0), 0);
        const heaviestLift = Math.max(...records
            .filter(r => r.type === 'max_weight')
            .map(r => parseFloat(r.value) || 0), 0);

        // 找出训练最多的动作
        const exerciseFrequency = new Map<string, number>();
        workouts.forEach(w => {
            w.exercises?.forEach(e => {
                const name = e.exerciseName || e.exerciseId;
                exerciseFrequency.set(name, (exerciseFrequency.get(name) || 0) + 1);
            });
        });
        const bestExercise = Array.from(exerciseFrequency.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

        // 找出最近30天内的 PR
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentPRs = records.filter(r => r.date > thirtyDaysAgo);

        // 按日期排序（最新的在前）
        records.sort((a, b) => b.date - a.date);

        return {
            records,
            totalWorkouts: workouts.length,
            totalWeightLifted,
            heaviestLift,
            bestExercise,
            recentPRs
        };
    }

    /**
     * 找出最大重量 PR
     */
    private static findMaxWeightPR(workouts: WorkoutSession[]): PersonalRecord | null {
        let maxWeight = 0;
        let maxWeightSet: WorkoutSet | null = null;
        let maxWeightExercise: ActiveExercise | null = null;
        let maxWeightDate = 0;

        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                exercise.sets?.forEach(set => {
                    if (set.completed && set.weight > maxWeight) {
                        maxWeight = set.weight;
                        maxWeightSet = set;
                        maxWeightExercise = exercise;
                        maxWeightDate = workout.date;
                    }
                });
            });
        });

        if (!maxWeightSet || !maxWeightExercise) return null;

        return {
            id: `max_weight_${maxWeightDate}`,
            type: 'max_weight',
            title: 'Max Weight',
            value: `${maxWeight} kg`,
            exerciseName: maxWeightExercise.exerciseName,
            muscleGroup: maxWeightExercise.muscleGroup,
            date: maxWeightDate,
            dateFormatted: this.formatDate(maxWeightDate),
            daysAgo: this.calculateDaysAgo(maxWeightDate),
            description: `${maxWeightExercise.exerciseName} × ${maxWeightSet.reps} reps`,
            icon: this.RECORD_ICONS.max_weight,
            color: this.RECORD_COLORS.max_weight
        };
    }

    /**
     * 找出最大 Volume 的训练 PR
     */
    private static findMaxVolumePR(workouts: WorkoutSession[]): PersonalRecord | null {
        let maxVolumeWorkout = workouts[0];

        workouts.forEach(workout => {
            if ((workout.volumeLoad || 0) > (maxVolumeWorkout.volumeLoad || 0)) {
                maxVolumeWorkout = workout;
            }
        });

        if (!maxVolumeWorkout || !maxVolumeWorkout.volumeLoad) return null;

        // 找出当天训练的主要肌肉群（最多显示3个）
        const muscleGroups = [...new Set(maxVolumeWorkout.exercises?.map(e => e.muscleGroup) || [])];
        const primaryMuscle = muscleGroups[0] || '';
        
        // 构建简洁的描述，避免过长
        let muscleDesc: string;
        if (muscleGroups.length === 0) {
            muscleDesc = 'Full Body';
        } else if (muscleGroups.length === 1) {
            muscleDesc = muscleGroups[0];
        } else if (muscleGroups.length <= 3) {
            muscleDesc = muscleGroups.join(' + ');
        } else {
            muscleDesc = `${muscleGroups.slice(0, 2).join(' + ')} +${muscleGroups.length - 2}`;
        }

        return {
            id: `max_volume_${maxVolumeWorkout.date}`,
            type: 'max_volume',
            title: 'Max Volume',
            value: this.formatVolume(maxVolumeWorkout.volumeLoad),
            muscleGroup: primaryMuscle,
            date: maxVolumeWorkout.date,
            dateFormatted: this.formatDate(maxVolumeWorkout.date),
            daysAgo: this.calculateDaysAgo(maxVolumeWorkout.date),
            description: `${muscleDesc} Workout`,
            icon: this.RECORD_ICONS.max_volume,
            color: this.RECORD_COLORS.max_volume
        };
    }

    /**
     * 找出单组最大次数 PR
     */
    private static findMaxRepsPR(workouts: WorkoutSession[]): PersonalRecord | null {
        let maxReps = 0;
        let maxRepsSet: WorkoutSet | null = null;
        let maxRepsExercise: ActiveExercise | null = null;
        let maxRepsDate = 0;

        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                exercise.sets?.forEach(set => {
                    if (set.completed && set.reps > maxReps && set.weight > 0) {
                        maxReps = set.reps;
                        maxRepsSet = set;
                        maxRepsExercise = exercise;
                        maxRepsDate = workout.date;
                    }
                });
            });
        });

        if (!maxRepsSet || !maxRepsExercise) return null;

        return {
            id: `max_reps_${maxRepsDate}`,
            type: 'max_reps',
            title: 'Max Reps',
            value: `${maxReps} reps`,
            exerciseName: maxRepsExercise.exerciseName,
            muscleGroup: maxRepsExercise.muscleGroup,
            date: maxRepsDate,
            dateFormatted: this.formatDate(maxRepsDate),
            daysAgo: this.calculateDaysAgo(maxRepsDate),
            description: `${maxRepsExercise.exerciseName} @ ${maxRepsSet.weight}kg`,
            icon: this.RECORD_ICONS.max_reps,
            color: this.RECORD_COLORS.max_reps
        };
    }

    /**
     * 找出最长训练时间 PR
     */
    private static findLongestWorkoutPR(workouts: WorkoutSession[]): PersonalRecord | null {
        let longestWorkout = workouts[0];

        workouts.forEach(workout => {
            if ((workout.durationMinutes || 0) > (longestWorkout.durationMinutes || 0)) {
                longestWorkout = workout;
            }
        });

        if (!longestWorkout || !longestWorkout.durationMinutes) return null;

        return {
            id: `longest_${longestWorkout.date}`,
            type: 'longest_workout',
            title: 'Longest Workout',
            value: `${longestWorkout.durationMinutes} min`,
            date: longestWorkout.date,
            dateFormatted: this.formatDate(longestWorkout.date),
            daysAgo: this.calculateDaysAgo(longestWorkout.date),
            description: `${longestWorkout.exercises?.length || 0} exercises`,
            icon: this.RECORD_ICONS.longest_workout,
            color: this.RECORD_COLORS.longest_workout
        };
    }

    /**
     * 找出最多组数 PR
     */
    private static findMostSetsPR(workouts: WorkoutSession[]): PersonalRecord | null {
        let mostSetsWorkout = workouts[0];
        let maxSets = 0;

        workouts.forEach(workout => {
            const totalSets = workout.exercises?.reduce((sum, e) => 
                sum + (e.sets?.filter(s => s.completed).length || 0), 0) || 0;
            if (totalSets > maxSets) {
                maxSets = totalSets;
                mostSetsWorkout = workout;
            }
        });

        if (!mostSetsWorkout || maxSets === 0) return null;

        return {
            id: `most_sets_${mostSetsWorkout.date}`,
            type: 'most_sets',
            title: 'Most Sets',
            value: `${maxSets} sets`,
            date: mostSetsWorkout.date,
            dateFormatted: this.formatDate(mostSetsWorkout.date),
            daysAgo: this.calculateDaysAgo(mostSetsWorkout.date),
            description: `${mostSetsWorkout.exercises?.length || 0} exercises`,
            icon: this.RECORD_ICONS.most_sets,
            color: this.RECORD_COLORS.most_sets
        };
    }

    /**
     * 获取历史上某个动作的最大重量（用于 AI 推荐）
     */
    static getExerciseMaxWeight(
        workouts: WorkoutSession[],
        exerciseId?: string,
        exerciseName?: string
    ): { weight: number; reps: number; date: number; daysAgo: number } | null {
        let maxWeight = 0;
        let maxReps = 0;
        let maxDate = 0;

        workouts.forEach(workout => {
            workout.exercises?.forEach(exercise => {
                // 匹配动作
                const isMatch = (exerciseId && exercise.exerciseId === exerciseId) ||
                    (exerciseName && (
                        exercise.exerciseName === exerciseName ||
                        exercise.exerciseNameZh === exerciseName
                    ));

                if (isMatch) {
                    exercise.sets?.forEach(set => {
                        if (set.completed && set.weight > maxWeight) {
                            maxWeight = set.weight;
                            maxReps = set.reps;
                            maxDate = workout.date;
                        }
                    });
                }
            });
        });

        if (maxWeight === 0) return null;

        return {
            weight: maxWeight,
            reps: maxReps,
            date: maxDate,
            daysAgo: this.calculateDaysAgo(maxDate)
        };
    }

    /**
     * 格式化日期
     */
    private static formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * 计算距离今天的天数
     */
    private static calculateDaysAgo(timestamp: number): number {
        const diff = Date.now() - timestamp;
        return Math.floor(diff / (24 * 60 * 60 * 1000));
    }

    /**
     * 格式化 Volume
     * 1000 kg = 1 ton
     */
    private static formatVolume(volume: number): string {
        const tons = volume / 1000;
        if (tons >= 1000) {
            // 超过1000吨，显示为X.Y k ton
            return `${(tons / 1000).toFixed(1)}k ton`;
        }
        if (tons >= 1) {
            // 超过1吨，显示为吨
            return `${tons.toFixed(1)} ton`;
        }
        // 小于1吨，显示为kg
        return `${volume} kg`;
    }
}

export default PersonalRecordService;
