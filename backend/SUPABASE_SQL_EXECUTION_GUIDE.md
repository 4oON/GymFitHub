# Supabase SQL 执行指南

## 方法：直接在Supabase控制台执行SQL

由于Prisma迁移命令在您的网络环境下遇到连接问题，我们将直接在Supabase控制台执行SQL脚本。

## 步骤1：登录Supabase并打开SQL编辑器

1. 打开浏览器，访问：https://supabase.com
2. 登录您的账号
3. 选择您的项目
4. 在左侧菜单中，点击 **SQL Editor**（SQL图标）

## 步骤2：执行SQL脚本

1. 在SQL编辑器中，点击 **New query** 创建新查询
2. 打开文件 `backend/add_ios_health_data.sql`
3. **复制全部内容**
4. **粘贴到Supabase SQL编辑器**
5. 点击右下角的 **Run** 按钮（或按 Ctrl+Enter）

## 步骤3：验证执行结果

执行成功后，您应该看到：

### 结果1：ALTER TABLE 成功
```
ALTER TABLE
```

### 结果2：CREATE TABLE 成功
```
CREATE TABLE
```

### 结果3：CREATE INDEX 成功
```
CREATE INDEX
```

### 结果4：验证查询结果

您会看到两个查询结果表：

**表1：user_profiles 新字段**
```
column_name              | data_type          | is_nullable | column_default
-------------------------+--------------------+-------------+----------------
health_sync_enabled      | boolean            | YES         | false
health_sync_consent      | boolean            | YES         | false
health_sync_consent_date | timestamp          | YES         | NULL
body_fat_percent         | double precision   | YES         | NULL
last_health_sync         | timestamp          | YES         | NULL
auto_sync_enabled        | boolean            | YES         | true
```

**表2：health_data 表结构**
```
column_name      | data_type          | is_nullable | column_default
-----------------+--------------------+-------------+------------------
id               | text               | NO          | NULL
user_id          | text               | NO          | NULL
weight           | double precision   | YES         | NULL
body_fat_percent | double precision   | YES         | NULL
gender           | text               | YES         | NULL
sync_date        | timestamp          | NO          | CURRENT_TIMESTAMP
created_at       | timestamp          | NO          | CURRENT_TIMESTAMP
```

## 步骤4：生成Prisma Client

SQL执行成功后，回到PowerShell运行：

```powershell
cd c:\zenfit\backend
npx prisma generate
```

这会根据schema生成Prisma Client，让代码能够使用新的数据库结构。

## 步骤5：重启后端服务器

1. 在运行 `npm run dev` 的终端按 **Ctrl+C** 停止服务器
2. 重新运行：
```powershell
npm run dev
```

## 步骤6：运行测试

在新的PowerShell窗口：

```powershell
cd c:\zenfit\backend
node test-health-api.js
```

## 常见问题

### Q: SQL执行失败，提示权限错误？
A: 确保您使用的是项目所有者账号登录Supabase。

### Q: 提示表或字段已存在？
A: 这是正常的！SQL脚本使用了 `IF NOT EXISTS`，会自动跳过已存在的对象。

### Q: 验证查询没有返回结果？
A: 可能字段名大小写不匹配。在Supabase中，表名和字段名通常是小写的。

### Q: prisma generate 失败？
A: 确保 `.env` 文件中的 `DATABASE_URL` 和 `DIRECT_URL` 配置正确。

## 成功标志

✅ SQL脚本执行无错误
✅ 验证查询显示了所有新字段
✅ `npx prisma generate` 成功完成
✅ 后端服务器启动无错误
✅ 测试脚本全部通过

## 需要帮助？

如果遇到任何问题，请提供：
1. SQL执行的错误消息截图
2. 验证查询的结果截图
3. `npx prisma generate` 的输出