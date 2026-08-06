/**
 * Health Data Types
 * 
 * Type definitions for iOS Health data integration
 */

export interface HealthDataInput {
    weight?: number;          // 体重 (kg)
    bodyFatPercent?: number;  // 体脂率 (%)
    gender?: string;          // 性别
}

export interface HealthDataResponse {
    id: string;
    userId: string;
    weight?: number;
    bodyFatPercent?: number;
    gender?: string;
    syncDate: Date;
    dataSource: string;
    createdAt: Date;
}

export interface HealthSyncRequest {
    weight?: number;
    bodyFatPercent?: number;
    gender?: string;
    syncDate?: Date;
}

export interface HealthSyncResponse {
    success: boolean;
    message: string;
    healthData?: HealthDataResponse;
    profileUpdated?: boolean;
}

export interface HealthHistoryQuery {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

export interface HealthHistoryResponse {
    success: boolean;
    data: HealthDataResponse[];
    count: number;
}

export interface WeightCalculationInput {
    currentWeight?: number;
    bodyFatPercent?: number;
    gender?: string;
    experienceLevel?: string;
    lastWorkoutWeight?: number;
}

export interface WeightCalculationResponse {
    recommendedWeight: number;
    adjustmentReason: string;
    percentageChange: number;
}