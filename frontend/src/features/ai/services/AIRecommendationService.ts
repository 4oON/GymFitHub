import type { Exercise, ActiveExercise, UserProfile, RecoveryStatus } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

export interface WorkoutRecommendation {
    id: string;
    type: 'exercise' | 'rest' | 'intensity' | 'volume';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    reasoning: string;
    suggestedExercises?: Exercise[];
    suggestedSets?: number;
    suggestedReps?: string;
    suggestedWeight?: string;
    restDays?: number;
    targetMuscles?: MuscleGroup[];
}

export interface AIRecommendationContext {
    userProfile: UserProfile;
    currentWorkout: ActiveExercise[];
    recoveryState: RecoveryStatus[];
    recentWorkouts: ActiveExercise[][];
    exerciseLibrary: Exercise[];
    currentDate: Date;
}

/**
 * AI-powered workout recommendation service
 * Provides intelligent suggestions based on user data and workout patterns
 */
export class AIRecommendationService {
    /**
     * Generate comprehensive workout recommendations
     */
    static generateRecommendations(context: AIRecommendationContext): WorkoutRecommendation[] {
        const recommendations: WorkoutRecommendation[] = [];

        // Analyze recovery status
        recommendations.push(...this.analyzeRecoveryRecommendations(context));

        // Analyze workout balance
        recommendations.push(...this.analyzeWorkoutBalance(context));

        // Analyze progression opportunities
        recommendations.push(...this.analyzeProgressionOpportunities(context));

        // Analyze exercise variety
        recommendations.push(...this.analyzeExerciseVariety(context));

        // Sort by priority and return top recommendations
        return recommendations
            .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })
            .slice(0, 8); // Limit to top 8 recommendations
    }

    /**
     * Analyze recovery status and suggest rest or target muscles
     */
    private static analyzeRecoveryRecommendations(context: AIRecommendationContext): WorkoutRecommendation[] {
        const { recoveryState, exerciseLibrary } = context;
        const recommendations: WorkoutRecommendation[] = [];

        // Find well-recovered muscles
        const wellRecoveredMuscles = recoveryState
            .filter(status => {
                const percentage = this.calculateRecoveryPercentage(status.lastWorked, 72);
                return percentage > 85;
            })
            .map(status => status.muscle);

        if (wellRecoveredMuscles.length > 0) {
            const targetMuscle = wellRecoveredMuscles[0];
            const suggestedExercises = exerciseLibrary
                .filter(ex => ex.muscleGroup === targetMuscle)
                .slice(0, 3);

            recommendations.push({
                id: `recovery-${targetMuscle}`,
                type: 'exercise',
                priority: 'high',
                title: `Target ${targetMuscle} Today`,
                description: `Your ${targetMuscle.toLowerCase()} muscles are fully recovered and ready for training`,
                reasoning: `Recovery analysis shows ${targetMuscle} at optimal training readiness`,
                suggestedExercises,
                targetMuscles: [targetMuscle],
                suggestedSets: 3,
                suggestedReps: '8-12'
            });
        }

        // Find overworked muscles
        const overworkedMuscles = recoveryState
            .filter(status => {
                const percentage = this.calculateRecoveryPercentage(status.lastWorked, 72);
                return percentage < 50;
            })
            .map(status => status.muscle);

        if (overworkedMuscles.length > 0) {
            recommendations.push({
                id: 'rest-overworked',
                type: 'rest',
                priority: 'high',
                title: 'Consider Rest Day',
                description: `${overworkedMuscles.join(', ')} need more recovery time`,
                reasoning: 'Overtraining can lead to injury and reduced performance',
                restDays: 1,
                targetMuscles: overworkedMuscles
            });
        }

        return recommendations;
    }

    /**
     * Analyze workout balance (push/pull, upper/lower)
     */
    private static analyzeWorkoutBalance(context: AIRecommendationContext): WorkoutRecommendation[] {
        const { currentWorkout, exerciseLibrary } = context;
        const recommendations: WorkoutRecommendation[] = [];

        if (currentWorkout.length === 0) return recommendations;

        // Analyze push vs pull balance
        const pushMuscles = [MuscleGroup.CHEST, MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS];
        const pullMuscles = [MuscleGroup.LATS, MuscleGroup.TRAPS, MuscleGroup.BICEPS];

        const pushCount = currentWorkout.filter(ex => pushMuscles.includes(ex.muscleGroup)).length;
        const pullCount = currentWorkout.filter(ex => pullMuscles.includes(ex.muscleGroup)).length;

        if (pushCount > pullCount + 1) {
            const pullExercises = exerciseLibrary
                .filter(ex => pullMuscles.includes(ex.muscleGroup))
                .slice(0, 2);

            recommendations.push({
                id: 'balance-pull',
                type: 'exercise',
                priority: 'medium',
                title: 'Add Pull Exercises',
                description: 'Balance your push exercises with pulling movements',
                reasoning: 'Maintaining push-pull balance prevents muscle imbalances',
                suggestedExercises: pullExercises,
                targetMuscles: pullMuscles
            });
        }

        if (pullCount > pushCount + 1) {
            const pushExercises = exerciseLibrary
                .filter(ex => pushMuscles.includes(ex.muscleGroup))
                .slice(0, 2);

            recommendations.push({
                id: 'balance-push',
                type: 'exercise',
                priority: 'medium',
                title: 'Add Push Exercises',
                description: 'Balance your pull exercises with pushing movements',
                reasoning: 'Maintaining push-pull balance prevents muscle imbalances',
                suggestedExercises: pushExercises,
                targetMuscles: pushMuscles
            });
        }

        return recommendations;
    }

    /**
     * Analyze progression opportunities
     */
    private static analyzeProgressionOpportunities(context: AIRecommendationContext): WorkoutRecommendation[] {
        const { currentWorkout, userProfile } = context;
        const recommendations: WorkoutRecommendation[] = [];

        // Suggest compound movements for beginners
        if (userProfile.experienceLevel === 'Beginner') {
            const hasCompound = currentWorkout.some(ex => ex.mechanic === 'Compound');

            if (!hasCompound && currentWorkout.length > 0) {
                recommendations.push({
                    id: 'add-compound',
                    type: 'exercise',
                    priority: 'high',
                    title: 'Add Compound Movement',
                    description: 'Include a compound exercise for maximum muscle activation',
                    reasoning: 'Compound exercises are essential for building strength and muscle mass',
                    suggestedSets: 3,
                    suggestedReps: '5-8'
                });
            }
        }

        // Suggest progressive overload
        if (currentWorkout.length > 2) {
            recommendations.push({
                id: 'progressive-overload',
                type: 'intensity',
                priority: 'medium',
                title: 'Focus on Progressive Overload',
                description: 'Gradually increase weight, reps, or sets from last session',
                reasoning: 'Progressive overload is key to continuous improvement',
                suggestedWeight: '+2.5kg or +1 rep'
            });
        }

        return recommendations;
    }

    /**
     * Analyze exercise variety
     */
    private static analyzeExerciseVariety(context: AIRecommendationContext): WorkoutRecommendation[] {
        const { currentWorkout, exerciseLibrary, recentWorkouts } = context;
        const recommendations: WorkoutRecommendation[] = [];

        // Get exercises used in recent workouts
        const recentExerciseIds = new Set(
            recentWorkouts.flat().map(ex => ex.exerciseId)
        );

        // Find unused exercises for current muscle groups
        const currentMuscles = new Set(currentWorkout.map(ex => ex.muscleGroup));
        const unusedExercises = exerciseLibrary.filter(ex =>
            currentMuscles.has(ex.muscleGroup) && !recentExerciseIds.has(ex.id)
        );

        if (unusedExercises.length > 0 && currentWorkout.length > 0) {
            recommendations.push({
                id: 'exercise-variety',
                type: 'exercise',
                priority: 'low',
                title: 'Try New Exercises',
                description: 'Add variety with different exercises for the same muscle groups',
                reasoning: 'Exercise variety prevents plateaus and keeps workouts engaging',
                suggestedExercises: unusedExercises.slice(0, 3)
            });
        }

        return recommendations;
    }

    /**
     * Calculate recovery percentage
     */
    private static calculateRecoveryPercentage(lastWorked: number, durationHours: number = 72): number {
        if (!lastWorked) return 100;
        const now = Date.now();
        const elapsed = now - lastWorked;
        const durationMs = durationHours * 60 * 60 * 1000;
        return Math.min(100, (elapsed / durationMs) * 100);
    }

    /**
     * Generate quick workout suggestions based on available time
     */
    static generateQuickWorkout(
        timeMinutes: number,
        targetMuscles: MuscleGroup[],
        exerciseLibrary: Exercise[],
        userProfile: UserProfile
    ): WorkoutRecommendation {
        const exercisesPerMuscle = Math.max(1, Math.floor(timeMinutes / 15)); // ~15 min per exercise
        const totalExercises = Math.min(targetMuscles.length * exercisesPerMuscle, 6);

        const suggestedExercises: Exercise[] = [];

        for (const muscle of targetMuscles) {
            const muscleExercises = exerciseLibrary
                .filter(ex => ex.muscleGroup === muscle)
                .slice(0, exercisesPerMuscle);
            suggestedExercises.push(...muscleExercises);
        }

        return {
            id: `quick-workout-${timeMinutes}`,
            type: 'exercise',
            priority: 'high',
            title: `${timeMinutes}-Minute Workout`,
            description: `Efficient workout targeting ${targetMuscles.join(', ')}`,
            reasoning: `Optimized for your available time and target muscles`,
            suggestedExercises: suggestedExercises.slice(0, totalExercises),
            suggestedSets: timeMinutes < 30 ? 2 : 3,
            suggestedReps: userProfile.experienceLevel === 'Beginner' ? '8-12' : '6-10'
        };
    }
}

export default AIRecommendationService;