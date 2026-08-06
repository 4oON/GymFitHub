-- 创建 weekly_reports 表
-- 用于存储用户的周训练报告

CREATE TABLE IF NOT EXISTS weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    date_range_start VARCHAR(10) NOT NULL, -- YYYY-MM-DD
    date_range_end VARCHAR(10) NOT NULL,   -- YYYY-MM-DD
    
    -- 统计数据 (JSON格式)
    stats JSONB NOT NULL,                  -- WeeklyStats
    muscle_distribution JSONB NOT NULL,    -- MuscleDistributionData[]
    weekly_progress JSONB,                 -- WeeklyProgress (可选)
    sessions JSONB NOT NULL,               -- WorkoutSession[] (简化版本)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- 确保每个用户的每周只有一个报告
    CONSTRAINT unique_user_week UNIQUE (user_id, year, week_number)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_year_week 
ON weekly_reports(user_id, year, week_number);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_created 
ON weekly_reports(user_id, created_at DESC);

-- 添加注释
COMMENT ON TABLE weekly_reports IS '用户周训练报告表';
COMMENT ON COLUMN weekly_reports.week_number IS 'ISO周数 (1-53)';
COMMENT ON COLUMN weekly_reports.year IS '年份';
COMMENT ON COLUMN weekly_reports.stats IS '周统计数据: {totalVolume, totalSets, totalReps, totalExercises, totalDuration, totalCalories, workoutDays}';
COMMENT ON COLUMN weekly_reports.muscle_distribution IS '肌肉群分布数据: [{muscle, totalWeight, percentage, sets, exercises}]';
COMMENT ON COLUMN weekly_reports.weekly_progress IS '与上周对比: {volumeChange, setsChange, repsChange, prevWeekId}';
COMMENT ON COLUMN weekly_reports.sessions IS '本周训练记录 (简化版本)';
