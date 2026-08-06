# Supabase 直接连接字符串获取指南

## 为什么需要直接连接？

Prisma 数据库迁移需要使用 **直接连接**（端口 5432），而不是连接池（端口 6543）。

## 步骤1：登录 Supabase

1. 打开浏览器，访问：https://supabase.com
2. 点击右上角 **Sign In** 登录您的账号

## 步骤2：选择项目

1. 登录后，您会看到项目列表
2. 点击您的 **zenfit** 项目（或您使用的项目名称）

## 步骤3：进入数据库设置

1. 在左侧菜单栏，点击 **Settings**（设置图标，齿轮形状）
2. 在设置菜单中，点击 **Database**

## 步骤4：获取直接连接字符串

1. 在 Database 页面，向下滚动找到 **Connection string** 部分
2. 您会看到两个选项：
   - **Session pooler** (会话池) - 端口 6543 ❌ 不要用这个
   - **Direct connection** (直接连接) - 端口 5432 ✅ 使用这个

3. 点击 **Direct connection** 标签
4. 选择 **URI** 格式
5. 点击复制按钮复制连接字符串

## 步骤5：连接字符串格式

复制的字符串应该类似这样：

```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**重要提示：**
- 注意端口是 **5432**（不是 6543）
- `[YOUR-PASSWORD]` 需要替换成您的实际数据库密码
- 如果忘记密码，可以在同一页面点击 "Reset database password" 重置

## 步骤6：使用直接连接运行迁移

### 方法1：临时设置环境变量（推荐）

在 PowerShell 中运行：

```powershell
# 设置临时环境变量（替换成您的完整连接字符串）
$env:DATABASE_URL="postgresql://postgres.xxxxx:您的密码@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

# 运行数据库推送
npx prisma db push

# 生成 Prisma Client
npx prisma generate
```

### 方法2：修改 .env 文件

1. 打开 `backend/.env` 文件
2. 临时将 `DATABASE_URL` 改为直接连接字符串（端口 5432）
3. 运行 `npx prisma db push`
4. 完成后，改回连接池 URL（端口 6543）用于应用运行

## 步骤7：验证迁移成功

成功后您应该看到：

```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema.
```

## 常见问题

### Q: 找不到密码怎么办？
A: 在 Supabase Database 设置页面，点击 "Reset database password" 重置密码。

### Q: 连接超时怎么办？
A: 检查您的网络连接，确保可以访问 Supabase 服务器。

### Q: 迁移后应用连接失败？
A: 确保 `.env` 文件中的 `DATABASE_URL` 使用的是连接池 URL（端口 6543），而不是直接连接 URL。

## 需要帮助？

如果遇到问题，请提供：
1. 错误消息的截图
2. 您使用的连接字符串格式（隐藏密码）
3. Prisma 命令的完整输出