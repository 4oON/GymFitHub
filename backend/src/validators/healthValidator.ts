/**
 * Health Data Validators
 * 
 * Zod schemas for validating health data inputs
 */
import { z } from 'zod';

/**
 * Schema for syncing health data from iOS Health app
 */
export const HealthSyncSchema = z.object({
    weight: z.number().positive().optional(),
    bodyFatPercent: z.number().min(0).max(100).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    syncDate: z.string().datetime().optional(),
}).refine(
    (data) => data.weight !== undefined || data.bodyFatPercent !== undefined || data.gender !== undefined,
    {
        message: 'At least one health metric (weight, bodyFatPercent, or gender) must be provided',
    }
);

/**
 * Schema for querying health history
 */
export const HealthHistoryQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.coerce.number().int().positive().max(100).optional().default(30),
});

/**
 * Validation helper function
 */
export function validateHealthInput<T>(
    data: unknown,
    schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    } else {
        return { success: false, errors: result.error };
    }
}