// iOS健康数据类型定义

export interface HealthData {
    id: string;
    userId: string;
    weight?: number;
    bodyFatPercent?: number;
    gender?: 'male' | 'female' | 'other';
    syncDate: Date;
    createdAt: Date;
}

export interface HealthSyncRequest {
    weight?: number;
    bodyFatPercent?: number;
    gender?: 'male' | 'female' | 'other';
}

export interface HealthAuthorizationStatus {
    isAuthorized: boolean;
    healthSyncEnabled: boolean;
    healthSyncConsent: boolean;
    healthSyncConsentDate?: Date;
    lastHealthSync?: Date;
    autoSyncEnabled: boolean;
}

export interface WeightCalculationInput {
    exerciseName: string;
    currentWeight?: number;
    bodyWeight?: number;
    bodyFatPercent?: number;
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface WeightCalculationResponse {
    recommendedWeight: number;
    minWeight: number;
    maxWeight: number;
    explanation: string;
    factors: {
        bodyWeight?: number;
        bodyFatPercent?: number;
        fitnessLevel?: string;
        exerciseType: string;
    };
}

export interface WeightTrendData {
    date: string;
    weight: number;
    bodyFatPercent?: number;
}

export interface WeightTrendResponse {
    trend: WeightTrendData[];
    summary: {
        averageWeight: number;
        weightChange: number;
        averageBodyFat?: number;
        bodyFatChange?: number;
        period: string;
    };
}

export interface AutoSyncSettings {
    enabled: boolean;
    lastSync?: Date;
}

// API响应类型
export interface HealthAuthorizationResponse {
    success: boolean;
    authorization: HealthAuthorizationStatus;
}

export interface HealthSyncResponse {
    success: boolean;
    data: HealthData;
    message: string;
}

export interface HealthDataListResponse {
    success: boolean;
    data: HealthData[];
    total: number;
}

export interface HealthDataResponse {
    success: boolean;
    data: HealthData;
}

export interface AutoSyncResponse {
    success: boolean;
    settings: AutoSyncSettings;
    message: string;
}