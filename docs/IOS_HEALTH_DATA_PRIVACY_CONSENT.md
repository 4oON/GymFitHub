# iOS健康数据隐私和用户授权

## 概述

本文档描述了ZenFit应用中iOS健康数据的隐私保护和用户授权机制，确保用户完全了解并控制其健康数据的使用。

## 用户授权流程

### 1. 首次使用流程

```
用户打开应用
    ↓
显示健康数据同步介绍页面
    ↓
用户阅读数据使用说明
    ↓
用户点击"同意并启用"按钮
    ↓
请求iOS HealthKit权限
    ↓
用户在系统弹窗中授权
    ↓
开始同步健康数据
```

### 2. 授权状态

用户的健康数据同步有三个关键状态：

- **healthSyncConsent**: 用户是否同意数据使用条款
- **healthSyncEnabled**: 健康数据同步是否启用
- **autoSyncEnabled**: 是否启用每日自动同步

## 数据库字段

```prisma
model UserProfile {
  // 健康数据同步设置
  healthSyncEnabled     Boolean   @default(false)  // 是否启用同步
  healthSyncConsent     Boolean   @default(false)  // 是否同意条款
  healthSyncConsentDate DateTime?                  // 同意日期
  lastHealthSync        DateTime?                  // 最后同步时间
  autoSyncEnabled       Boolean   @default(true)   // 自动同步开关
}
```

## API端点

### 1. 检查授权状态

**GET** `/api/health/authorization`

检查用户当前的健康数据同步授权状态。

**响应：**
```json
{
  "success": true,
  "enabled": true,
  "consented": true,
  "message": "Health data sync is authorized"
}
```

### 2. 启用健康数据同步

**POST** `/api/health/enable`

用户同意数据使用条款并启用健康数据同步。

**响应：**
```json
{
  "success": true,
  "message": "Health data sync enabled successfully",
  "enabled": true,
  "consented": true
}
```

### 3. 禁用健康数据同步

**POST** `/api/health/disable`

用户撤销授权，禁用健康数据同步。

**响应：**
```json
{
  "success": true,
  "message": "Health data sync disabled successfully",
  "enabled": false
}
```

### 4. 更新自动同步设置

**PUT** `/api/health/auto-sync`

更新每日自动同步的开关状态。

**请求体：**
```json
{
  "enabled": true
}
```

**响应：**
```json
{
  "success": true,
  "message": "Auto sync enabled successfully",
  "autoSyncEnabled": true
}
```

## 前端UI实现

### 1. 健康数据授权页面

```typescript
import React, { useState } from 'react';
import { View, Text, Button, Switch, ScrollView } from 'react-native';

const HealthDataConsentScreen = () => {
  const [autoSync, setAutoSync] = useState(true);

  const handleEnableHealthSync = async () => {
    try {
      // 1. 显示数据使用说明
      // 2. 用户确认后，调用后端API
      const response = await fetch('/api/health/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // 3. 请求iOS HealthKit权限
        await requestHealthKitPermissions();
        
        // 4. 开始首次同步
        await syncHealthData();
        
        // 5. 导航到主页面
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Enable health sync failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>健康数据同步</Text>
      
      <Text style={styles.description}>
        ZenFit需要访问您的健康数据以提供个性化的训练建议。
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>我们会读取以下数据：</Text>
        <Text style={styles.item}>• 体重</Text>
        <Text style={styles.item}>• 体脂率</Text>
        <Text style={styles.item}>• 性别</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据用途：</Text>
        <Text style={styles.item}>• 计算推荐的训练重量</Text>
        <Text style={styles.item}>• 追踪体重变化趋势</Text>
        <Text style={styles.item}>• 优化训练计划</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>隐私保护：</Text>
        <Text style={styles.item}>• 数据仅用于训练计划优化</Text>
        <Text style={styles.item}>• 不会与第三方分享</Text>
        <Text style={styles.item}>• 您可以随时撤销授权</Text>
        <Text style={styles.item}>• 所有数据加密传输和存储</Text>
      </View>

      <View style={styles.settingRow}>
        <Text>启用每日自动同步</Text>
        <Switch
          value={autoSync}
          onValueChange={setAutoSync}
        />
      </View>

      <Button
        title="同意并启用"
        onPress={handleEnableHealthSync}
      />

      <Button
        title="暂不启用"
        onPress={() => navigation.goBack()}
      />
    </ScrollView>
  );
};
```

### 2. 设置页面中的健康数据控制

```typescript
const HealthDataSettings = () => {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    checkAuthorizationStatus();
  }, []);

  const checkAuthorizationStatus = async () => {
    const response = await fetch('/api/health/authorization', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setSyncEnabled(data.enabled);
  };

  const toggleHealthSync = async () => {
    try {
      if (syncEnabled) {
        // 禁用同步
        await fetch('/api/health/disable', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSyncEnabled(false);
      } else {
        // 启用同步
        await fetch('/api/health/enable', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSyncEnabled(true);
      }
    } catch (error) {
      console.error('Toggle health sync failed:', error);
    }
  };

  const toggleAutoSync = async (enabled: boolean) => {
    try {
      await fetch('/api/health/auto-sync', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      setAutoSync(enabled);
    } catch (error) {
      console.error('Toggle auto sync failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>健康数据设置</Text>

      <View style={styles.settingRow}>
        <Text>启用健康数据同步</Text>
        <Switch
          value={syncEnabled}
          onValueChange={toggleHealthSync}
        />
      </View>

      {syncEnabled && (
        <View style={styles.settingRow}>
          <Text>每日自动同步</Text>
          <Switch
            value={autoSync}
            onValueChange={toggleAutoSync}
          />
        </View>
      )}

      <Button
        title="立即同步"
        disabled={!syncEnabled}
        onPress={handleManualSync}
      />

      <Button
        title="查看数据使用说明"
        onPress={() => navigation.navigate('PrivacyPolicy')}
      />
    </View>
  );
};
```

