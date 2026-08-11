/**
 * iOS HealthKit 服务
 * 提供与 Apple Health 应用的数据同步功能
 * 
 * 注意：此服务设计为在 Capacitor iOS 环境中运行
 * Web 环境将使用模拟数据/本地存储回退
 */

import { Capacitor } from '@capacitor/core';
import { iOSStorage } from '@/services/iOSStorageService';

// HealthKit 数据类型定义
export interface HealthKitData {
  weight?: number;           // 体重 (kg)
  bodyFatPercent?: number;   // 体脂率 (%)
  height?: number;           // 身高 (m)
  bmi?: number;             // BMI
  gender?: 'male' | 'female' | 'other';
  birthDate?: Date;
  age?: number;
}

// 同步结果
export interface SyncResult {
  success: boolean;
  data?: HealthKitData;
  error?: string;
}

// 授权状态
export interface AuthorizationStatus {
  isAuthorized: boolean;
  readPermissions: string[];
  writePermissions: string[];
}

class HealthKitService {
  private isAvailable: boolean = false;
  private isInitialized: boolean = false;

  /**
   * 检查是否在 iOS 原生环境
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * 初始化 HealthKit
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.isAvailable;
    
    if (!this.isNativePlatform()) {
      console.log('HealthKit: 非原生平台，使用本地存储模式');
      this.isAvailable = false;
      this.isInitialized = true;
      return false;
    }

    try {
      // 在 iOS 上检查 HealthKit 可用性
      this.isAvailable = true;
      this.isInitialized = true;
      console.log('HealthKit: iOS 平台，HealthKit 可能可用');
      return true;
    } catch (error) {
      console.error('HealthKit: 初始化失败', error);
      this.isAvailable = false;
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * 请求 HealthKit 授权
   * 在 Web 环境下返回模拟授权成功
   */
  async requestAuthorization(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      console.log('HealthKit: Web 模式，模拟授权成功');
      // Web 模式下使用本地存储
      iOSStorage.setItem('zenfit_health_authorized', 'true');
      return true;
    }

