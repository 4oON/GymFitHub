import type { WorkoutSession, ActiveExercise, UserProfile } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { VolumeCalculationService } from '@/features/workout/services/VolumeCalculationService';

/**
 * Advanced Calorie Calculation Service - Version 2.0
 * 
 * Based on latest exercise science research:
 * - ACSM's Guidelines for Exercise Testing and Prescription (2022)
 * - Journal of Sports Medicine and Physical Fitness studies
 * - Metabolic equivalent (MET) values for resistance training
 * 
 * Key Improvements:
 * - Dynamic MET calculation based on training intensity
 * - Compound vs isolation exercise adjustments
 * - Muscle group size coefficients
 * - Training density factors
 * - Individual metabolic variations
 */

// === MET VALUE RESEARCH DATA ===

/**
 * Base MET values for resistance training by intensity
 * Source: ACSM 2022, Ainsworth et al. Compendium of Physical Activities
 */
const BASE_MET_VALUES = {
    // Light intensity (50-65% 1RM, 12-20 reps)
    LIGHT: 3.5,

    // Moderate intensity (65-80% 1RM, 8-12 reps) 
    MODERATE: 5.0,

    // High intensity (80-90% 1RM, 4-8 reps)
    HIGH: 6.5,

    // Very high intensity (90%+ 1RM, 1-4 reps)
    VERY_HIGH: 8.0,

    // Circuit training (minimal rest)
    CIRCUIT: 8.5,

    // Powerlifting/Olympic lifts
    POWERLIFTING: 9.0
};

/**
 * Muscle group size coefficients
 * Larger muscle groups require more energy
 */
const MUSCLE_GROUP_COEFFICIENTS: Record<MuscleGroup, number> = {
    // Large compound muscle groups (higher energy cost)
    [MuscleGroup.QUADS]: 1.3,
    [MuscleGroup.CHEST]: 1.2,
    [MuscleGroup.LATS]: 1.2,
    [MuscleGroup.HAMSTRINGS]: 1.1,
    [MuscleGroup.SHOULDERS]: 1.1,
    [MuscleGroup.GLUTES]: 1.1,

    // Medium muscle groups
    [MuscleGroup.TRAPS]: 1.0,
    [MuscleGroup.ABS]: 1.0,
    [MuscleGroup.LOWER_BACK]: 1.0,

    // Smaller muscle groups (lower energy cost)
    [MuscleGroup.BICEPS]: 0.8,
    [MuscleGroup.TRICEPS]: 0.8,
    [MuscleGroup.CALVES]: 0.7,
    [MuscleGroup.FOREARMS]: 0.6,
    [MuscleGroup.OBLIQUES]: 0.7,

    // Cardio activities
    [MuscleGroup.CARDIO]: 1.5
};

/**
 * Exercise type multipliers
 * Compound movements require more energy than isolation
 */
const EXERCISE_TYPE_MULTIPLIERS = {
    // Multi-joint compound movements
    COMPOUND: 1.2,

    // Single-joint isolation movements  
    ISOLATION: 0.9,

    // Functional/athletic movements
    FUNCTIONAL: 1.3,

    // Machine-based exercises (more stable, less energy)
    MACHINE: 0.85,

    // Free weight exercises
    FREE_WEIGHT: 1.0,

    // Bodyweight exercises
    BODYWEIGHT: 1.1
};

/**
 * Training intensity analysis interface
 */
interface IntensityMetrics {
    averageIntensity: number;        // 0-1 scale based on weight/bodyweight ratio
    trainingDensity: number;         // Sets per minute
    volumeLoad: number;              // Total weight × reps
    restEfficiency: number;          // Rest time optimization factor
    compoundRatio: number;           // Percentage of compound movements
}

/**
 * Individual metabolic factors
 */
interface MetabolicFactors {
    age: number;
    gender: 'male' | 'female';
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
    bodyComposition: number;         // Muscle mass percentage (estimated)
}

/**
 * Analyze training intensity from workout data
 */
