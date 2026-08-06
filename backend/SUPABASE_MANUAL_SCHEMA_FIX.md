# Supabase手动Schema修复指南

## 问题说明

由于网络限制只能使用IPv4连接，必须通过Session Pooler（pgbouncer）连接Supabase。但是pgbouncer不支持DDL操作（如ALTER TABLE），所以无法使用`prisma db push`来自动同步schema。

## 解决方案：手动执行SQL

### 步骤1：登录Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 登录你的账号
3. 选择你的项目（zenfit项目）

### 步骤2：打开SQL编辑器

1. 在左侧菜单中点击 **SQL Editor**
2. 点击 **New Query** 创建新查询

### 步骤3：执行SQL脚本

复制`backend/add_missing_columns.sql`文件的全部内容，粘贴到SQL编辑器中，然后点击**Run**按钮执行。

### 步骤4：验证结果

执行成功后，你应该看到类似以下的输出：

```
NOTICE: Added exercises column to workouts table
NOTICE: Added description column to workouts table  
NOTICE: Added workouts column to routines table

table_name | column_name  | data_type | is_nullable | column_default
-----------|--------------|-----------|-------------|----------------
routines   | workouts     | jsonb     | YES         | '[]'::jsonb
workouts   | description  | text      | YES         | NULL
workouts   | exercises    | jsonb     | YES         | '[]'::jsonb
```

### 步骤5：停止后端服务器

在Terminal 2中按Ctrl+C停止后端服务器（必须先停止才能重新生成Prisma Client）

### 步骤6：重新生成Prisma Client

在Terminal 2中执行：

```bash
cd backend
npx prisma generate
```

这会根据schema.prisma重新生成Prisma Client，确保类型定义正确。

**注意**：如果遇到`EPERM: operation not permitted`错误，说明后端服务器还在运行，请确保已完全停止。

### 步骤7：重启后端服务器

在Terminal 2中重新启动：
```bash
npm run dev
```

### 步骤7：验证修复

后端重启后，之前的Prisma错误应该消失了。检查Terminal 2的输出，应该不再看到：
- `The column 'workouts.exercises' does not exist`
- `The column 'workouts.description' does not exist`
- `The column 'routines.workouts' does not exist`

## 如果SQL执行失败

### 错误1：权限不足
**症状**：`permission denied for table workouts`

**解决**：确保你使用的是项目的主账号登录，或者账号有ALTER TABLE权限。

### 错误2：列已存在
**症状**：`column "exercises" of relation "workouts" already exists`

**解决**：这是好消息！说明列已经存在了。SQL脚本使用了`IF NOT EXISTS`检查，所以不应该出现这个错误。如果出现，说明列已经添加成功，可以忽略。

### 错误3：表不存在
**症状**：`relation "workouts" does not exist`

**解决**：检查表名是否正确。Prisma使用的表名映射：
- Model `Workout` → Table `workouts`
- Model `Routine` → Table `routines`

## 完整的SQL脚本内容

```sql
-- 添加缺失的数据库列
-- 在Supabase SQL编辑器中执行此脚本

-- 1. 为workouts表添加exercises列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'exercises'
    ) THEN
        ALTER TABLE workouts ADD COLUMN exercises JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added exercises column to workouts table';
    ELSE
        RAISE NOTICE 'exercises column already exists in workouts table';
    END IF;
END $$;

-- 2. 为workouts表添加description列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workouts' AND column_name = 'description'
    ) THEN
        ALTER TABLE workouts ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to workouts table';
    ELSE
        RAISE NOTICE 'description column already exists in workouts table';
    END IF;
END $$;

-- 3. 为routines表添加workouts列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routines' AND column_name = 'workouts'
    ) THEN
        ALTER TABLE routines ADD COLUMN workouts JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added workouts column to routines table';
    ELSE
        RAISE NOTICE 'workouts column already exists in routines table';
    END IF;
END $$;

-- 4. 验证所有列都已添加
SELECT 
    'workouts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'workouts' 
  AND column_name IN ('exercises', 'description')
UNION ALL
SELECT 
    'routines' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'routines' 
  AND column_name = 'workouts'
ORDER BY table_name, column_name;
```

## 下一步

Schema修复完成后，继续执行：
1. 将同步按钮移到Progress页面
2. 测试批量同步功能
3. 验证数据同步到Vercel网站

详见：`docs/IOS_HEALTH_DATA_NEXT_STEPS.md`