/**
 * HealthKit 服务 - Phase 1
 *
 * 通过 cordova-plugin-health 与 Apple Health / Health Connect 交互。
 * 目标：在 iOS 真机上读取用户授权的身体、运动、恢复相关数据，并持久化到本地，
 * 供 AI 训练计划、恢复评估、Dashboard 展示使用。
 *
 * 非 iOS 环境（网页版 / 模拟器无数据时）回退到本地存储或手动输入。
 */

import { Capacitor } from '@capacitor/core';
import { iOSStorage } from '@/services/iOSStorageService';
import type {
  CordovaHealth,
  CordovaHealthSample,
  CordovaHealthQueryOptions,
} from '@/types/cordova-plugin-health';

// 声明文件已位于 src/types/cordova-plugin-health.d.ts

// ===== 数据类型定义 =====

export interface BodyMeasurements {
  weight?: number;            // kg
  height?: number;            // m
  bodyFatPercent?: number;    // 0-100
  bmi?: number;
  leanBodyMass?: number;      // kg, 可能通过计算得出
  waistCircumference?: number; // m
}

export interface HeartData {
  heartRate?: number;                 // count/min
  restingHeartRate?: number;          // count/min
  heartRateVariability?: number;      // ms
  oxygenSaturation?: number;          // 0-100
}

export interface ActivityData {
  steps?: number;
  distance?: number;                  // m
  activeEnergyBurned?: number;        // kcal
  basalEnergyBurned?: number;         // kcal
  appleExerciseTime?: number;         // min
  flightsClimbed?: number;
}

export interface SleepSession {
  startDate: Date;
  endDate: Date;
  stage: string;
}

export interface SleepData {
  sessions?: SleepSession[];
  totalSleepTime?: number;            // minutes
}

export interface NutritionSummary {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  water?: number;
  caffeine?: number;
}

export interface SyncedHealthData {
  body: BodyMeasurements;
  heart: HeartData;
  activity: ActivityData;
  sleep: SleepData;
  nutrition: NutritionSummary;
  // 保留原始最新 sample 的时间戳，便于判断数据新鲜度
  lastSampleDates: Record<string, string | undefined>;
  syncedAt: Date;
}

export interface SyncHealthResult {
  success: boolean;
  data?: SyncedHealthData;
  error?: string;
  authorized: boolean;
}

export interface HealthAuthorizationStatus {
  isAuthorized: boolean;
  readTypes: string[];
  writeTypes: string[];
}

// ===== 配置 =====

const HEALTH_STORAGE_KEY = 'zenfit_health_data';
const HEALTH_AUTH_KEY = 'zenfit_health_authorized';

// 我们请求读取的数据类型（尽量覆盖 AI 制定训练计划所需维度）
const READ_DATA_TYPES: string[] = [
  'weight',
  'height',
  'bmi',
  'fat_percentage',
  'waist_circumference',
  'heart_rate',
  'heart_rate.resting',
  'heart_rate.variability',
  'oxygen_saturation',
  'steps',
  'distance',
  'calories',
  'calories.active',
  'calories.basal',
  'appleExerciseTime',
  'stairs',
  'sleep',
  'temperature',
  'nutrition',
  'nutrition.water',
  'nutrition.calories',
  'nutrition.protein',
  'nutrition.carbs.total',
  'nutrition.fat.total',
  'nutrition.caffeine',
];

// 我们请求写入的数据类型（手动输入时回写 Health）
const WRITE_DATA_TYPES: string[] = [
  'weight',
  'fat_percentage',
  'height',
];

// ===== 工具函数 =====

function waitForCordovaReady(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    if ((window as any).cordova) {
      document.addEventListener('deviceready', () => resolve(), { once: true });
      // fallback: if deviceready already fired, resolve immediately
      setTimeout(() => resolve(), 100);
    } else {
      resolve();
    }
  });
}

function getHealthPlugin(): CordovaHealth | undefined {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return undefined;
  }

  const cordovaHealth = (window as any).cordova?.plugins?.health;
  if (cordovaHealth) {
    console.log('[HealthKit] found window.cordova.plugins.health');
    return cordovaHealth;
  }

  if (navigator.health) {
    console.log('[HealthKit] found navigator.health');
    return navigator.health;
  }

  if ((window as any).plugins?.health) {
    console.log('[HealthKit] found window.plugins.health');
    return (window as any).plugins.health;
  }

  if ((window as any).plugins?.healthkit) {
    console.log('[HealthKit] found window.plugins.healthkit');
    return (window as any).plugins.healthkit;
  }

  if ((window as any).health) {
    console.log('[HealthKit] found window.health');
    return (window as any).health;
  }

  console.warn('[HealthKit] cordova-plugin-health not available. navigator.health:', !!(navigator as any).health, 'window.plugins:', !!(window as any).plugins, 'window.plugins.health:', !!(window as any).plugins?.health, 'cordova.plugins.health:', !!(window as any).cordova?.plugins?.health, 'window.plugins.healthkit:', !!(window as any).plugins?.healthkit);
  return undefined;
}

