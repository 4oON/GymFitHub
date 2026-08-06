-- =====================================================
-- 清理未来日期脏数据脚本
-- Clean Future Date Dirty Data Script
-- =====================================================
--
-- 此脚本专门用于清理以下问题：
-- 1. date字段为2026年（未来日期）的记录
-- 2. 重复的测试数据
-- 3. 特定用户的批量测试数据
--
-- ⚠️ 警告：此操作不可逆，请先备份数据！
-- ⚠️ Warning: This operation is irreversible, please backup data first!
--
-- 执行步骤：
-- 1. 先运行查询SQL查看将被处理的记录
-- 2. 确认无误后，取消注释相应的DELETE语句
-- 3. 分步执行，每步验证结果
--
-- =====================================================

-- =====================================================
-- 步骤0：创建备份表
-- Step 0: Create backup table
-- =====================================================

-- 创建备份表（带时间戳）
CREATE TABLE IF NOT EXISTS workouts_backup_future_date_20260115 AS 
SELECT * FROM workouts;

-- 验证备份
SELECT 
    COUNT(*) as backup_count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM workouts_backup_future_date_20260115;

-- =====================================================
-- 步骤1：分析脏数据
-- Step 1: Analyze dirty data
-- =====================================================

-- 1.1 查看所有2026年的记录
SELECT 
    COUNT(*) as future_date_count,
    MIN(date) as earliest_future_date,
    MAX(date) as latest_future_date
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- 1.2 查看按日期分组的记录数
SELECT 
    DATE(date) as workout_date,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026
GROUP BY DATE(date)
ORDER BY workout_date DESC;

-- 1.3 查看特定用户的记录（从截图中看到的user_id）
SELECT 
    user_id,
    COUNT(*) as workout_count,
    MIN(date) as first_date,
    MAX(date) as last_date,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM workouts
WHERE user_id = '83381e3a-c430-48ca-9fba-b799b...'  -- 请替换为完整的user_id
GROUP BY user_id;

-- 1.4 查看所有用户的统计（找出异常用户）
SELECT 
    user_id,
    COUNT(*) as workout_count,
    COUNT(CASE WHEN EXTRACT(YEAR FROM date) >= 2026 THEN 1 END) as future_date_count,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM workouts
GROUP BY user_id
ORDER BY future_date_count DESC;

-- 1.5 预览将被删除的记录（前50条）
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    updated_at,
    duration_min,
    jsonb_array_length(exercises::jsonb) as exercise_count
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026
ORDER BY created_at DESC
LIMIT 50;

-- =====================================================
-- 步骤2：删除2026年的所有记录
-- Step 2: Delete all 2026 records
-- =====================================================

-- 2.1 统计将被删除的记录数
SELECT 
    COUNT(*) as records_to_delete,
    'Records with date in 2026 or later' as description
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- 2.2 执行删除（取消注释以执行）
-- ⚠️ 这将删除所有2026年及以后的记录
/*
DELETE FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting future dates' as description
FROM workouts;
*/

-- =====================================================
-- 步骤3：删除特定用户的所有记录（如果需要）
-- Step 3: Delete all records for specific user (if needed)
-- =====================================================

-- 3.1 查看特定用户的所有记录
-- 请将下面的user_id替换为您要删除的完整user_id
/*
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    duration_min
FROM workouts
WHERE user_id = '83381e3a-c430-48ca-9fba-b799b...'  -- 替换为完整的user_id
ORDER BY created_at DESC;
*/

-- 3.2 删除特定用户的所有记录（取消注释以执行）
-- ⚠️ 这将删除该用户的所有训练记录
/*
DELETE FROM workouts
WHERE user_id = '83381e3a-c430-48ca-9fba-b799b...';  -- 替换为完整的user_id

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting specific user' as description
FROM workouts;
*/

-- =====================================================
-- 步骤4：删除今天创建的所有记录（如果是今天的测试数据）
-- Step 4: Delete all records created today (if they are test data)
-- =====================================================

-- 4.1 查看今天创建的记录
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    duration_min
FROM workouts
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 4.2 统计今天创建的记录数
SELECT 
    COUNT(*) as today_count,
    'Records created today' as description
FROM workouts
WHERE DATE(created_at) = CURRENT_DATE;

-- 4.3 删除今天创建的记录（取消注释以执行）
-- ⚠️ 这将删除今天创建的所有记录
/*
DELETE FROM workouts
WHERE DATE(created_at) = CURRENT_DATE;

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting today records' as description
FROM workouts;
*/

