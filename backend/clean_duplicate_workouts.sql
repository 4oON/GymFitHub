-- =====================================================
-- 清理重复的Workout记录
-- Clean Duplicate Workout Records
-- =====================================================
-- 
-- 问题：某用户有742条workout记录，明显异常
-- 原因：可能是重复同步、批量导入bug或测试数据残留
--
-- 此脚本用于：
-- 1. 识别重复的workout记录（基于created_at时间戳）
-- 2. 保留每个时间戳的第一条记录
-- 3. 删除重复的记录
--
-- ⚠️ 警告：此操作不可逆，请先备份数据！
-- ⚠️ Warning: This operation is irreversible, please backup data first!
-- =====================================================

-- =====================================================
-- 步骤1：分析重复数据
-- Step 1: Analyze duplicate data
-- =====================================================

-- 1.1 查看每个用户的workout数量
SELECT 
    user_id,
    COUNT(*) as workout_count,
    MIN(created_at) as first_workout,
    MAX(created_at) as last_workout,
    CASE 
        WHEN COUNT(*) > 100 THEN '⚠️ 异常（>100条）'
        WHEN COUNT(*) > 50 THEN '⚠️ 可疑（>50条）'
        ELSE '✅ 正常'
    END as status
FROM workouts
GROUP BY user_id
ORDER BY workout_count DESC;

-- 1.2 查找重复的workout（相同created_at时间戳）
SELECT 
    user_id,
    created_at,
    COUNT(*) as duplicate_count,
    array_agg(id) as workout_ids
FROM workouts
GROUP BY user_id, created_at
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- 1.3 统计重复记录总数
SELECT 
    COUNT(*) as total_duplicates,
    'Total duplicate workout records' as description
FROM (
    SELECT 
        user_id,
        created_at,
        COUNT(*) - 1 as extra_copies
    FROM workouts
    GROUP BY user_id, created_at
    HAVING COUNT(*) > 1
) as duplicates;

-- 1.4 查看异常用户（>100条记录）的详细信息
SELECT 
    user_id,
    COUNT(*) as total_workouts,
    COUNT(DISTINCT created_at) as unique_timestamps,
    COUNT(*) - COUNT(DISTINCT created_at) as duplicate_count,
    MIN(created_at) as first_workout,
    MAX(created_at) as last_workout
FROM workouts
GROUP BY user_id
HAVING COUNT(*) > 100
ORDER BY total_workouts DESC;

-- =====================================================
-- 步骤2：删除重复记录（保留最早的一条）
-- Step 2: Delete duplicates (keep the earliest one)
-- =====================================================

-- ⚠️ 取消下面的注释以执行删除
-- ⚠️ Uncomment below to execute deletion

/*
-- 2.1 删除重复的workout记录（保留每个created_at的第一条）
DELETE FROM workouts
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY user_id, created_at 
                ORDER BY id
            ) as row_num
        FROM workouts
    ) as ranked
    WHERE row_num > 1
);

-- 2.2 显示删除结果
SELECT 
    user_id,
    COUNT(*) as remaining_workouts,
    MIN(created_at) as first_workout,
    MAX(created_at) as last_workout
FROM workouts
GROUP BY user_id
ORDER BY remaining_workouts DESC;
*/

-- =====================================================
-- 步骤3：验证清理结果
-- Step 3: Verify cleanup results
-- =====================================================

-- 3.1 确认没有重复记录
SELECT 
    user_id,
    created_at,
    COUNT(*) as count
FROM workouts
GROUP BY user_id, created_at
HAVING COUNT(*) > 1;

-- 3.2 查看最终统计
SELECT 
    COUNT(DISTINCT user_id) as total_users,
    COUNT(*) as total_workouts,
    AVG(workout_count) as avg_workouts_per_user,
    MAX(workout_count) as max_workouts_per_user
FROM (
    SELECT user_id, COUNT(*) as workout_count
    FROM workouts
    GROUP BY user_id
) as user_stats;

-- =====================================================
-- 备注 / Notes:
-- =====================================================
-- 
-- 1. 此脚本基于created_at时间戳识别重复记录
-- 2. 如果两条记录的created_at完全相同，只保留第一条（按id排序）
-- 3. 删除前请务必备份数据
-- 4. 建议先在测试环境执行
-- 
-- 导出重复记录的命令（在psql中执行）：
-- \copy (SELECT * FROM workouts WHERE id IN (SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, created_at ORDER BY id) as row_num FROM workouts) as ranked WHERE row_num > 1)) TO '/tmp/duplicate_workouts.csv' CSV HEADER;
-- 
-- =====================================================