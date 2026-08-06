# Weekly Reports 数据库迁移指南

## 问题诊断

### 根本原因
Weekly Report功能无法显示的根本原因是:**Supabase数据库中缺少`weekly_reports`表**

虽然代码已经实现:
- ✅ 后端API路由已实现 ([`backend/src/routes/weeklyReport.ts`](../backend/src/routes/weeklyReport.ts))
- ✅ Prisma schema已定义 ([`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma))
- ✅ 前端同步服务已实现 ([`frontend/src/features/report/services/ReportStorageService.ts`](../frontend/src/features/report/services/ReportStorageService.ts))

但是:**数据库迁移从未执行**,导致表不存在。

## 解决方案

### 步骤1: 在Supabase执行SQL创建表

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 创建新查询,复制以下SQL并执行:

```sql
-- 创建 weekly_reports 表
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
```

### 步骤2: 验证表创建成功

在Supabase SQL Editor中执行:

```sql
-- 验证表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'weekly_reports'
ORDER BY ordinal_position;
```

应该看到所有列的信息。

### 步骤3: 测试API

执行SQL后,Railway上的后端API应该立即可用。测试:

```bash
# 获取所有周报告 (需要auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-railway-app.railway.app/api/weekly-reports
```

### 步骤4: 前端自动同步

表创建后,前端会自动:
1. 检测缺失的周报告
2. 生成报告
3. 同步到后端
4. 跨设备显示

## 数据结构说明

### WeeklyStats (stats字段)
```typescript
{
  totalVolume: number,      // 总训练负荷 (kg)
  totalSets: number,        // 总组数
  totalReps: number,        // 总次数
  totalExercises: number,   // 总动作数
  totalDuration: number,    // 总时长 (分钟)
  totalCalories: number,    // 总消耗卡路里
  workoutDays: number       // 训练天数
}
```

### MuscleDistributionData (muscle_distribution字段)
```typescript
[{
  muscle: string,           // 肌肉群名称
  totalWeight: number,      // 该肌肉群总负荷
  percentage: number,       // 占比 (%)
  sets: number,             // 组数
  exercises: string[]       // 动作列表
}]
```

### WeeklyProgress (weekly_progress字段)
```typescript
{
  volumeChange: number,     // 负荷变化 (%)
  setsChange: number,       // 组数变化 (%)
  repsChange: number,       // 次数变化 (%)
  prevWeekId: string        // 上周报告ID
}
```

## 常见问题

### Q: 为什么不用Prisma migrate?
A: 因为后端永远在Railway上运行,本地没有配置数据库连接。直接在Supabase执行SQL更简单直接。

### Q: 现有数据会丢失吗?
A: 不会。这只是创建新表,不影响现有的users、workouts等表。

### Q: 需要重启Railway吗?
A: 不需要。表创建后,后端API立即可用。

### Q: 如果表已存在怎么办?
A: SQL使用了`IF NOT EXISTS`,重复执行不会报错。

## 验证成功

执行SQL后,你应该能够:
1. ✅ 在手机端看到weekly report
2. ✅ 在桌面端看到weekly report
3. ✅ 两端数据同步
4. ✅ 自动生成缺失的周报告

## 下一步

表创建成功后,系统会:
1. 自动检测所有有训练的周
2. 为缺失的周生成报告
3. 同步到数据库
4. 跨设备显示

不需要手动操作,一切都是自动的!