function promisify<T>(
  fn: (
    success: (result: T) => void,
    error: (err: string) => void
  ) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(
      (result) => resolve(result),
      (err) => reject(new Error(err))
    );
  });
}

function promisifyVoid(
  fn: (success: () => void, error: (err: string) => void) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    fn(() => resolve(), (err) => reject(new Error(err)));
  });
}

function getStartOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getEndOfDay(d: Date): Date {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

function parseNumeric(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function ensureDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function latestSample(samples: CordovaHealthSample[]): CordovaHealthSample | undefined {
  if (!samples || samples.length === 0) return undefined;
  return samples.reduce((latest, current) => {
    const latestDate = ensureDate(latest.endDate)?.getTime() ?? 0;
    const currentDate = ensureDate(current.endDate)?.getTime() ?? 0;
    return currentDate > latestDate ? current : latest;
  });
}

// ===== 服务类 =====

class HealthKitService {
  private initialized = false;
  private available = false;

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  async isAvailable(): Promise<boolean> {
    const plugin = getHealthPlugin();
    if (!plugin) return false;
    try {
      const available = await promisify<boolean>((success, error) =>
        plugin.isAvailable(success, error)
      );
      this.available = available;
      return available;
    } catch (e) {
      console.warn('[HealthKit] isAvailable failed:', e);
      return false;
    }
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return this.available;

    if (!this.isNativePlatform()) {
      console.log('[HealthKit] 非原生平台，HealthKit 不可用');
      this.available = false;
      this.initialized = true;
      return false;
    }

    // Cordova plugins are injected asynchronously after deviceready
    await waitForCordovaReady();
    console.log('[HealthKit] deviceready passed, checking plugin...');

    const available = await this.isAvailable();
    this.initialized = true;
    return available;
  }

  async requestAuthorization(): Promise<boolean> {
    await this.initialize();
    const plugin = getHealthPlugin();
    if (!plugin) {
      console.warn('[HealthKit] plugin 不存在，无法请求授权');
      return false;
    }

    try {
      await promisifyVoid((success, error) =>
        plugin.requestAuthorization(
          { read: READ_DATA_TYPES, write: WRITE_DATA_TYPES },
          success,
          error
        )
      );
      iOSStorage.setItem(HEALTH_AUTH_KEY, 'true');
      return true;
    } catch (e) {
      console.error('[HealthKit] 授权失败:', e);
      iOSStorage.setItem(HEALTH_AUTH_KEY, 'false');
      return false;
    }
  }

  async checkAuthorizationStatus(): Promise<HealthAuthorizationStatus> {
    const authorized = iOSStorage.getItem(HEALTH_AUTH_KEY) === 'true';
    const plugin = getHealthPlugin();
    return {
      isAuthorized: authorized && !!plugin,
      readTypes: READ_DATA_TYPES,
      writeTypes: WRITE_DATA_TYPES,
    };
  }

  private async queryLatest(
    dataType: string,
    date: Date = new Date()
  ): Promise<CordovaHealthSample | undefined> {
    const plugin = getHealthPlugin();
    if (!plugin) return undefined;

    const options: CordovaHealthQueryOptions = {
      dataType,
      startDate: getStartOfDay(new Date(date.getTime() - 90 * 24 * 60 * 60 * 1000)),
      endDate: getEndOfDay(date),
      limit: 1,
    };

    if (dataType === 'sleep') {
      options.sleepSession = true;
    }

    try {
      const results = await promisify<CordovaHealthSample[]>((success, error) =>
        plugin.query(options, success, error)
      );
      return latestSample(results);
    } catch (e) {
      console.warn(`[HealthKit] query ${dataType} failed:`, e);
      return undefined;
    }
  }

  private async querySleepSessions(
    date: Date = new Date()
  ): Promise<SleepSession[] | undefined> {
    const plugin = getHealthPlugin();
    if (!plugin) return undefined;

    const options: CordovaHealthQueryOptions = {
      dataType: 'sleep',
      startDate: new Date(date.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: getEndOfDay(date),
      limit: 100,
      sleepSession: true,
    };

    try {
      const results = await promisify<CordovaHealthSample[]>((success, error) =>
        plugin.query(options, success, error)
      );
      return results
        .map((r) => ({
          startDate: ensureDate(r.startDate) ?? new Date(),
          endDate: ensureDate(r.endDate) ?? new Date(),
          stage: String(r.value ?? 'unknown'),
        }))
        .filter((s) => s.stage !== 'inBed' && s.stage !== 'awake');
    } catch (e) {
      console.warn('[HealthKit] query sleep failed:', e);
      return undefined;
    }
  }

  private async queryNutritionSummary(
    date: Date = new Date()
  ): Promise<NutritionSummary> {
    const plugin = getHealthPlugin();
    const summary: NutritionSummary = {};
    if (!plugin) return summary;

    const types: Array<{ type: string; key: keyof NutritionSummary }> = [
      { type: 'nutrition.calories', key: 'calories' },
      { type: 'nutrition.protein', key: 'protein' },
      { type: 'nutrition.carbs.total', key: 'carbs' },
      { type: 'nutrition.fat.total', key: 'fat' },
      { type: 'nutrition.water', key: 'water' },
      { type: 'nutrition.caffeine', key: 'caffeine' },
    ];

    for (const { type, key } of types) {
      try {
        const sample = await this.queryLatest(type, date);
        if (sample?.value !== undefined) {
          summary[key] = parseNumeric(sample.value);
        }
      } catch (e) {
        console.warn(`[HealthKit] query ${type} failed:`, e);
      }
    }

    return summary;
  }

  async syncAllHealthData(date: Date = new Date()): Promise<SyncHealthResult> {
    await this.initialize();
    const plugin = getHealthPlugin();
    if (!plugin) {
      return {
        success: false,
        error: 'Health plugin 不可用',
        authorized: false,
      };
    }

    const status = await this.checkAuthorizationStatus();
    if (!status.isAuthorized) {
      return {
        success: false,
        error: '尚未获得 HealthKit 授权',
        authorized: false,
      };
    }

    try {
      const lastSampleDates: Record<string, string | undefined> = {};

      // Body measurements
      const weightSample = await this.queryLatest('weight', date);
      const heightSample = await this.queryLatest('height', date);
      const bmiSample = await this.queryLatest('bmi', date);
      const fatSample = await this.queryLatest('fat_percentage', date);
      const waistSample = await this.queryLatest('waist_circumference', date);

      const weight = parseNumeric(weightSample?.value);
      const height = parseNumeric(heightSample?.value);
      const bodyFatPercent = parseNumeric(fatSample?.value);

      let bmi = parseNumeric(bmiSample?.value);
      if (!bmi && weight && height) {
        bmi = weight / (height * height);
      }

      let leanBodyMass: number | undefined;
      if (weight && bodyFatPercent !== undefined) {
        leanBodyMass = weight * (1 - bodyFatPercent / 100);
      }

      const body: BodyMeasurements = {
        weight,
        height,
        bodyFatPercent,
        bmi,
        leanBodyMass,
        waistCircumference: parseNumeric(waistSample?.value),
      };

      lastSampleDates.weight = weightSample?.endDate?.toISOString?.();
      lastSampleDates.height = heightSample?.endDate?.toISOString?.();
      lastSampleDates.bmi = bmiSample?.endDate?.toISOString?.();
      lastSampleDates.fat_percentage = fatSample?.endDate?.toISOString?.();

      // Heart
      const hrSample = await this.queryLatest('heart_rate', date);
      const restingHrSample = await this.queryLatest('heart_rate.resting', date);
      const hrvSample = await this.queryLatest('heart_rate.variability', date);
      const spo2Sample = await this.queryLatest('oxygen_saturation', date);

      const heart: HeartData = {
        heartRate: parseNumeric(hrSample?.value),
        restingHeartRate: parseNumeric(restingHrSample?.value),
        heartRateVariability: parseNumeric(hrvSample?.value),
        oxygenSaturation: parseNumeric(spo2Sample?.value),
      };

      // Activity
      const stepsSample = await this.queryLatest('steps', date);
      const distanceSample = await this.queryLatest('distance', date);
      const activeCalSample = await this.queryLatest('calories.active', date);
      const basalCalSample = await this.queryLatest('calories.basal', date);
      const exerciseTimeSample = await this.queryLatest('appleExerciseTime', date);
      const stairsSample = await this.queryLatest('stairs', date);

      const activity: ActivityData = {
        steps: parseNumeric(stepsSample?.value),
        distance: parseNumeric(distanceSample?.value),
        activeEnergyBurned: parseNumeric(activeCalSample?.value),
        basalEnergyBurned: parseNumeric(basalCalSample?.value),
        appleExerciseTime: parseNumeric(exerciseTimeSample?.value),
        flightsClimbed: parseNumeric(stairsSample?.value),
      };

      // Sleep
      const sleepSessions = await this.querySleepSessions(date);
      const totalSleepTime = sleepSessions?.reduce(
        (sum, s) => sum + (s.endDate.getTime() - s.startDate.getTime()) / (1000 * 60),
        0
      );

      const sleep: SleepData = {
        sessions: sleepSessions,
        totalSleepTime,
      };

      // Nutrition
      const nutrition = await this.queryNutritionSummary(date);

      const syncedData: SyncedHealthData = {
        body,
        heart,
        activity,
        sleep,
        nutrition,
        lastSampleDates,
        syncedAt: new Date(),
      };

      iOSStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(syncedData));

      return {
        success: true,
        data: syncedData,
        authorized: true,
      };
    } catch (e) {
      console.error('[HealthKit] syncAllHealthData failed:', e);
      return {
        success: false,
        error: e instanceof Error ? e.message : '同步健康数据失败',
        authorized: true,
      };
    }
  }

  async getCachedHealthData(): Promise<SyncedHealthData | undefined> {
    try {
      const saved = iOSStorage.getItem(HEALTH_STORAGE_KEY);
      if (!saved) return undefined;
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        syncedAt: new Date(parsed.syncedAt),
      } as SyncedHealthData;
    } catch (e) {
      console.error('[HealthKit] 读取本地缓存失败:', e);
      return undefined;
    }
  }

  async saveWeight(weight: number, date: Date = new Date()): Promise<boolean> {
    const plugin = getHealthPlugin();
    const cached = await this.getCachedHealthData();
    const updated: SyncedHealthData = {
      ...(cached ?? {
        body: {},
        heart: {},
        activity: {},
        sleep: {},
        nutrition: {},
        lastSampleDates: {},
      } as unknown as SyncedHealthData),
      body: { ...(cached?.body ?? {}), weight },
      syncedAt: new Date(),
    };
    iOSStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(updated));

    if (plugin) {
      try {
        await promisifyVoid((success, error) =>
          plugin.store(
            { dataType: 'weight', value: weight, startDate: date, endDate: date },
            success,
            error
          )
        );
      } catch (e) {
        console.warn('[HealthKit] 写入体重到 Health 失败:', e);
      }
    }

    return true;
  }

  async saveBodyFat(percentage: number, date: Date = new Date()): Promise<boolean> {
    const plugin = getHealthPlugin();
    const cached = await this.getCachedHealthData();
    const updated: SyncedHealthData = {
      ...(cached ?? {
        body: {},
        heart: {},
        activity: {},
        sleep: {},
        nutrition: {},
        lastSampleDates: {},
      } as unknown as SyncedHealthData),
      body: { ...(cached?.body ?? {}), bodyFatPercent: percentage },
      syncedAt: new Date(),
    };
    iOSStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(updated));

    if (plugin) {
      try {
        await promisifyVoid((success, error) =>
          plugin.store(
            { dataType: 'fat_percentage', value: percentage, startDate: date, endDate: date },
            success,
            error
          )
        );
      } catch (e) {
        console.warn('[HealthKit] 写入体脂率到 Health 失败:', e);
      }
    }

    return true;
  }

  async saveHeight(height: number, date: Date = new Date()): Promise<boolean> {
    const plugin = getHealthPlugin();
    const cached = await this.getCachedHealthData();
    const updated: SyncedHealthData = {
      ...(cached ?? {
        body: {},
        heart: {},
        activity: {},
        sleep: {},
        nutrition: {},
        lastSampleDates: {},
      } as unknown as SyncedHealthData),
      body: { ...(cached?.body ?? {}), height },
      syncedAt: new Date(),
    };
    iOSStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(updated));

    if (plugin) {
      try {
        await promisifyVoid((success, error) =>
          plugin.store(
            { dataType: 'height', value: height, startDate: date, endDate: date },
            success,
            error
          )
        );
      } catch (e) {
        console.warn('[HealthKit] 写入身高到 Health 失败:', e);
      }
    }

    return true;
  }

  async openHealthSettings(): Promise<void> {
    const plugin = getHealthPlugin();
    if (!plugin) return;
    await promisifyVoid((success, error) => plugin.openHealthSettings(success, error));
  }
}

export const healthKitService = new HealthKitService();
export default healthKitService;
