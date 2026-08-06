# Railway 部署同步指南

## 问题描述

当前情况：
- **Railway 部署版本**：基于 PR #42 (`477721d`)，可以正常显示1月8号的训练记录
- **本地开发版本**：`feature/ios-health-data-sync` 分支，包含最新的 backend 修改，但看不到1月8号的记录

## 根本原因

`feature/ios-health-data-sync` 分支包含了以下 backend 修改，但这些修改尚未合并到 `master` 分支：

1. **5f872f7** - feat: 添加批量同步workout数据的后端API
2. **79684c4** - fix: 修复workout创建API以支持额外字段
3. **bb56410** - fix: 移除description字段以匹配数据库schema
4. **5f9f98c** - fix: 移除workout API中不存在的status字段查询

这些修改改变了 backend API 的行为，可能导致数据查询或显示问题。

## 解决方案

### 方案1：合并到 master 并重新部署（推荐）

```bash
# 1. 切换到 master 分支
git checkout master

# 2. 拉取最新的 master
git pull origin master

# 3. 合并 feature/ios-health-data-sync 分支
git merge feature/ios-health-data-sync

# 4. 解决可能的冲突（如果有）
# 编辑冲突文件，然后：
git add .
git commit -m "chore: merge ios-health-data-sync into master"

# 5. 推送到 master
git push origin master

# 6. Railway 会自动检测到 master 分支的更新并重新部署
```

### 方案2：回滚本地到 PR #42 版本

如果你想保持本地和 Railway 一致：

```bash
# 1. 创建一个新分支保存当前工作
git checkout -b backup/ios-health-data-sync-backup

# 2. 切换到 master
git checkout master

# 3. 拉取最新的 master（PR #42 版本）
git pull origin master

# 4. 在本地运行
cd frontend
npm run dev
```

### 方案3：临时使用 Railway 的 master 版本

如果你只是想测试，可以直接使用 Railway 上已部署的版本：

```bash
# 访问 Railway 部署的前端 URL
# 这个版本应该可以正常显示1月8号的记录
```

## 推荐流程

### 步骤1：验证数据完整性

在合并之前，先验证数据：

```bash
# 1. 使用诊断工具检查后端数据
# 打开: http://localhost:5173/check-jan8-backend.html

# 2. 查询1月8号的数据是否存在于数据库中
# 如果存在，说明问题在前端显示逻辑
# 如果不存在，说明数据可能在同步过程中丢失
```

### 步骤2：对比代码差异

```bash
# 查看 master 和 feature/ios-health-data-sync 的差异
git diff master feature/ios-health-data-sync -- backend/src/routes/workout.ts

# 查看前端 ProgressView 的差异
git diff master feature/ios-health-data-sync -- frontend/src/features/report/components/ProgressView.tsx
```

### 步骤3：安全合并

```bash
# 1. 确保所有更改已提交
git status

# 2. 切换到 master
git checkout master

# 3. 创建一个合并分支（安全起见）
git checkout -b merge/ios-health-data-sync

# 4. 合并 feature 分支
git merge feature/ios-health-data-sync

# 5. 测试合并后的代码
cd frontend && npm run dev
cd backend && npm run dev

# 6. 如果测试通过，推送到 master
git checkout master
git merge merge/ios-health-data-sync
git push origin master
```

## 关键检查点

### Backend API 变更

检查以下 API 端点是否正常工作：

1. **GET /api/workouts** - 获取所有训练记录
   - 确保返回所有日期的记录，包括1月8号
   - 检查 `createdAt` 字段格式

2. **POST /api/workout/batch-sync** - 批量同步
   - 新增的端点，确保不影响现有数据

3. **POST /api/workout** - 创建训练记录
   - 字段从 `description` 改为 `createdAt`
   - 确保兼容性

### Frontend 显示逻辑

检查 `ProgressView.tsx` 中的日期过滤逻辑：

```typescript
// 确保日期验证不会过滤掉有效记录
const validWorkouts = useMemo(() => {
  return workouts.filter(workout => {
    const date = new Date(workout.date);
    return !isNaN(date.getTime()); // 只过滤无效日期
  });
}, [workouts]);
```

## 部署后验证

合并并部署到 Railway 后，进行以下验证：

1. **访问 Railway 前端 URL**
2. **登录账户**
3. **导航到 Progress 页面**
4. **检查1月8号的记录是否显示**
5. **使用诊断工具验证数据**：
   ```
   https://your-railway-url.app/check-jan8-backend.html
   ```

## 回滚计划

如果部署后出现问题，可以快速回滚：

```bash
# 1. 在 Railway Dashboard 中找到之前的部署
# 2. 点击 "Rollback" 按钮回滚到 PR #42 版本

# 或者通过 Git 回滚：
git checkout master
git reset --hard 477721d  # PR #42 的 commit
git push origin master --force
```

## 总结

**当前状态**：
- ✅ Railway (master) - 可以显示1月8号记录
- ❌ 本地 (feature/ios-health-data-sync) - 看不到1月8号记录

**推荐操作**：
1. 使用诊断工具检查后端数据是否存在
2. 对比代码差异，找出导致显示问题的原因
3. 修复问题后，再合并到 master
4. 推送到 Railway 重新部署

**注意事项**：
- 合并前务必备份当前工作
- 测试所有关键功能
- 准备好回滚方案