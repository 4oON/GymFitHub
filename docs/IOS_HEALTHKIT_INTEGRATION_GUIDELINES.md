# iOS HealthKit集成指南

## 🎯 核心原则

### ⚠️ 重要：只读权限

**ZenFit应用只能从iOS健康应用读取数据，绝对不能写入数据到iOS健康应用。**

这是一个核心设计原则，必须在所有开发阶段严格遵守。

## 📖 设计理念

### 为什么只读？

1. **数据完整性** - iOS健康应用是用户健康数据的唯一真实来源
2. **避免冲突** - 防止ZenFit的数据覆盖或污染健康应用的数据
3. **用户信任** - 用户完全掌控自己的健康数据
4. **简单明确** - 单向数据流，避免同步冲突

### 数据流向

```
iOS健康应用（唯一数据源）
    ↓
  【只读】
    ↓
ZenFit应用（读取并使用）
    ↓
ZenFit后端数据库（存储副本用于分析）
```

## 🔧 实现要求

### HealthKit权限配置

在未来实现iOS HealthKit集成时，必须：

1. **只请求读取权限**
   ```swift
   // ✅ 正确：只请求读取权限
   let typesToRead: Set<HKSampleType> = [
       HKObjectType.quantityType(forIdentifier: .bodyMass)!,
       HKObjectType.quantityType(forIdentifier: .bodyFatPercentage)!,
       HKObjectType.characteristicType(forIdentifier: .biologicalSex)!
   ]
   
   healthStore.requestAuthorization(
       toShare: nil,  // ⚠️ 重要：不请求写入权限
       read: typesToRead
   )
   ```

2. **不请求写入权限**
   ```swift
   // ❌ 错误：不要这样做
   let typesToShare: Set<HKSampleType> = [...]
   healthStore.requestAuthorization(
       toShare: typesToShare,  // ❌ 禁止
       read: typesToRead
   )
   ```

### Info.plist配置

```xml
<!-- ✅ 只配置读取权限说明 -->
<key>NSHealthShareUsageDescription</key>
<string>ZenFit需要读取您的体重、体脂率等健康数据，以便为您提供个性化的训练计划。我们不会修改您的健康数据。</string>

<!-- ❌ 不要添加写入权限说明 -->
<!-- <key>NSHealthUpdateUsageDescription</key> -->
<!-- <string>...</string> -->
```

## 📱 用户界面说明

### 授权页面文案

在HealthSettingsPage中，必须清楚说明：

```
✅ 推荐文案：
"ZenFit将从iOS健康应用读取您的健康数据（体重、体脂率等），
用于计算个性化的训练重量。我们只读取数据，不会修改您的健康应用中的任何信息。"

❌ 避免的文案：
"同步健康数据" - 可能让用户误以为是双向同步
"更新健康数据" - 暗示会写入数据
```

### 手动输入功能的说明

当前实现的"手动同步数据"功能：
- ✅ 数据只存储在ZenFit后端
- ✅ 不会写入iOS健康应用
- ✅ 用于用户手动补充数据或在没有iOS设备时使用

应该添加明确说明：
```
"手动输入的数据仅保存在ZenFit中，不会同步到iOS健康应用。"
```

## 🔄 数据同步策略

### 读取策略

1. **自动读取**
   - 每天打开应用时自动从iOS健康应用读取最新数据
   - 只读取最新的数据点
   - 存储到ZenFit后端用于历史分析

2. **手动读取**
   - 用户可以随时点击"从健康应用读取"按钮
   - 立即获取最新数据

3. **手动输入**
   - 作为补充方式，不依赖iOS健康应用
   - 数据只存在ZenFit中
   - 适用于：
     - 没有iOS设备的用户
     - iOS健康应用中没有数据
     - 用户想要补充额外信息

### 数据存储

```
ZenFit数据库
├── 从iOS健康应用读取的数据
│   ├── 标记来源：iOS Health
│   ├── 只读，不可修改
│   └── 用于训练计划计算
└── 用户手动输入的数据
    ├── 标记来源：Manual Input
    ├── 可以修改
    └── 作为补充数据
```

## 🚫 禁止的操作

### 绝对不能做的事情

1. ❌ 写入数据到iOS健康应用
2. ❌ 修改iOS健康应用中的现有数据
3. ❌ 删除iOS健康应用中的数据
4. ❌ 请求HealthKit写入权限
5. ❌ 使用任何HealthKit的save/delete方法

### 代码审查检查点

在代码审查时，必须确认：
- [ ] 没有调用`HKHealthStore.save()`
- [ ] 没有调用`HKHealthStore.delete()`
- [ ] 没有请求`toShare`权限
- [ ] Info.plist中没有`NSHealthUpdateUsageDescription`
- [ ] UI文案明确说明只读取数据

## 📋 未来实现清单

### Phase 1: iOS HealthKit集成（只读）

- [ ] 配置HealthKit权限（只读）
- [ ] 实现数据读取功能
  - [ ] 读取体重
  - [ ] 读取体脂率
  - [ ] 读取性别
- [ ] 添加数据来源标记
- [ ] 更新UI说明文案
- [ ] 测试只读权限

### Phase 2: 用户体验优化

- [ ] 添加"从健康应用读取"按钮
- [ ] 显示数据来源（iOS Health vs Manual）
- [ ] 添加数据更新时间
- [ ] 优化错误提示

### Phase 3: 数据分析

- [ ] 使用健康数据计算训练重量
- [ ] 体重趋势分析
- [ ] 训练效果评估

## 📚 参考资料

### Apple官方文档

- [HealthKit Framework](https://developer.apple.com/documentation/healthkit)
- [Protecting User Privacy](https://developer.apple.com/documentation/healthkit/protecting_user_privacy)
- [Reading Data from HealthKit](https://developer.apple.com/documentation/healthkit/reading_data_from_healthkit)

### 最佳实践

1. **最小权限原则** - 只请求必需的读取权限
2. **透明度** - 清楚告知用户数据用途
3. **用户控制** - 用户可随时撤销权限
4. **数据安全** - 加密存储读取的数据

## ⚖️ 法律和隐私

### GDPR合规

- ✅ 明确告知数据收集目的
- ✅ 获得用户明确同意
- ✅ 允许用户随时撤销授权
- ✅ 允许用户删除数据

### Apple审核要求

- ✅ 清楚说明HealthKit数据用途
- ✅ 不能将健康数据用于广告
- ✅ 不能出售健康数据
- ✅ 必须有隐私政策

## 🎯 总结

**核心原则：ZenFit是iOS健康应用的消费者，不是生产者。**

我们读取健康数据来提供更好的训练建议，但永远不会修改用户在iOS健康应用中的数据。这确保了：
- 用户数据的完整性
- 用户对健康数据的完全控制
- 应用的可信度
- 符合Apple的设计理念

---

**最后更新：** 2026-01-06  
**版本：** 1.0  
**状态：** 设计阶段