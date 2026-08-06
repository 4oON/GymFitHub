-- =====================================================
-- 综合清理脏数据脚本
-- Comprehensive Dirty Data Cleanup Script
-- =====================================================
--
-- 此脚本用于清理以下问题：
-- 1. duration_min为0或NULL的记录
-- 2. exercises为空的记录
-- 3. 异常volume的记录（300kg、82000kg等）
-- 4. 重复的训练记录
--
-- ⚠️ 警告：此操作不可逆，请先备份数据！
-- ⚠️ Warning: This operation is irreversible, please backup data first!
--
-- 执行步骤：
-- 1. 先运行查询SQL查看将被处理的记录
-- 2. 确认无误后，取消注释相应的UPDATE/DELETE语句
-- 3. 分步执行，每步验证结果
--
-- =====================================================

-- =====================================================
-- 步骤0：创建备份表
-- Step 0: Create backup table
-- =====================================================

-- 创建备份表（带时间戳）
CREATE TABLE IF NOT EXISTS workouts_backup_20260115 AS 
SELECT * FROM workouts;

-- 验证备份
SELECT 
    COUNT(*) as backup_count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM workouts_backup_20260115;

-- =====================================================
-- 步骤1：查找并分析脏数据
-- Step 1: Find and analyze dirty data
-- =====================================================

-- 1.1 查找duration_min为0或NULL的记录
SELECT 
    id,
    user_id,
    name,
    duration_min,
    created_at,
    date,
    'zero_or_null_duration' as issue_type
FROM workouts
WHERE duration_min IS NULL OR duration_min = 0
ORDER BY created_at DESC;

-- 1.2 查找exercises为空的记录
SELECT 
    id,
    user_id,
    name,
    exercises,
    created_at,
    'empty_exercises' as issue_type
FROM workouts
WHERE 
    exercises IS NULL 
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0
ORDER BY created_at DESC;

-- 1.3 查找异常重量的记录（300kg、82000kg等）
-- 注意：这里查找单组重量超过500kg的记录
WITH exercise_data AS (
    SELECT 
        w.id,
        w.user_id,
        w.name,
        w.created_at,
        w.date,
        jsonb_array_elements(w.exercises::jsonb) as exercise
    FROM workouts w
    WHERE w.exercises IS NOT NULL
),
abnormal_weights AS (
    SELECT 
        id,
        user_id,
        name,
        created_at,
        date,
        exercise->>'exerciseName' as exercise_name,
        (exercise->'sets')::jsonb as sets,
        'abnormal_weight' as issue_type
    FROM exercise_data
    WHERE 
        -- 查找包含异常重量的记录
        exercise::text LIKE '%82000%'
        OR exercise::text LIKE '%300000%'
        OR exercise::text LIKE '%"weight":500%'
        OR exercise::text LIKE '%"weight":1000%'
)
SELECT * FROM abnormal_weights
ORDER BY created_at DESC;

-- 1.4 统计各类问题的数量
SELECT 
    'zero_duration' as issue_type,
    COUNT(*) as count
FROM workouts
WHERE duration_min IS NULL OR duration_min = 0

UNION ALL

SELECT 
    'empty_exercises' as issue_type,
    COUNT(*) as count
FROM workouts
WHERE 
    exercises IS NULL 
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0

UNION ALL

SELECT 
    'abnormal_weight' as issue_type,
    COUNT(*) as count
FROM workouts
WHERE 
    exercises::text LIKE '%82000%'
    OR exercises::text LIKE '%300000%';

-- =====================================================
-- 步骤2：修复duration_min为0的记录
-- Step 2: Fix records with zero duration
-- =====================================================

-- 2.1 预览将被修复的记录
SELECT 
    id,
    name,
    duration_min as old_duration,
    45 as new_duration,
    created_at
FROM workouts
WHERE duration_min IS NULL OR duration_min = 0
ORDER BY created_at DESC
LIMIT 20;

-- 2.2 执行修复（取消注释以执行）
/*
UPDATE workouts
SET duration_min = 45  -- 设置默认值为45分钟
WHERE duration_min IS NULL OR duration_min = 0;

-- 验证修复结果
SELECT 
    COUNT(*) as fixed_count,
    'Records with duration fixed to 45min' as description
FROM workouts
WHERE duration_min = 45;
*/

-- =====================================================
-- 步骤3：删除空exercises的记录
-- Step 3: Delete records with empty exercises
-- =====================================================

-- 3.1 预览将被删除的记录
SELECT 
    id,
    user_id,
    name,
    exercises,
    created_at
FROM workouts
WHERE 
    exercises IS NULL 
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0
ORDER BY created_at DESC;

-- 3.2 执行删除（取消注释以执行）
/*
DELETE FROM workouts
WHERE 
    exercises IS NULL 
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0;

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting empty exercises' as description
FROM workouts;
*/

