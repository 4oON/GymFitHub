# 训练时间和脏数据问题修复 - 执行指南

## 快速概览

### 问题
1. ❌ 训练report显示0分钟（1月15日10602kg、1月14日16210kg）
2. ❌ 脏数据持续存在（300kg、82000kg等异常数据）

### 根本原因
1. **后端API没有保存`durationMin`字段** - 前端传了但后端没接收
2. **缺少数据验证机制** - 异常数据可以直接写入数据库
3. **数据库没有约束** - JSON字段内容完全不受控制

### 修复方案
✅ 已完成代码修改：
- 后端API添加`durationMin`字段支持
- Prisma Schema添加字段定义
- 前端添加数据验证逻辑
- 创建数据清理SQL脚本

## 执行步骤

### 第一步：数据库添加字段（必须）

在Supabase SQL Editor中执行：

```sql
-- 执行文件：backend/add_duration_min_field.sql
-- 这个脚本会：
-- 1. 添加 duration_min 字段
-- 2. 更新现有记录为默认值45分钟
-- 3. 添加CHECK约束防止异常值
```

**验证：**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'workouts' AND column_name = 'duration_min';
```

### 第二步：清理现有脏数据（谨慎）

⚠️ **重要：先备份数据！**

在Supabase SQL Editor中执行：

```sql
-- 执行文件：backend/clean_workout_data_comprehensive.sql
-- 
-- 建议分步执行：
-- 1. 先运行查询部分，查看将被处理的数据
-- 2. 确认无误后，取消注释UPDATE/DELETE语句
-- 3. 每步执行后验证结果
```

**重点清理：**
- ✅ 修复duration_min为0的记录（设为45分钟）
- ✅ 删除空exercises的记录
- ✅ 删除异常重量的记录（82000kg、300kg等）
- ✅ 删除重复记录

### 第三步：更新Prisma Client

在backend目录执行：

```bash
cd backend
npx prisma generate
npx prisma db push  # 或者创建migration
```

### 第四步：部署后端到Railway

```bash
cd backend
git add .
git commit -m "fix: add durationMin field and data validation"
git push origin main
```

Railway会自动部署。

### 第五步：测试验证

1. **测试新训练保存：**
   - 完成一次训练
   - 检查report是否显示正确的时间
   - 在Supabase中验证`duration_min`字段有值

2. **测试数据验证：**
   - 尝试保存异常数据（如10000kg单组重量）
   - 应该被拒绝并显示错误信息

3. **验证历史数据：**
   - 查看1月15日和1月14日的训练
   - 确认时间显示正确（应该是45分钟或实际时间）

## 验证SQL

### 检查duration_min字段
```sql
SELECT 
    id,
    name,
    duration_min,
    created_at,
    date
FROM workouts
WHERE DATE(COALESCE(date, created_at)) IN ('2026-01-14', '2026-01-15')
ORDER BY created_at DESC;
```

### 检查是否还有脏数据
```sql
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN duration_min IS NULL OR duration_min = 0 THEN 1 END) as zero_duration,
    COUNT(CASE WHEN exercises IS NULL OR exercises::text = '[]' THEN 1 END) as empty_exercises,
    COUNT(CASE WHEN exercises::text LIKE '%82000%' OR exercises::text LIKE '%300000%' THEN 1 END) as abnormal_weight
FROM workouts;
```

### 查看数据质量统计
```sql
SELECT 
    COUNT(*) as total_workouts,
    AVG(duration_min) as avg_duration,
    MIN(duration_min) as min_duration,
    MAX(duration_min) as max_duration,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM workouts;
```

## 预期结果

### 修复后
- ✅ 新训练的duration正确保存（不再是0）
- ✅ 历史训练显示默认45分钟（如果原来是0）
- ✅ 异常数据被清理（300kg、82000kg等）
- ✅ 重复数据被删除
- ✅ 未来不会再产生脏数据（有验证机制）

### 数据验证规则
- 训练时长：5-600分钟
- 总volume：100-100,000kg
- 单个动作volume：<50,000kg
- 单组重量：<500kg（腿部<1000kg）
- 单组次数：1-100次

## 回滚方案

如果出现问题，可以从备份恢复：

```sql
-- 恢复数据
TRUNCATE TABLE workouts;
INSERT INTO workouts SELECT * FROM workouts_backup_20260115;

-- 验证
SELECT COUNT(*) FROM workouts;
```

## 注意事项

1. ⚠️ **数据库操作前务必备份**
2. ⚠️ **分步执行，每步验证**
3. ⚠️ **保留备份至少7天**
4. ✅ **修复后监控新数据质量**
5. ✅ **如有问题立即回滚**

## 文件清单

### 已修改的文件
- ✅ [`backend/src/routes/workout.ts`](../backend/src/routes/workout.ts) - 添加durationMin支持
- ✅ [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) - 添加字段定义
- ✅ [`frontend/src/services/WorkoutSyncService.ts`](../frontend/src/services/WorkoutSyncService.ts) - 添加数据验证

### 新增的文件
- ✅ [`backend/add_duration_min_field.sql`](../backend/add_duration_min_field.sql) - 添加字段脚本
- ✅ [`backend/clean_workout_data_comprehensive.sql`](../backend/clean_workout_data_comprehensive.sql) - 清理脏数据脚本
- ✅ [`docs/WORKOUT_DURATION_AND_DIRTY_DATA_FIX.md`](./WORKOUT_DURATION_AND_DIRTY_DATA_FIX.md) - 详细技术文档

## 联系支持

如果执行过程中遇到问题：
1. 查看详细技术文档：[`WORKOUT_DURATION_AND_DIRTY_DATA_FIX.md`](./WORKOUT_DURATION_AND_DIRTY_DATA_FIX.md)
2. 检查Railway部署日志
3. 查看Supabase数据库日志
4. 如有疑问，先回滚再排查

---

**最后更新：** 2026-01-15
**状态：** ✅ 代码已修改，等待部署和测试
