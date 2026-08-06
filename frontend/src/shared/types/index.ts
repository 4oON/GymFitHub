export enum MuscleGroup {
    // Upper Body - Push
    CHEST = 'Chest',
    SHOULDERS = 'Shoulders',
    TRICEPS = 'Triceps',

    // Upper Body - Pull
    LATS = 'Lats',
    TRAPS = 'Traps',
    LOWER_BACK = 'Lower Back',
    BICEPS = 'Biceps',
    FOREARMS = 'Forearms',

    // Core
    ABS = 'Abs',
    OBLIQUES = 'Obliques',

    // Lower Body
    QUADS = 'Quads',
    HAMSTRINGS = 'Hamstrings',
    GLUTES = 'Glutes',
    CALVES = 'Calves',

    // Other
    CARDIO = 'Cardio',
}

export enum ExperienceLevel {
    BEGINNER = 'Beginner',
    INTERMEDIATE = 'Intermediate',
    ADVANCED = 'Advanced'
}

export enum TrainingGoal {
    STRENGTH = 'Strength',
    HYPERTROPHY = 'Hypertrophy',
    ENDURANCE = 'Endurance',
    GENERAL_FITNESS = 'General Fitness'
}

export type MechanicType = 'Compound' | 'Isolation' | 'N/A';

// Weight input mode for exercises
export type WeightInputMode = 
    | 'standard'           // Regular weight entry (barbell, machine weight stack)
    | 'dumbbell_per_side'  // Dumbbell: input is per dumbbell, total = weight × 2
    | 'assisted_subtraction'; // Assisted exercises: actual weight = bodyweight - input

// Tracking mode for exercises
export type TrackingMode = 'reps' | 'duration'; // reps = repetitions, duration = seconds/time

export interface Exercise {
    id: string;
    name: string;
    nameZh?: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    muscle_ids?: string[]; // Detailed muscle IDs from JSON (e.g., "biceps", "triceps", "glutes")
    equipment?: string;
    mechanic?: MechanicType;
    videoUrl?: string;
    gifUrl?: string; // Added for poster
    imageUrl?: string;
    target?: string; // Added for target muscle description
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    isFavorite?: boolean;
    isPrimaryMuscle?: boolean; // NEW: Indicates if the current muscleGroup is the primary target (vs secondary)
    
    // NEW: Input mode configurations
    weightInputMode?: WeightInputMode; // How to interpret weight input
    trackingMode?: TrackingMode; // Whether to track reps or duration (seconds)
}

export interface WorkoutSet {
    id: string;
    weight: number;
    reps: number;
    completed: boolean;
    completedAt?: number;          // NEW: Timestamp when set was completed
    restCompletedAt?: number;      // Timestamp when rest finished for this specific set
    actualRestSeconds?: number;    // Actual rest taken if less than recommended
}

export interface ActiveExercise {
    id: string;
    exerciseId: string;
    exerciseName: string;
    exerciseNameZh?: string;
    muscleGroup: MuscleGroup;
    secondaryMuscles?: MuscleGroup[];
    mechanic?: MechanicType;
    sets: WorkoutSet[];
    recommendedRestSeconds?: number;
    lastRestCompleted?: number;
    createdAt: number;             // Timestamp when exercise was added to session
    startedAt?: number;            // NEW: Timestamp when user first started entering data
    isAIRecommended?: boolean;     // Flag to indicate if exercise was added via AI recommendation
}

export interface WorkoutSession {
    id: string;                    // UUID
    date: number;                  // Timestamp (start time)
    createdAt: number;             // NEW: Timestamp when session was created
    updatedAt?: number;            // NEW: Timestamp when session was last updated
    syncStatus?: 'pending' | 'synced' | 'conflict'; // NEW: Sync status for backend
    exercises: ActiveExercise[];
    durationMinutes?: number;
    volumeLoad: number;
}

export interface Routine {
    id: string;
    name: string;
    exercises: Exercise[]; // The template exercises
    createdAt: number;
    source?: 'user' | 'ai';
}

export interface RecoveryStatus {
    muscle: MuscleGroup;
    lastWorked: number;
    recoveryPercentage: number;
    recoveryDurationHours?: number;  // 新增这一行
}

export interface UserProfile {
    // Existing
    weight: number;
    unit: 'kg' | 'lbs';

    // NEW - Essential
    name?: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Other';
    experienceLevel?: ExperienceLevel;

    // NEW - Highly Useful
    bodyFatPercentage?: number;
    primaryGoal?: TrainingGoal;

    // NEW - Optional
    weeklyTrainingDays?: number;
}

export interface BodyMetricsHistory {
    id: string;
    timestamp: number;
    weight: number;
    unit: 'kg' | 'lbs';
    bodyFatPercentage?: number;
}

export enum AppScreen {
    HOME = 'HOME',
    WORKOUT = 'WORKOUT',
    HISTORY = 'HISTORY',
    EXERCISES = 'EXERCISES',
    SETTINGS = 'SETTINGS'
}

export interface TimerData {
    targetTime: number;
    duration: number;
    startTime: number;
    exerciseName: string;
}

export type TimerState = Record<string, TimerData>;

export interface AiRecommendation {
    exerciseName: string;
    sets: number;
    reps: string;
    weight: string;
    reason: string;
    tip?: string; // Short, punchy instruction (max 10 words)
    popularityRating?: number; // 1-3 stars based on popularity
}

// ============================================
// Weekly Report Types (NEW)
// ============================================

export interface MuscleDistributionData {
    muscle: MuscleGroup;
    totalWeight: number;
    percentage: number;
    sets: number;
    exercises: string[];
}

export interface WeeklyStats {
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalExercises: number;
    totalDuration: number;
    totalCalories: number;
    workoutDays: number;
}

export interface WeeklyProgress {
    volumeChange: number;      // Percentage change from previous week
    setsChange: number;
    repsChange: number;
    prevWeekId?: string;       // Reference to previous week's report ID
}

export interface WeeklyReport {
    id: string;                // UUID
    weekNumber: number;        // Week number in year (1-52)
    year: number;              // Year
    dateRange: {
        start: string;           // "2025-11-24" (Monday)
        end: string;             // "2025-11-30" (Sunday)
    };

    sessions: WorkoutSession[]; // All sessions from this week
    stats: WeeklyStats;
    muscleDistribution: MuscleDistributionData[];
    weeklyProgress?: WeeklyProgress;

    userNotes?: string;        // Optional user notes
    createdAt: number;         // Timestamp when report was generated
    syncStatus?: 'pending' | 'synced';
}

// ============================================
// AI Configuration Types (NEW)
// ============================================

export enum AIProvider {
    PERPLEXITY = 'perplexity',
    KIMI = 'kimi',
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    DEEPSEEK = 'deepseek',
    CUSTOM = 'custom'  // OpenAI Compatible - custom base URL
}

export interface AIModel {
    id: string;
    name: string;
    provider: AIProvider;
    description: string;
    maxTokens?: number;
}

export interface AIConfig {
    provider: AIProvider;
    modelId: string;
    apiKey: string;
    temperature: number;
    enabled: boolean;
    // Custom provider settings
    baseUrl?: string;  // For CUSTOM provider (OpenAI Compatible)
    // Cached models list (fetched from API)
    cachedModels?: Array<{ id: string; name: string }>;
    lastFetchedAt?: number;
}