const analyzeTrainingIntensity = (
    exercises: ActiveExercise[],
    userProfile: UserProfile,
    sessionDuration: number
): IntensityMetrics => {
    let totalVolume = 0;
    let totalSets = 0;
    let weightedIntensity = 0;
    let compoundCount = 0;

    exercises.forEach(exercise => {
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        // Use VolumeCalculationService for accurate volume calculation
        const exerciseVolume = VolumeCalculationService.calculateActiveExerciseVolume(
            exercise,
            [], // Exercise library not available in this context
            { userBodyweight: userProfile.weight }
        );

        totalVolume += exerciseVolume;
        totalSets += completedSets.length;

        // Calculate weighted intensity for completed sets
        completedSets.forEach(set => {
            const weight = set.weight || 0;
            const volume = weight * (set.reps || 0);
            const intensity = weight / userProfile.weight;
            weightedIntensity += intensity * volume;
        });

        // Identify compound movements (heuristic based on muscle group)
        if (isCompoundMovement(exercise.muscleGroup, exercise.exerciseName)) {
            compoundCount += completedSets.length;
        }
    });

    const averageIntensity = totalVolume > 0 ? weightedIntensity / totalVolume : 0;
    const trainingDensity = sessionDuration > 0 ? totalSets / sessionDuration : 0;
    const compoundRatio = totalSets > 0 ? compoundCount / totalSets : 0;

    // Rest efficiency: optimal density is ~1 set per minute
    const restEfficiency = Math.min(1.0, trainingDensity / 1.0);

    return {
        averageIntensity,
        trainingDensity,
        volumeLoad: totalVolume,
        restEfficiency,
        compoundRatio
    };
};

/**
 * Determine if exercise is compound movement
 */
const isCompoundMovement = (muscleGroup: MuscleGroup, exerciseName: string): boolean => {
    const compoundKeywords = [
        'squat', 'deadlift', 'bench', 'press', 'row', 'pull', 'chin',
        'dip', 'lunge', 'clean', 'snatch', 'thruster', 'burpee'
    ];

    const compoundMuscleGroups = [
        MuscleGroup.CHEST, MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS,
        MuscleGroup.LATS, MuscleGroup.SHOULDERS
    ];

    const nameMatch = compoundKeywords.some(keyword =>
        exerciseName.toLowerCase().includes(keyword)
    );

    const muscleMatch = compoundMuscleGroups.includes(muscleGroup);

    return nameMatch || muscleMatch;
};

/**
 * Calculate dynamic MET value based on training characteristics
 */
const calculateDynamicMET = (
    intensityMetrics: IntensityMetrics,
    exercises: ActiveExercise[]
): number => {
    let baseMET = BASE_MET_VALUES.MODERATE; // Default starting point

    // Adjust based on training intensity
    if (intensityMetrics.averageIntensity >= 1.5) {
        baseMET = BASE_MET_VALUES.VERY_HIGH;
    } else if (intensityMetrics.averageIntensity >= 1.0) {
        baseMET = BASE_MET_VALUES.HIGH;
    } else if (intensityMetrics.averageIntensity >= 0.6) {
        baseMET = BASE_MET_VALUES.MODERATE;
    } else {
        baseMET = BASE_MET_VALUES.LIGHT;
    }

    // Training density adjustment (circuit-style training)
    if (intensityMetrics.trainingDensity > 1.5) {
        baseMET += 1.5; // Circuit training bonus
    } else if (intensityMetrics.trainingDensity > 1.0) {
        baseMET += 0.5; // Moderate density bonus
    }

    // Compound movement bonus
    const compoundBonus = intensityMetrics.compoundRatio * 1.0;
    baseMET += compoundBonus;

    // Muscle group size adjustment
    let muscleGroupAdjustment = 0;
    exercises.forEach(exercise => {
        const coefficient = MUSCLE_GROUP_COEFFICIENTS[exercise.muscleGroup] || 1.0;
        muscleGroupAdjustment += (coefficient - 1.0) * 0.1;
    });
    baseMET += muscleGroupAdjustment;

    // Ensure reasonable bounds
    return Math.max(3.0, Math.min(12.0, baseMET));
};

/**
 * Apply individual metabolic adjustments
 */
const applyMetabolicAdjustments = (
    baseMET: number,
    userProfile: UserProfile,
    metabolicFactors?: Partial<MetabolicFactors>
): number => {
    let adjustedMET = baseMET;

    // Age adjustment (metabolism slows ~2% per decade after 30)
    if (metabolicFactors?.age) {
        const ageAdjustment = metabolicFactors.age > 30
            ? 1 - ((metabolicFactors.age - 30) * 0.002)
            : 1.0;
        adjustedMET *= ageAdjustment;
    }

    // Gender adjustment (males typically 10-15% higher metabolic rate)
    if (metabolicFactors?.gender === 'female') {
        adjustedMET *= 0.9;
    }

    // Fitness level adjustment
    if (metabolicFactors?.fitnessLevel) {
        const fitnessMultipliers = {
            beginner: 0.9,      // Less efficient movement
            intermediate: 1.0,   // Baseline
            advanced: 1.1       // More efficient, but higher intensity capability
        };
        adjustedMET *= fitnessMultipliers[metabolicFactors.fitnessLevel];
    }

    return adjustedMET;
};

