/**
 * Health Service
 *
 * Business logic for iOS Health data synchronization and weight calculation
 */
import prisma from '../db/client';
import { HealthDataInput, WeightCalculationInput, WeightCalculationResponse } from '../types/health';

/**
 * 检查用户是否已授权健康数据同步
 */
export async function checkHealthSyncAuthorization(userId: string): Promise<{
    enabled: boolean;
    consented: boolean;
    message?: string;
}> {
    const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
            healthSyncEnabled: true,
            healthSyncConsent: true,
        },
    });

    if (!profile) {
        return {
            enabled: false,
            consented: false,
            message: 'User profile not found',
        };
    }

    if (!profile.healthSyncConsent) {
        return {
            enabled: false,
            consented: false,
            message: 'User has not consented to health data usage',
        };
    }

    if (!profile.healthSyncEnabled) {
        return {
            enabled: false,
            consented: true,
            message: 'Health data sync is disabled',
        };
    }

    return {
        enabled: true,
        consented: true,
    };
}

/**
 * 启用健康数据同步（用户授权）
 */
export async function enableHealthSync(userId: string): Promise<void> {
    await prisma.userProfile.upsert({
        where: { userId },
        update: {
            healthSyncEnabled: true,
            healthSyncConsent: true,
            healthSyncConsentDate: new Date(),
        },
        create: {
            userId,
            healthSyncEnabled: true,
            healthSyncConsent: true,
            healthSyncConsentDate: new Date(),
        },
    });
}

/**
 * 禁用健康数据同步（用户撤销授权）
 */
export async function disableHealthSync(userId: string): Promise<void> {
    const profile = await prisma.userProfile.findUnique({
        where: { userId },
    });

    if (profile) {
        await prisma.userProfile.update({
            where: { userId },
            data: {
                healthSyncEnabled: false,
            },
        });
    }
}

/**
 * 更新自动同步设置
 */
export async function updateAutoSyncSetting(
    userId: string,
    enabled: boolean
): Promise<void> {
    await prisma.userProfile.update({
        where: { userId },
        data: {
            autoSyncEnabled: enabled,
        },
    });
}

/**
 * 同步iOS健康数据到数据库
 * 1. 检查用户授权
 * 2. 保存健康数据历史记录
 * 3. 更新用户profile中的最新数据
 */
export async function syncHealthData(
    userId: string,
    healthData: HealthDataInput
): Promise<{ healthRecord: any; profileUpdated: boolean }> {
    // 检查用户是否已授权
    const authorization = await checkHealthSyncAuthorization(userId);
    if (!authorization.enabled) {
        throw new Error(authorization.message || 'Health data sync is not authorized');
    }
    // 1. 创建健康数据记录
    const healthRecord = await prisma.healthData.create({
        data: {
            userId,
            weight: healthData.weight,
            bodyFatPercent: healthData.bodyFatPercent,
            gender: healthData.gender,
        },
    });

    // 2. 更新用户profile
    const updateData: any = {
        lastHealthSync: new Date(),
    };

    if (healthData.weight !== undefined) {
        updateData.weight = healthData.weight;
    }
    if (healthData.bodyFatPercent !== undefined) {
        updateData.bodyFatPercent = healthData.bodyFatPercent;
    }
    if (healthData.gender !== undefined) {
        updateData.gender = healthData.gender;
    }

    // 检查profile是否存在
    const existingProfile = await prisma.userProfile.findUnique({
        where: { userId },
    });

    let profileUpdated = false;
    if (existingProfile) {
        await prisma.userProfile.update({
            where: { userId },
            data: updateData,
        });
        profileUpdated = true;
    } else {
        // 如果profile不存在，创建一个新的
        await prisma.userProfile.create({
            data: {
                userId,
                ...updateData,
            },
        });
        profileUpdated = true;
    }

    return { healthRecord, profileUpdated };
}

/**
 * 获取用户的健康数据历史
 */
export async function getHealthHistory(
    userId: string,
    options: {
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    } = {}
) {
    const { startDate, endDate, limit = 30 } = options;

    const where: any = { userId };

    if (startDate || endDate) {
        where.syncDate = {};
        if (startDate) {
            where.syncDate.gte = startDate;
        }
        if (endDate) {
            where.syncDate.lte = endDate;
        }
    }

    const healthData = await prisma.healthData.findMany({
        where,
        orderBy: { syncDate: 'desc' },
        take: limit,
    });

    return healthData;
}

