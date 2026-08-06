-- iOS健康数据功能 - 数据库迁移脚本
-- 执行日期: 2026-01-06
-- 说明: 添加健康数据同步相关的字段和表

-- 1. 为 user_profiles 表添加iOS健康数据相关字段
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS health_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_sync_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_sync_consent_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS body_fat_percent DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_health_sync TIMESTAMP,
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT true;

-- 2. 创建 health_data 表（如果不存在）
CREATE TABLE IF NOT EXISTS health_data (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    weight DOUBLE PRECISION,
    body_fat_percent DOUBLE PRECISION,
    gender TEXT,
    sync_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. 为 health_data 表创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS health_data_user_id_sync_date_idx 
ON health_data(user_id, sync_date);

-- 4. 验证表结构
-- 查看 user_profiles 表的新字段
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN (
    'health_sync_enabled',
    'health_sync_consent', 
    'health_sync_consent_date',
    'body_fat_percent',
    'last_health_sync',
    'auto_sync_enabled'
);

-- 查看 health_data 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'health_data'
ORDER BY ordinal_position;