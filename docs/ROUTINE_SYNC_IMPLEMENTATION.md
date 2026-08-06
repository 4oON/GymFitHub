# My Routine 同步功能实施文档

## 📋 任务概述

实现 My Routine 功能与后端的完全同步，解决数据丢失问题，并修复从 routine 启动训练时视频无法显示的 bug。

## 🎯 实施目标

1. ✅ 实现 Routine 数据与后端的完全同步（CRUD）
2. ✅ 添加预定义的肩部训练组 1（6个动作）
3. ✅ 修复从 routine 启动训练时视频无法显示的问题
4. ✅ 修复 Edit Routine 页面 Save 按钮无反应的问题

## 🔧 技术实施

### 1. 后端实现

#### 1.1 数据库模型（Prisma Schema）

```prisma
model Routine {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  name        String
  description String?
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises   RoutineExercise[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt      @map("updated_at")

  @@map("routines")
}

model RoutineExercise {
  id              String   @id @default(uuid())
  routineId       String   @map("routine_id")
  exerciseId      String   @map("exercise_id")
  exerciseName    String   @map("exercise_name")
  exerciseNameZh  String?  @map("exercise_name_zh")
  muscleGroup     String   @map("muscle_group")
  equipment       String?
  mechanic        String?
  videoUrl        String?  @map("video_url")
  orderIndex      Int      @map("order_index")
  routine         Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)

  @@map("routine_exercises")
}
```

#### 1.2 REST API 端点

**文件：** `backend/src/routes/routine.ts`

- `POST /api/routine` - 创建新 routine
- `GET /api/routine` - 获取用户所有 routines
- `PUT /api/routine/:id` - 更新 routine
- `DELETE /api/routine/:id` - 删除 routine

### 2. 前端实现

#### 2.1 同步服务

**文件：** `frontend/src/services/RoutineSyncService.ts`

核心功能：
- `syncRoutineToBackend()` - 同步单个 routine 到后端
- `loadRoutinesFromBackend()` - 从后端加载所有 routines
- `updateRoutineInBackend()` - 更新后端 routine
- `deleteRoutineFromBackend()` - 删除后端 routine
- `mergeRoutineData()` - 智能合并本地和远程数据

#### 2.2 预定义 Routine

**文件：** `frontend/src/data/predefined-routines.ts`

```typescript
export const SHOULDER_ROUTINE_1: Omit<Routine, 'id' | 'createdAt'> = {
    name: '肩部训练组 1',
    exercises: [
        {
            id: 'db-shoulder-press',
            name: 'Dumbbell Seated Overhead Press',
            nameZh: '坐姿哑铃推举',
            muscleGroup: MuscleGroup.SHOULDERS,
            // ... 其他属性
        },
        // ... 其他5个动作
    ]
};
```

#### 2.3 自动同步集成

**文件：** `frontend/src/pages/MainApp.tsx`

**关键实现点：**

1. **登录时自动加载：**
```typescript
useEffect(() => {
    const loadRoutinesFromBackend = async () => {
        if (!isAuthenticated || !user) return;
        
        const remoteRoutines = await RoutineSyncService.loadRoutinesFromBackend([...]);
        let mergedRoutines = RoutineSyncService.mergeRoutineData(localRoutines, remoteRoutines);
        
        // 自动添加预定义 routine
        if (!hasPredefinedRoutine(mergedRoutines, SHOULDER_ROUTINE_1.name)) {
            const shoulderRoutine = { ...SHOULDER_ROUTINE_1, id: generateUUID(), createdAt: getCurrentTimestamp() };
            await RoutineSyncService.syncRoutineToBackend(shoulderRoutine);
            mergedRoutines = [shoulderRoutine, ...mergedRoutines];
        }
        
        setRoutines(mergedRoutines);
    };
    
    loadRoutinesFromBackend();
}, [isAuthenticated, user?.id]);
```

2. **创建时立即同步：**
```typescript
const handleSaveRoutine = async () => {
    const newRoutine: Routine = { /* ... */ };
    
    const backendId = await RoutineSyncService.syncRoutineToBackend(newRoutine);
    if (backendId) {
        newRoutine.id = backendId;
    }
    
    setRoutines(prev => [...prev, newRoutine]);
};
```

3. **删除时同步后端：**
```typescript
const handleDeleteRoutine = async (id: string) => {
    await RoutineSyncService.deleteRoutineFromBackend(id);
    setRoutines(prev => prev.filter(r => r.id !== id));
};
```

## 🐛 Bug 修复

### Bug 1: 视频无法显示

**问题描述：**
从 routine 启动训练后，点击动作的 info 按钮，视频无法显示。

**Root Cause：**
1. localStorage 中存储的 routine 使用了错误的 exercise ID（如 `'close-grip-bench-press'`）
2. 这些 ID 不存在于 `INITIAL_EXERCISES` 中
3. `InProgressWorkout` 组件的 `exerciseLibrary` prop 只包含 `commonExercises + comprehensiveExercises`，缺少 `INITIAL_EXERCISES`
4. `getExerciseDetails(exerciseId)` 找不到对应的 exercise，返回 `undefined`
5. 视频渲染条件 `{exerciseDetails?.videoUrl && ...}` 不满足，视频不显示

**解决方案：**

**文件：** `frontend/src/pages/MainApp.tsx:1580-1587`

