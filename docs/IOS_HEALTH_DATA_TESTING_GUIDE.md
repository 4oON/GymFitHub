# iOS健康数据功能测试指南（Windows开发环境）

## 概述

在Windows开发环境下测试iOS健康数据功能有几种方案，每种方案适用于不同的测试阶段。

## 测试方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **1. 后端API直接测试** | 最简单，无需iOS设备 | 无法测试HealthKit集成 | 后端开发和调试 |
| **2. Web应用（Safari）** | ❌ 不可行 | Safari无法访问HealthKit | - |
| **3. React Native App** | ✅ 推荐，完整功能测试 | 需要Mac或Expo Go | 完整功能测试 |
| **4. 模拟数据测试** | 快速验证流程 | 非真实数据 | 开发阶段验证 |

## 推荐方案：分阶段测试

### 阶段1：后端API测试（Windows上完成）✅

**目的：** 验证后端逻辑正确性

**工具：** Postman、curl、Thunder Client（VS Code插件）

**步骤：**

1. **启动后端服务**
   ```bash
   cd backend
   npm run dev
   ```

2. **获取JWT Token**
   ```bash
   # 登录获取token
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password"}'
   ```

3. **测试授权流程**
   ```bash
   # 检查授权状态
   curl http://localhost:3001/api/health/authorization \
     -H "Authorization: Bearer YOUR_TOKEN"

   # 启用健康数据同步
   curl -X POST http://localhost:3001/api/health/enable \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **测试数据同步**
   ```bash
   # 模拟iOS健康数据同步
   curl -X POST http://localhost:3001/api/health/sync \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "weight": 75.5,
       "bodyFatPercent": 18.5,
       "gender": "male"
     }'
   ```

5. **测试数据查询**
   ```bash
   # 获取最新数据
   curl http://localhost:3001/api/health/latest \
     -H "Authorization: Bearer YOUR_TOKEN"

   # 获取历史记录
   curl "http://localhost:3001/api/health/history?limit=10" \
     -H "Authorization: Bearer YOUR_TOKEN"

   # 获取体重趋势
   curl "http://localhost:3001/api/health/weight-trend?days=30" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

6. **测试重量计算**
   ```bash
   curl -X POST http://localhost:3001/api/health/calculate-weight \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"lastWorkoutWeight": 60}'
   ```

**预期结果：** 所有API返回正确的JSON响应，数据正确保存到数据库。

---

### 阶段2：React Native App测试（需要iOS设备）✅

**重要：** HealthKit只能在真实iOS设备上运行，模拟器不支持！

#### 方案A：使用Expo Go（最简单）

**优点：**
- 无需Mac电脑
- 无需Xcode
- 快速测试

**步骤：**

1. **安装Expo CLI（Windows上）**
   ```bash
   npm install -g expo-cli
   ```

2. **创建Expo项目**
   ```bash
   npx create-expo-app zenfit-mobile
   cd zenfit-mobile
   ```

3. **安装依赖**
   ```bash
   # 注意：Expo Go不支持react-native-health
   # 需要使用expo-sensors或自定义开发构建
   npm install axios
   ```

4. **创建简单的测试界面**
   ```typescript
   // App.tsx
   import React, { useState } from 'react';
   import { View, Text, Button, TextInput } from 'react-native';
   import axios from 'axios';

   const API_URL = 'https://your-backend.railway.app'; // 使用Railway部署的后端

   export default function App() {
     const [token, setToken] = useState('');
     const [weight, setWeight] = useState('75');
     const [bodyFat, setBodyFat] = useState('18');
     const [result, setResult] = useState('');

     const enableSync = async () => {
       try {
         const response = await axios.post(
           `${API_URL}/api/health/enable`,
           {},
           { headers: { Authorization: `Bearer ${token}` } }
         );
         setResult(JSON.stringify(response.data, null, 2));
       } catch (error) {
         setResult('Error: ' + error.message);
       }
     };

     const syncData = async () => {
       try {
         const response = await axios.post(
           `${API_URL}/api/health/sync`,
           {
             weight: parseFloat(weight),
             bodyFatPercent: parseFloat(bodyFat),
             gender: 'male'
           },
           { headers: { Authorization: `Bearer ${token}` } }
         );
         setResult(JSON.stringify(response.data, null, 2));
       } catch (error) {
         setResult('Error: ' + error.message);
       }
     };

     return (
       <View style={{ padding: 20 }}>
         <Text>ZenFit Health Data Test</Text>
         
         <TextInput
           placeholder="JWT Token"
           value={token}
           onChangeText={setToken}
           style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
         />
         
         <TextInput
           placeholder="Weight (kg)"
           value={weight}
           onChangeText={setWeight}
           keyboardType="numeric"
           style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
         />
         
         <TextInput
           placeholder="Body Fat %"
           value={bodyFat}
           onChangeText={setBodyFat}
           keyboardType="numeric"
           style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
         />
         
         <Button title="Enable Sync" onPress={enableSync} />
         <Button title="Sync Data" onPress={syncData} />
         
         <Text style={{ marginTop: 20 }}>{result}</Text>
       </View>
     );
   }
   ```

5. **启动Expo开发服务器**
   ```bash
   npx expo start
   ```

6. **在iPhone上测试**
   - 在iPhone上安装Expo Go应用
   - 扫描二维码
   - 测试API调用

