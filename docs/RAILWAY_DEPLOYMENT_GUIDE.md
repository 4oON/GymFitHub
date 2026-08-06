# 🚂 Railway 后端部署指南

## 📋 前置准备

### 1. 注册 Railway 账号
- 访问 [https://railway.app](https://railway.app)
- 使用 GitHub 账号登录（推荐）
- 免费额度：500小时/月运行时间

### 2. 准备 Supabase 数据库
- 访问 [https://supabase.com](https://supabase.com)
- 创建新项目
- 获取数据库连接字符串（DATABASE_URL）

---

## 🚀 部署步骤

### 步骤 1: 创建 Railway 项目

1. 登录 Railway Dashboard
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权 Railway 访问您的 GitHub
5. 选择 `zenfit` 仓库
6. 选择 `mobile-app-development` 分支

### 步骤 2: 配置环境变量

在 Railway 项目设置中添加以下环境变量：

```env
# 数据库连接
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# 端口配置
PORT=3001

# 运行环境
NODE_ENV=production

# Gemini AI API Key（如果使用 AI 功能）
GEMINI_API_KEY=your_gemini_api_key_here
```

#### 如何生成 JWT_SECRET：
```bash
# 在终端运行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 步骤 3: 配置构建设置

Railway 会自动检测 Node.js 项目，但我们需要确保配置正确：

**Root Directory**: `/backend`（如果 Railway 没有自动检测）

**Build Command**: 
```bash
npm install && npm run build
```

**Start Command**:
```bash
npm start
```

### 步骤 4: 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，Railway 会提供一个公网域名

示例域名：
```
https://zenfit-backend-production.up.railway.app
```

### 步骤 5: 测试部署

使用以下命令测试 API：

```bash
# 健康检查
curl https://your-railway-domain.railway.app/api/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2024-12-24T15:30:00.000Z",
  "database": "connected"
}
```

---

## 🔧 配置 Prisma 数据库

### 在 Railway 中运行数据库迁移

1. 在 Railway Dashboard 中打开项目
2. 点击 **"Settings"** → **"Deploy Triggers"**
3. 添加部署后钩子：

```bash
npx prisma migrate deploy
```

或者手动运行：

1. 在本地终端：
```bash
cd backend
DATABASE_URL="your_railway_database_url" npx prisma migrate deploy
```

---

## 📊 监控和日志

### 查看实时日志

1. 在 Railway Dashboard 中打开项目
2. 点击 **"Deployments"** 标签
3. 选择最新的部署
4. 查看实时日志输出

### 常见日志信息

```
✅ 成功启动：
🚀 ZenFit Backend Server is running on http://localhost:3001
📊 Health check: http://localhost:3001/api/health

❌ 数据库连接失败：
Error: P1001: Can't reach database server
解决方案：检查 DATABASE_URL 是否正确

❌ 端口冲突：
Error: listen EADDRINUSE: address already in use :::3001
解决方案：Railway 会自动分配端口，无需担心
```

---

## 🔐 安全配置

### 1. CORS 配置

确保后端允许移动端访问：

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'http://localhost:5173',      // Web 开发环境
    'http://localhost:3000',      // 备用端口
    'exp://192.168.*.*:8081',     // Expo 开发环境
    'https://your-production-domain.com'  // 生产环境
  ],
  credentials: true,
}));
```

### 2. 环境变量安全

- ✅ 使用 Railway 的环境变量管理
- ✅ 不要在代码中硬编码敏感信息
- ✅ 定期更换 JWT_SECRET
- ✅ 使用强密码

---

## 📈 性能优化

### 1. 启用数据库连接池

```typescript
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // 连接池配置
  connection_limit = 10
  pool_timeout = 20
}
```

### 2. 添加请求缓存

```typescript
// backend/src/middleware/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10分钟缓存

export const cacheMiddleware = (duration: number) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    res.originalJson = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.originalJson(body);
    };
    
    next();
  };
};
```

---

## 🐛 故障排查

### 问题 1: 部署失败

**症状**: 构建过程中出错

**解决方案**:
```bash
# 检查 package.json 中的脚本
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  }
}

# 确保 tsconfig.json 配置正确
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### 问题 2: 数据库连接失败

**症状**: `P1001: Can't reach database server`

**解决方案**:
1. 检查 Supabase 数据库是否在线
2. 验证 DATABASE_URL 格式：
```
postgresql://user:password@host:5432/database?pgbouncer=true
```
3. 确保 Supabase 允许外部连接

### 问题 3: API 请求超时

**症状**: 移动端请求超时

**解决方案**:
1. 检查 Railway 服务是否在运行
2. 增加请求超时时间：
```typescript
// mobile/src/services/api.ts
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30秒
});
```

---

## 📱 连接移动端

### 配置 API 地址

在移动端项目中配置 Railway 后端地址：

```typescript
// mobile/app.json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-railway-domain.railway.app"
    }
  }
}
```

### 测试连接

```typescript
// mobile/src/services/api.ts
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

// 测试连接
const testConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    console.log('✅ Backend connected:', data);
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
  }
};
```

---

## 💰 成本管理

### 免费额度

- **运行时间**: 500小时/月
- **内存**: 512MB
- **CPU**: 共享
- **带宽**: 100GB/月

### 监控使用量

1. 在 Railway Dashboard 查看使用统计
2. 设置使用量警报
3. 优化代码减少资源消耗

### 升级到 Pro（可选）

- **费用**: $5/月
- **运行时间**: 无限制
- **内存**: 8GB
- **优先支持**

---

## 🔄 持续部署

### 自动部署配置

Railway 默认启用自动部署：

1. 推送代码到 GitHub
2. Railway 自动检测更改
3. 自动构建和部署
4. 零停机时间

### 手动部署

如果需要手动触发部署：

1. 在 Railway Dashboard 中打开项目
2. 点击 **"Deployments"**
3. 点击 **"Deploy"** 按钮

---

## 📚 相关资源

- [Railway 官方文档](https://docs.railway.app)
- [Supabase 文档](https://supabase.com/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Express.js 文档](https://expressjs.com)

---

## ✅ 部署检查清单

- [ ] Railway 账号已创建
- [ ] Supabase 数据库已配置
- [ ] 环境变量已设置
- [ ] 数据库迁移已运行
- [ ] API 健康检查通过
- [ ] CORS 配置正确
- [ ] 移动端可以连接后端
- [ ] 日志监控正常

---

**最后更新**: 2024-12-24  
**维护者**: ZenFit 开发团队