```typescript
exerciseLibrary={(() => {
    // 创建完整的 exercise library，包含去重
    const allExercises = [...INITIAL_EXERCISES, ...commonExercises, ...comprehensiveExercises];
    const uniqueExercises = Array.from(
        new Map(allExercises.map(ex => [ex.id, ex])).values()
    );
    return uniqueExercises;
})()}
```

**关键改进：**
- 合并 `INITIAL_EXERCISES`、`commonExercises` 和 `comprehensiveExercises`
- 使用 Map 去重，确保每个 exercise ID 只出现一次
- 保证所有预定义 routine 的动作都能在 library 中找到

### Bug 2: Save Routine 按钮无反应

**问题描述：**
在 Edit Routine 页面点击 "+ Add Manual" 添加动作后，Save Routine 按钮仍然是禁用状态。

**Root Cause：**
`selectedRoutineExercises` 状态和 `RoutineCreator` 组件的 `exercises` prop 没有正确同步。当用户通过 `ExerciseSelector` 选择动作时，只更新了 `selectedRoutineExercises`，但 `RoutineCreator` 没有收到更新。

**解决方案：**

确保 `selectedRoutineExercises` 正确传递给 `RoutineCreator`：

```typescript
<RoutineCreator
    exercises={selectedRoutineExercises}
    onUpdateExercises={setSelectedRoutineExercises}
    // ...
/>
```

当用户完成选择时，状态会自动同步，Save 按钮变为可用。

## 📊 数据流图

```
用户登录
    ↓
加载本地 routines (localStorage)
    ↓
加载远程 routines (Backend API)
    ↓
智能合并 (mergeRoutineData)
    ↓
检查预定义 routine
    ↓
如果不存在 → 创建并同步到后端
    ↓
显示所有 routines
    ↓
用户操作 (CRUD)
    ↓
立即同步到后端
    ↓
更新本地状态
    ↓
保存到 localStorage (备份)
```

## 🧪 测试验证

### 测试场景 1：首次登录
1. ✅ 清除 localStorage
2. ✅ 登录账号
3. ✅ 验证"肩部训练组 1"自动出现
4. ✅ 验证后端数据库中有对应记录

### 测试场景 2：视频显示
1. ✅ 点击"肩部训练组 1"
2. ✅ 启动训练
3. ✅ 点击任意动作的 info 按钮
4. ✅ 验证视频正常显示

### 测试场景 3：创建 Routine
1. ✅ 创建新 routine
2. ✅ 添加动作
3. ✅ 保存
4. ✅ 验证后端同步成功
5. ✅ 刷新页面，验证数据持久化

### 测试场景 4：编辑 Routine
1. ✅ 编辑现有 routine
2. ✅ 点击 "+ Add Manual"
3. ✅ 选择动作
4. ✅ 验证 Save 按钮可用
5. ✅ 保存并验证同步

### 测试场景 5：删除 Routine
1. ✅ 删除 routine
2. ✅ 验证后端数据被删除
3. ✅ 验证本地状态更新

## 📝 文件变更清单

### 后端文件
- ✅ `backend/prisma/schema.prisma` - 添加 Routine 和 RoutineExercise 模型
- ✅ `backend/src/routes/routine.ts` - 新建 Routine API 路由
- ✅ `backend/src/index.ts` - 注册 routine 路由

### 前端文件
- ✅ `frontend/src/services/RoutineSyncService.ts` - 新建同步服务
- ✅ `frontend/src/data/predefined-routines.ts` - 新建预定义 routine
- ✅ `frontend/src/pages/MainApp.tsx` - 集成同步功能，修复 bug
- ✅ `frontend/src/features/workout/components/InProgressWorkout.tsx` - 修复视频显示

### 文档
- ✅ `docs/ROUTINE_SYNC_IMPLEMENTATION.md` - 本文档

## 🚀 部署步骤

1. **数据库迁移：**
```bash
cd backend
npx prisma migrate dev --name add_routine_tables
```

2. **推送代码：**
```bash
git push origin fix-my-routine-sync
```

3. **创建 Pull Request**

4. **合并到 main 分支**

5. **部署到生产环境**

## 📈 性能优化

1. **智能合并策略：** 避免重复数据，优先使用远程数据
2. **批量同步：** 首次登录时批量同步本地未同步的 routines
3. **错误处理：** 同步失败时保留本地数据，标记为 pending
4. **去重优化：** 使用 Map 进行 O(n) 时间复杂度的去重

## 🔒 安全考虑

1. **用户隔离：** 所有 API 都通过 JWT 验证用户身份
2. **数据验证：** 后端验证所有输入数据
3. **级联删除：** 删除 routine 时自动删除关联的 exercises
4. **权限控制：** 用户只能访问自己的 routines

## 🎉 总结

本次实施成功完成了以下目标：

1. ✅ **完整的后端同步** - Routine 数据不再丢失
2. ✅ **预定义 Routine** - 用户首次登录自动获得肩部训练组
3. ✅ **视频显示修复** - 从 routine 启动的训练可以正常查看视频
4. ✅ **UI 交互修复** - Edit Routine 页面功能完全正常

**技术亮点：**
- 智能数据合并策略
- 完整的错误处理
- 优雅的降级方案（后端失败时使用本地数据）
- 清晰的代码结构和注释

**用户体验提升：**
- 数据永久保存，不再丢失
- 自动获得专业训练计划
- 流畅的视频查看体验
- 可靠的编辑功能

---

**创建时间：** 2026-01-02  
**分支：** fix-my-routine-sync  
**状态：** ✅ 已完成并推送