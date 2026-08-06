import type { Exercise, WorkoutSet, ActiveExercise } from '@/shared/types';
import { ExerciseIdentificationService } from './ExerciseIdentificationService';

/**
 * Volume Calculation Service
 * 
 * Handles special exercise types:
 * 1. Time-based exercises (Dead Hang): volume = bodyweight × duration(seconds)
 * 2. Dumbbell exercises: weight input is per dumbbell, actual weight = input × 2
 * 3. Assisted exercises (Assisted Pull-up): actual weight = bodyweight - assistance
 */

export interface VolumeCalculationOptions {
    userBodyweight?: number; // User's bodyweight in kg for bodyweight/assisted exercises
}

export class VolumeCalculationService {
    private static readonly DEFAULT_BODYWEIGHT = 70; // Default fallback

    /**
     * Get the effective weight for a set based on exercise configuration
     */
    static getEffectiveWeight(
        exercise: Exercise,
        set: WorkoutSet,
        options: VolumeCalculationOptions = {}
    ): number {
        const { userBodyweight = this.DEFAULT_BODYWEIGHT } = options;
        const inputWeight = set.weight || 0;
        
        // Use explicit config or identify by name
        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exercise);
        const weightInputMode = typeInfo.weightInputMode;

        switch (weightInputMode) {
            case 'dumbbell_per_side':
                // User inputs per dumbbell weight, actual is x2
                return inputWeight * 2;

            case 'assisted_subtraction':
                // Actual resistance = bodyweight - assistance weight
                // If input is 0, user is doing bodyweight (no assistance)
                // If input equals bodyweight, user is at 0 load (fully assisted)
                const assistance = inputWeight;
                const actualWeight = Math.max(0, userBodyweight - assistance);
                return actualWeight;

            case 'standard':
            default:
                // Regular weight entry
                return inputWeight;
        }
    }

    /**
     * Get the display value for weight input field
     * For assisted exercises, this converts actual weight back to input
     */
    static getDisplayWeight(
        exercise: Exercise,
        actualWeight: number,
        options: VolumeCalculationOptions = {}
    ): number {
        const { userBodyweight = this.DEFAULT_BODYWEIGHT } = options;
        const weightInputMode = exercise.weightInputMode || 'standard';

        switch (weightInputMode) {
            case 'assisted_subtraction':
                // Convert actual weight back to assistance input
                // assistance = bodyweight - actualWeight
                return Math.max(0, userBodyweight - actualWeight);

            case 'dumbbell_per_side':
            case 'standard':
            default:
                return actualWeight;
        }
    }

    /**
     * Calculate volume for a single set
     */
    static calculateSetVolume(
        exercise: Exercise,
        set: WorkoutSet,
        options: VolumeCalculationOptions = {}
    ): number {
        if (!set.completed) return 0;

        const effectiveWeight = this.getEffectiveWeight(exercise, set, options);
        
        // Use explicit config or identify by name
        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exercise);
        const trackingMode = typeInfo.trackingMode;

        if (trackingMode === 'duration') {
            // For time-based exercises: weight x seconds
            // This represents "weight-seconds" of work
            return effectiveWeight * (set.reps || 0);
        } else {
            // Standard: weight x reps
            return effectiveWeight * (set.reps || 0);
        }
    }

    /**
     * Calculate total volume for an exercise (all completed sets)
     */
    static calculateExerciseVolume(
        exercise: Exercise,
        sets: WorkoutSet[],
        options: VolumeCalculationOptions = {}
    ): number {
        return sets.reduce((total, set) => {
            return total + this.calculateSetVolume(exercise, set, options);
        }, 0);
    }

    /**
     * Calculate total volume for an active workout exercise
     */
    static calculateActiveExerciseVolume(
        activeExercise: ActiveExercise,
        exerciseLibrary: Exercise[],
        options: VolumeCalculationOptions = {}
    ): number {
        const exercise = exerciseLibrary.find(e => e.id === activeExercise.exerciseId);
        if (!exercise) {
            // Fallback to standard calculation if exercise not found
            return activeExercise.sets
                .filter(s => s.completed)
                .reduce((sum, s) => sum + (s.weight * s.reps), 0);
        }

        return this.calculateExerciseVolume(exercise, activeExercise.sets, options);
    }

    /**
     * Calculate volume for a complete workout session
     */
    static calculateWorkoutVolume(
        exercises: ActiveExercise[],
        exerciseLibrary: Exercise[],
        options: VolumeCalculationOptions = {}
    ): number {
        return exercises.reduce((total, activeEx) => {
            return total + this.calculateActiveExerciseVolume(activeEx, exerciseLibrary, options);
        }, 0);
    }

    /**
     * Get input hint text for weight field based on exercise type
     */
    static getWeightInputHint(exercise: Exercise): string {
        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exercise);
        const weightInputMode = typeInfo.weightInputMode;

        switch (weightInputMode) {
            case 'dumbbell_per_side':
                return 'Enter weight of ONE dumbbell. Total will be calculated automatically.';
            case 'assisted_subtraction':
                return 'Enter assistance weight. Actual resistance = Your Bodyweight - Assistance.';
            case 'standard':
            default:
                return '';
        }
    }

    /**
     * Get the label for the reps/duration field
     */
    static getRepsLabel(exercise: Exercise): string {
        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exercise);
        return typeInfo.trackingMode === 'duration' ? 'Sec' : 'Reps';
    }

    /**
     * Get the placeholder for reps/duration field
     */
    static getRepsPlaceholder(exercise: Exercise): string {
        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exercise);
        return typeInfo.trackingMode === 'duration' ? 'Seconds' : 'Reps';
    }

    /**
     * Check if exercise needs bodyweight info
     */
    static needsBodyweight(exercise: Exercise): boolean {
        const typeInfo = ExerciseIdentificationService.getExerciseTypeInfo(exercise);
        const weightInputMode = typeInfo.weightInputMode;
        return weightInputMode === 'assisted_subtraction' || 
               (exercise.equipment === 'Bodyweight' && typeInfo.trackingMode === 'duration');
    }
}

export default VolumeCalculationService;