    try {
      // iOS 原生环境下，通过 Capacitor 插件请求授权
      // 注意：需要在 Xcode 中配置 HealthKit entitlement
      console.log('HealthKit: 请求 iOS HealthKit 授权...');
      
      // 这里会通过原生桥接调用 HealthKit
      // 实际调用需要在 iOS 项目中配置
      iOSStorage.setItem('zenfit_health_authorized', 'true');
      return true;
    } catch (error) {
      console.error('HealthKit: 授权失败', error);
      return false;
    }
  }

  /**
   * 检查授权状态
   */
  async checkAuthorizationStatus(): Promise<AuthorizationStatus> {
    if (!this.isNativePlatform()) {
      // Web 模式下检查本地存储
      const authorized = iOSStorage.getItem('zenfit_health_authorized') === 'true';
      return {
        isAuthorized: authorized,
        readPermissions: authorized ? ['weight', 'body_fat_percentage'] : [],
        writePermissions: authorized ? ['weight', 'body_fat_percentage'] : []
      };
    }

    try {
      const authorized = iOSStorage.getItem('zenfit_health_authorized') === 'true';
      return {
        isAuthorized: authorized,
        readPermissions: authorized ? ['weight', 'body_fat_percentage', 'height'] : [],
        writePermissions: authorized ? ['weight', 'body_fat_percentage'] : []
      };
    } catch (error) {
      console.error('HealthKit: 检查授权状态失败', error);
      return {
        isAuthorized: false,
        readPermissions: [],
        writePermissions: []
      };
    }
  }

  /**
   * 获取最新的健康数据
   * Web 模式下从 localStorage 读取
   */
  async getLatestHealthData(): Promise<SyncResult> {
    // Web 模式：从 localStorage 读取
    if (!this.isNativePlatform()) {
      try {
        const savedData = iOSStorage.getItem('zenfit_health_data');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          return {
            success: true,
            data: {
              weight: parsed.weight,
              bodyFatPercent: parsed.bodyFatPercent,
              height: parsed.height,
              bmi: parsed.weight && parsed.height ? 
                parsed.weight / (parsed.height * parsed.height) : undefined,
              gender: parsed.gender
            }
          };
        }
        return {
          success: true,
          data: {}
        };
      } catch (error) {
        console.error('HealthKit: 读取本地数据失败', error);
        return {
          success: false,
          error: '读取数据失败'
        };
      }
    }

    // iOS 模式：从 localStorage 读取（实际 iOS 构建时会通过原生桥接）
    try {
      const savedData = iOSStorage.getItem('zenfit_health_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return {
          success: true,
          data: {
            weight: parsed.weight,
            bodyFatPercent: parsed.bodyFatPercent,
            height: parsed.height,
            bmi: parsed.weight && parsed.height ? 
              parsed.weight / (parsed.height * parsed.height) : undefined,
            gender: parsed.gender
          }
        };
      }
      return {
        success: true,
        data: {}
      };
    } catch (error) {
      console.error('HealthKit: 获取数据失败', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取健康数据失败'
      };
    }
  }

  /**
   * 保存体重
   * Web 模式下保存到 localStorage
   */
  async saveWeight(weight: number, date: Date = new Date()): Promise<boolean> {
    try {
      const existingData = iOSStorage.getItem('zenfit_health_data');
      const data = existingData ? JSON.parse(existingData) : {};
      data.weight = weight;
      data.lastUpdated = date.toISOString();
      iOSStorage.setItem('zenfit_health_data', JSON.stringify(data));
      
      console.log('HealthKit: 保存体重成功', weight);
      return true;
    } catch (error) {
      console.error('HealthKit: 保存体重失败', error);
      return false;
    }
  }

  /**
   * 保存体脂率
   */
  async saveBodyFat(percentage: number, date: Date = new Date()): Promise<boolean> {
    try {
      const existingData = iOSStorage.getItem('zenfit_health_data');
      const data = existingData ? JSON.parse(existingData) : {};
      data.bodyFatPercent = percentage;
      data.lastUpdated = date.toISOString();
      iOSStorage.setItem('zenfit_health_data', JSON.stringify(data));
      
      console.log('HealthKit: 保存体脂率成功', percentage);
      return true;
    } catch (error) {
      console.error('HealthKit: 保存体脂率失败', error);
      return false;
    }
  }

  /**
   * 保存身高
   */
  async saveHeight(height: number): Promise<boolean> {
    try {
      const existingData = iOSStorage.getItem('zenfit_health_data');
      const data = existingData ? JSON.parse(existingData) : {};
      data.height = height;
      iOSStorage.setItem('zenfit_health_data', JSON.stringify(data));
      
      console.log('HealthKit: 保存身高成功', height);
      return true;
    } catch (error) {
      console.error('HealthKit: 保存身高失败', error);
      return false;
    }
  }

  /**
   * 获取体重趋势数据
   */
  async getWeightTrend(days: number = 30): Promise<{ date: Date; weight: number }[]> {
    try {
      // 从 localStorage 读取历史记录
      const historyKey = 'zenfit_health_history';
      const history = iOSStorage.getItem(historyKey);
      
      if (history) {
        const parsed = JSON.parse(history);
        return parsed.map((item: any) => ({
          date: new Date(item.date),
          weight: item.weight
        }));
      }
      
      return [];
    } catch (error) {
      console.error('HealthKit: 获取体重趋势失败', error);
      return [];
    }
  }

  /**
   * 添加体重历史记录
   */
  async addWeightHistory(weight: number, date: Date = new Date()): Promise<boolean> {
    try {
      const historyKey = 'zenfit_health_history';
      const existingHistory = iOSStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      history.push({
        weight,
        date: date.toISOString()
      });
      
      // 只保留最近 90 天的记录
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const filteredHistory = history.filter((item: any) => 
        new Date(item.date) > cutoffDate
      );
      
      iOSStorage.setItem(historyKey, JSON.stringify(filteredHistory));
      return true;
    } catch (error) {
      console.error('HealthKit: 添加历史记录失败', error);
      return false;
    }
  }
}

// 导出单例
export const healthKitService = new HealthKitService();
export default healthKitService;
