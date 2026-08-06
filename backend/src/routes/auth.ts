import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { hashPassword, verifyPassword, generateToken } from '../utils/auth';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 *
 * Request body:
 * - email: string (required, must contain @)
 * - password: string (required, min 6 characters)
 *
 * Response:
 * - 201: User created successfully with JWT token
 * - 400: Invalid email or password format
 * - 409: Email already registered
 * - 500: Internal server error
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 *
 * Request body:
 * - email: string (required)
 * - password: string (required)
 *
 * Response:
 * - 200: Login successful with JWT token
 * - 400: Missing email or password
 * - 401: Invalid credentials
 * - 500: Internal server error
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user information
 *
 * Headers:
 * - Authorization: Bearer <token> (required)
 *
 * Response:
 * - 200: User information
 * - 401: Unauthorized (no token or invalid token)
 * - 500: Internal server error
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    // req.user is set by authMiddleware
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/users
 * Get all registered users
 *
 * Response:
 * - 200: Array of users (ordered by createdAt desc)
 * - 500: Internal server error
 */
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
