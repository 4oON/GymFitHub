/**
 * Profile Validators
 * 
 * Input validation for profile operations using Zod
 */
import { z } from 'zod';

// Gender enum schema
export const GenderSchema = z.enum(['male', 'female', 'other']);

// Fitness goal enum schema
export const FitnessGoalSchema = z.enum([
  'lose_weight',
  'build_muscle',
  'maintain',
  'improve_endurance',
]);

// Experience level enum schema
export const ExperienceLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
]);

// Create profile input schema
export const CreateProfileSchema = z.object({
  age: z.number().int().min(10).max(120).optional(),
  gender: GenderSchema.optional(),
  weight: z.number().min(20).max(300).optional(),
  height: z.number().min(100).max(250).optional(),
  fitnessGoal: FitnessGoalSchema.optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
});

// Update profile input schema (same as create)
export const UpdateProfileSchema = z.object({
  age: z.number().int().min(10).max(120).optional(),
  gender: GenderSchema.optional(),
  weight: z.number().min(20).max(300).optional(),
  height: z.number().min(100).max(250).optional(),
  fitnessGoal: FitnessGoalSchema.optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
});

// Type inference from schemas
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Validate profile input data
 * @param data - Input data to validate
 * @param schema - Zod schema to use for validation
 * @returns Validation result with parsed data or errors
 */
export function validateProfileInput(
  data: unknown,
  schema: z.ZodSchema = CreateProfileSchema
): { success: boolean; data?: any; errors?: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}