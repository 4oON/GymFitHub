# iOS健康数据集成 - 快速开始

## 🎯 功能概述

本功能允许ZenFit应用从iOS健康应用读取用户的健康数据（体重、性别、体脂率），并基于这些数据自动调整训练计划和重量建议。

## 📋 已实现的功能

### 1. 数据库模型
- ✅ 新增 `HealthData` 表存储健康数据历史
- ✅ 更新 `UserProfile` 表添加体脂率和同步时间字段
- ✅ 添加用户授权和隐私控制字段

### 2. 后端API

**授权管理：**
- ✅ `GET /api/health/authorization` - 检查授权状态
- ✅ `POST /api/health/enable` - 启用健康数据同步
- ✅ `POST /api/health/disable` - 禁用健康数据同步
- ✅ `PUT /api/health/auto-sync` - 更新自动同步设置

**数据同步：**
- ✅ `POST /api/health/sync` - 同步健康数据
- ✅ `GET /api/health/history` - 获取历史记录
- ✅ `GET /api/health/latest` - 获取最新数据
- ✅ `GET /api/health/should-sync` - 检查是否需要同步

**数据分析：**
- ✅ `POST /api/health/calculate-weight` - 计算推荐训练重量
- ✅ `GET /api/health/weight-trend` - 获取体重趋势

### 3. 业务逻辑
- ✅ 健康数据同步服务
- ✅ 每日自动同步检查
- ✅ 基于健康数据的重量计算算法
- ✅ 体重趋势分析

### 4. 文档
- ✅ 集成指南
- ✅ 部署指南
- ✅ API文档

## 🚀 快速部署

### 步骤1：完成数据库迁移

```bash
cd backend

# 等待当前迁移完成，或重新运行
npx prisma migrate dev --name add_ios_health_data

# 生成Prisma客户端
npx prisma generate
```

### 步骤2：重启后端服务

```bash
npm run dev
```

### 步骤3：测试API

```bash
# 获取JWT token（先登录）
TOKEN="your_jwt_token_here"

# 测试同步健康数据
curl -X POST http://localhost:3001/api/health/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 75.5,
    "bodyFatPercent": 18.5,
    "gender": "male"
  }'

# 测试计算推荐重量
curl -X POST http://localhost:3001/api/health/calculate-weight \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastWorkoutWeight": 60
  }'
```

## 📁 新增文件

```
backend/
├── src/
│   ├── types/
│   │   └── health.ts                    # 健康数据类型定义
│   ├── validators/
│   │   └── healthValidator.ts           # 数据验证规则
│   ├── services/
│   │   └── healthService.ts             # 业务逻辑实现
│   └── routes/
│       └── health.ts                    # API路由（已更新）
└── prisma/
    └── schema.prisma                    # 数据库模型（已更新）

docs/
├── IOS_HEALTH_DATA_INTEGRATION.md       # 详细集成指南
├── IOS_HEALTH_DATA_DEPLOYMENT.md        # 部署指南
└── IOS_HEALTH_DATA_QUICK_START.md       # 本文档
```

## 🔑 核心功能说明

### 1. 用户授权和隐私控制

**首次使用流程：**
```typescript
// 1. 显示授权页面
showConsentScreen();

// 2. 用户同意后启用同步
await fetch('/api/health/enable', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. 请求iOS HealthKit权限
await requestHealthKitPermissions();

// 4. 开始同步
await syncHealthData();
```

**授权检查：**
```typescript
// 检查用户是否已授权
const { enabled, consented } = await fetch('/api/health/authorization')
  .then(r => r.json());

if (!enabled) {
  // 显示授权页面
  showConsentScreen();
}
```

**撤销授权：**
```typescript
// 用户可以随时禁用同步
await fetch('/api/health/disable', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. 健康数据同步

每天打开应用时，自动检查是否需要同步：

```typescript
// 伪代码
async function onAppStart() {
  const { shouldSync } = await checkShouldSync();
  
  if (shouldSync) {
    const healthData = await readFromHealthKit();
    await syncHealthData(healthData);
  }
}
```

### 3. 训练重量计算

基于以下因素计算推荐重量：
- 体重和体脂率（计算瘦体重）
- 性别（男性/女性力量系数不同）
- 经验水平（初学者/中级/高级）
- 上次训练重量（计算变化百分比）

公式：
```
瘦体重 = 体重 × (1 - 体脂率/100)
推荐重量 = 瘦体重 × 力量系数
```

### 4. 体重趋势分析

分析30天内的体重变化：
- 趋势方向（增加/减少/稳定）
- 变化量
- 平均体重
- 数据点数量

## 📱 前端集成（待实现）

### 所需依赖

```bash
npm install react-native-health
```

### iOS权限配置

在 `Info.plist` 添加：

```xml
<key>NSHealthShareUsageDescription</key>
<string>我们需要访问您的健康数据以优化训练计划</string>
```

### 示例代码

```typescript
import AppleHealthKit from 'react-native-health';

// 初始化HealthKit
const initHealthKit = () => {
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
    console.log('HealthKit初始化成功');
  });
};

// 同步健康数据
const syncHealthData = async () => {
  // 读取体重
  const weight = await getLatestWeight();
  
  // 读取体脂率
  const bodyFat = await getLatestBodyFat();
  
  // 读取性别
  const gender = await getBiologicalSex();
  
  // 同步到后端
  await api.post('/health/sync', {
    weight,
    bodyFatPercent: bodyFat,
    gender,
  });
};
```

## 🧪 测试清单

- [ ] 数据库迁移成功
- [ ] Prisma客户端生成成功
- [ ] 后端服务启动无错误
- [ ] 健康数据同步API正常工作
- [ ] 历史记录查询正常
- [ ] 重量计算逻辑正确
- [ ] 体重趋势分析准确
- [ ] 每日同步检查功能正常

## 📊 API端点总览

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/health/sync` | 同步健康数据 |
| GET | `/api/health/history` | 获取历史记录 |
| GET | `/api/health/latest` | 获取最新数据 |
| GET | `/api/health/should-sync` | 检查同步状态 |
| POST | `/api/health/calculate-weight` | 计算推荐重量 |
| GET | `/api/health/weight-trend` | 获取体重趋势 |

## 🔐 安全性

- ✅ 所有端点需要JWT认证
- ✅ 用户只能访问自己的数据
- ✅ 数据传输使用HTTPS
- ✅ 遵守健康数据隐私法规

## 📚 相关文档

1. [详细集成指南](./IOS_HEALTH_DATA_INTEGRATION.md) - 完整的技术文档
2. [部署指南](./IOS_HEALTH_DATA_DEPLOYMENT.md) - 部署和故障排除
3. [Prisma Schema](../backend/prisma/schema.prisma) - 数据库模型

## 🎉 下一步

1. 等待数据库迁移完成
2. 测试所有API端点
3. 实现前端HealthKit集成
4. 进行端到端测试
5. 部署到生产环境

## 💡 提示

- 数据库迁移可能需要几分钟时间
- 确保有有效的JWT token进行API测试
- 前端集成需要真实的iOS设备（模拟器不支持HealthKit）
- 建议先在开发环境完整测试后再部署到生产环境

---

**分支名称：** `feature/ios-health-data-sync`

**状态：** ✅ 后端实现完成，⏳ 等待数据库迁移和测试