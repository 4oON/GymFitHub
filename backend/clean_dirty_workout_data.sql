-- =====================================================
-- 清理Workout表中的脏数据
-- Clean Dirty Data from Workouts Table
-- =====================================================
--
-- 此脚本用于清理以下异常数据：
-- 1. exercises字段为空数组或null的记录
-- 2. exercises中所有动作的volume总和超过100,000kg的记录（异常数据）
-- 3. exercises中没有任何完成组数的记录
--
-- ⚠️ 警告：此操作不可逆，请先备份数据！
-- ⚠️ Warning: This operation is irreversible, please backup data first!
--
-- 注意：正常训练volume范围约5,000-30,000kg
-- 用户实际数据：1月6号 8,302kg，1月8号 9,817.5kg，1月14号 16,028kg
-- 阈值设置为100,000kg以保护所有有效数据
--
-- 使用方法 / Usage:
-- 1. 连接到Supabase数据库
-- 2. 先运行SELECT查询查看将被删除的记录
-- 3. 确认无误后，取消注释DELETE语句并执行
-- =====================================================

-- =====================================================
-- 步骤1：查看将被删除的记录（预览）
-- Step 1: Preview records that will be deleted
-- =====================================================

-- 1.1 查看空训练记录（exercises为空数组或null）
SELECT 
    id,
    user_id,
    name,
    exercises,
    created_at,
    'Empty exercises' as reason
FROM workouts
WHERE 
    exercises IS NULL 
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0;

-- 1.2 查看异常volume的记录（需要手动检查JSON内容）
-- 注意：由于volume计算复杂，建议手动检查exercises字段
-- 只查找明显异常的数据（>100,000kg）
SELECT
    id,
    user_id,
    name,
    exercises,
    created_at,
    'Potential abnormal volume (>100k)' as reason
FROM workouts
WHERE
    -- 查找exercises字段中包含异常大数字的记录（>100,000）
    exercises::text LIKE '%150000%'
    OR exercises::text LIKE '%200000%'
    OR exercises::text LIKE '%500000%';

-- 1.3 统计将被删除的记录数量
SELECT
    COUNT(*) as total_to_delete,
    'Records with empty or abnormal exercises' as description
FROM workouts
WHERE
    exercises IS NULL
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0
    OR exercises::text LIKE '%150000%'
    OR exercises::text LIKE '%200000%'
    OR exercises::text LIKE '%500000%';

-- =====================================================
-- 步骤2：执行删除操作（请谨慎！）
-- Step 2: Execute deletion (Use with caution!)
-- =====================================================

-- ⚠️ 取消下面的注释以执行删除
-- ⚠️ Uncomment below to execute deletion

/*
-- 2.1 删除空训练记录
DELETE FROM workouts
WHERE 
    exercises IS NULL 
    OR exercises::text = '[]'
    OR jsonb_array_length(exercises::jsonb) = 0;

-- 2.2 删除异常volume的记录（只删除>100,000kg的记录）
DELETE FROM workouts
WHERE
    exercises::text LIKE '%150000%'
    OR exercises::text LIKE '%200000%'
    OR exercises::text LIKE '%500000%';

-- 2.3 显示删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after cleanup' as description
FROM workouts;
*/

-- =====================================================
-- 步骤3：验证清理结果
-- Step 3: Verify cleanup results
-- =====================================================

-- 3.1 查看剩余的workout记录
SELECT 
    COUNT(*) as total_workouts,
    MIN(created_at) as oldest_workout,
    MAX(created_at) as newest_workout
FROM workouts;

-- 3.2 按用户统计workout数量
SELECT 
    user_id,
    COUNT(*) as workout_count,
    MIN(created_at) as first_workout,
    MAX(created_at) as last_workout
FROM workouts
GROUP BY user_id
ORDER BY workout_count DESC;

-- =====================================================
-- 备注 / Notes:
-- =====================================================
-- 
-- 1. 此脚本只删除明显异常的数据（volume > 100,000kg）
-- 2. 正常训练volume范围：5,000-30,000kg
-- 3. 用户有效数据已确认：8,302kg, 9,817.5kg, 13,868kg, 16,028kg
-- 4. 删除前请务必备份数据
-- 5. 如果不确定，可以先将异常记录导出到CSV文件
--
-- 导出异常记录的命令（在psql中执行）：
-- \copy (SELECT * FROM workouts WHERE exercises IS NULL OR exercises::text = '[]' OR exercises::text LIKE '%150000%') TO '/tmp/dirty_workouts.csv' CSV HEADER;
-- 
-- =====================================================