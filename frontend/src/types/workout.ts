// Workout Status Type
export type WorkoutStatus = 'planned' | 'in_progress' | 'completed';

// Workout Exercise Interface
export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Workout Interface
export interface Workout {
  id: string;
  userId: string;
  name: string;
  date: Date;
  status: WorkoutStatus;
  durationMin?: number;
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

// Create Workout Exercise Input
export interface CreateWorkoutExerciseInput {
  exerciseId: string;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  order?: number;
}

// Create Workout Input
export interface CreateWorkoutInput {
  name: string;
  date?: string; // ISO date string
  status?: WorkoutStatus;
  durationMin?: number;
  notes?: string;
  exercises?: CreateWorkoutExerciseInput[];
}

// Update Workout Input (all fields optional)
export interface UpdateWorkoutInput {
  name?: string;
  date?: string; // ISO date string
  status?: WorkoutStatus;
  durationMin?: number;
  notes?: string;
  exercises?: CreateWorkoutExerciseInput[];
}

// API Response Types
export interface GetWorkoutsResponse {
  success: boolean;
  workouts: Workout[];
}

export interface GetWorkoutResponse {
  success: boolean;
  workout: Workout;
}

export interface CreateWorkoutResponse {
  success: boolean;
  workout: Workout;
}

export interface UpdateWorkoutResponse {
  success: boolean;
  workout: Workout;
}

export interface DeleteWorkoutResponse {
  success: boolean;
}