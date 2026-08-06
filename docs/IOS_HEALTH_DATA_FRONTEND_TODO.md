# iOS健康数据前端实现 - 待办事项

## 状态：待实现

后端API已完全实现并可独立使用。前端实现为可选项，可以稍后完成。

## 前端实现优先级

### 必需（核心功能）
- [ ] 健康数据授权页面
- [ ] 设置页面中的同步开关
- [ ] HealthKit权限请求

### 可选（增强功能）
- [ ] 健康数据历史图表
- [ ] 体重趋势可视化
- [ ] 训练重量建议显示

## 快速实现指南

### 1. 授权页面（最小实现）

```typescript
// screens/HealthConsentScreen.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';

export const HealthConsentScreen = () => {
  const handleEnable = async () => {
    // 调用后端API启用同步
    await fetch('http://your-api/api/health/enable', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 请求iOS权限
    // TODO: 集成react-native-health
    
    // 导航到主页
    navigation.navigate('Home');
  };

  return (
    <View>
      <Text>ZenFit需要访问您的健康数据</Text>
      <Text>我们会读取：体重、体脂率、性别</Text>
      <Button title="同意并启用" onPress={handleEnable} />
      <Button title="暂不启用" onPress={() => navigation.goBack()} />
    </View>
  );
};
```

### 2. 设置页面开关

```typescript
// screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';

export const HealthSettings = () => {
  const [enabled, setEnabled] = useState(false);

  const toggleSync = async (value: boolean) => {
    const endpoint = value ? '/api/health/enable' : '/api/health/disable';
    await fetch(`http://your-api${endpoint}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setEnabled(value);
  };

  return (
    <View>
      <Text>健康数据同步</Text>
      <Switch value={enabled} onValueChange={toggleSync} />
    </View>
  );
};
```

### 3. 自动同步（应用启动时）

```typescript
// App.tsx
useEffect(() => {
  checkAndSync();
}, []);

const checkAndSync = async () => {
  // 检查授权
  const auth = await fetch('http://your-api/api/health/authorization', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  if (!auth.enabled) return;

  // 检查是否需要同步
  const shouldSync = await fetch('http://your-api/api/health/should-sync', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  if (shouldSync.shouldSync) {
    // TODO: 读取HealthKit数据并同步
  }
};
```

## 依赖包

```bash
npm install react-native-health
```

## iOS配置

在 `Info.plist` 添加：

```xml
<key>NSHealthShareUsageDescription</key>
<string>我们需要访问您的健康数据以优化训练计划</string>
```

## 测试后端API（无需前端）

可以使用curl直接测试：

```bash
# 启用同步
curl -X POST http://localhost:3001/api/health/enable \
  -H "Authorization: Bearer YOUR_TOKEN"

# 同步数据
curl -X POST http://localhost:3001/api/health/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weight": 75, "bodyFatPercent": 18, "gender": "male"}'

# 检查状态
curl http://localhost:3001/api/health/authorization \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 参考文档

完整实现请参考：
- [`IOS_HEALTH_DATA_PRIVACY_CONSENT.md`](./IOS_HEALTH_DATA_PRIVACY_CONSENT.md) - 详细的前端实现示例
- [`IOS_HEALTH_DATA_INTEGRATION.md`](./IOS_HEALTH_DATA_INTEGRATION.md) - 技术集成指南

## 注意事项

1. 后端API已完全可用，前端实现不影响后端功能
2. 可以先用Postman/curl测试后端API
3. 前端实现可以分阶段完成
4. HealthKit需要真实iOS设备测试（模拟器不支持）