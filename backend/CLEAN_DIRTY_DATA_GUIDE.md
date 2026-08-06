# 清理Supabase脏数据指南
# Clean Supabase Dirty Data Guide

## 问题描述

从截图中可以看到，数据库中存在大量脏数据：
- ✅ 所有记录的 `date` 字段都是 2026 年（未来日期）
- ✅ 所有记录的 `user_id` 都相同（`83381e3a-c430-48ca-9fba-b799b...`）
- ✅ 数据看起来是重复的测试数据
- ✅ 所有记录的 `duration_min` 都是 45

## 解决方案

我已经为您创建了专门的清理脚本：[`clean_future_date_dirty_data.sql`](backend/clean_future_date_dirty_data.sql)

## 执行步骤

### 方法一：在Supabase SQL Editor中执行（推荐）

#### 1. 登录Supabase控制台

访问：https://app.supabase.com/
选择您的项目

#### 2. 打开SQL Editor

在左侧菜单中点击 **SQL Editor**

#### 3. 创建备份（重要！）

首先执行备份命令：

```sql
-- 创建备份表
CREATE TABLE IF NOT EXISTS workouts_backup_future_date_20260115 AS 
SELECT * FROM workouts;

-- 验证备份
SELECT 
    COUNT(*) as backup_count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM workouts_backup_future_date_20260115;
```

#### 4. 分析脏数据

执行以下查询，了解要删除的数据：

```sql
-- 查看所有2026年的记录数量
SELECT 
    COUNT(*) as future_date_count,
    MIN(date) as earliest_future_date,
    MAX(date) as latest_future_date
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- 预览将被删除的记录（前50条）
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    updated_at,
    duration_min
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026
ORDER BY created_at DESC
LIMIT 50;
```

#### 5. 执行删除操作

**选项A：删除所有2026年的记录（推荐）**

```sql
-- 删除所有2026年及以后的记录
DELETE FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting future dates' as description
FROM workouts;
```

**选项B：删除特定用户的所有记录**

如果这些数据都属于测试用户，可以直接删除该用户的所有记录：

```sql
-- 先查看该用户的记录数
SELECT 
    COUNT(*) as workout_count
FROM workouts
WHERE user_id = '83381e3a-c430-48ca-9fba-b799b...';  -- 替换为完整的user_id

-- 删除该用户的所有记录
DELETE FROM workouts
WHERE user_id = '83381e3a-c430-48ca-9fba-b799b...';  -- 替换为完整的user_id
```

**选项C：删除今天创建的所有记录**

如果这些都是今天的测试数据：

```sql
-- 查看今天创建的记录数
SELECT 
    COUNT(*) as today_count
FROM workouts
WHERE DATE(created_at) = CURRENT_DATE;

-- 删除今天创建的记录
DELETE FROM workouts
WHERE DATE(created_at) = CURRENT_DATE;
```

**选项D：组合条件删除（最安全）**

```sql
-- 删除2026年的记录 OR 今天创建的记录
DELETE FROM workouts
WHERE 
    EXTRACT(YEAR FROM date) >= 2026
    OR DATE(created_at) = CURRENT_DATE;

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts
FROM workouts;
```

#### 6. 最终验证

```sql
-- 查看清理后的数据统计
SELECT 
    COUNT(*) as total_workouts,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM workouts;

-- 检查是否还有未来日期
SELECT 
    COUNT(*) as future_date_count
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- 查看最近的记录
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    duration_min
FROM workouts
ORDER BY created_at DESC
LIMIT 20;
```

### 方法二：使用Supabase CLI

如果您安装了Supabase CLI：

```bash
# 1. 登录
supabase login

# 2. 连接到项目
supabase link --project-ref your-project-ref

# 3. 执行SQL文件
supabase db execute -f backend/clean_future_date_dirty_data.sql
```

### 方法三：使用数据库客户端工具

您也可以使用以下工具连接到Supabase：
- **DBeaver**
- **pgAdmin**
- **TablePlus**
- **DataGrip**

连接信息可以在Supabase控制台的 **Settings > Database** 中找到。

## 如果删除错误，如何恢复？

