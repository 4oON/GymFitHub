# Supabase数据库备份指南

## 方法1：使用Supabase Dashboard（推荐）

### 步骤1：访问Supabase Dashboard
1. 登录 [https://supabase.com](https://supabase.com)
2. 选择你的项目
3. 点击左侧菜单的 **Database**

### 步骤2：使用SQL Editor备份
1. 点击 **SQL Editor**
2. 点击 **New query**
3. 执行以下SQL创建备份表：

```sql
-- 备份workouts表
CREATE TABLE workouts_backup_20260115 AS 
SELECT * FROM workouts;

-- 验证备份
SELECT COUNT(*) as backup_count FROM workouts_backup_20260115;
SELECT COUNT(*) as original_count FROM workouts;
```

### 步骤3：导出为CSV（可选）
1. 在SQL Editor中执行查询：
```sql
SELECT * FROM workouts ORDER BY created_at DESC;
```
2. 点击右上角的 **Download CSV** 按钮
3. 保存文件到本地（例如：`workouts_backup_20260115.csv`）

## 方法2：使用pg_dump（命令行）

### 前提条件
- 安装PostgreSQL客户端工具
- 获取数据库连接信息

### 步骤1：获取连接信息
1. 在Supabase Dashboard中，点击 **Settings** > **Database**
2. 找到 **Connection string** 部分
3. 复制 **Connection pooling** 的连接字符串（使用Transaction mode）

示例：
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 步骤2：执行备份命令

#### 备份整个数据库
```bash
pg_dump "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" > zenfit_backup_20260115.sql
```

#### 只备份workouts表
```bash
pg_dump "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" -t workouts > workouts_backup_20260115.sql
```

#### 备份为自定义格式（推荐，支持并行恢复）
```bash
pg_dump -Fc "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" > zenfit_backup_20260115.dump
```

### 步骤3：验证备份文件
```bash
# 查看SQL文件大小
ls -lh zenfit_backup_20260115.sql

# 查看文件内容（前几行）
head -n 20 zenfit_backup_20260115.sql
```

## 方法3：使用Supabase CLI

### 步骤1：安装Supabase CLI
```bash
npm install -g supabase
```

### 步骤2：登录
```bash
supabase login
```

### 步骤3：链接项目
```bash
supabase link --project-ref [your-project-ref]
```

### 步骤4：导出数据
```bash
# 导出schema
supabase db dump -f schema.sql

# 导出数据
supabase db dump --data-only -f data.sql
```

## 方法4：在SQL中创建备份表（最简单）

### 优点
- ✅ 不需要下载文件
- ✅ 备份在同一数据库中，恢复快速
- ✅ 可以随时查询备份数据

### 步骤

#### 1. 创建备份表
```sql
-- 备份workouts表（包含所有数据和结构）
CREATE TABLE workouts_backup_20260115 AS 
SELECT * FROM workouts;

-- 备份users表
CREATE TABLE users_backup_20260115 AS 
SELECT * FROM users;

-- 备份routines表
CREATE TABLE routines_backup_20260115 AS 
SELECT * FROM routines;

-- 备份user_profiles表
CREATE TABLE user_profiles_backup_20260115 AS 
SELECT * FROM user_profiles;
```

#### 2. 验证备份
```sql
-- 检查备份表的记录数
SELECT 
    'workouts' as table_name,
    (SELECT COUNT(*) FROM workouts) as original_count,
    (SELECT COUNT(*) FROM workouts_backup_20260115) as backup_count
UNION ALL
SELECT 
    'users',
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM users_backup_20260115)
UNION ALL
SELECT 
    'routines',
    (SELECT COUNT(*) FROM routines),
    (SELECT COUNT(*) FROM routines_backup_20260115);
```

#### 3. 查看备份表
```sql
-- 查看备份表的最新记录
SELECT * FROM workouts_backup_20260115 
ORDER BY created_at DESC 
LIMIT 10;
```

#### 4. 恢复数据（如果需要）
```sql
-- 清空当前表
TRUNCATE TABLE workouts CASCADE;

-- 从备份恢复
INSERT INTO workouts 
SELECT * FROM workouts_backup_20260115;

-- 验证恢复
SELECT COUNT(*) FROM workouts;
```

#### 5. 删除备份表（清理）
```sql
-- 确认不再需要后，删除备份表
DROP TABLE IF EXISTS workouts_backup_20260115;
```

## 推荐的备份策略

### 执行数据库修改前
```sql
-- 1. 创建备份表（在同一数据库中）
CREATE TABLE workouts_backup_20260115 AS SELECT * FROM workouts;

-- 2. 验证备份
SELECT COUNT(*) FROM workouts_backup_20260115;

-- 3. 执行修改操作
-- ... 你的UPDATE/DELETE语句 ...

-- 4. 验证修改结果
SELECT COUNT(*) FROM workouts;

-- 5. 如果出错，立即恢复
-- TRUNCATE TABLE workouts;
-- INSERT INTO workouts SELECT * FROM workouts_backup_20260115;
```

### 定期备份（每周）
```sql
-- 创建带日期的备份表
CREATE TABLE workouts_backup_weekly_20260115 AS SELECT * FROM workouts;
CREATE TABLE users_backup_weekly_20260115 AS SELECT * FROM users;
CREATE TABLE routines_backup_weekly_20260115 AS SELECT * FROM routines;
```

## 备份文件存储建议

### 本地存储
- 📁 创建专门的备份目录：`C:/zenfit/backups/`
- 📁 按日期组织：`backups/2026-01-15/`
- 📁 保留至少7天的备份

### 云存储（推荐）
- ☁️ Google Drive
- ☁️ Dropbox
- ☁️ OneDrive
- ☁️ GitHub（私有仓库）

## 恢复数据

### 从备份表恢复
```sql
-- 1. 清空当前表
TRUNCATE TABLE workouts CASCADE;

-- 2. 从备份恢复
INSERT INTO workouts SELECT * FROM workouts_backup_20260115;

-- 3. 验证
SELECT COUNT(*) FROM workouts;
```

### 从SQL文件恢复
```bash
psql "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" < zenfit_backup_20260115.sql
```

### 从自定义格式恢复
```bash
pg_restore -d "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" zenfit_backup_20260115.dump
```

## 快速备份脚本

### 创建一个完整的备份脚本
```sql
-- =====================================================
-- 快速备份所有重要表
-- Quick Backup All Important Tables
-- =====================================================

-- 获取当前日期
DO $$
DECLARE
    backup_suffix TEXT := to_char(now(), 'YYYYMMDD_HH24MISS');
BEGIN
    -- 备份workouts表
    EXECUTE format('CREATE TABLE workouts_backup_%s AS SELECT * FROM workouts', backup_suffix);
    
    -- 备份users表
    EXECUTE format('CREATE TABLE users_backup_%s AS SELECT * FROM users', backup_suffix);
    
    -- 备份routines表
    EXECUTE format('CREATE TABLE routines_backup_%s AS SELECT * FROM routines', backup_suffix);
    
    -- 备份user_profiles表
    EXECUTE format('CREATE TABLE user_profiles_backup_%s AS SELECT * FROM user_profiles', backup_suffix);
    
    RAISE NOTICE 'Backup completed with suffix: %', backup_suffix;
END $$;

-- 验证备份
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_name LIKE '%backup%'
ORDER BY table_name DESC
LIMIT 10;
```

## 注意事项

1. ⚠️ **备份前确认有足够的存储空间**
2. ⚠️ **备份文件包含敏感信息，注意安全**
3. ⚠️ **定期测试恢复流程**
4. ⚠️ **保留多个版本的备份**
5. ✅ **备份后验证数据完整性**

## 针对本次修复的备份建议

### 执行add_duration_min_field.sql前
```sql
-- 创建备份
CREATE TABLE workouts_backup_before_duration_fix AS SELECT * FROM workouts;

-- 验证
SELECT COUNT(*) FROM workouts_backup_before_duration_fix;
```

### 执行clean_workout_data_comprehensive.sql前
```sql
-- 创建备份
CREATE TABLE workouts_backup_before_cleanup AS SELECT * FROM workouts;

-- 导出脏数据（用于分析）
CREATE TABLE workouts_dirty_data AS 
SELECT * FROM workouts 
WHERE 
    duration_min IS NULL 
    OR duration_min = 0
    OR exercises IS NULL 
    OR exercises::text = '[]'
    OR exercises::text LIKE '%82000%'
    OR exercises::text LIKE '%300000%';

-- 验证
SELECT COUNT(*) FROM workouts_backup_before_cleanup;
SELECT COUNT(*) FROM workouts_dirty_data;
```

## 总结

**推荐方法：** 使用SQL创建备份表（方法4）
- ✅ 最简单
- ✅ 最快速
- ✅ 恢复方便
- ✅ 不需要额外工具

**执行顺序：**
1. 创建备份表
2. 验证备份
3. 执行修改
4. 验证结果
5. 保留备份7天
6. 清理旧备份
