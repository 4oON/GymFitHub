/**
 * Routine Routes
 * 
 * API endpoints for routine (workout template) management
 */
import { Router, Response } from 'express';
import prisma from '../db/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/routine
 * Create a new routine
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { name, description, workouts } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'Routine name is required',
            });
        }

        // Create routine with workouts as JSON
        const routine = await prisma.routine.create({
            data: {
                userId,
                name: name.trim(),
                description: description || null,
                workouts: workouts || [],
            },
        });

        return res.status(201).json({
            success: true,
            routine,
        });
    } catch (error) {
        console.error('Create routine error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create routine',
        });
    }
});

/**
 * GET /api/routine
 * Get all routines for the current user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;

        const routines = await prisma.routine.findMany({
            where: { userId },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return res.json({
            success: true,
            count: routines.length,
            routines,
        });
    } catch (error) {
        console.error('Get routines error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve routines',
        });
    }
});

/**
 * GET /api/routine/:id
 * Get a single routine by ID
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const routine = await prisma.routine.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!routine) {
            return res.status(404).json({
                error: 'Routine not found',
                message: 'Routine does not exist or you do not have permission to access it',
            });
        }

        return res.json({
            success: true,
            routine,
        });
    } catch (error) {
        console.error('Get routine error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve routine',
        });
    }
});

/**
 * PUT /api/routine/:id
 * Update a routine
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { name, description, workouts } = req.body;

        // Check if routine exists and belongs to user
        const existingRoutine = await prisma.routine.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingRoutine) {
            return res.status(404).json({
                error: 'Routine not found',
                message: 'Routine does not exist or you do not have permission to update it',
            });
        }

        // Prepare update data
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (workouts !== undefined) updateData.workouts = workouts;

        // Update routine
        const routine = await prisma.routine.update({
            where: { id },
            data: updateData,
        });

        return res.json({
            success: true,
            routine,
            message: 'Routine updated successfully',
        });
    } catch (error) {
        console.error('Update routine error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to update routine',
        });
    }
});

/**
 * DELETE /api/routine/:id
 * Delete a routine
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        // Check if routine exists and belongs to user
        const existingRoutine = await prisma.routine.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingRoutine) {
            return res.status(404).json({
                error: 'Routine not found',
                message: 'Routine does not exist or you do not have permission to delete it',
            });
        }

        // Delete routine (exercises will be cascade deleted)
        await prisma.routine.delete({
            where: { id },
        });

        return res.json({
            success: true,
            message: 'Routine deleted successfully',
        });
    } catch (error) {
        console.error('Delete routine error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to delete routine',
        });
    }
});

export default router;