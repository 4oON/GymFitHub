-- 修复所有缺失的字段
-- 在Supabase SQL Editor中运行此脚本

-- 1. 检查users表的所有字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 添加缺失的updated_at字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. 添加缺失的created_at字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. 为现有记录设置默认值
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;

-- 5. 验证修复结果
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 6. 检查是否所有必需字段都存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') THEN '✅' 
    ELSE '❌' 
  END AS has_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN '✅' 
    ELSE '❌' 
  END AS has_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN '✅' 
    ELSE '❌' 
  END AS has_password,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN '✅' 
    ELSE '❌' 
  END AS has_created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN '✅' 
    ELSE '❌' 
  END AS has_updated_at;