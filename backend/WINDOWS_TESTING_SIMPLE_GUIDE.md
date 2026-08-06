# Windows环境下测试iOS健康数据功能 - 简化指南

## 🎯 测试目标

在Windows上测试iOS健康数据的**后端API**功能（不需要真实iOS设备）。

## ⚠️ 重要说明

- ✅ **后端API** 可以在Windows上完全测试
- ❌ **HealthKit集成** 需要真实iOS设备（Safari无法访问HealthKit）
- ✅ 我们先测试后端，确保功能正常

## 📋 前提条件

1. ✅ 数据库迁移已完成（SQL已在Supabase执行）
2. ⏳ 需要修复项目的schema问题（auth.ts等错误）
3. ✅ 后端服务能够启动

## 🚀 测试步骤

### 方法1：使用自动化测试脚本（最简单）✅

我已经创建了测试脚本 [`test-health-api.js`](test-health-api.js)

**步骤：**

1. **确保后端服务运行**
   ```powershell
   cd c:\zenfit\backend
   npm run dev
   ```

2. **打开新的PowerShell窗口，运行测试**
   ```powershell
   cd c:\zenfit\backend
   node test-health-api.js
   ```

3. **查看结果**
   - ✅ 绿色勾号 = 测试通过
   - ❌ 红色叉号 = 测试失败
   - 会显示详细的错误信息

**测试内容：**
- 用户注册和登录
- 健康数据授权
- 数据同步
- 历史记录查询
- 重量计算
- 体重趋势分析

---

### 方法2：使用Postman手动测试

**步骤1：获取JWT Token**

```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

保存返回的 `token`。

**步骤2：启用健康数据同步**

```http
POST http://localhost:3001/api/health/enable
Authorization: Bearer YOUR_TOKEN_HERE
```

**步骤3：同步健康数据**

```http
POST http://localhost:3001/api/health/sync
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "weight": 75.5,
  "bodyFatPercent": 18.5,
  "gender": "male"
}
```

**步骤4：获取最新数据**

```http
GET http://localhost:3001/api/health/latest
Authorization: Bearer YOUR_TOKEN_HERE
```

**步骤5：计算推荐重量**

```http
POST http://localhost:3001/api/health/calculate-weight
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "lastWorkoutWeight": 60
}
```

**步骤6：获取体重趋势**

```http
GET http://localhost:3001/api/health/weight-trend?days=30
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### 方法3：使用curl命令（PowerShell）

```powershell
# 1. 登录获取token
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body (@{email="test@example.com";password="password123"} | ConvertTo-Json) -ContentType "application/json"
$token = $response.token

# 2. 启用健康数据同步
Invoke-RestMethod -Uri "http://localhost:3001/api/health/enable" -Method POST -Headers @{Authorization="Bearer $token"}

# 3. 同步健康数据
$healthData = @{
    weight = 75.5
    bodyFatPercent = 18.5
    gender = "male"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/health/sync" -Method POST -Headers @{Authorization="Bearer $token"} -Body $healthData -ContentType "application/json"

# 4. 获取最新数据
Invoke-RestMethod -Uri "http://localhost:3001/api/health/latest" -Headers @{Authorization="Bearer $token"}

# 5. 计算推荐重量
$weightCalc = @{lastWorkoutWeight = 60} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/health/calculate-weight" -Method POST -Headers @{Authorization="Bearer $token"} -Body $weightCalc -ContentType "application/json"
```

---

## 🔧 当前问题和解决方案

### 问题：服务器无法启动

**原因：** 项目中有一些schema与数据库不匹配的问题（auth.ts, workout.ts等）

**解决方案：**

#### 选项1：修复schema问题（推荐）
1. 在Supabase SQL Editor运行 `check_user_table.sql` 查看实际字段名
2. 更新 `schema.prisma` 以匹配数据库
3. 重新生成Prisma Client
4. 修复TypeScript错误

#### 选项2：临时注释掉有问题的路由
在 `src/index.ts` 中：
```typescript
// 临时注释掉有问题的路由
// app.use('/api/auth', authRouter);
// app.use('/api/workout', workoutRouter);
// app.use('/api/routine', routineRouter);

// 只保留健康数据路由
app.use('/api/health', healthRouter);
```

这样可以先测试健康数据功能。

---

## 📱 iOS设备测试（未来）

当后端测试通过后，需要真实iOS设备测试HealthKit集成：

### 方案A：使用Expo Go（简单）
- 创建Expo应用
- 在iPhone上安装Expo Go
- 扫码测试API调用
- **限制：** 无法测试HealthKit，只能测试API

### 方案B：完整React Native App（需要Mac）
- 使用 `react-native-health` 库
- 读取真实HealthKit数据
- 完整功能测试

### 方案C：使用Expo EAS Build（无需Mac）
- 云端构建iOS应用
- 支持HealthKit
- 通过TestFlight分发测试

详细说明请查看：[`IOS_HEALTH_DATA_TESTING_GUIDE.md`](../docs/IOS_HEALTH_DATA_TESTING_GUIDE.md)

---

## ✅ 测试检查清单

### 后端API测试（Windows）
- [ ] 服务器成功启动
- [ ] 用户可以登录获取token
- [ ] 可以启用健康数据同步
- [ ] 可以同步健康数据
- [ ] 可以查询历史记录
- [ ] 可以获取最新数据
- [ ] 重量计算功能正常
- [ ] 体重趋势分析正常

### iOS设备测试（未来）
- [ ] HealthKit权限请求正常
- [ ] 可以读取体重数据
- [ ] 可以读取体脂率数据
- [ ] 可以读取性别信息
- [ ] 数据自动同步到后端
- [ ] 每日同步检查正常

---

## 🎯 当前状态

✅ **后端功能：100%完成**
- 所有API已实现
- 数据库表已创建
- 业务逻辑已完成

⚠️ **测试状态：等待服务器启动**
- 需要修复项目的schema问题
- 或临时注释掉有问题的路由

📱 **iOS集成：待实现**
- 需要真实iOS设备
- 前端HealthKit集成代码待开发

---

## 💡 建议

1. **现在可以做：**
   - 修复项目的schema问题
   - 启动服务器
   - 运行自动化测试脚本
   - 验证所有API功能

2. **之后再做：**
   - iOS设备上的HealthKit集成
   - 前端UI开发
   - 端到端测试

---

## 📚 相关文档

- [`HOW_TO_TEST.md`](HOW_TO_TEST.md) - 详细测试步骤
- [`IOS_HEALTH_DATA_TESTING_GUIDE.md`](../docs/IOS_HEALTH_DATA_TESTING_GUIDE.md) - 完整测试指南
- [`IOS_HEALTH_DATA_QUICK_START.md`](../docs/IOS_HEALTH_DATA_QUICK_START.md) - 快速开始
- [`IOS_HEALTH_DATA_IMPLEMENTATION_SUMMARY.md`](IOS_HEALTH_DATA_IMPLEMENTATION_SUMMARY.md) - 实现总结

---

**总结：** 后端功能已完全实现，可以在Windows上测试所有API。HealthKit集成需要真实iOS设备，但可以稍后进行。