-- =====================================================
-- 添加 duration_min 字段到 workouts 表
-- Add duration_min field to workouts table
-- =====================================================
--
-- 此脚本用于添加训练时长字段，修复时间显示为0的问题
-- This script adds the duration field to fix the 0-minute display issue
--
-- 执行前请确保：
-- 1. 已备份数据库
-- 2. 在测试环境验证过
-- 3. 有足够的权限执行DDL操作
--
-- =====================================================

-- 步骤1：检查字段是否已存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workouts' 
        AND column_name = 'duration_min'
    ) THEN
        -- 步骤2：添加字段（允许NULL，默认值为0）
        ALTER TABLE workouts 
        ADD COLUMN duration_min INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Column duration_min added successfully';
    ELSE
        RAISE NOTICE 'Column duration_min already exists';
    END IF;
END $$;

-- 步骤3：更新现有记录的duration_min（如果为NULL或0）
-- 使用合理的默认值：45分钟
UPDATE workouts
SET duration_min = 45
WHERE duration_min IS NULL OR duration_min = 0;

-- 步骤4：添加CHECK约束（可选，防止异常值）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'check_duration_min_range'
    ) THEN
        ALTER TABLE workouts 
        ADD CONSTRAINT check_duration_min_range 
        CHECK (duration_min >= 0 AND duration_min <= 600);
        
        RAISE NOTICE 'CHECK constraint added successfully';
    ELSE
        RAISE NOTICE 'CHECK constraint already exists';
    END IF;
END $$;

-- 步骤5：创建索引（可选，提升查询性能）
CREATE INDEX IF NOT EXISTS idx_workouts_duration_min 
ON workouts(duration_min);

-- 步骤6：验证结果
SELECT 
    COUNT(*) as total_workouts,
    COUNT(CASE WHEN duration_min > 0 THEN 1 END) as with_duration,
    COUNT(CASE WHEN duration_min IS NULL OR duration_min = 0 THEN 1 END) as without_duration,
    AVG(duration_min) as avg_duration,
    MIN(duration_min) as min_duration,
    MAX(duration_min) as max_duration
FROM workouts;

-- 步骤7：查看最近的训练记录（验证数据）
SELECT 
    id,
    name,
    duration_min,
    created_at,
    date
FROM workouts
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 完成！
-- Done!
-- =====================================================
