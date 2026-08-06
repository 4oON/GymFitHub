/**
 * Workout Routes
 * 
 * API endpoints for workout management
 */
import { Router, Response } from 'express';
import prisma from '../db/client';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  validateCreateWorkout,
  validateUpdateWorkout,
} from '../validators/workoutValidator';
import { invalidateSummary } from '../services/trainingSummaryService';

const router = Router();

/**
 * POST /api/workout
 * Create a new workout
 * 
 * Requires authentication
 * Request body: { name, date?, status?, durationMin?, notes?, exercises? }
 * 
 * Response:
 * - 201: Workout created successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Validate input
    const validation = validateCreateWorkout(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.errors,
      });
    }

    const { name, exercises, createdAt, date, durationMin } = req.body;

    // 🆕 防止重复创建 - 检查是否已存在相同的workout
    // 基于: 用户ID + 日期(精确到分钟) + 动作数量 + 总组数
    const workoutDate = date ? new Date(date) : (createdAt ? new Date(createdAt) : new Date());
    const dateKey = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate(), workoutDate.getHours(), workoutDate.getMinutes());
    
    // 计算总组数作为指纹的一部分
    const totalSets = (exercises || []).reduce((sum: number, ex: any) => {
      if (Array.isArray(ex.sets)) {
        return sum + ex.sets.filter((s: any) => s.completed).length;
      }
      return sum + (ex.sets || 0);
    }, 0);

    // 查找最近5分钟内的相似workout
    const fiveMinutesAgo = new Date(dateKey.getTime() - 5 * 60 * 1000);
    const fiveMinutesLater = new Date(dateKey.getTime() + 5 * 60 * 1000);
    
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        userId,
        date: {
          gte: fiveMinutesAgo,
          lte: fiveMinutesLater,
        },
      },
    });

    // 如果找到相似的workout,检查动作数量和总组数是否匹配
    if (existingWorkout) {
      const existingExercises = existingWorkout.exercises as any[];
      const existingTotalSets = (existingExercises || []).reduce((sum: number, ex: any) => {
        if (Array.isArray(ex.sets)) {
          return sum + ex.sets.filter((s: any) => s.completed).length;
        }
        return sum + (ex.sets || 0);
      }, 0);

      // 如果动作数量和总组数都匹配,认为是重复的workout
      if (existingExercises.length === (exercises || []).length && existingTotalSets === totalSets) {
        console.log('⚠️ Duplicate workout detected, returning existing workout:', existingWorkout.id);
        return res.status(200).json({
          success: true,
          workout: existingWorkout,
          message: 'Workout already exists, returning existing record',
        });
      }
    }

    // Create workout with exercises as JSON
    const workout = await prisma.workout.create({
      data: {
        userId,
        name,
        exercises: exercises || [],
        date: workoutDate,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        durationMin: durationMin !== undefined ? durationMin : 0,
      },
    });

    // Invalidate AI training summary cache so the next coach message reflects this workout
    invalidateSummary(userId);

    return res.status(201).json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error('Create workout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create workout',
    });
  }
});

/**
 * GET /api/workout
 * Get all workouts for the current user
 * 
 * Requires authentication
 * Query params: status? (filter by status)
 * 
 * Response:
 * - 200: List of workouts
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Fetch workouts ordered by createdAt (newest first)
    const workouts = await prisma.workout.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      count: workouts.length,
      workouts,
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve workouts',
    });
  }
});

/**
 * GET /api/workout/:id
 * Get a single workout by ID
 * 
 * Requires authentication
 * Only returns workout if it belongs to the current user
 * 
 * Response:
 * - 200: Workout data
 * - 401: Unauthorized
 * - 404: Workout not found or doesn't belong to user
 * - 500: Internal server error
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const workout = await prisma.workout.findFirst({
      where: {
        id,
        userId, // Ensure workout belongs to current user
      },
    });

    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'Workout does not exist or you do not have permission to access it',
      });
    }

    return res.json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error('Get workout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve workout',
    });
  }
});

/**
 * PUT /api/workout/:id
 * Update a workout
 * 
 * Requires authentication
 * Request body: { name?, date?, status?, durationMin?, notes?, exercises? }
 * If exercises array is provided, it will replace all existing exercises
 * 
 * Response:
 * - 200: Workout updated successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Workout not found or doesn't belong to user
 * - 500: Internal server error
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Validate input
    const validation = validateUpdateWorkout(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.errors,
      });
    }

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingWorkout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'Workout does not exist or you do not have permission to update it',
      });
    }

    const { name, description, exercises, date } = req.body;

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (exercises !== undefined) updateData.exercises = exercises;
    if (date !== undefined) updateData.date = new Date(date);

    // Update workout
    const workout = await prisma.workout.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      workout,
      message: 'Workout updated successfully',
    });
  } catch (error) {
    console.error('Update workout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update workout',
    });
  }
});

/**
 * DELETE /api/workout/:id
 * Delete a workout
 * 
 * Requires authentication
 * Cascades to delete all associated exercises
 * 
 * Response:
 * - 200: Workout deleted successfully
 * - 401: Unauthorized
 * - 404: Workout not found or doesn't belong to user
 * - 500: Internal server error
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingWorkout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'Workout does not exist or you do not have permission to delete it',
      });
    }

    // Delete workout (exercises will be cascade deleted)
    await prisma.workout.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    console.error('Delete workout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete workout',
    });
  }
});

/**
 * POST /api/workout/batch-sync
 * 批量同步本地workout数据到后端
 *
 * Requires authentication
 * Request body: { workouts: Array<{ name, description?, exercises, createdAt?, updatedAt? }> }
 *
 * 功能：
 * - 接收多个workout数据
 * - 检查每个workout是否已存在（基于createdAt时间戳）
 * - 只创建不存在的workout，避免重复
 * - 返回同步统计信息
 *
 * Response:
 * - 200: Batch sync completed
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/batch-sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { workouts } = req.body;

    // 验证输入
    if (!Array.isArray(workouts)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'workouts must be an array',
      });
    }

    if (workouts.length === 0) {
      return res.json({
        success: true,
        message: 'No workouts to sync',
        stats: {
          total: 0,
          created: 0,
          skipped: 0,
          failed: 0,
        },
      });
    }

    // 统计信息
    const stats = {
      total: workouts.length,
      created: 0,
      skipped: 0,
      failed: 0,
    };

    const createdWorkouts = [];
    const errors = [];

    // 🆕 获取用户现有的所有workout(包含完整数据用于内容比对)
    const existingWorkouts = await prisma.workout.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        date: true,
        name: true,
        exercises: true,
        durationMin: true,
      },
    });

    // 🆕 辅助函数：计算workout的volume
    const calculateVolume = (exercises: any[]): number => {
      return (exercises || []).reduce((total: number, ex: any) => {
        if (Array.isArray(ex.sets)) {
          return total + ex.sets
            .filter((s: any) => s.completed)
            .reduce((sum: number, s: any) => sum + (s.weight || 0) * (s.reps || 0), 0);
        } else {
          // 旧格式
          return total + (ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0);
        }
      }, 0);
    };

    // 创建严格指纹映射用于快速查找（精确到分钟）
    const existingFingerprints = new Map<string, any>();
    // 🆕 创建宽松指纹映射（同一天相同动作）用于检测脏数据
    const existingLooseFingerprints = new Map<string, any[]>();
    
    existingWorkouts.forEach(w => {
      const exercises = w.exercises as any[];
      const totalSets = (exercises || []).reduce((sum: number, ex: any) => {
        if (Array.isArray(ex.sets)) {
          return sum + ex.sets.filter((s: any) => s.completed).length;
        }
        return sum + (ex.sets || 0);
      }, 0);
      
      const volume = calculateVolume(exercises);
      
      // 生成严格指纹: 日期(精确到分钟) + 动作数量 + 总组数
      const date = w.date ? new Date(w.date) : new Date(w.createdAt);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
      const fingerprint = `${dateKey}|${exercises.length}|${totalSets}`;
      existingFingerprints.set(fingerprint, w);
      
      // 🆕 生成宽松指纹: 日期(精确到天) + 动作ID列表
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const exerciseIds = (exercises || []).map((ex: any) => ex.exerciseId).sort().join(',');
      const looseFingerprint = `${dayKey}|${exerciseIds}`;
      
      if (!existingLooseFingerprints.has(looseFingerprint)) {
        existingLooseFingerprints.set(looseFingerprint, []);
      }
      existingLooseFingerprints.get(looseFingerprint)!.push({ ...w, volume, totalSets });
    });

    // 处理每个workout
    for (let i = 0; i < workouts.length; i++) {
      const workout = workouts[i];

      try {
        // 验证必需字段
        if (!workout.name || !workout.exercises) {
          stats.failed++;
          errors.push({
            index: i,
            error: 'Missing required fields: name and exercises',
            workout: workout.name || 'unnamed',
          });
          continue;
        }

        // 🆕 数据质量验证：过滤掉明显无效的记录
        const workoutVolume = calculateVolume(workout.exercises);
        const workoutSets = (workout.exercises || []).reduce((sum: number, ex: any) => {
          if (Array.isArray(ex.sets)) {
            return sum + ex.sets.filter((s: any) => s.completed).length;
          }
          return sum + (ex.sets || 0);
        }, 0);
        
        // 过滤条件：
        // 1. volume必须大于0（过滤掉误点但无数据的记录）
        // 2. 必须有完成的组数
        // 3. 训练时长必须在合理范围（5分钟到10小时）
        if (workoutVolume <= 0) {
          stats.skipped++;
          console.log(`⚠️ Skipping workout with zero volume: ${workout.name}`);
          continue;
        }
        
        if (workoutSets === 0) {
          stats.skipped++;
          console.log(`⚠️ Skipping workout with no completed sets: ${workout.name}`);
          continue;
        }
        
        const duration = workout.durationMin || 0;
        if (duration < 5 || duration > 600) {
          stats.skipped++;
          console.log(`⚠️ Skipping workout with invalid duration (${duration}min): ${workout.name}`);
          continue;
        }

        // 🆕 生成workout指纹用于去重
        const workoutDate = workout.date ? new Date(workout.date) : (workout.createdAt ? new Date(workout.createdAt) : new Date());
        const dateKey = `${workoutDate.getFullYear()}-${workoutDate.getMonth()}-${workoutDate.getDate()}-${workoutDate.getHours()}-${workoutDate.getMinutes()}`;
        
        const totalSets = (workout.exercises || []).reduce((sum: number, ex: any) => {
          if (Array.isArray(ex.sets)) {
            return sum + ex.sets.filter((s: any) => s.completed).length;
          }
          return sum + (ex.sets || 0);
        }, 0);
        
        const fingerprint = `${dateKey}|${workout.exercises.length}|${totalSets}`;

        // 检查是否已存在相同指纹的workout
        if (existingFingerprints.has(fingerprint)) {
          stats.skipped++;
          console.log(`⚠️ Skipping duplicate workout: ${workout.name} (strict fingerprint: ${fingerprint})`);
          continue;
        }

        // 🆕 检查宽松指纹：同一天相同动作组的重复记录
        const dayKey = `${workoutDate.getFullYear()}-${workoutDate.getMonth()}-${workoutDate.getDate()}`;
        const exerciseIds = (workout.exercises || []).map((ex: any) => ex.exerciseId).sort().join(',');
        const looseFingerprint = `${dayKey}|${exerciseIds}`;
        
        if (existingLooseFingerprints.has(looseFingerprint)) {
          const existingSimilarWorkouts = existingLooseFingerprints.get(looseFingerprint)!;
          // 如果存在相同动作的workout，且现有记录的volume更大，则跳过
          const maxExistingVolume = Math.max(...existingSimilarWorkouts.map(w => w.volume));
          
          if (workoutVolume <= maxExistingVolume * 0.8) { // 如果新记录的volume小于现有最大volume的80%，认为是脏数据
            stats.skipped++;
            console.log(`⚠️ Skipping potentially duplicate workout: ${workout.name} (loose fingerprint: ${looseFingerprint}, volume: ${workoutVolume} vs max: ${maxExistingVolume})`);
            continue;
          }
        }

        // 创建新workout
        const created = await prisma.workout.create({
          data: {
            userId,
            name: workout.name,
            exercises: workout.exercises || [],
            date: workout.date ? new Date(workout.date) : (workout.createdAt ? new Date(workout.createdAt) : new Date()),
            createdAt: workout.createdAt ? new Date(workout.createdAt) : undefined,
            updatedAt: workout.updatedAt ? new Date(workout.updatedAt) : undefined,
          },
        });

        // Invalidate AI training summary cache
        invalidateSummary(userId);

        createdWorkouts.push(created);
        stats.created++;
        
        // 🆕 将新创建的workout指纹添加到映射中,防止后续重复
        existingFingerprints.set(fingerprint, created);
        
        // 🆕 更新宽松指纹映射
        if (!existingLooseFingerprints.has(looseFingerprint)) {
          existingLooseFingerprints.set(looseFingerprint, []);
        }
        existingLooseFingerprints.get(looseFingerprint)!.push({ ...created, volume: workoutVolume, totalSets });

      } catch (error) {
        stats.failed++;
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          workout: workout.name || 'unnamed',
        });
      }
    }

    return res.json({
      success: true,
      message: `Batch sync completed: ${stats.created} created, ${stats.skipped} skipped, ${stats.failed} failed`,
      stats,
      createdWorkouts,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Batch sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to batch sync workouts',
    });
  }
});

/**
 * GET /api/workout/personal-records
 * Get all personal records (PRs) for the user
 * 
 * Returns maximum weight lifted for each exercise
 */
