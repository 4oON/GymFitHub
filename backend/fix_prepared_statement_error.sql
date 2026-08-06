-- 修复Supabase Pooler的prepared statement错误
-- 在Supabase SQL Editor中运行此脚本

-- 这个错误是因为使用了Session Pooler而不是Transaction Pooler
-- 解决方案：清理prepared statements或切换到Transaction Pooler

-- 方案1：清理所有prepared statements（临时解决）
DEALLOCATE ALL;

-- 方案2：检查当前连接模式
SHOW pool_mode;

-- 注意：这个错误通常需要修改DATABASE_URL的连接参数
-- 需要在.env文件中添加 ?pgbouncer=true&connection_limit=1