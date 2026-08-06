/**
 * Workout Validators
 * 
 * Input validation for workout operations using Zod
 */
import { z } from 'zod';

// Workout status enum schema
export const WorkoutStatusSchema = z.enum(['planned', 'in_progress', 'completed']);

// Workout exercise input schema
export const WorkoutExerciseInputSchema = z.object({
  exerciseId: z.string().min(1, 'Exercise ID is required'),
  sets: z.number().int().min(0).optional(),
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  notes: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

// Create workout input schema
export const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  date: z.string().datetime().optional(),
  status: WorkoutStatusSchema.optional(),
  durationMin: z.number().int().min(0, 'Duration must be non-negative').optional(),
  notes: z.string().optional(),
  exercises: z.array(WorkoutExerciseInputSchema).optional(),
});

// Update workout input schema (all fields optional)
export const UpdateWorkoutSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').max(100, 'Name must be less than 100 characters').optional(),
  date: z.string().datetime().optional(),
  status: WorkoutStatusSchema.optional(),
  durationMin: z.number().int().min(0, 'Duration must be non-negative').optional(),
  notes: z.string().optional(),
  exercises: z.array(WorkoutExerciseInputSchema).optional(),
});

// Type inference from schemas
export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;
export type WorkoutExerciseInput = z.infer<typeof WorkoutExerciseInputSchema>;

/**
 * Validate create workout input
 * @param data - Input data to validate
 * @returns Validation result with isValid flag and errors array
 */
export function validateCreateWorkout(data: unknown): { isValid: boolean; errors: string[] } {
  const result = CreateWorkoutSchema.safeParse(data);
  
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  
  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { isValid: false, errors };
}

/**
 * Validate update workout input
 * @param data - Input data to validate
 * @returns Validation result with isValid flag and errors array
 */
export function validateUpdateWorkout(data: unknown): { isValid: boolean; errors: string[] } {
  const result = UpdateWorkoutSchema.safeParse(data);
  
  if (result.success) {
    return { isValid: true, errors: [] };
  }
  
  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { isValid: false, errors };
}