router.get('/personal-records', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    const { getPersonalRecords } = await import('../services/personalRecordService');
    const prs = await getPersonalRecords(userId);
    
    return res.json({
      success: true,
      data: prs,
      count: prs.length,
    });
  } catch (error) {
    console.error('Get personal records error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get personal records',
    });
  }
});

/**
 * GET /api/workout/personal-records/:exerciseId
 * Get personal record for a specific exercise
 */
router.get('/personal-records/:exerciseId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;
    
    const { getExercisePR } = await import('../services/personalRecordService');
    const pr = await getExercisePR(userId, exerciseId);
    
    if (!pr) {
      return res.status(404).json({
        success: false,
        message: 'No personal record found for this exercise',
      });
    }
    
    return res.json({
      success: true,
      data: pr,
    });
  } catch (error) {
    console.error('Get exercise PR error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get exercise personal record',
    });
  }
});

/**
 * GET /api/workout/exercise-history/:exerciseId
 * Get complete history for a specific exercise
 */
router.get('/exercise-history/:exerciseId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;
    
    const { getExerciseHistory } = await import('../services/personalRecordService');
    const history = await getExerciseHistory(userId, exerciseId);
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'No history found for this exercise',
      });
    }
    
    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get exercise history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get exercise history',
    });
  }
});

/**
 * GET /api/workout/muscle-group-prs/:muscleGroup
 * Get personal records for a specific muscle group
 */
router.get('/muscle-group-prs/:muscleGroup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { muscleGroup } = req.params;
    
    const { getMuscleGroupPRs } = await import('../services/personalRecordService');
    const prs = await getMuscleGroupPRs(userId, muscleGroup);
    
    return res.json({
      success: true,
      data: prs,
      count: prs.length,
    });
  } catch (error) {
    console.error('Get muscle group PRs error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get muscle group PRs',
    });
  }
});

export default router;