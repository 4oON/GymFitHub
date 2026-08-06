# iOS健康数据功能部署指南

## 概述

本文档说明如何部署和测试iOS健康数据集成功能。

## 当前状态

✅ **已完成的工作：**
1. 创建了新的Git分支 `feature/ios-health-data-sync`
2. 设计并更新了数据库模型（Prisma Schema）
3. 创建了健康数据类型定义
4. 实现了健康数据验证器
5. 实现了健康数据服务（业务逻辑）
6. 创建了完整的API端点
7. 编写了详细的集成文档

⏳ **待完成的工作：**
1. 完成数据库迁移
2. 测试API端点
3. 前端集成

## 部署步骤

### 1. 完成数据库迁移

当前有一个Prisma迁移命令正在运行。等待它完成后：

```bash
cd backend

# 如果迁移命令还在运行，等待它完成
# 如果需要重新运行迁移：
npx prisma migrate dev --name add_ios_health_data

# 生成Prisma客户端
npx prisma generate
```

### 2. 验证数据库更改

检查数据库中是否创建了新表和字段：

```sql
-- 检查 user_profiles 表是否添加了新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';

-- 检查 health_data 表是否创建
SELECT * FROM information_schema.tables 
WHERE table_name = 'health_data';
```

### 3. 重启后端服务

```bash
cd backend
npm run dev
```

### 4. 测试API端点

使用以下curl命令测试API：

#### 4.1 同步健康数据

```bash
curl -X POST http://localhost:3001/api/health/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "weight": 75.5,
    "bodyFatPercent": 18.5,
    "gender": "male"
  }'
```

预期响应：
```json
{
  "success": true,
  "message": "Health data synced successfully",
  "healthData": {
    "id": "...",
    "userId": "...",
    "weight": 75.5,
    "bodyFatPercent": 18.5,
    "gender": "male",
    "syncDate": "2026-01-06T...",
    "dataSource": "ios_health"
  },
  "profileUpdated": true
}
```

#### 4.2 检查是否需要同步

```bash
curl http://localhost:3001/api/health/should-sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4.3 获取健康数据历史

```bash
curl "http://localhost:3001/api/health/history?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4.4 获取最新健康数据

```bash
curl http://localhost:3001/api/health/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4.5 计算推荐训练重量

```bash
curl -X POST http://localhost:3001/api/health/calculate-weight \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lastWorkoutWeight": 60
  }'
```

#### 4.6 获取体重趋势

```bash
curl "http://localhost:3001/api/health/weight-trend?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 文件清单

### 新增文件

1. **类型定义**
   - `backend/src/types/health.ts` - 健康数据类型定义

2. **验证器**
   - `backend/src/validators/healthValidator.ts` - 健康数据验证规则

3. **服务**
   - `backend/src/services/healthService.ts` - 健康数据业务逻辑

4. **文档**
   - `docs/IOS_HEALTH_DATA_INTEGRATION.md` - 集成指南
   - `docs/IOS_HEALTH_DATA_DEPLOYMENT.md` - 部署指南（本文档）

### 修改文件

1. **数据库模型**
   - `backend/prisma/schema.prisma` - 添加了HealthData模型和UserProfile字段

2. **路由**
   - `backend/src/routes/health.ts` - 更新了健康数据API端点

## 前端集成准备

### 所需依赖

```bash
# React Native项目
npm install react-native-health
```

### iOS配置

在 `Info.plist` 中添加健康数据权限：

```xml
<key>NSHealthShareUsageDescription</key>
<string>我们需要访问您的健康数据以优化训练计划</string>
<key>NSHealthUpdateUsageDescription</key>
<string>我们需要更新您的健康数据</string>
```

### 示例代码

参考 `docs/IOS_HEALTH_DATA_INTEGRATION.md` 中的前端集成部分。

## 测试场景

### 场景1：首次同步
1. 用户登录应用
2. 授权健康数据访问
3. 同步健康数据
4. 验证数据已保存到数据库
5. 验证用户profile已更新

### 场景2：每日自动同步
1. 应用启动
2. 检查是否需要同步（should-sync）
3. 如果需要，读取并同步健康数据
4. 验证lastHealthSync时间戳已更新

### 场景3：训练重量计算
1. 用户开始训练
2. 系统读取最新健康数据
3. 计算推荐训练重量
4. 显示调整建议

### 场景4：体重趋势分析
1. 用户查看进度
2. 获取30天体重趋势
3. 显示图表和分析

## 故障排除

### 问题1：迁移失败

如果Prisma迁移失败：

```bash
# 重置迁移（仅开发环境）
cd backend
npx prisma migrate reset

# 重新运行迁移
npx prisma migrate dev --name add_ios_health_data
```

### 问题2：TypeScript错误

如果看到Prisma相关的TypeScript错误：

```bash
# 重新生成Prisma客户端
cd backend
npx prisma generate

# 重启TypeScript服务器（在VSCode中）
# Ctrl+Shift+P -> TypeScript: Restart TS Server
```

### 问题3：API返回401错误

确保：
1. 用户已登录并获得JWT token
2. Authorization header格式正确：`Bearer YOUR_TOKEN`
3. Token未过期

### 问题4：健康数据未同步

检查：
1. 用户是否授权了健康数据访问
2. iOS健康应用中是否有相关数据
3. 网络连接是否正常
4. 后端日志中是否有错误信息

## 性能优化

### 数据库索引

已在schema中添加索引：
```prisma
@@index([userId, syncDate])
```

### 缓存策略

考虑实现：
1. Redis缓存最新健康数据
2. 减少数据库查询频率
3. 批量同步历史数据

## 安全考虑

1. **数据加密**
   - 传输层使用HTTPS
   - 敏感数据加密存储

2. **访问控制**
   - 所有端点都需要JWT认证
   - 用户只能访问自己的健康数据

3. **数据隐私**
   - 遵守GDPR和健康数据隐私法规
   - 提供数据删除功能
   - 明确的隐私政策

## 监控和日志

建议添加：
1. 健康数据同步成功/失败率监控
2. API响应时间监控
3. 错误日志记录
4. 用户行为分析

## 下一步

1. ✅ 等待数据库迁移完成
2. ⏳ 运行API测试
3. ⏳ 实现前端集成
4. ⏳ 进行端到端测试
5. ⏳ 部署到生产环境

## 相关文档

- [iOS健康数据集成指南](./IOS_HEALTH_DATA_INTEGRATION.md)
- [API文档](./API_DOCUMENTATION.md)
- [数据库Schema](../backend/prisma/schema.prisma)

## 联系方式

如有问题，请查看：
- GitHub Issues
- 项目文档
- 开发团队