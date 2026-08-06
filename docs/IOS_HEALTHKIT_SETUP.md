# iOS HealthKit 集成设置指南

## 概述

ZenFit 现在支持直接与 iOS 健康应用同步数据，包括：
- 体重
- 体脂率
- 身高
- BMI（自动计算）
- 性别

## 环境要求

- macOS 系统
- Xcode 14.0 或更高版本
- Node.js 18+ 
- iOS 14.0 或更高版本的设备/模拟器

## 安装步骤

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 初始化 Capacitor iOS 项目

```bash
# 构建 React 应用
npm run build

# 添加 iOS 平台
npx cap add ios

# 同步代码到 iOS 项目
npx cap sync ios
```

### 3. 配置 iOS HealthKit 权限

在 Xcode 中打开 iOS 项目：

```bash
npx cap open ios
```

#### 3.1 启用 HealthKit 功能

1. 在 Xcode 中选择项目 target
2. 选择 "Signing & Capabilities" 标签
3. 点击 "+ Capability"
4. 添加 "HealthKit"

#### 3.2 配置 Info.plist 权限说明

在 `ios/App/App/Info.plist` 中添加以下权限说明：

```xml
<key>NSHealthShareUsageDescription</key>
<string>ZenFit 需要访问您的健康数据来提供个性化的训练建议和体重追踪</string>

<key>NSHealthUpdateUsageDescription</key>
<string>ZenFit 可以将训练数据写入健康应用，帮助您全面追踪健康状况</string>
```

或者通过 Xcode 界面配置：
1. 选择 `Info.plist` 文件
2. 添加以下键值：
   - `Privacy - Health Share Usage Description`
   - `Privacy - Health Update Usage Description`

### 4. 构建并运行

```bash
# 在模拟器上运行
npx cap run ios

# 或在 Xcode 中选择设备后点击运行
```

## 开发调试

### 实时重新加载（Live Reload）

在开发过程中，可以启用实时重新加载：

```bash
# 启动开发服务器
npm run dev

# 在另一个终端，启用 live reload
npx cap run ios --livereload --external
```

### 在真实设备上测试 HealthKit

**注意：HealthKit 在 iOS 模拟器上的功能有限，建议在真实设备上测试。**

1. 连接 iOS 设备到 Mac
2. 在 Xcode 中选择您的设备
3. 确保设备已启用开发者模式
4. 点击运行按钮

## 功能说明

### 数据同步流程

1. **首次使用**
   - 用户进入"健康数据同步"页面
   - 点击"启用健康数据同步"
   - 系统请求 HealthKit 授权
   - 授权成功后自动读取最新数据

2. **自动同步**
   - 每次打开应用时会自动同步
   - 显示最后同步时间

3. **手动同步**
   - 点击"立即同步"按钮
   - 从 HealthKit 读取最新数据

4. **手动输入**
   - 用户可以手动输入体重和体脂率
   - 数据会同时保存到 ZenFit 和 iOS 健康应用

### 权限管理

用户可以随时在 iOS 设置中管理权限：
1. 打开 iOS "设置" 应用
2. 选择 "隐私与安全性"
3. 选择 "健康"
4. 选择 "ZenFit"
5. 管理数据访问权限

## 故障排除

### 问题：HealthKit 授权失败

**解决方案：**
1. 检查是否在 iOS 设备上运行（模拟器可能有限制）
2. 确认 Info.plist 中已添加权限说明
3. 检查 Xcode 中是否启用了 HealthKit capability

### 问题：无法读取数据

**解决方案：**
1. 确认 Health 应用中有数据
2. 检查授权状态，可能需要重新授权
3. 查看 Xcode 控制台日志获取详细错误信息

### 问题：无法保存数据

**解决方案：**
1. 确认 HealthKit 有写入权限
2. 检查数据格式是否正确
3. 确认没有在模拟器上测试（某些功能受限）

## 技术实现

### 核心组件

1. **HealthKitService** (`src/services/HealthKitService.ts`)
   - 封装所有 HealthKit API 调用
   - 处理授权和数据读写

2. **useHealthKit Hook** (`src/hooks/useHealthKit.ts`)
   - React Hook，方便组件使用
   - 管理状态和自动刷新

3. **HealthSettingsPage** (`src/pages/HealthSettingsPage.tsx`)
   - 用户界面
   - 显示数据和处理交互

### 依赖包

```json
{
  "@capacitor/core": "^5.0.0",
  "@capacitor/ios": "^5.0.0",
  "@ionic-native/health": "^5.36.0",
  "cordova-plugin-health": "^2.0.0"
}
```

## 隐私和安全

- 所有 HealthKit 数据访问都需要用户明确授权
- ZenFit 只读取必要的健康数据（体重、体脂等）
- 用户可以随时撤销授权
- 数据仅用于个性化训练建议，不会上传到第三方服务器

## 参考文档

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Ionic Native Health Plugin](https://ionicframework.com/docs/native/health)