/**
 * Main calorie calculation function with advanced MET analysis
 */
export const calculateAdvancedCalories = (
    session: WorkoutSession,
    userProfile: UserProfile,
    metabolicFactors?: Partial<MetabolicFactors>
): number => {
    // Input validation
    const duration = session.durationMinutes || 0;
    const weight = userProfile.weight || 75;

    if (duration <= 0 || weight <= 0 || !session.exercises.length) {
        return 0;
    }

    try {
        // Analyze training characteristics
        const intensityMetrics = analyzeTrainingIntensity(
            session.exercises,
            userProfile,
            duration
        );

        // Calculate dynamic MET value
        const dynamicMET = calculateDynamicMET(intensityMetrics, session.exercises);

        // Apply individual metabolic adjustments
        const adjustedMET = applyMetabolicAdjustments(
            dynamicMET,
            userProfile,
            metabolicFactors
        );

        // Calculate calories: MET × weight(kg) × time(hours)
        const durationHours = duration / 60;
        const calories = adjustedMET * weight * durationHours;

        // Add post-exercise oxygen consumption (EPOC) bonus for high-intensity training
        let epocBonus = 0;
        if (intensityMetrics.averageIntensity > 0.8) {
            epocBonus = calories * 0.15; // 15% EPOC bonus for high-intensity training
        } else if (intensityMetrics.averageIntensity > 0.6) {
            epocBonus = calories * 0.08; // 8% EPOC bonus for moderate-high intensity
        }

        const totalCalories = calories + epocBonus;

        // Ensure result is valid
        return isNaN(totalCalories) || !isFinite(totalCalories)
            ? 0
            : Math.round(totalCalories);

    } catch (error) {
        console.error('Advanced calorie calculation error:', error);
        // Fallback to simple calculation
        return Math.round(5.0 * weight * (duration / 60));
    }
};

/**
 * Legacy simple calorie calculation for backward compatibility
 */
export const calculateSimpleCalories = (
    session: WorkoutSession,
    userProfile: UserProfile
): number => {
    const duration = session.durationMinutes || 0;
    const weight = userProfile.weight || 75;

    if (duration <= 0 || weight <= 0) return 0;

    const met = 5.0; // Fixed MET value
    const calories = met * weight * (duration / 60);

    return isNaN(calories) || !isFinite(calories) ? 0 : Math.round(calories);
};

/**
 * Get calorie calculation breakdown for debugging/display
 */
export const getCalorieBreakdown = (
    session: WorkoutSession,
    userProfile: UserProfile,
    metabolicFactors?: Partial<MetabolicFactors>
): {
    baseMET: number;
    adjustedMET: number;
    intensityMetrics: IntensityMetrics;
    baseCalories: number;
    epocBonus: number;
    totalCalories: number;
} => {
    const duration = session.durationMinutes || 0;
    const weight = userProfile.weight || 75;

    const intensityMetrics = analyzeTrainingIntensity(
        session.exercises,
        userProfile,
        duration
    );

    const baseMET = calculateDynamicMET(intensityMetrics, session.exercises);
    const adjustedMET = applyMetabolicAdjustments(baseMET, userProfile, metabolicFactors);

    const baseCalories = adjustedMET * weight * (duration / 60);

    let epocBonus = 0;
    if (intensityMetrics.averageIntensity > 0.8) {
        epocBonus = baseCalories * 0.15;
    } else if (intensityMetrics.averageIntensity > 0.6) {
        epocBonus = baseCalories * 0.08;
    }

    const totalCalories = baseCalories + epocBonus;

    return {
        baseMET,
        adjustedMET,
        intensityMetrics,
        baseCalories: Math.round(baseCalories),
        epocBonus: Math.round(epocBonus),
        totalCalories: Math.round(totalCalories)
    };
};

/**
 * Export the main calculation function as default
 */
export default calculateAdvancedCalories;