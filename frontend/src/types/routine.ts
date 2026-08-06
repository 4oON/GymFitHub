/**
 * Routine API Types
 * 
 * Type definitions for routine-related API requests and responses
 */

export interface RoutineExercise {
    id: string;
    exerciseId: string;
    exerciseName: string;
    order: number;
    createdAt: string;
}

export interface BackendRoutine {
    id: string;
    userId: string;
    name: string;
    description?: string | null;
    exercises: RoutineExercise[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoutineInput {
    name: string;
    description?: string;
    exercises: Array<{
        exerciseId: string;
        exerciseName: string;
        order?: number;
    }>;
}

export interface UpdateRoutineInput {
    name?: string;
    description?: string;
    exercises?: Array<{
        exerciseId: string;
        exerciseName: string;
        order?: number;
    }>;
}

export interface GetRoutinesResponse {
    success: boolean;
    count: number;
    routines: BackendRoutine[];
}

export interface GetRoutineResponse {
    success: boolean;
    routine: BackendRoutine;
}

export interface CreateRoutineResponse {
    success: boolean;
    routine: BackendRoutine;
}

export interface UpdateRoutineResponse {
    success: boolean;
    routine: BackendRoutine;
    message: string;
}

export interface DeleteRoutineResponse {
    success: boolean;
    message: string;
}