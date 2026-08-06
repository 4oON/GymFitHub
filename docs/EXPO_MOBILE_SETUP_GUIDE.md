# ZenFit Expo 移动端完整设置指南

## 📱 项目概述

ZenFit 移动端使用 **Expo** 和 **React Native** 构建，连接到已部署在 Railway 的后端 API。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd mobile
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Railway 后端 URL：

```env
API_URL=https://your-railway-app.railway.app
API_TIMEOUT=10000
```

**重要**: 同时需要在 `app.json` 中更新 `extra.apiUrl`：

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-railway-app.railway.app"
    }
  }
}
```

### 3. 启动开发服务器

```bash
npm start
```

这将启动 Expo 开发服务器，你会看到一个二维码。

---

## 📲 在设备上运行

### iOS (需要 Mac)

```bash
npm run ios
```

或者：
1. 在 App Store 下载 **Expo Go** 应用
2. 使用 Expo Go 扫描终端中的二维码

### Android

```bash
npm run android
```

或者：
1. 在 Google Play 下载 **Expo Go** 应用
2. 使用 Expo Go 扫描终端中的二维码

### Web (浏览器预览)

```bash
npm run web
```

---

## 📁 项目结构

```
mobile/
├── app/                          # Expo Router 页面
│   ├── _layout.tsx              # 根布局
│   ├── index.tsx                # 欢迎页面
│   ├── (auth)/                  # 认证相关页面
│   │   ├── login.tsx           # 登录页面
│   │   └── register.tsx        # 注册页面
│   └── (tabs)/                  # 主应用标签页
│       ├── _layout.tsx         # 标签页布局
│       ├── index.tsx           # 训练列表页
│       └── profile.tsx         # 个人资料页
├── src/
│   └── services/
│       └── api.ts              # API 服务（连接 Railway 后端）
├── app.json                     # Expo 配置
├── package.json                 # 依赖配置
├── tsconfig.json               # TypeScript 配置
└── .env                        # 环境变量（需要创建）
```

---

## 🔌 API 服务说明

### API 服务位置
`mobile/src/services/api.ts`

### 主要功能

#### 1. 自动添加 JWT Token
所有请求自动从 AsyncStorage 读取 token 并添加到请求头：

```typescript
Authorization: Bearer <token>
```

#### 2. 自动处理 401 错误
当 token 过期时，自动清除本地存储并可以导航到登录页。

#### 3. 可用的 API 方法

**认证相关**:
- `ApiService.register(email, password, name)` - 注册
- `ApiService.login(email, password)` - 登录
- `ApiService.logout()` - 退出登录
- `ApiService.getCurrentUser()` - 获取当前用户

**用户资料**:
- `ApiService.getProfile()` - 获取用户资料
- `ApiService.updateProfile(data)` - 更新用户资料

**训练计划**:
- `ApiService.getWorkouts()` - 获取所有训练
- `ApiService.getWorkout(id)` - 获取单个训练
- `ApiService.createWorkout(data)` - 创建训练
- `ApiService.updateWorkout(id, data)` - 更新训练
- `ApiService.deleteWorkout(id)` - 删除训练

**AI 推荐**:
- `ApiService.getAIRecommendation(prompt)` - 获取 AI 推荐

### 使用示例

```typescript
import { ApiService } from '../src/services/api';

// 登录
const handleLogin = async () => {
  try {
    const result = await ApiService.login(email, password);
    console.log('登录成功:', result);
    // Token 已自动保存到 AsyncStorage
  } catch (error) {
    console.error('登录失败:', error);
  }
};

