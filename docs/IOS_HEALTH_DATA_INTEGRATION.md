# iOS健康数据集成指南

## 概述

本文档描述了ZenFit应用中iOS健康数据集成功能的实现，包括数据同步、存储和基于健康数据的训练重量计算。

## 功能特性

### 1. 健康数据同步
- 从iOS健康应用读取用户的体重、性别和体脂率
- 每天自动同步一次健康数据
- 保存历史记录以便追踪趋势

### 2. 用户信息同步
- 自动更新用户profile中的健康数据
- 保持用户信息与健康应用数据一致

### 3. 训练重量计算
- 基于体重、体脂率、性别和经验水平计算推荐训练重量
- 根据体重变化自动调整训练重量建议

## 数据库模型

### UserProfile 更新
```prisma
model UserProfile {
  // ... 现有字段
  bodyFatPercent  Float?    @map("body_fat_percent") // 体脂率
  lastHealthSync  DateTime? @map("last_health_sync")  // 最后同步时间
}
```

### HealthData 新模型
```prisma
model HealthData {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  weight          Float?   // 体重 (kg)
  bodyFatPercent  Float?   @map("body_fat_percent") // 体脂率 (%)
  gender          String?  // 性别
  syncDate        DateTime @default(now()) @map("sync_date")
  dataSource      String   @default("ios_health") @map("data_source")
  createdAt       DateTime @default(now()) @map("created_at")
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("health_data")
  @@index([userId, syncDate])
}
```

## API端点

### 1. 同步健康数据
**POST** `/api/health/sync`

同步iOS健康应用的数据到后端。

**请求体：**
```json
{
  "weight": 75.5,
  "bodyFatPercent": 18.5,
  "gender": "male"
}
```

**响应：**
```json
{
  "success": true,
  "message": "Health data synced successfully",
  "healthData": {
    "id": "uuid",
    "userId": "uuid",
    "weight": 75.5,
    "bodyFatPercent": 18.5,
    "gender": "male",
    "syncDate": "2026-01-06T00:00:00.000Z",
    "dataSource": "ios_health"
  },
  "profileUpdated": true
}
```

### 2. 获取健康数据历史
**GET** `/api/health/history?startDate=2026-01-01&endDate=2026-01-31&limit=30`

获取指定时间范围内的健康数据历史记录。

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "weight": 75.5,
      "bodyFatPercent": 18.5,
      "syncDate": "2026-01-06T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. 获取最新健康数据
**GET** `/api/health/latest`

获取用户最新的健康数据记录。

### 4. 检查是否需要同步
**GET** `/api/health/should-sync`

检查今天是否已经同步过健康数据。

**响应：**
```json
{
  "success": true,
  "shouldSync": true,
  "message": "Health data sync is recommended for today"
}
```

### 5. 计算推荐训练重量
**POST** `/api/health/calculate-weight`

基于健康数据计算推荐的训练重量。

**请求体：**
```json
{
  "currentWeight": 75.5,
  "bodyFatPercent": 18.5,
  "gender": "male",
  "experienceLevel": "intermediate",
  "lastWorkoutWeight": 60
}
```

**响应：**
```json
{
  "success": true,
  "recommendedWeight": 62,
  "adjustmentReason": "体重增加，建议增加训练重量",
  "percentageChange": 3.33
}
```

### 6. 获取体重趋势
**GET** `/api/health/weight-trend?days=30`

分析指定天数内的体重变化趋势。

**响应：**
```json
{
  "success": true,
  "trend": "increasing",
  "change": 2.5,
  "averageWeight": 74.8,
  "dataPoints": 15
}
```

## 训练重量计算逻辑

### 计算公式

1. **瘦体重计算**
   ```
   瘦体重 = 体重 × (1 - 体脂率/100)
   ```

2. **力量系数**
   - 男性：
     - 初学者：0.5
     - 中级：0.75
     - 高级：1.0
   - 女性：
     - 初学者：0.35
     - 中级：0.55
     - 高级：0.75

3. **推荐重量**
   ```
   推荐重量 = 瘦体重 × 力量系数
   ```

### 重量调整建议

