# 修复Users表Password字段问题

## 问题描述

错误信息：
```
The column `users.password` does not exist in the current database.
```

**原因：** 数据库中的`users`表可能使用了`password_hash`字段名，而Prisma schema定义的是`password`。

## 解决方案

### 步骤1：检查数据库实际字段名

在Supabase SQL Editor中运行：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### 步骤2：根据检查结果选择修复方案

#### 情况A：存在`password_hash`字段

**方案1：重命名数据库字段（推荐）**

在Supabase SQL Editor中运行：

```sql
-- 重命名字段
ALTER TABLE users RENAME COLUMN password_hash TO password;

-- 验证修改
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password';
```

**方案2：修改Prisma Schema**

修改 [`schema.prisma`](prisma/schema.prisma)：

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   @map("password_hash")  // 添加@map映射
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  profile  UserProfile?
  workouts Workout[]
  routines Routine[]

  @@map("users")
}
```

然后重新生成Prisma Client：

```powershell
cd c:\zenfit\backend
npx prisma generate
```

#### 情况B：两个字段都不存在

在Supabase SQL Editor中运行：

```sql
-- 添加password字段
ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT '';

-- 验证添加
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'password';
```

### 步骤3：重新生成Prisma Client

无论选择哪个方案，都需要重新生成Prisma Client：

```powershell
cd c:\zenfit\backend
npx prisma generate
```

### 步骤4：重启服务器

```powershell
# 方法1：使用重启脚本
.\restart-server.bat

# 方法2：手动重启
# 按 Ctrl+C 停止当前服务器
npm run dev
```

### 步骤5：重新测试

```powershell
node test-health-api.js
```

## 推荐方案

**我推荐使用方案1（重命名数据库字段）**，原因：

1. ✅ 保持代码简洁，不需要额外的`@map`映射
2. ✅ 与Prisma schema定义一致
3. ✅ 更容易维护
4. ✅ 符合命名规范（`password`比`password_hash`更简洁）

## 快速修复脚本

在Supabase SQL Editor中一次性运行：

```sql
-- 检查当前字段
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name LIKE '%password%';

-- 如果显示password_hash，运行下面的命令
ALTER TABLE users RENAME COLUMN password_hash TO password;

-- 验证修复
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password';
```

## 验证修复成功

修复后，应该看到：

1. ✅ 服务器启动无错误
2. ✅ 可以成功注册用户
3. ✅ 可以成功登录
4. ✅ 测试脚本显示绿色勾号

## 相关文件

- [`check_and_fix_users_table.sql`](check_and_fix_users_table.sql) - 检查脚本
- [`schema.prisma`](prisma/schema.prisma) - Prisma schema定义
- [`auth.ts`](src/routes/auth.ts) - 认证路由
- [`test-health-api.js`](test-health-api.js) - 测试脚本

## 注意事项

⚠️ **重要：** 如果数据库中已有用户数据，重命名字段不会丢失数据，只是改变字段名。

⚠️ **备份：** 在生产环境操作前，建议先备份数据库。

⚠️ **测试：** 修复后务必运行完整测试，确保所有功能正常。