// 获取训练列表
const loadWorkouts = async () => {
  try {
    const workouts = await ApiService.getWorkouts();
    console.log('训练列表:', workouts);
  } catch (error) {
    console.error('加载失败:', error);
  }
};
```

---

## 🎨 页面说明

### 1. 欢迎页面 (`app/index.tsx`)
- 检查用户是否已登录
- 已登录：自动跳转到主页
- 未登录：显示登录/注册按钮

### 2. 登录页面 (`app/(auth)/login.tsx`)
- 邮箱和密码输入
- 调用 `ApiService.login()`
- 登录成功后跳转到主页

### 3. 注册页面 (`app/(auth)/register.tsx`)
- 姓名、邮箱、密码输入
- 密码确认验证
- 调用 `ApiService.register()`
- 注册成功后跳转到登录页

### 4. 训练列表页 (`app/(tabs)/index.tsx`)
- 显示用户的所有训练计划
- 调用 `ApiService.getWorkouts()`
- 可以退出登录

### 5. 个人资料页 (`app/(tabs)/profile.tsx`)
- 显示用户信息
- 显示训练统计
- 退出登录功能

---

## 🔧 常见问题

### 1. TypeScript 错误

在安装依赖之前，TypeScript 会报错找不到模块。这是正常的，运行 `npm install` 后错误会消失。

### 2. 无法连接到后端

**检查清单**:
- ✅ Railway 后端是否正常运行？
- ✅ `app.json` 中的 `apiUrl` 是否正确？
- ✅ 后端 URL 是否以 `https://` 开头？
- ✅ 网络连接是否正常？

**测试后端连接**:
```bash
curl https://your-railway-app.railway.app/api/health
```

应该返回:
```json
{"status":"ok","timestamp":"..."}
```

### 3. Expo Go 无法扫描二维码

- 确保手机和电脑在同一个 WiFi 网络
- 尝试使用 Tunnel 模式：`npx expo start --tunnel`
- 或者直接输入 URL 到 Expo Go 应用

### 4. iOS 模拟器无法启动

需要安装 Xcode：
```bash
xcode-select --install
```

### 5. Android 模拟器无法启动

需要安装 Android Studio 和配置 Android SDK。

---

## 📦 构建生产版本

### iOS (需要 Apple Developer 账号)

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 配置项目
eas build:configure

# 构建 iOS 应用
eas build --platform ios
```

### Android

```bash
# 构建 APK
eas build --platform android --profile preview

# 构建 AAB (用于 Google Play)
eas build --platform android
```

---

## 🔄 数据同步

### 本地存储
使用 `@react-native-async-storage/async-storage` 存储：
- JWT Token
- 用户信息

### 自动同步
- 登录时：保存 token 和用户信息
- 退出时：清除所有本地数据
- 每次 API 请求：自动附加 token

---

## 🚨 安全注意事项

1. **不要提交 `.env` 文件到 Git**
   - 已在 `.gitignore` 中排除

2. **使用 HTTPS**
   - Railway 自动提供 HTTPS
   - 确保 API_URL 使用 `https://`

3. **Token 管理**
   - Token 存储在设备本地
   - 退出登录时自动清除
   - Token 过期时自动处理

---

## 📚 相关文档

- [Expo 官方文档](https://docs.expo.dev/)
- [React Native 文档](https://reactnative.dev/)
- [Expo Router 文档](https://docs.expo.dev/router/introduction/)
- [Railway 部署指南](./RAILWAY_DEPLOYMENT_GUIDE.md)

---

## 🆘 获取帮助

### 查看日志

**开发模式**:
```bash
npm start
# 按 'j' 打开 Chrome DevTools
```

**查看 API 请求**:
在 `api.ts` 中添加日志：
```typescript
api.interceptors.request.use(config => {
  console.log('API Request:', config.url, config.data);
  return config;
});
```

### 常用命令

```bash
# 清除缓存
npx expo start -c

# 重新安装依赖
rm -rf node_modules
npm install

# 查看 Expo 版本
npx expo --version

# 更新 Expo
npx expo install expo@latest
```

---

## ✅ 下一步

1. **测试登录流程**
   - 注册新账号
   - 登录
   - 查看训练列表

2. **自定义样式**
   - 修改 `StyleSheet` 中的颜色和字体
   - 添加自定义图标

3. **添加新功能**
   - 创建训练页面
   - 训练详情页面
   - AI 推荐页面

4. **准备发布**
   - 配置应用图标和启动画面
   - 使用 EAS Build 构建生产版本
   - 提交到 App Store / Google Play

---

## 🎉 完成！

你的 ZenFit 移动端应用已经准备就绪！

**快速启动**:
```bash
cd mobile
npm install
npm start
```

然后使用 Expo Go 扫描二维码即可在手机上查看应用！