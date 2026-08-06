// Workout Types for ZenFit Backend
// Defines TypeScript interfaces for workout-related data structures

export type WorkoutStatus = 'planned' | 'in_progress' | 'completed';

export interface CreateWorkoutExerciseInput {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  order?: number;
}

export interface CreateWorkoutInput {
  name: string;
  date?: string; // ISO date string
  status?: WorkoutStatus;
  durationMin?: number;
  notes?: string;
  exercises?: CreateWorkoutExerciseInput[];
}

export interface UpdateWorkoutInput {
  name?: string;
  date?: string; // ISO date string
  status?: WorkoutStatus;
  durationMin?: number;
  notes?: string;
  exercises?: CreateWorkoutExerciseInput[];
}

export interface WorkoutExerciseResponse {
  id: string;
  workoutId: string;
  exerciseId: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  notes: string | null;
  order: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutResponse {
  id: string;
  userId: string;
  name: string;
  date: Date;
  status: string;
  durationMin: number | null;
  notes: string | null;
  exercises?: WorkoutExerciseResponse[];
  createdAt: Date;
  updatedAt: Date;
}