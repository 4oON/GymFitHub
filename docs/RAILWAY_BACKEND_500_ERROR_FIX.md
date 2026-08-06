# Railway后端500错误修复指南

## 问题描述

**症状**：
- Vercel前端无法显示最新的训练记录（1月6号数据）
- 浏览器控制台显示：
  ```
  Failed to load routines from backend: Error: Internal server error
  Failed to load workouts from backend: Error: Internal server error
  ```
- 前端只能显示本地缓存的旧数据（9个本地session，0个远程session）

**根本原因**：Railway后端API返回500错误，无法从数据库读取数据

## 可能的原因

### 1. Prisma客户端未生成（最可能）

Railway部署时可能没有运行`prisma generate`命令，导致Prisma客户端不可用。

**检查方法**：
查看Railway部署日志，确认是否有以下输出：
```
✔ Generated Prisma Client
```

**修复方法**：
在`package.json`中添加postinstall脚本：

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && tsc",
    "start": "node dist/index.js",
    "dev": "nodemon"
  }
}
```

### 2. 数据库连接问题

Railway可能无法连接到Supabase数据库。

**检查方法**：
1. 登录Railway控制台
2. 查看后端服务的日志
3. 搜索数据库连接错误：
   ```
   Error: P1001: Can't reach database server
   Error: P1017: Server has closed the connection
   ```

**修复方法**：
确认Railway环境变量中的`DATABASE_URL`配置正确：
```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**注意**：
- 使用Session Pooler端口：`6543`
- 添加`pgbouncer=true`参数
- 添加`connection_limit=1`参数（Railway限制）

### 3. 数据库迁移未执行

数据库表可能不存在或结构不匹配。

**检查方法**：
在Railway控制台执行：
```bash
npx prisma migrate status
```

**修复方法**：
```bash
# 方法1：执行所有pending migrations
npx prisma migrate deploy

# 方法2：如果需要重置（⚠️ 会删除所有数据）
npx prisma migrate reset --force
```

### 4. 环境变量缺失

Railway可能缺少必要的环境变量。

**必需的环境变量**：
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3001
```

## 修复步骤

### 步骤1：更新package.json

在`backend/package.json`中添加postinstall脚本：

```json
{
  "name": "zenfit-backend",
  "version": "1.0.0",
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && tsc",
    "start": "node dist/index.js",
    "dev": "nodemon",
    "migrate": "prisma migrate deploy"
  }
}
```

### 步骤2：检查Railway环境变量

1. 登录Railway控制台
2. 进入后端服务 → Variables
3. 确认以下变量存在且正确：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### 步骤3：重新部署Railway

```bash
# 提交更改
git add backend/package.json
git commit -m "fix: 添加Prisma postinstall脚本修复Railway部署"
git push origin feature/ios-health-data-sync

# Railway会自动触发重新部署
```

### 步骤4：验证修复

部署完成后，检查Railway日志：

**成功标志**：
```
✔ Generated Prisma Client (targets: /app/node_modules/.prisma/client)
Server running on port 3001
Database connected successfully
```

**测试API**：
```bash
# 测试健康检查
curl https://kilo-zenfit-production.up.railway.app/api/health

# 测试workout API（需要token）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kilo-zenfit-production.up.railway.app/api/workout
```

### 步骤5：清除前端缓存

修复后端后，用户需要清除浏览器缓存：

1. 在Vercel网站上按`Ctrl+Shift+R`（Windows）或`Cmd+Shift+R`（Mac）
2. 或者清除浏览器缓存：
   - Chrome: Settings → Privacy and security → Clear browsing data
   - 选择"Cached images and files"
   - 时间范围选择"All time"

## 验证清单

部署后验证以下内容：

- [ ] Railway日志显示"Generated Prisma Client"
- [ ] Railway日志显示"Database connected successfully"
- [ ] `/api/health`端点返回200状态码
- [ ] `/api/workout`端点返回数据（需要认证）
- [ ] Vercel前端可以加载最新的训练记录
- [ ] 浏览器控制台没有500错误

## 调试技巧

### 查看Railway日志

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 查看实时日志
railway logs
```

### 测试数据库连接

在Railway控制台执行：
```bash
npx prisma db pull
```

如果成功，说明数据库连接正常。

### 检查Prisma客户端

在Railway控制台执行：
```bash
ls -la node_modules/.prisma/client
```

如果目录不存在，说明Prisma客户端未生成。

## 预防措施

### 1. 添加健康检查端点

在`backend/src/routes/health.ts`中添加数据库连接检查：

```typescript
router.get('/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});
```

### 2. 添加启动检查

在`backend/src/index.ts`中添加：

```typescript
// 启动时检查数据库连接
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

checkDatabaseConnection();
```

### 3. 配置Railway构建命令

在Railway项目设置中：
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Install Command**: `npm install`（会自动运行postinstall）

## 相关文档

- [Railway部署指南](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [Prisma部署文档](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)
- [Supabase连接池配置](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**创建时间**：2026-01-06  
**最后更新**：2026-01-06  
**状态**：待执行