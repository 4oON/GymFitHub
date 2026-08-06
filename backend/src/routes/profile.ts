/**
 * Profile Routes
 * 
 * API endpoints for user profile management
 */
import { Router, Response } from 'express';
import prisma from '../db/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  CreateProfileSchema,
  UpdateProfileSchema,
  validateProfileInput,
} from '../validators/profileValidator';

const router = Router();

/**
 * POST /api/profile
 * Create user profile
 * 
 * Requires authentication
 * Request body: { age?, gender?, weight?, height?, fitnessGoal?, experienceLevel? }
 * 
 * Response:
 * - 201: Profile created successfully
 * - 400: Validation error or profile already exists
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Validate input using Zod
    const validation = validateProfileInput(req.body, CreateProfileSchema);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.errors,
      });
    }

    // Check if profile already exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return res.status(400).json({
        error: 'Profile already exists',
        message: 'Use PUT /api/profile to update your profile',
      });
    }

    // Create profile
    const profile = await prisma.userProfile.create({
      data: {
        userId,
        ...validation.data,
      },
    });

    return res.status(201).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create profile',
    });
  }
});

/**
 * GET /api/profile/me
 * Get current user's profile
 * 
 * Requires authentication
 * 
 * Response:
 * - 200: Profile data
 * - 401: Unauthorized
 * - 404: Profile not found
 * - 500: Internal server error
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please create a profile first using POST /api/profile',
      });
    }

    return res.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve profile',
    });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 * 
 * Requires authentication
 * Request body: { age?, gender?, weight?, height?, fitnessGoal?, experienceLevel? }
 * 
 * Response:
 * - 200: Profile updated successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Profile not found
 * - 500: Internal server error
 */
router.put('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Validate input using Zod
    const validation = validateProfileInput(req.body, UpdateProfileSchema);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.errors,
      });
    }

    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please create a profile first using POST /api/profile',
      });
    }

    // Update profile
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: validation.data,
    });

    return res.json({
      success: true,
      profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
});

/**
 * DELETE /api/profile
 * Delete user profile
 * 
 * Requires authentication
 * 
 * Response:
 * - 200: Profile deleted successfully
 * - 401: Unauthorized
 * - 404: Profile not found
 * - 500: Internal server error
 */
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'No profile to delete',
      });
    }

    // Delete profile
    await prisma.userProfile.delete({
      where: { userId },
    });

    return res.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete profile',
    });
  }
});

/**
 * GET /api/profile/all
 * Get all user profiles (for admin/testing purposes)
 * 
 * Requires authentication
 * 
 * Response:
 * - 200: List of all profiles
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/all', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const profiles = await prisma.userProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error('Get all profiles error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve profiles',
    });
  }
});

export default router;