- 体重增加 > 5%：建议增加训练重量
- 体重减少 > 5%：建议降低训练重量
- 变化 ≤ 5%：保持当前训练重量

## 前端集成

### iOS HealthKit集成

在React Native应用中，需要使用HealthKit API来读取健康数据：

```typescript
import AppleHealthKit from 'react-native-health';

// 请求权限
const permissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.BiologicalSex,
    ],
  },
};

AppleHealthKit.initHealthKit(permissions, (error) => {
  if (error) {
    console.log('HealthKit初始化失败:', error);
    return;
  }
  
  // 读取健康数据
  readHealthData();
});

// 读取健康数据
async function readHealthData() {
  // 读取体重
  AppleHealthKit.getLatestWeight(null, (err, weight) => {
    if (!err) {
      console.log('体重:', weight.value);
    }
  });
  
  // 读取体脂率
  AppleHealthKit.getLatestBodyFatPercentage(null, (err, bodyFat) => {
    if (!err) {
      console.log('体脂率:', bodyFat.value);
    }
  });
  
  // 读取性别
  AppleHealthKit.getBiologicalSex(null, (err, results) => {
    if (!err) {
      console.log('性别:', results.value);
    }
  });
}
```

### 每日自动同步

在应用启动时检查是否需要同步：

```typescript
import { useEffect } from 'react';
import { syncHealthData, checkShouldSync } from './services/healthService';

function App() {
  useEffect(() => {
    checkAndSyncHealth();
  }, []);
  
  async function checkAndSyncHealth() {
    try {
      // 检查是否需要同步
      const { shouldSync } = await checkShouldSync();
      
      if (shouldSync) {
        // 读取健康数据
        const healthData = await readHealthDataFromDevice();
        
        // 同步到后端
        await syncHealthData(healthData);
        
        console.log('健康数据同步成功');
      }
    } catch (error) {
      console.error('健康数据同步失败:', error);
    }
  }
}
```

## 使用场景

### 场景1：用户首次使用
1. 用户授权访问健康应用
2. 读取当前健康数据
3. 同步到后端并创建profile
4. 计算初始训练重量

### 场景2：每日自动同步
1. 应用启动时检查是否需要同步
2. 如果需要，读取最新健康数据
3. 同步到后端并更新profile
4. 重新计算训练重量建议

### 场景3：训练计划调整
1. 用户开始新的训练计划
2. 系统读取最新健康数据
3. 基于体重变化调整训练重量
4. 提供个性化建议

## 数据隐私

- 所有健康数据都经过加密传输
- 用户可以随时撤销健康数据访问权限
- 健康数据仅用于训练计划优化
- 不会与第三方分享健康数据

## 测试

### 单元测试
```bash
cd backend
npm test -- healthService.test.ts
```

### API测试
使用Postman或curl测试API端点：

```bash
# 同步健康数据
curl -X POST http://localhost:3001/api/health/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 75.5,
    "bodyFatPercent": 18.5,
    "gender": "male"
  }'

# 检查是否需要同步
curl http://localhost:3001/api/health/should-sync \
  -H "Authorization: Bearer YOUR_TOKEN"

# 计算推荐重量
curl -X POST http://localhost:3001/api/health/calculate-weight \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastWorkoutWeight": 60
  }'
```

## 故障排除

### 问题1：健康数据同步失败
- 检查用户是否授权了健康应用访问权限
- 确认健康应用中有相关数据
- 检查网络连接

### 问题2：训练重量计算不准确
- 确认健康数据已正确同步
- 检查用户profile中的经验水平设置
- 验证体脂率数据的准确性

### 问题3：每日同步不工作
- 检查lastHealthSync时间戳
- 确认应用启动时的同步逻辑
- 查看后端日志

## 未来改进

1. **更多健康指标**
   - 心率
   - 睡眠质量
   - 活动量

2. **智能建议**
   - 基于恢复状态调整训练强度
   - 根据睡眠质量推荐休息日

3. **数据可视化**
   - 体重变化图表
   - 体脂率趋势
   - 训练重量进步曲线

## 相关文档

- [API文档](./API_DOCUMENTATION.md)
- [数据库Schema](../backend/prisma/schema.prisma)
- [前端集成指南](./FRONTEND_INTEGRATION.md)