### 3. 应用启动时的同步检查

```typescript
const App = () => {
  useEffect(() => {
    checkAndSyncHealth();
  }, []);

  const checkAndSyncHealth = async () => {
    try {
      // 1. 检查授权状态
      const authResponse = await fetch('/api/health/authorization', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const authData = await authResponse.json();

      if (!authData.enabled) {
        // 用户未启用健康数据同步，不执行任何操作
        return;
      }

      // 2. 检查是否需要同步
      const syncResponse = await fetch('/api/health/should-sync', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const syncData = await syncResponse.json();

      if (syncData.shouldSync) {
        // 3. 读取健康数据
        const healthData = await readHealthDataFromDevice();

        // 4. 同步到后端
        await fetch('/api/health/sync', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(healthData),
        });

        console.log('健康数据同步成功');
      }
    } catch (error) {
      console.error('健康数据同步失败:', error);
    }
  };
};
```

## 数据使用说明文本

### 中文版本

```
健康数据使用说明

ZenFit需要访问您的iOS健康应用数据，以提供个性化的训练建议和计划。

我们会读取的数据：
• 体重 - 用于计算推荐训练重量
• 体脂率 - 用于评估身体成分
• 性别 - 用于调整训练强度系数

数据用途：
• 根据您的体重变化自动调整训练重量
• 追踪体重和体脂率趋势
• 提供个性化的训练建议
• 优化训练计划效果

隐私保护承诺：
• 您的健康数据仅用于训练计划优化
• 我们不会将您的数据分享给任何第三方
• 所有数据通过加密方式传输和存储
• 您可以随时在设置中撤销授权
• 撤销授权后，我们将停止读取您的健康数据

数据控制：
• 您可以选择启用或禁用健康数据同步
• 您可以控制是否启用每日自动同步
• 您可以随时手动触发数据同步
• 您可以查看所有历史同步记录

点击"同意并启用"即表示您已阅读并同意以上条款。
```

### 英文版本

```
Health Data Usage Policy

ZenFit needs access to your iOS Health app data to provide personalized training recommendations and plans.

Data We Collect:
• Weight - Used to calculate recommended training weights
• Body Fat Percentage - Used to assess body composition
• Gender - Used to adjust training intensity coefficients

How We Use Your Data:
• Automatically adjust training weights based on weight changes
• Track weight and body fat percentage trends
• Provide personalized training recommendations
• Optimize training plan effectiveness

Privacy Protection:
• Your health data is only used for training plan optimization
• We will not share your data with any third parties
• All data is transmitted and stored using encryption
• You can revoke authorization at any time in settings
• After revoking authorization, we will stop reading your health data

Data Control:
• You can enable or disable health data sync
• You can control whether to enable daily auto-sync
• You can manually trigger data sync at any time
• You can view all historical sync records

By clicking "Agree and Enable", you acknowledge that you have read and agree to the above terms.
```

## 授权撤销流程

当用户撤销授权时：

1. **前端操作**
   - 用户在设置中关闭健康数据同步开关
   - 显示确认对话框

2. **后端处理**
   - 调用 `POST /api/health/disable`
   - 更新 `healthSyncEnabled` 为 `false`
   - 保留历史数据（用户可能重新启用）

3. **后续行为**
   - 停止所有自动同步
   - 手动同步按钮变为不可用
   - 不再读取iOS健康数据
   - 训练重量计算使用最后已知数据

## 合规性

### GDPR合规
- ✅ 明确的用户同意
- ✅ 数据使用目的说明
- ✅ 用户可以撤销同意
- ✅ 数据访问和删除权利

### HIPAA考虑
- ✅ 健康数据加密传输
- ✅ 访问控制和认证
- ✅ 审计日志
- ✅ 数据最小化原则

### Apple App Store审核
- ✅ 清晰的隐私政策
- ✅ 用户授权流程
- ✅ HealthKit使用说明
- ✅ Info.plist权限描述

## 测试清单

- [ ] 首次使用时显示授权页面
- [ ] 用户可以同意并启用同步
- [ ] 用户可以拒绝授权
- [ ] 授权后可以成功同步数据
- [ ] 用户可以在设置中禁用同步
- [ ] 禁用后停止自动同步
- [ ] 用户可以重新启用同步
- [ ] 自动同步开关正常工作
- [ ] 授权状态正确显示
- [ ] 隐私政策链接可访问

## 相关文档

- [iOS健康数据集成指南](./IOS_HEALTH_DATA_INTEGRATION.md)
- [快速开始指南](./IOS_HEALTH_DATA_QUICK_START.md)
- [部署指南](./IOS_HEALTH_DATA_DEPLOYMENT.md)