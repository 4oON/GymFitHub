# 📱 ZenFit 移动端开发指南

## 🎯 技术栈

- **框架**: Expo + React Native
- **语言**: TypeScript
- **导航**: React Navigation
- **状态管理**: React Hooks + Context API
- **数据存储**: AsyncStorage + Expo SecureStore
- **网络请求**: Axios
- **UI 组件**: React Native + 自定义组件

---

## 🚀 快速开始

### 前置要求

1. **Node.js**: v18 或更高版本
2. **npm** 或 **yarn**
3. **Expo CLI**: 全局安装
4. **Expo Go App**: 在手机上安装（用于测试）

### 安装 Expo CLI

```bash
npm install -g expo-cli
# 或
npm install -g eas-cli
```

### 创建移动端项目

```bash
# 在项目根目录
npx create-expo-app@latest mobile --template blank-typescript

cd mobile
```

---

## 📦 安装依赖

### 核心依赖

```bash
# 导航
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# Expo 依赖
npx expo install react-native-screens react-native-safe-area-context

# 网络请求
npm install axios

# 数据存储
npx expo install @react-native-async-storage/async-storage expo-secure-store

# 网络状态
npx expo install @react-native-community/netinfo

# 图标
npm install @expo/vector-icons

# 日期处理
npm install date-fns

# 表单验证
npm install zod
```

---

## 📁 项目结构

```
mobile/
├── app/                      # Expo Router 页面
│   ├── (auth)/              # 认证相关页面
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/              # 主应用标签页
│   │   ├── index.tsx        # 首页
│   │   ├── workout.tsx      # 训练页面
│   │   ├── history.tsx      # 历史记录
│   │   └── profile.tsx      # 个人资料
│   └── _layout.tsx          # 根布局
│
├── components/              # 可复用组件
│   ├── common/             # 通用组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── workout/            # 训练相关组件
│   │   ├── ExerciseCard.tsx
│   │   ├── SetTracker.tsx
│   │   └── Timer.tsx
│   └── anatomy/            # 肌肉解剖图组件
│       └── MuscleSelector.tsx
│
├── services/               # 服务层
│   ├── api/               # API 客户端
│   │   ├── client.ts      # Axios 配置
│   │   ├── auth.ts        # 认证 API
│   │   ├── workout.ts     # 训练 API
│   │   └── profile.ts     # 用户资料 API
│   ├── storage/           # 本地存储
│   │   ├── secureStorage.ts
│   │   └── asyncStorage.ts
│   └── sync/              # 数据同步
│       └── syncService.ts
│
├── hooks/                 # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useWorkout.ts
│   ├── useSync.ts
│   └── useNetworkStatus.ts
│
├── context/               # React Context
│   ├── AuthContext.tsx
│   └── WorkoutContext.tsx
│
├── types/                 # TypeScript 类型定义
│   ├── workout.ts
│   ├── user.ts
│   └── api.ts
│
├── constants/             # 常量配置
│   ├── colors.ts
│   ├── exercises.ts
│   └── config.ts
│
├── utils/                 # 工具函数
│   ├── validation.ts
│   └── formatting.ts
│
├── app.json              # Expo 配置
├── package.json
└── tsconfig.json
```

---

## ⚙️ 配置文件

### app.json

```json
{
  "expo": {
    "name": "ZenFit",
    "slug": "zenfit",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.zenfit.app",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "ZenFit 需要访问相机以拍摄训练照片",
        "NSPhotoLibraryUsageDescription": "ZenFit 需要访问相册以保存训练记录"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "com.zenfit.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router"
    ],
    "extra": {
      "apiUrl": "https://your-railway-domain.railway.app",
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["./components/*"],
      "@services/*": ["./services/*"],
      "@hooks/*": ["./hooks/*"],
      "@types/*": ["./types/*"],
      "@utils/*": ["./utils/*"],
      "@constants/*": ["./constants/*"]
    }
  }
}
```

---

## 🔧 核心服务实现

### API 客户端

