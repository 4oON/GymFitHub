# Railway 完整配置代码

## 📋 在 Railway 中完整替换配置

### 方法 1: 删除 railway.json，只使用 nixpacks.toml

**步骤**:
1. 在 Railway 项目设置中，找到 **Settings** → **Service Settings**
2. 删除所有自定义的 Build Command 和 Start Command
3. 让 Railway 自动使用 `nixpacks.toml`

**nixpacks.toml 完整代码** (已在项目根目录):
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'openssl']

[phases.install]
cmds = [
    'cd backend',
    'npm ci',
    'npx prisma generate'
]

[phases.build]
cmds = [
    'cd backend',
    'npm run build'
]

[start]
cmd = 'cd backend && npx prisma migrate deploy && npm start'
```

---

### 方法 2: 在 Railway Settings 中手动配置

如果 Railway 不识别 `nixpacks.toml`，在 Railway 网页界面中手动设置：

#### 🔧 Build Settings

**Build Command** (完整复制粘贴):
```bash
cd backend && npm ci && npx prisma generate && npm run build
```

**Install Command** (留空或删除):
```
(留空)
```

#### 🚀 Deploy Settings

**Start Command** (完整复制粘贴):
```bash
cd backend && npx prisma migrate deploy && npm start
```

**Watch Paths** (可选):
```
backend/**
```

---

### 方法 3: 使用 Railway CLI 部署

如果网页界面有问题，使用 CLI：

```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录
railway login

# 3. 链接项目
railway link

# 4. 设置环境变量
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-secret-here"
railway variables set NODE_ENV="production"

# 5. 部署
railway up
```

---

## 🔑 必需的环境变量

在 Railway **Variables** 标签中添加：

### 1. DATABASE_URL
```
postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
```

**获取方式**:
1. 访问 https://supabase.com
2. 选择项目 → Settings → Database
3. 复制 "Connection string" → "URI"
4. 替换 `[YOUR-PASSWORD]` 为实际密码

### 2. JWT_SECRET
```bash
# 在本地终端运行生成：
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 复制输出结果，例如：
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. NODE_ENV
```
production
```

### 4. PORT (自动提供)
```
${{PORT}}
```

---

## 🎯 完整的 Railway 配置截图对照

你的 Railway 配置应该看起来像这样：

### Build 部分
```json
{
  "builder": "NIXPACKS",
  "buildCommand": "cd backend && npm ci && npx prisma generate && npm run build"
}
```

### Deploy 部分
```json
{
  "startCommand": "cd backend && npx prisma migrate deploy && npm start",
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 10
}
```

---

## 🔄 强制重新部署

如果修改配置后仍然失败：

### 选项 1: 清除缓存重新部署
1. 在 Railway 项目中，点击 **Settings**
2. 找到 **Danger Zone**
3. 点击 **Clear Build Cache**
4. 返回 **Deployments**
5. 点击 **Redeploy**

### 选项 2: 创建新的 Service
1. 在 Railway 项目中，点击 **+ New**
2. 选择 **GitHub Repo**
3. 选择 `kilo-zenfit` 仓库
4. 选择 `mobile-app-development` 分支
5. 添加环境变量
6. 等待部署

---

## 📝 验证配置是否正确

### 检查 Build Logs

成功的构建日志应该包含：

```
✓ Installing dependencies with npm ci
✓ Generating Prisma Client
✓ Building TypeScript
✓ Build completed successfully
```

### 检查 Deploy Logs

成功的部署日志应该包含：

```
✓ Prisma Migrate deployed
✓ Server running on port 3001
```

---

## 🆘 如果还是失败

### 1. 检查 Build Logs 中的具体错误

常见错误：
- `Cannot find module '@prisma/client'` → Prisma 未生成
- `ENOENT: no such file or directory` → 路径错误
- `npm ERR!` → 依赖安装失败

### 2. 验证环境变量

在 Railway Shell 中运行：
```bash
echo $DATABASE_URL
echo $JWT_SECRET
echo $NODE_ENV
```

### 3. 手动测试构建命令

在 Railway Shell 中运行：
```bash
cd backend
npm ci
npx prisma generate
npm run build
```

查看哪一步失败。

---

## 📞 需要帮助？

如果以上方法都不行，请提供：
1. **Build Logs** 的完整输出（截图或文本）
2. **Deploy Logs** 的完整输出
3. **Environment Variables** 列表（不要包含实际的密钥值）
4. Railway 项目的 URL

我会根据具体错误提供解决方案。