# Railway 部署故障排查指南

## 🚨 常见部署错误及解决方案

### 错误 1: "Deployment failed during the build process"

**症状**: 
- Railway 显示构建失败
- 没有详细的错误信息
- 0 Variables 显示

**原因**:
1. Railway 无法找到正确的 `package.json`（项目在子目录 `backend/`）
2. 缺少必要的环境变量
3. Prisma 数据库配置问题

**解决方案**:

#### 步骤 1: 检查项目结构

确保你的项目有以下文件：
```
zenfit/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── prisma/
│       └── schema.prisma
├── railway.json
└── nixpacks.toml  ← 新增的配置文件
```

#### 步骤 2: 配置环境变量

在 Railway 项目设置中添加以下环境变量：

**必需变量**:
```bash
# 数据库连接（从 Supabase 获取）
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=your-super-secret-jwt-key-here

# Node 环境
NODE_ENV=production

# 端口（Railway 自动提供）
PORT=${{PORT}}
```

**可选变量**:
```bash
# Gemini AI API Key（如果使用 AI 功能）
GEMINI_API_KEY=your-gemini-api-key

# CORS 允许的源
CORS_ORIGIN=https://your-frontend-domain.com
```

#### 步骤 3: 生成 JWT_SECRET

在本地终端运行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串作为 `JWT_SECRET`。

#### 步骤 4: 获取 Supabase DATABASE_URL

1. 登录 [Supabase](https://supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **Database**
4. 找到 **Connection string** → **URI**
5. 复制连接字符串（格式：`postgresql://postgres:[YOUR-PASSWORD]@...`）
6. 将 `[YOUR-PASSWORD]` 替换为你的数据库密码

#### 步骤 5: 重新部署

1. 在 Railway 项目页面，点击 **Deployments**
2. 点击最新的失败部署
3. 点击右上角的 **Redeploy** 按钮

---

## 🔍 查看详细错误日志

### 方法 1: Build Logs

1. 在 Railway 项目页面，点击失败的部署
2. 点击 **Build Logs** 标签
3. 查看完整的构建输出

### 方法 2: Deploy Logs

1. 点击 **Deploy Logs** 标签
2. 查看运行时错误

---

## 🛠️ 常见错误及修复

### 错误: "Cannot find module 'prisma'"

**原因**: Prisma 客户端未生成

**解决方案**: 
确保 `nixpacks.toml` 包含：
```toml
[phases.install]
cmds = [
    'cd backend',
    'npm ci',
    'npx prisma generate'  ← 这一行很重要
]
```

### 错误: "Port already in use"

**原因**: 端口配置错误

**解决方案**:
检查 `backend/src/index.ts`：
```typescript
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 错误: "Database connection failed"

**原因**: DATABASE_URL 配置错误

**解决方案**:
1. 检查 Supabase 数据库是否在运行
2. 验证连接字符串格式：
   ```
   postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
   ```
3. 确保 IP 白名单允许 Railway 连接（Supabase 默认允许所有）

### 错误: "Prisma migration failed"

**原因**: 数据库迁移未执行

**解决方案**:
1. 确保 `nixpacks.toml` 的 start 命令包含：
   ```toml
   [start]
   cmd = 'cd backend && npx prisma migrate deploy && npm start'
   ```
2. 或者手动运行迁移：
   - 在 Railway 项目中打开 **Shell**
   - 运行：`cd backend && npx prisma migrate deploy`

---

## 📋 部署前检查清单

在部署到 Railway 之前，确保：

- [ ] `backend/package.json` 存在且包含所有依赖
- [ ] `backend/prisma/schema.prisma` 配置正确
- [ ] `railway.json` 和 `nixpacks.toml` 已创建
- [ ] 所有环境变量已在 Railway 中配置
- [ ] Supabase 数据库已创建并可访问
- [ ] JWT_SECRET 已生成
- [ ] 代码已推送到 GitHub 的正确分支

---

## 🔄 完整部署流程

### 1. 准备 Supabase 数据库

```bash
# 1. 访问 https://supabase.com
# 2. 创建新项目
# 3. 等待数据库初始化（约 2 分钟）
# 4. 复制 DATABASE_URL
```

### 2. 配置 Railway

```bash
# 1. 访问 https://railway.app
# 2. 创建新项目
# 3. 连接 GitHub 仓库
# 4. 选择 mobile-app-development 分支
# 5. 添加环境变量：
#    - DATABASE_URL
#    - JWT_SECRET
#    - NODE_ENV=production
```

### 3. 触发部署

```bash
# 方法 1: 推送代码到 GitHub
git add .
git commit -m "fix: update railway configuration"
git push origin mobile-app-development

# 方法 2: 在 Railway 手动触发
# 点击 "Redeploy" 按钮
```

### 4. 验证部署

```bash
# 等待部署完成（约 3-5 分钟）
# 检查 Deploy Logs 确认无错误
# 访问 Railway 提供的 URL
# 测试 API 端点：
curl https://your-app.railway.app/api/health
```

---

## 🆘 仍然无法解决？

### 收集信息

1. **Build Logs**: 完整的构建输出
2. **Deploy Logs**: 运行时错误
3. **环境变量**: 确认所有变量已设置（不要分享实际的密钥）
4. **项目结构**: 运行 `tree -L 3` 查看目录结构

### 联系支持

- Railway Discord: https://discord.gg/railway
- Railway 文档: https://docs.railway.app
- GitHub Issues: 在项目仓库创建 issue

---

## 📚 相关文档

- [Railway 部署指南](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [移动端快速启动](./MOBILE_APP_QUICK_START.md)
- [完整开发指南](./MOBILE_APP_SETUP_GUIDE.md)

---

## ✅ 成功部署的标志

当你看到以下内容时，说明部署成功：

1. ✅ Build Logs 显示 "Build successful"
2. ✅ Deploy Logs 显示 "Server running on port XXXX"
3. ✅ Railway 提供的 URL 可以访问
4. ✅ `/api/health` 端点返回 200 状态码
5. ✅ 没有错误日志持续出现

**恭喜！你的后端已成功部署到 Railway！** 🎉