/**
 * 获取最新的健康数据
 */
export async function getLatestHealthData(userId: string) {
    const latestData = await prisma.healthData.findFirst({
        where: { userId },
        orderBy: { syncDate: 'desc' },
    });

    return latestData;
}

/**
 * 检查是否需要同步（每天只同步一次）
 */
export async function shouldSyncToday(userId: string): Promise<boolean> {
    const profile = await prisma.userProfile.findUnique({
        where: { userId },
        select: { lastHealthSync: true },
    });

    if (!profile || !profile.lastHealthSync) {
        return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSync = new Date(profile.lastHealthSync);
    lastSync.setHours(0, 0, 0, 0);

    return today.getTime() > lastSync.getTime();
}

/**
 * 计算推荐的训练重量
 * 基于体重、体脂率、性别和经验水平
 */
export async function calculateRecommendedWeight(
    userId: string,
    input: WeightCalculationInput
): Promise<WeightCalculationResponse> {
    // 获取用户profile
    const profile = await prisma.userProfile.findUnique({
        where: { userId },
    });

    if (!profile) {
        throw new Error('User profile not found');
    }

    // 使用输入值或profile中的值
    const currentWeight = input.currentWeight ?? profile.weight ?? 70;
    const bodyFatPercent = input.bodyFatPercent ?? profile.bodyFatPercent ?? 20;
    const gender = input.gender ?? profile.gender ?? 'male';
    const experienceLevel = input.experienceLevel ?? profile.experienceLevel ?? 'beginner';

    // 计算瘦体重 (Lean Body Mass)
    const leanBodyMass = currentWeight * (1 - bodyFatPercent / 100);

    // 基础力量系数（根据性别和经验水平）
    let strengthCoefficient = 1.0;

    if (gender === 'male') {
        switch (experienceLevel) {
            case 'beginner':
                strengthCoefficient = 0.5;
                break;
            case 'intermediate':
                strengthCoefficient = 0.75;
                break;
            case 'advanced':
                strengthCoefficient = 1.0;
                break;
        }
    } else {
        // 女性通常力量系数较低
        switch (experienceLevel) {
            case 'beginner':
                strengthCoefficient = 0.35;
                break;
            case 'intermediate':
                strengthCoefficient = 0.55;
                break;
            case 'advanced':
                strengthCoefficient = 0.75;
                break;
        }
    }

    // 计算推荐重量（基于瘦体重）
    const recommendedWeight = Math.round(leanBodyMass * strengthCoefficient);

    // 如果有上次训练重量，计算变化百分比
    let percentageChange = 0;
    let adjustmentReason = '基于当前体重和体脂率计算';

    if (input.lastWorkoutWeight) {
        percentageChange = ((recommendedWeight - input.lastWorkoutWeight) / input.lastWorkoutWeight) * 100;

        if (percentageChange > 5) {
            adjustmentReason = '体重增加，建议增加训练重量';
        } else if (percentageChange < -5) {
            adjustmentReason = '体重减少，建议降低训练重量';
        } else {
            adjustmentReason = '保持当前训练重量';
        }
    }

    return {
        recommendedWeight,
        adjustmentReason,
        percentageChange: Math.round(percentageChange * 100) / 100,
    };
}

/**
 * 获取体重趋势分析
 */
export async function getWeightTrend(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const healthData = await prisma.healthData.findMany({
        where: {
            userId,
            syncDate: {
                gte: startDate,
            },
            weight: {
                not: null,
            },
        },
        orderBy: { syncDate: 'asc' },
        select: {
            weight: true,
            syncDate: true,
        },
    });

    if (healthData.length < 2) {
        return {
            trend: 'insufficient_data',
            change: 0,
            averageWeight: healthData[0]?.weight ?? 0,
        };
    }

    const weights = healthData.map(d => d.weight!);
    const averageWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const change = lastWeight - firstWeight;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (change > 1) {
        trend = 'increasing';
    } else if (change < -1) {
        trend = 'decreasing';
    }

    return {
        trend,
        change: Math.round(change * 100) / 100,
        averageWeight: Math.round(averageWeight * 100) / 100,
        dataPoints: healthData.length,
    };
}