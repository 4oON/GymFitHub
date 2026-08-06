/**
 * Health Data Routes
 *
 * API endpoints for iOS Health data synchronization
 */
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  syncHealthData,
  getHealthHistory,
  getLatestHealthData,
  shouldSyncToday,
  calculateRecommendedWeight,
  getWeightTrend,
  checkHealthSyncAuthorization,
  enableHealthSync,
  disableHealthSync,
  updateAutoSyncSetting,
} from '../services/healthService';
import {
  HealthSyncSchema,
  HealthHistoryQuerySchema,
  validateHealthInput,
} from '../validators/healthValidator';

const router = Router();

/**
 * GET /api/health/authorization
 * 检查用户健康数据同步授权状态
 *
 * Requires authentication
 *
 * Response:
 * - 200: Authorization status
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/authorization', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const authorization = await checkHealthSyncAuthorization(userId);

    return res.json({
      success: true,
      authorization,
    });
  } catch (error) {
    console.error('Check authorization error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check authorization status',
    });
  }
});

/**
 * POST /api/health/enable
 * 启用健康数据同步（用户授权）
 *
 * Requires authentication
 *
 * Response:
 * - 200: Health sync enabled successfully
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    await enableHealthSync(userId);

    // 获取更新后的授权状态
    const authorization = await checkHealthSyncAuthorization(userId);

    return res.json({
      success: true,
      message: 'Health data sync enabled successfully',
      authorization,
    });
  } catch (error) {
    console.error('Enable health sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to enable health data sync',
    });
  }
});

/**
 * POST /api/health/disable
 * 禁用健康数据同步（用户撤销授权）
 *
 * Requires authentication
 *
 * Response:
 * - 200: Health sync disabled successfully
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    await disableHealthSync(userId);

    return res.json({
      success: true,
      message: 'Health data sync disabled successfully',
      enabled: false,
    });
  } catch (error) {
    console.error('Disable health sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to disable health data sync',
    });
  }
});

/**
 * POST /api/health/auto-sync/enable
 * 启用自动同步
 *
 * Requires authentication
 *
 * Response:
 * - 200: Auto sync enabled
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/auto-sync/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    await updateAutoSyncSetting(userId, true);

    return res.json({
      success: true,
      message: 'Auto sync enabled successfully',
      settings: {
        enabled: true,
        lastSync: new Date(),
      },
    });
  } catch (error) {
    console.error('Enable auto sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to enable auto sync',
    });
  }
});

/**
 * POST /api/health/auto-sync/disable
 * 禁用自动同步
 *
 * Requires authentication
 *
 * Response:
 * - 200: Auto sync disabled
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/auto-sync/disable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    await updateAutoSyncSetting(userId, false);

    return res.json({
      success: true,
      message: 'Auto sync disabled successfully',
      settings: {
        enabled: false,
      },
    });
  } catch (error) {
    console.error('Disable auto sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to disable auto sync',
    });
  }
});

/**
 * PUT /api/health/auto-sync
 * 更新自动同步设置
 *
 * Requires authentication
 * Request body: { enabled: boolean }
 *
 * Response:
 * - 200: Auto sync setting updated
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.put('/auto-sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'enabled must be a boolean value',
      });
    }

    await updateAutoSyncSetting(userId, enabled);

    return res.json({
      success: true,
      message: `Auto sync ${enabled ? 'enabled' : 'disabled'} successfully`,
      autoSyncEnabled: enabled,
    });
  } catch (error) {
    console.error('Update auto sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update auto sync setting',
    });
  }
});

/**
 * POST /api/health/sync
 * 同步iOS健康数据
 * 
 * Requires authentication
 * Request body: { weight?, bodyFatPercent?, gender?, syncDate? }
 * 
 * Response:
 * - 200: Health data synced successfully
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 验证输入
    const validation = validateHealthInput(req.body, HealthSyncSchema);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.errors,
      });
    }

    // 同步健康数据
    const result = await syncHealthData(userId, validation.data);

    return res.json({
      success: true,
      message: 'Health data synced successfully',
      healthData: result.healthRecord,
      profileUpdated: result.profileUpdated,
    });
  } catch (error) {
    console.error('Sync health data error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to sync health data',
    });
  }
});

/**
 * GET /api/health/history
 * 获取健康数据历史
 * 
 * Requires authentication
 * Query params: startDate?, endDate?, limit?
 * 
 * Response:
 * - 200: Health data history
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // 验证查询参数
    const validation = validateHealthInput(req.query, HealthHistoryQuerySchema);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.errors,
      });
    }

    const { startDate, endDate, limit } = validation.data;

    // 获取健康数据历史
    const healthData = await getHealthHistory(userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });

    return res.json({
      success: true,
      data: healthData,
      count: healthData.length,
    });
  } catch (error) {
    console.error('Get health history error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve health history',
    });
  }
});

/**
 * GET /api/health/latest
 * 获取最新的健康数据
 * 
 * Requires authentication
 * 
 * Response:
 * - 200: Latest health data
 * - 401: Unauthorized
 * - 404: No health data found
 * - 500: Internal server error
 */
router.get('/latest', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const latestData = await getLatestHealthData(userId);

    if (!latestData) {
      return res.status(404).json({
        error: 'Not found',
        message: 'No health data found. Please sync your health data first.',
      });
    }

    return res.json({
      success: true,
      data: latestData,
    });
  } catch (error) {
    console.error('Get latest health data error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve latest health data',
    });
  }
});

/**
 * GET /api/health/should-sync
 * 检查今天是否需要同步
 * 
 * Requires authentication
 * 
 * Response:
 * - 200: Sync status
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/should-sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const shouldSync = await shouldSyncToday(userId);

    return res.json({
      success: true,
      shouldSync,
      message: shouldSync
        ? 'Health data sync is recommended for today'
        : 'Health data already synced today',
    });
  } catch (error) {
    console.error('Check sync status error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check sync status',
    });
  }
});

/**
 * POST /api/health/calculate-weight
 * 计算推荐的训练重量
 * 
 * Requires authentication
 * Request body: { currentWeight?, bodyFatPercent?, gender?, experienceLevel?, lastWorkoutWeight? }
 * 
 * Response:
 * - 200: Recommended weight calculation
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.post('/calculate-weight', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await calculateRecommendedWeight(userId, req.body);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Calculate weight error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Failed to calculate recommended weight',
    });
  }
});

/**
 * GET /api/health/weight-trend
 * 获取体重趋势分析
 * 
 * Requires authentication
 * Query params: days? (default: 30)
 * 
 * Response:
 * - 200: Weight trend analysis
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get('/weight-trend', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    const trend = await getWeightTrend(userId, days);

    return res.json({
      success: true,
      ...trend,
    });
  } catch (error) {
    console.error('Get weight trend error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve weight trend',
    });
  }
});

export default router;