-- 检查users表的实际字段名
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;