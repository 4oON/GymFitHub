import type { Exercise, WeightInputMode, TrackingMode } from '@/shared/types';

/**
 * Exercise Identification Service
 * 
 * Identifies special exercise types based on exercise names/patterns.
 * Used when full exercise configuration is not available (e.g., backend data).
 */

export interface ExerciseTypeInfo {
    weightInputMode: WeightInputMode;
    trackingMode: TrackingMode;
}

export class ExerciseIdentificationService {
    
    // Time-based exercises (duration tracking)
    private static readonly TIME_BASED_PATTERNS = [
        /dead\s*hang/i,
        /plank/i,
        /wall\s*sit/i,
        /farmers?\s*walk/i,
        /hang/i,
        /hold/i,
        /isometric/i,
    ];

    // Assisted exercises (subtraction mode)
    private static readonly ASSISTED_PATTERNS = [
        /assisted\s*pull\s*up/i,
        /assisted\s*dip/i,
        /assisted\s*chin\s*up/i,
        /machine\s*assisted/i,
        /gravitron/i,
    ];

    // Dumbbell exercises (per side mode)
    private static readonly DUMBBELL_PATTERNS = [
        /dumbbell/i,
    ];

    // Exercises that should NOT use dumbbell_per_side despite having "dumbbell" in name
    private static readonly EXCLUDE_FROM_DUMBBELL_PER_SIDE = [
        /dumbbell\s*pullover/i, // Usually done with one dumbbell, not per-side
    ];

    /**
     * Identify exercise type based on name
     */
    static identifyByName(exerciseName: string): ExerciseTypeInfo {
        const name = exerciseName.toLowerCase();

        // Check for time-based exercises
        if (this.TIME_BASED_PATTERNS.some(pattern => pattern.test(name))) {
            return {
                weightInputMode: 'standard',
                trackingMode: 'duration'
            };
        }

        // Check for assisted exercises
        if (this.ASSISTED_PATTERNS.some(pattern => pattern.test(name))) {
            return {
                weightInputMode: 'assisted_subtraction',
                trackingMode: 'reps'
            };
        }

        // Check for dumbbell exercises
        if (this.DUMBBELL_PATTERNS.some(pattern => pattern.test(name))) {
            // Check if it should be excluded from per-side mode
            const shouldExclude = this.EXCLUDE_FROM_DUMBBELL_PER_SIDE
                .some(pattern => pattern.test(name));

            if (!shouldExclude) {
                return {
                    weightInputMode: 'dumbbell_per_side',
                    trackingMode: 'reps'
                };
            }
        }

        // Default: standard mode
        return {
            weightInputMode: 'standard',
            trackingMode: 'reps'
        };
    }

    /**
     * Get exercise type info with fallback to name-based identification
     */
    static getExerciseTypeInfo(exercise: Exercise | null | undefined): ExerciseTypeInfo {
        if (!exercise) {
            return {
                weightInputMode: 'standard',
                trackingMode: 'reps'
            };
        }

        // If explicit configuration exists, use it
        if (exercise.weightInputMode || exercise.trackingMode) {
            return {
                weightInputMode: exercise.weightInputMode || 'standard',
                trackingMode: exercise.trackingMode || 'reps'
            };
        }

        // Otherwise, identify by name
        return this.identifyByName(exercise.name);
    }

    /**
     * Check if an exercise name matches a time-based pattern
     */
    static isTimeBased(exerciseName: string): boolean {
        return this.TIME_BASED_PATTERNS.some(pattern => pattern.test(exerciseName));
    }

    /**
     * Check if an exercise name matches an assisted pattern
     */
    static isAssisted(exerciseName: string): boolean {
        return this.ASSISTED_PATTERNS.some(pattern => pattern.test(exerciseName));
    }

    /**
     * Check if an exercise name matches a dumbbell pattern
     */
    static isDumbbell(exerciseName: string): boolean {
        return this.DUMBBELL_PATTERNS.some(pattern => pattern.test(exerciseName));
    }
}

export default ExerciseIdentificationService;