**限制：** Expo Go不支持HealthKit，只能测试API调用，无法读取真实健康数据。

---

#### 方案B：完整React Native App（需要Mac）

**如果您有Mac电脑或可以访问Mac：**

1. **安装依赖**
   ```bash
   npm install react-native-health
   ```

2. **配置iOS权限**
   在 `Info.plist` 添加：
   ```xml
   <key>NSHealthShareUsageDescription</key>
   <string>我们需要访问您的健康数据以优化训练计划</string>
   ```

3. **实现HealthKit读取**
   ```typescript
   import AppleHealthKit from 'react-native-health';

   // 初始化HealthKit
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
     
     // 读取体重
     AppleHealthKit.getLatestWeight(null, (err, weight) => {
       if (!err) {
         console.log('体重:', weight.value);
       }
     });
   });
   ```

4. **构建并安装到iPhone**
   ```bash
   # 在Mac上
   cd ios
   pod install
   cd ..
   npx react-native run-ios --device
   ```

---

### 阶段3：模拟数据测试（Windows上完成）✅

**目的：** 在没有iOS设备的情况下验证完整流程

**创建测试脚本：**

```javascript
// test-health-sync.js
const axios = require('axios');

const API_URL = 'http://localhost:3001';
let token = '';

async function login() {
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'password'
  });
  token = response.data.token;
  console.log('✅ 登录成功');
}

async function enableHealthSync() {
  const response = await axios.post(
    `${API_URL}/api/health/enable`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ 启用健康数据同步:', response.data);
}

async function syncHealthData() {
  // 模拟多天的健康数据
  const dates = [
    { weight: 75.0, bodyFat: 19.0, date: '2026-01-01' },
    { weight: 74.8, bodyFat: 18.8, date: '2026-01-02' },
    { weight: 74.5, bodyFat: 18.5, date: '2026-01-03' },
    { weight: 74.3, bodyFat: 18.3, date: '2026-01-04' },
    { weight: 74.0, bodyFat: 18.0, date: '2026-01-05' },
  ];

  for (const data of dates) {
    const response = await axios.post(
      `${API_URL}/api/health/sync`,
      {
        weight: data.weight,
        bodyFatPercent: data.bodyFat,
        gender: 'male'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ 同步数据 ${data.date}:`, response.data.healthData.weight);
  }
}

async function getWeightTrend() {
  const response = await axios.get(
    `${API_URL}/api/health/weight-trend?days=30`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ 体重趋势:', response.data);
}

async function calculateWeight() {
  const response = await axios.post(
    `${API_URL}/api/health/calculate-weight`,
    { lastWorkoutWeight: 60 },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ 推荐训练重量:', response.data);
}

async function runTests() {
  try {
    await login();
    await enableHealthSync();
    await syncHealthData();
    await getWeightTrend();
    await calculateWeight();
    console.log('\n🎉 所有测试通过！');
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

runTests();
```

**运行测试：**
```bash
node test-health-sync.js
```

---

## 推荐的测试流程

### 对于Windows开发者：

1. **第一步：后端API测试（Windows）** ✅
   - 使用Postman或curl测试所有API端点
   - 验证数据正确保存到数据库
   - 确认授权流程正常工作

2. **第二步：模拟数据测试（Windows）** ✅
   - 运行测试脚本模拟完整流程
   - 验证数据同步、趋势分析、重量计算

3. **第三步：简单前端测试（可选）**
   - 使用Expo创建简单测试应用
   - 在iPhone上通过Expo Go测试API调用
   - 验证前后端通信正常

4. **第四步：完整功能测试（需要Mac或外包）**
   - 如果有Mac：构建完整React Native应用
   - 如果没有Mac：可以考虑：
     - 使用云端Mac服务（如MacStadium、MacinCloud）
     - 找有Mac的朋友帮忙测试
     - 使用Expo EAS Build云构建服务

---

## 无需iOS设备的替代方案

### 使用Expo EAS Build（推荐）

Expo提供云构建服务，可以在Windows上构建iOS应用：

```bash
# 安装EAS CLI
npm install -g eas-cli

# 登录Expo账号
eas login

# 配置项目
eas build:configure

# 构建iOS应用
eas build --platform ios

# 下载.ipa文件并通过TestFlight分发
```

**优点：**
- 无需Mac电脑
- 可以构建真实的iOS应用
- 支持HealthKit等原生功能

**成本：** Expo免费计划每月有限制，付费计划约$29/月

---

## 总结

### 最实用的测试方案（Windows环境）：

1. **开发阶段（现在）：**
   - ✅ 使用Postman/curl测试后端API
   - ✅ 运行Node.js测试脚本模拟数据
   - ✅ 验证所有业务逻辑正确

2. **前端开发阶段：**
   - 使用Expo创建简单测试应用
   - 在iPhone上通过Expo Go测试API调用
   - 暂时使用手动输入代替HealthKit读取

3. **完整测试阶段：**
   - 选项A：使用Expo EAS Build云构建
   - 选项B：借用Mac电脑构建
   - 选项C：使用云端Mac服务

### 当前可以做的（无需iOS设备）：

✅ 完成数据库迁移
✅ 测试所有后端API
✅ 验证授权流程
✅ 测试数据同步逻辑
✅ 验证重量计算算法
✅ 测试体重趋势分析

**结论：** 后端功能可以在Windows上完全测试，HealthKit集成需要真实iOS设备，但可以通过云服务或借用设备解决。
