-- 数据库备份脚本
-- 在 Supabase SQL Editor 执行，复制结果保存为 .sql 文件

-- 1. 生成所有表的 CREATE TABLE 语句
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', '
    ) || ');' as create_table_sql
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;

-- 2. 导出关键表数据（以 INSERT 格式）
-- Workouts
SELECT 'INSERT INTO workouts (id, user_id, name, description, date, duration_min, exercises, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || date::text || '''', 'NULL') || ', ' ||
    COALESCE(duration_min::text, '0') || ', ' ||
    '''' || REPLACE(exercises::text, '''', '''''') || '''::json, ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || ''''
    || ');' as insert_sql
FROM workouts;

-- Routines
SELECT 'INSERT INTO routines (id, user_id, name, description, workouts, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    COALESCE('''' || REPLACE(description, '''', '''''') || '''', 'NULL') || ', ' ||
    '''' || REPLACE(workouts::text, '''', '''''') || '''::json, ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || ''''
    || ');' as insert_sql
FROM routines;

-- AI Provider Configs
SELECT 'INSERT INTO ai_provider_configs (id, user_id, name, is_default, provider, base_url, api_key, model_id, temperature, cached_models, balance_info, last_balance_check, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    is_default || ', ' ||
    '''' || provider || ''', ' ||
    COALESCE('''' || base_url || '''', 'NULL') || ', ' ||
    '''' || REPLACE(api_key, '''', '''''') || ''', ' ||
    '''' || model_id || ''', ' ||
    temperature || ', ' ||
    COALESCE('''' || cached_models::text || '''::jsonb', 'NULL') || ', ' ||
    COALESCE('''' || balance_info::text || '''::jsonb', 'NULL') || ', ' ||
    COALESCE('''' || last_balance_check::text || '''', 'NULL') || ', ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || ''''
    || ');' as insert_sql
FROM ai_provider_configs;

-- User Profiles
SELECT 'INSERT INTO user_profiles (id, user_id, age, gender, weight, height, fitness_goal, experience_level, health_sync_enabled, health_sync_consent, health_sync_consent_date, body_fat_percent, last_health_sync, auto_sync_enabled, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    COALESCE(age::text, 'NULL') || ', ' ||
    COALESCE('''' || gender || '''', 'NULL') || ', ' ||
    COALESCE(weight::text, 'NULL') || ', ' ||
    COALESCE(height::text, 'NULL') || ', ' ||
    COALESCE('''' || fitness_goal || '''', 'NULL') || ', ' ||
    COALESCE('''' || experience_level || '''', 'NULL') || ', ' ||
    health_sync_enabled || ', ' ||
    health_sync_consent || ', ' ||
    COALESCE('''' || health_sync_consent_date::text || '''', 'NULL') || ', ' ||
    COALESCE(body_fat_percent::text, 'NULL') || ', ' ||
    COALESCE('''' || last_health_sync::text || '''', 'NULL') || ', ' ||
    auto_sync_enabled || ', ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || ''''
    || ');' as insert_sql
FROM user_profiles;

-- Health Data
SELECT 'INSERT INTO health_data (id, user_id, weight, body_fat_percent, gender, sync_date, created_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    COALESCE(weight::text, 'NULL') || ', ' ||
    COALESCE(body_fat_percent::text, 'NULL') || ', ' ||
    COALESCE('''' || gender || '''', 'NULL') || ', ' ||
    '''' || sync_date || ''', ' ||
    '''' || created_at || ''''
    || ');' as insert_sql
FROM health_data;

-- Weekly Reports
SELECT 'INSERT INTO weekly_reports (id, user_id, year, week_number, summary, muscle_analysis, improvements, recommendations, stats, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    year || ', ' ||
    week_number || ', ' ||
    '''' || REPLACE(summary, '''', '''''') || ''', ' ||
    '''' || REPLACE(muscle_analysis::text, '''', '''''') || '''::jsonb, ' ||
    '''' || REPLACE(improvements::text, '''', '''''') || '''::jsonb, ' ||
    '''' || REPLACE(recommendations::text, '''', '''''') || '''::jsonb, ' ||
    '''' || REPLACE(stats::text, '''', '''''') || '''::jsonb, ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || ''''
    || ');' as insert_sql
FROM weekly_reports;