-- =====================================================
-- 步骤5：删除最近N小时创建的记录
-- Step 5: Delete records created in last N hours
-- =====================================================

-- 5.1 查看最近24小时创建的记录
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    duration_min,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
FROM workouts
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5.2 统计最近24小时的记录数
SELECT 
    COUNT(*) as recent_count,
    'Records created in last 24 hours' as description
FROM workouts
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 5.3 删除最近24小时的记录（取消注释以执行）
-- ⚠️ 这将删除最近24小时创建的所有记录
/*
DELETE FROM workouts
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after deleting recent records' as description
FROM workouts;
*/

-- =====================================================
-- 步骤6：组合条件删除（推荐）
-- Step 6: Delete with combined conditions (recommended)
-- =====================================================

-- 6.1 预览将被删除的记录（组合条件）
-- 条件：2026年的日期 OR 今天创建的记录
SELECT 
    id,
    user_id,
    name,
    date,
    created_at,
    duration_min,
    CASE 
        WHEN EXTRACT(YEAR FROM date) >= 2026 THEN 'future_date'
        WHEN DATE(created_at) = CURRENT_DATE THEN 'created_today'
        ELSE 'other'
    END as delete_reason
FROM workouts
WHERE 
    EXTRACT(YEAR FROM date) >= 2026
    OR DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 6.2 统计将被删除的记录数
SELECT 
    COUNT(*) as records_to_delete,
    'Records matching combined conditions' as description
FROM workouts
WHERE 
    EXTRACT(YEAR FROM date) >= 2026
    OR DATE(created_at) = CURRENT_DATE;

-- 6.3 执行组合条件删除（取消注释以执行）
-- ⚠️ 这将删除所有符合条件的记录
/*
DELETE FROM workouts
WHERE 
    EXTRACT(YEAR FROM date) >= 2026
    OR DATE(created_at) = CURRENT_DATE;

-- 验证删除结果
SELECT 
    COUNT(*) as remaining_workouts,
    'Total workouts after combined deletion' as description
FROM workouts;
*/

-- =====================================================
-- 步骤7：最终验证
-- Step 7: Final verification
-- =====================================================

-- 7.1 查看清理后的数据统计
SELECT 
    COUNT(*) as total_workouts,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM workouts;

-- 7.2 按用户统计
SELECT 
    user_id,
    COUNT(*) as workout_count,
    MIN(date) as first_workout_date,
    MAX(date) as last_workout_date
FROM workouts
GROUP BY user_id
ORDER BY workout_count DESC;

-- 7.3 按日期统计（确认没有未来日期）
SELECT 
    DATE(date) as workout_date,
    COUNT(*) as count
FROM workouts
GROUP BY DATE(date)
ORDER BY workout_date DESC
LIMIT 30;

-- 7.4 检查是否还有问题数据
SELECT 
    COUNT(*) as future_date_count,
    'Records still with future dates' as description
FROM workouts
WHERE EXTRACT(YEAR FROM date) >= 2026;

-- =====================================================
-- 步骤8：如果需要，恢复备份
-- Step 8: Restore from backup if needed
-- =====================================================

-- 如果清理出现问题，可以从备份恢复
/*
-- 清空当前表
TRUNCATE TABLE workouts;

-- 从备份恢复
INSERT INTO workouts
SELECT * FROM workouts_backup_future_date_20260115;

-- 验证恢复
SELECT COUNT(*) FROM workouts;
*/

-- =====================================================
-- 额外工具：按ID批量删除
-- Extra Tool: Batch delete by IDs
-- =====================================================

-- 如果您想手动选择要删除的记录，可以使用这个方法
-- 1. 先查询获取要删除的ID列表
-- 2. 然后使用IN子句删除

-- 示例：删除特定ID的记录
/*
DELETE FROM workouts
WHERE id IN (
    'afcfc442-9255-4e85-873b-3fec4b097758',
    '0d64670b-aae9-4f17-bd98-cd3f4631f0e55',
    -- 添加更多ID...
);
*/

-- =====================================================
-- 完成！
-- Done!
-- =====================================================

-- 清理完成后的建议：
-- 1. 在应用层添加日期验证，防止未来日期
-- 2. 添加数据库约束：CHECK (date <= CURRENT_DATE + INTERVAL '1 day')
-- 3. 定期运行数据质量检查
-- 4. 考虑添加触发器自动拒绝异常数据
