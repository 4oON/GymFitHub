-- 添加缺失的数据库列（包含is_active）
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

-- 4. 为routines表添加is_active列（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'routines' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE routines ADD COLUMN is_active BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_active column to routines table';
    ELSE
        RAISE NOTICE 'is_active column already exists in routines table';
    END IF;
END $$;

-- 5. 验证所有列都已添加
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
  AND column_name IN ('workouts', 'is_active')
ORDER BY table_name, column_name;