#!/bin/bash

# ZenFit 移动端项目初始化脚本
# 使用方法: bash scripts/init-mobile-app.sh

set -e

echo "🚀 开始初始化 ZenFit 移动端项目..."
echo ""

# 检查 Node.js 版本
echo "📦 检查 Node.js 版本..."
NODE_VERSION=$(node -v)
echo "当前 Node.js 版本: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v1[8-9]\. ]] && [[ ! "$NODE_VERSION" =~ ^v2[0-9]\. ]]; then
    echo "❌ 错误: 需要 Node.js v18 或更高版本"
    exit 1
fi

echo "✅ Node.js 版本检查通过"
echo ""

# 检查是否已安装 Expo CLI
echo "📦 检查 Expo CLI..."
if ! command -v expo &> /dev/null; then
    echo "⚠️  未检测到 Expo CLI，正在安装..."
    npm install -g expo-cli
    echo "✅ Expo CLI 安装完成"
else
    echo "✅ Expo CLI 已安装"
fi
echo ""

# 创建移动端项目目录
echo "📁 创建移动端项目..."
if [ -d "mobile" ]; then
    echo "⚠️  mobile 目录已存在，跳过创建"
else
    npx create-expo-app@latest mobile --template blank-typescript
    echo "✅ 移动端项目创建完成"
fi
echo ""

# 进入移动端目录
cd mobile

# 安装核心依赖
echo "📦 安装核心依赖..."
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install axios
npx expo install @react-native-async-storage/async-storage expo-secure-store
npx expo install @react-native-community/netinfo
npm install @expo/vector-icons
npm install date-fns
npm install zod
echo "✅ 核心依赖安装完成"
echo ""

# 创建项目结构
echo "📁 创建项目结构..."
mkdir -p app/{auth,tabs}
mkdir -p components/{common,workout,anatomy}
mkdir -p services/{api,storage,sync}
mkdir -p hooks
mkdir -p context
mkdir -p types
mkdir -p constants
mkdir -p utils
echo "✅ 项目结构创建完成"
echo ""

# 创建配置文件
echo "⚙️  创建配置文件..."

# 创建 app.json
cat > app.json << 'EOF'
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
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "com.zenfit.app"
    },
    "plugins": [
      "expo-router"
    ],
    "extra": {
      "apiUrl": "http://localhost:3001"
    }
  }
}
EOF

# 创建 tsconfig.json
cat > tsconfig.json << 'EOF'
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
EOF

echo "✅ 配置文件创建完成"
echo ""

# 创建 API 客户端
echo "📝 创建 API 客户端..."
cat > services/api/client.ts << 'EOF'
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
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
EOF

echo "✅ API 客户端创建完成"
echo ""

# 返回项目根目录
cd ..

# 创建 README
echo "📝 创建 README..."
cat > mobile/README.md << 'EOF'
# ZenFit Mobile App

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npx expo start
```

### 在设备上测试
1. 安装 Expo Go App
2. 扫描终端中的二维码

### 构建应用
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 项目结构

- `app/` - 页面和路由
- `components/` - 可复用组件
- `services/` - API 和数据服务
- `hooks/` - 自定义 Hooks
- `types/` - TypeScript 类型定义

## 相关文档

- [开发指南](../docs/MOBILE_APP_SETUP_GUIDE.md)
- [实施计划](../docs/MOBILE_APP_IMPLEMENTATION_PLAN.md)
- [Railway 部署](../docs/RAILWAY_DEPLOYMENT_GUIDE.md)
EOF

echo "✅ README 创建完成"
echo ""

echo "🎉 移动端项目初始化完成！"
echo ""
echo "📋 下一步操作："
echo "1. cd mobile"
echo "2. npx expo start"
echo "3. 在手机上安装 Expo Go App"
echo "4. 扫描二维码开始开发"
echo ""
echo "📚 查看文档："
echo "- docs/MOBILE_APP_SETUP_GUIDE.md"
echo "- docs/MOBILE_APP_IMPLEMENTATION_PLAN.md"
echo "- docs/RAILWAY_DEPLOYMENT_GUIDE.md"
echo ""