创建 `services/api/client.ts`:

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除并跳转登录
      await SecureStore.deleteItemAsync('auth_token');
      // 触发登录页面导航
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 认证服务

创建 `services/api/auth.ts`:

```typescript
import apiClient from './client';
import * as SecureStore from 'expo-secure-store';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post('/api/auth/login', credentials);
    const { token, user } = response.data;
    
    // 安全存储 token
    await SecureStore.setItemAsync('auth_token', token);
    
    return { token, user };
  },

  async register(data: RegisterData) {
    const response = await apiClient.post('/api/auth/register', data);
    const { token, user } = response.data;
    
    await SecureStore.setItemAsync('auth_token', token);
    
    return { token, user };
  },

  async logout() {
    await SecureStore.deleteItemAsync('auth_token');
  },

  async getToken() {
    return await SecureStore.getItemAsync('auth_token');
  },
};
```

### 数据同步服务

创建 `services/sync/syncService.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from '../api/client';

interface SyncQueueItem {
  id: string;
  action: string;
  data: any;
  timestamp: number;
  retries: number;
}

class SyncService {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private maxRetries = 3;

  async initialize() {
    // 加载同步队列
    const queue = await AsyncStorage.getItem('sync_queue');
    if (queue) {
      this.syncQueue = JSON.parse(queue);
    }

    // 监听网络状态
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.sync();
      }
    });
  }

  async addToQueue(action: string, data: any) {
    const item: SyncQueueItem = {
      id: Date.now().toString(),
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(item);
    await this.saveQueue();

    // 如果在线，立即同步
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.sync();
    }
  }

  async sync() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    const failedItems: SyncQueueItem[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.processItem(item);
      } catch (error) {
        console.error(`Sync failed for ${item.action}:`, error);
        
        if (item.retries < this.maxRetries) {
          failedItems.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    this.syncQueue = failedItems;
    await this.saveQueue();
    this.isSyncing = false;
  }

  private async processItem(item: SyncQueueItem) {
    switch (item.action) {
      case 'CREATE_WORKOUT':
        await apiClient.post('/api/workout', item.data);
        break;
      case 'UPDATE_PROFILE':
        await apiClient.put('/api/profile', item.data);
        break;
      case 'DELETE_WORKOUT':
        await apiClient.delete(`/api/workout/${item.data.id}`);
        break;
      default:
        console.warn(`Unknown sync action: ${item.action}`);
    }
  }

  private async saveQueue() {
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
  }

  getQueueLength() {
    return this.syncQueue.length;
  }
}

export const syncService = new SyncService();
```

---

## 🎨 UI 组件示例

### 自定义按钮

创建 `components/common/Button.tsx`:

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#10b981',
  },
  secondary: {
    backgroundColor: '#64748b',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#10b981',
  },
});
```

---

## 🧪 开发和测试

### 启动开发服务器

```bash
cd mobile
npx expo start
```

### 在设备上测试

1. **iOS**: 在 Expo Go App 中扫描二维码
2. **Android**: 在 Expo Go App 中扫描二维码
3. **iOS 模拟器**: 按 `i`
4. **Android 模拟器**: 按 `a`

### 调试

```bash
# 打开 React Native Debugger
npx react-devtools

# 查看日志
npx expo start --dev-client
```

---

## 📱 构建和发布

### 使用 EAS Build

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录
eas login

# 配置项目
eas build:configure

# 构建 iOS
eas build --platform ios

# 构建 Android
eas build --platform android
```

---

## 🔍 故障排查

### 常见问题

**1. Metro Bundler 启动失败**
```bash
# 清除缓存
npx expo start -c
```

**2. 依赖安装失败**
```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json
npm install
```

**3. iOS 构建失败**
```bash
# 清除 iOS 构建缓存
cd ios && pod install && cd ..
```

---

## 📚 相关资源

- [Expo 文档](https://docs.expo.dev)
- [React Native 文档](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [Axios 文档](https://axios-http.com)

---

**最后更新**: 2024-12-24  
**维护者**: ZenFit 开发团队