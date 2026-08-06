# Supabase 迁移问题解决方案

## 问题说明

Supabase的直接连接不支持IPv4网络，但Prisma迁移需要直接连接。

## 解决方案：使用Session Pooler + pgbouncer参数

我们可以使用Session Pooler连接，但添加 `?pgbouncer=true` 参数来让Prisma正确处理连接。

## 步骤1：获取Session Pooler连接字符串

1. 访问 https://supabase.com 并登录
2. 选择您的项目
3. 点击 **Settings** → **Database**
4. 在 **Connection string** 部分，选择 **Session pooler** 标签
5. 复制连接字符串（端口应该是 **6543**）

格式类似：
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
```

## 步骤2：修改 .env 文件

打开 `backend/.env` 文件，添加两个环境变量：

```env
# 应用运行时使用（Session Pooler）
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# 迁移时使用（Session Pooler + pgbouncer参数）
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**重要：** 
- 两个URL几乎相同
- `DIRECT_URL` 在末尾添加 `?pgbouncer=true` 参数
- 替换 `[PROJECT-REF]` 和 `[PASSWORD]` 为您的实际值

## 步骤3：运行数据库推送

在 PowerShell 中运行：

```powershell
cd c:\zenfit\backend
npx prisma db push
```

## 步骤4：生成 Prisma Client

```powershell
npx prisma generate
```

## 步骤5：重启后端服务器

1. 在运行 `npm run dev` 的终端按 `Ctrl+C` 停止服务器
2. 重新运行：`npm run dev`

## 步骤6：运行测试

在新的 PowerShell 窗口：

```powershell
cd c:\zenfit\backend
node test-health-api.js
```

## 示例 .env 文件

```env
PORT=3001
NODE_ENV=development

# 数据库连接（替换为您的实际值）
DATABASE_URL="postgresql://postgres.abcdefgh:your_password@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.abcdefgh:your_password@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# AI服务密钥
GEMINI_API_KEY=your-gemini-key
PERPLEXITY_API_KEY=your-perplexity-key
```

## 常见问题

### Q: 如何找到我的 PROJECT-REF？
A: 在Supabase连接字符串中，`postgres.` 后面的部分就是PROJECT-REF，例如：`postgres.abcdefgh` 中的 `abcdefgh`

### Q: 忘记密码怎么办？
A: 在Supabase Database设置页面，点击 "Reset database password" 重置密码

### Q: 还是连接超时？
A: 确保您的网络可以访问Supabase服务器，检查防火墙设置

## 验证成功

成功后您应该看到：

```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema.
```

然后测试应该全部通过！