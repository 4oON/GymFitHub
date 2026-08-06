-- 检查并修复users表的password字段问题
-- 在Supabase SQL Editor中运行此脚本

-- 1. 首先检查users表的结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 检查是否存在password_hash字段
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users' AND column_name LIKE '%password%';

-- 3. 如果存在password_hash但不存在password，重命名字段
-- 注意：只有在确认存在password_hash字段后才运行此命令
-- ALTER TABLE users RENAME COLUMN password_hash TO password;

-- 4. 如果两个字段都不存在，添加password字段
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';

-- 5. 验证修复后的表结构
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;