如果您不小心删除了不该删除的数据，可以从备份恢复：

```sql
-- 清空当前表
TRUNCATE TABLE workouts;

-- 从备份恢复
INSERT INTO workouts
SELECT * FROM workouts_backup_future_date_20260115;

-- 验证恢复
SELECT COUNT(*) FROM workouts;
```

## 预防措施

为了防止将来再次出现脏数据，建议：

### 1. 添加数据库约束

```sql
-- 添加日期检查约束（防止未来日期）
ALTER TABLE workouts
ADD CONSTRAINT check_workout_date 
CHECK (date <= CURRENT_DATE + INTERVAL '1 day');

-- 添加duration_min检查约束
ALTER TABLE workouts
ADD CONSTRAINT check_duration_min 
CHECK (duration_min > 0 AND duration_min <= 600);
```

### 2. 在应用层添加验证

在前端和后端都添加日期验证：

**前端验证（TypeScript）：**
```typescript
// 验证训练日期不能是未来日期
const validateWorkoutDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};
```

**后端验证（在 [`workoutValidator.ts`](backend/src/validators/workoutValidator.ts)）：**
```typescript
export const validateWorkoutDate = (date: string): boolean => {
  const workoutDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (workoutDate > today) {
    throw new Error('Workout date cannot be in the future');
  }
  
  return true;
};
```

### 3. 定期运行数据质量检查

创建一个定期任务来检查数据质量：

```sql
-- 数据质量检查查询
SELECT 
    'future_dates' as issue,
    COUNT(*) as count
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026

UNION ALL

SELECT 
    'zero_duration' as issue,
    COUNT(*) as count
FROM workouts
WHERE duration_min IS NULL OR duration_min = 0

UNION ALL

SELECT 
    'empty_exercises' as issue,
    COUNT(*) as count
FROM workouts
WHERE exercises IS NULL OR exercises::text = '[]';
```

## 常见问题

### Q1: 如何找到完整的 user_id？

在Supabase SQL Editor中执行：

```sql
SELECT DISTINCT user_id, COUNT(*) as workout_count
FROM workouts
GROUP BY user_id
ORDER BY workout_count DESC;
```

### Q2: 如何只删除特定日期范围的记录？

```sql
-- 删除2026年1月9日的记录
DELETE FROM workouts
WHERE DATE(date) = '2026-01-09';

-- 删除2026年1月9日到1月11日的记录
DELETE FROM workouts
WHERE DATE(date) BETWEEN '2026-01-09' AND '2026-01-11';
```

### Q3: 如何批量删除特定ID的记录？

```sql
DELETE FROM workouts
WHERE id IN (
    'afcfc442-9255-4e85-873b-3fec4b097758',
    '0d64670b-aae9-4f17-bd98-cd3f4631f0e55',
    '60b9c66d-b9e7-4864-b888-a029cc4549'
    -- 添加更多ID...
);
```

### Q4: 删除操作很慢怎么办？

如果记录数量很大，可以分批删除：

```sql
-- 分批删除（每次1000条）
DELETE FROM workouts
WHERE id IN (
    SELECT id 
    FROM workouts 
    WHERE EXTRACT(YEAR FROM date) >= 2026
    LIMIT 1000
);

-- 重复执行上面的命令，直到没有记录被删除
```

## 相关文件

- [`clean_future_date_dirty_data.sql`](backend/clean_future_date_dirty_data.sql) - 完整的清理脚本
- [`clean_workout_data_comprehensive.sql`](backend/clean_workout_data_comprehensive.sql) - 综合清理脚本
- [`SUPABASE_SQL_EXECUTION_GUIDE.md`](backend/SUPABASE_SQL_EXECUTION_GUIDE.md) - Supabase SQL执行指南

## 总结

1. **先备份** - 执行任何删除操作前都要先备份
2. **先查询** - 用 SELECT 查看要删除的数据
3. **再删除** - 确认无误后执行 DELETE
4. **后验证** - 删除后检查结果是否符合预期
5. **加约束** - 添加数据库约束防止未来再次出现脏数据

如果您有任何问题，请参考相关文档或联系技术支持。