-- =====================================================
-- 步骤4：处理异常重量的记录
-- Step 4: Handle records with abnormal weights
-- =====================================================

-- 4.1 查找具体的异常记录
SELECT 
    id,
    user_id,
    name,
    exercises,
    created_at,
    date
FROM workouts
WHERE 
    exercises::text LIKE '%82000%'
    OR exercises::text LIKE '%300000%'
    OR exercises::text LIKE '%"weight":500%'
ORDER BY created_at DESC;

-- 4.2 删除异常重量的记录（取消注释以执行）
-- ⚠️ 注意：这会永久删除这些记录
/*
DELETE FROM workouts
WHERE 
    exercises::text LIKE '%82000%'
    OR exercises::text LIKE '%300000%';

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting abnormal weights' as description
FROM workouts;
*/

-- =====================================================
-- 步骤5：查找并删除重复记录
-- Step 5: Find and delete duplicate records
-- =====================================================

-- 5.1 查找可能的重复记录（同一天、同一用户、相似的exercises）
WITH workout_fingerprints AS (
    SELECT 
        id,
        user_id,
        DATE(COALESCE(date, created_at)) as workout_date,
        jsonb_array_length(exercises::jsonb) as exercise_count,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, DATE(COALESCE(date, created_at)), jsonb_array_length(exercises::jsonb)
            ORDER BY created_at DESC
        ) as rn
    FROM workouts
    WHERE exercises IS NOT NULL
)
SELECT 
    w.id,
    w.user_id,
    w.name,
    wf.workout_date,
    wf.exercise_count,
    w.created_at,
    'duplicate' as issue_type
FROM workout_fingerprints wf
JOIN workouts w ON w.id = wf.id
WHERE wf.rn > 1  -- 保留最新的，标记其他为重复
ORDER BY wf.workout_date DESC, w.created_at DESC;

-- 5.2 删除重复记录（保留最新的）（取消注释以执行）
/*
WITH workout_fingerprints AS (
    SELECT 
        id,
        user_id,
        DATE(COALESCE(date, created_at)) as workout_date,
        jsonb_array_length(exercises::jsonb) as exercise_count,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, DATE(COALESCE(date, created_at)), jsonb_array_length(exercises::jsonb)
            ORDER BY created_at DESC
        ) as rn
    FROM workouts
    WHERE exercises IS NOT NULL
)
DELETE FROM workouts
WHERE id IN (
    SELECT id 
    FROM workout_fingerprints 
    WHERE rn > 1
);

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after removing duplicates' as description
FROM workouts;
*/

-- =====================================================
-- 步骤6：最终验证和统计
-- Step 6: Final verification and statistics
-- =====================================================

-- 6.1 查看清理后的数据质量
SELECT 
    COUNT(*) as total_workouts,
    COUNT(CASE WHEN duration_min > 0 THEN 1 END) as with_valid_duration,
    COUNT(CASE WHEN exercises IS NOT NULL AND exercises::text != '[]' THEN 1 END) as with_exercises,
    AVG(duration_min) as avg_duration,
    MIN(duration_min) as min_duration,
    MAX(duration_min) as max_duration,
    MIN(created_at) as oldest_workout,
    MAX(created_at) as newest_workout
FROM workouts;

-- 6.2 按用户统计
SELECT 
    user_id,
    COUNT(*) as workout_count,
    AVG(duration_min) as avg_duration,
    MIN(created_at) as first_workout,
    MAX(created_at) as last_workout
FROM workouts
GROUP BY user_id
ORDER BY workout_count DESC;

-- 6.3 查看最近的训练记录（验证数据正确性）
SELECT 
    id,
    user_id,
    name,
    duration_min,
    jsonb_array_length(exercises::jsonb) as exercise_count,
    created_at,
    date
FROM workouts
ORDER BY created_at DESC
LIMIT 20;

-- 6.4 查找仍然存在的问题（如果有）
SELECT 
    'Still has issues' as status,
    COUNT(*) as count
FROM workouts
WHERE 
    duration_min IS NULL 
    OR duration_min = 0
    OR exercises IS NULL 
    OR exercises::text = '[]'
    OR exercises::text LIKE '%82000%'
    OR exercises::text LIKE '%300000%';

-- =====================================================
-- 步骤7：如果需要，恢复备份
-- Step 7: Restore from backup if needed
-- =====================================================

-- 如果清理出现问题，可以从备份恢复
/*
-- 清空当前表
TRUNCATE TABLE workouts;

-- 从备份恢复
INSERT INTO workouts
SELECT * FROM workouts_backup_20260115;

-- 验证恢复
SELECT COUNT(*) FROM workouts;
*/

-- =====================================================
-- 完成！
-- Done!
-- =====================================================

-- 清理完成后的建议：
-- 1. 监控新数据的质量
-- 2. 定期运行数据质量检查
-- 3. 在应用层添加更严格的验证
-- 4. 考虑添加数据库触发器防止脏数据
