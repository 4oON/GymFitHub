import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'com.zenfit.app',
  appName: 'ZenFit',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: false,
    // HealthKit 权限配置
    permissions: {
      'NSHealthShareUsageDescription': 'ZenFit需要访问您的健康数据来提供个性化的训练建议和体重追踪',
      'NSHealthUpdateUsageDescription': 'ZenFit需要写入训练数据到健康应用'
    }
  }
};

export default config;
