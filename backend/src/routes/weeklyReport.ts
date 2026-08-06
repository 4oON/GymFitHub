import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { invalidateSummary } from '../services/trainingSummaryService';

const router = Router();
const prisma = new PrismaClient();

// 获取用户的所有周报告
router.get('/api/weekly-reports', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const reports = await prisma.weeklyReport.findMany({
            where: { userId },
            orderBy: [
                { year: 'desc' },
                { weekNumber: 'desc' }
            ]
        });

        return res.json(reports);
    } catch (error) {
        console.error('Failed to fetch weekly reports:', error);
        return res.status(500).json({ error: 'Failed to fetch weekly reports' });
    }
});

// 获取特定周的报告
router.get('/api/weekly-reports/:year/:weekNumber', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const year = parseInt(req.params.year);
        const weekNumber = parseInt(req.params.weekNumber);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const report = await prisma.weeklyReport.findUnique({
            where: {
                userId_year_weekNumber: {
                    userId,
                    year,
                    weekNumber
                }
            }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        return res.json(report);
    } catch (error) {
        console.error('Failed to fetch weekly report:', error);
        return res.status(500).json({ error: 'Failed to fetch weekly report' });
    }
});

// 创建或更新周报告
router.post('/api/weekly-reports', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            weekNumber,
            year,
            dateRangeStart,
            dateRangeEnd,
            stats,
            muscleDistribution,
            weeklyProgress,
            sessions
        } = req.body;

        // 验证必填字段
        if (!weekNumber || !year || !dateRangeStart || !dateRangeEnd || !stats || !muscleDistribution || !sessions) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 使用 upsert 来创建或更新
        const report = await prisma.weeklyReport.upsert({
            where: {
                userId_year_weekNumber: {
                    userId,
                    year,
                    weekNumber
                }
            },
            update: {
                dateRangeStart,
                dateRangeEnd,
                stats,
                muscleDistribution,
                weeklyProgress,
                sessions,
                updatedAt: new Date()
            },
            create: {
                userId,
                weekNumber,
                year,
                dateRangeStart,
                dateRangeEnd,
                stats,
                muscleDistribution,
                weeklyProgress,
                sessions
            }
        });

        // Invalidate AI training summary cache so the coach sees fresh weekly data
        invalidateSummary(userId);

        return res.json(report);
    } catch (error) {
        console.error('Failed to save weekly report:', error);
        return res.status(500).json({ error: 'Failed to save weekly report' });
    }
});

// 批量同步周报告
router.post('/api/weekly-reports/batch-sync', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { reports } = req.body;

        if (!Array.isArray(reports)) {
            return res.status(400).json({ error: 'Reports must be an array' });
        }

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const report of reports) {
            try {
                const {
                    weekNumber,
                    year,
                    dateRange,
                    stats,
                    muscleDistribution,
                    weeklyProgress,
                    sessions
                } = report;

                // 检查是否已存在
                const existing = await prisma.weeklyReport.findUnique({
                    where: {
                        userId_year_weekNumber: {
                            userId,
                            year,
                            weekNumber
                        }
                    }
                });

                await prisma.weeklyReport.upsert({
                    where: {
                        userId_year_weekNumber: {
                            userId,
                            year,
                            weekNumber
                        }
                    },
                    update: {
                        dateRangeStart: dateRange.start,
                        dateRangeEnd: dateRange.end,
                        stats,
                        muscleDistribution,
                        weeklyProgress,
                        sessions,
                        updatedAt: new Date()
                    },
                    create: {
                        userId,
                        weekNumber,
                        year,
                        dateRangeStart: dateRange.start,
                        dateRangeEnd: dateRange.end,
                        stats,
                        muscleDistribution,
                        weeklyProgress,
                        sessions
                    }
                });

                if (existing) {
                    results.updated++;
                } else {
                    results.created++;
                }

                // Invalidate AI training summary cache
                invalidateSummary(userId);
            } catch (error) {
                results.failed++;
                results.errors.push(`Week ${report.weekNumber}, ${report.year}: ${error}`);
            }
        }

        return res.json(results);
    } catch (error) {
        console.error('Failed to batch sync weekly reports:', error);
        return res.status(500).json({ error: 'Failed to batch sync weekly reports' });
    }
});

// 删除周报告
router.delete('/api/weekly-reports/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const reportId = req.params.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // 确保用户只能删除自己的报告
        const report = await prisma.weeklyReport.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        if (report.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.weeklyReport.delete({
            where: { id: reportId }
        });

        return res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Failed to delete weekly report:', error);
        return res.status(500).json({ error: 'Failed to delete weekly report' });
    }
});

// 手动触发周报告生成（用于测试或生成历史报告）
router.post('/api/weekly-reports/generate/:userId/:year/:weekNumber', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { userId, year, weekNumber } = req.params;
        const requestingUserId = req.user?.userId;

        // 确保用户只能为自己生成报告
        if (userId !== requestingUserId) {
            return res.status(403).json({ error: 'Can only generate reports for yourself' });
        }

        const { manuallyGenerateReport } = await import('../services/weeklyReportAutoGenService');
        
        const result = await manuallyGenerateReport(
            userId,
            parseInt(year),
            parseInt(weekNumber)
        );

        if (result.success) {
            return res.json({ message: result.message });
        } else {
            return res.status(400).json({ error: result.message });
        }
    } catch (error) {
        console.error('Failed to manually generate report:', error);
        return res.status(500).json({ error: 'Failed to generate report' });
    }
});

// 获取当前用户的报告生成状态
router.get('/api/weekly-reports/status/:userId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const requestingUserId = req.user?.userId;

        if (userId !== requestingUserId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const now = new Date();
        const currentWeek = getWeekInfo(now);
        
        // 获取上一周的信息
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekInfo = getWeekInfo(lastWeek);

        // 检查是否有当前周和上周的报告
        const [currentWeekReport, lastWeekReport] = await Promise.all([
            prisma.weeklyReport.findUnique({
                where: {
                    userId_year_weekNumber: {
                        userId,
                        year: currentWeek.year,
                        weekNumber: currentWeek.weekNumber
                    }
                }
            }),
            prisma.weeklyReport.findUnique({
                where: {
                    userId_year_weekNumber: {
                        userId,
                        year: lastWeekInfo.year,
                        weekNumber: lastWeekInfo.weekNumber
                    }
                }
            })
        ]);

        // 获取该用户的训练数量
        const workoutCount = await prisma.workout.count({
            where: { userId }
        });

        return res.json({
            currentWeek: {
                year: currentWeek.year,
                weekNumber: currentWeek.weekNumber,
                hasReport: !!currentWeekReport
            },
            lastWeek: {
                year: lastWeekInfo.year,
                weekNumber: lastWeekInfo.weekNumber,
                hasReport: !!lastWeekReport
            },
            totalWorkouts: workoutCount,
            canGenerateLastWeek: !lastWeekReport && workoutCount > 0
        });
    } catch (error) {
        console.error('Failed to get report status:', error);
        return res.status(500).json({ error: 'Failed to get report status' });
    }
});

// 辅助函数：获取ISO周信息
function getWeekInfo(date: Date): { year: number; weekNumber: number } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return {
        year: d.getFullYear(),
        weekNumber
    };
}

export default router;
