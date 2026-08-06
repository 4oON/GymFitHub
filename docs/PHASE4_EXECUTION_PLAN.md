# 📋 Phase 4 执行计划 - Workout 训练记录系统

## 🎯 Phase 4 总体目标
**建立 Workout 训练记录系统（后端 + 前端基础）**

---

## 📊 Phase 4 拆分策略

考虑到 token 消耗和 PR 节点管理，Phase 4 拆分为 **3 个独立的小阶段**，每个阶段可以独立验证和 PR：

---

## 🔹 Phase 4.1: Workout 后端 API（最小可用版本）

### 📦 交付内容

#### 1. Prisma Schema 更新 (`backend/prisma/schema.prisma`)
```prisma
model Workout {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  date      DateTime @default(now())
  status    String   @default("planned") // planned, in_progress, completed
  duration  Int?     // 分钟
  notes     String?
  exercises WorkoutExercise[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([date])
}

model WorkoutExercise {
  id         String   @id @default(uuid())
  workoutId  String
  workout    Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exerciseId String   // 关联到 Exercise 库（字符串 ID）
  sets       Int
  reps       Int
  weight     Float?
  notes      String?
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([workoutId])
}
```

#### 2. 后端 API 路由 (`backend/src/routes/workout.ts`)
- `POST /workout` - 创建训练记录
- `GET /workout` - 获取用户所有训练记录
- `GET /workout/:id` - 获取单个训练详情
- `PUT /workout/:id` - 更新训练记录
- `DELETE /workout/:id` - 删除训练记录

#### 3. 类型定义 (`backend/src/types/workout.ts`)
```typescript
export interface CreateWorkoutInput {
  name: string;
  date?: Date;
  status?: 'planned' | 'in_progress' | 'completed';
  duration?: number;
  notes?: string;
  exercises: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    order?: number;
  }[];
}

export interface UpdateWorkoutInput {
  name?: string;
  date?: Date;
  status?: 'planned' | 'in_progress' | 'completed';
  duration?: number;
  notes?: string;
  exercises?: {
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    order?: number;
  }[];
}

export interface WorkoutResponse {
  id: string;
  userId: string;
  name: string;
  date: Date;
  status: string;
  duration?: number;
  notes?: string;
  exercises: {
    id: string;
    exerciseId: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    order: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4. 验证器 (`backend/src/validators/workoutValidator.ts`)
- Zod schema 验证
- 基础字段验证

#### 5. 集成到主应用 (`backend/src/index.ts`)
- 注册 workout 路由

### ✅ 验证标准
- ✅ Prisma migrate 成功
- ✅ Postman/Thunder Client 测试所有 API
- ✅ 数据库正确存储数据
- ✅ 认证中间件正常工作
- ✅ TypeScript 编译无错误

### ⏱️ 预计时间
**15-20 分钟**（纯后端，无前端 UI）

### 📝 Git 工作流
```bash
# 1. 创建分支
git checkout master
git pull origin master
git checkout -b feature/phase4.1-workout-backend-api

# 2. 开发 + 测试
# 3. Commit
git add .
git commit -m "feat: Phase 4.1 - Workout Backend API (CRUD)"

# 4. Push
git push -u origin feature/phase4.1-workout-backend-api

# 5. 创建 PR
# 6. 合并后删除分支
```

---

## 🔹 Phase 4.2: Workout 前端 API Client

### 📦 交付内容

#### 1. API Client 扩展 (`frontend/src/services/apiClient.ts`)
```typescript
// Workout API methods
async createWorkout(data: CreateWorkoutInput): Promise<WorkoutResponse>
async getWorkouts(): Promise<WorkoutResponse[]>
async getWorkout(id: string): Promise<WorkoutResponse>
async updateWorkout(id: string, data: UpdateWorkoutInput): Promise<WorkoutResponse>
async deleteWorkout(id: string): Promise<void>
```

#### 2. 类型定义 (`frontend/src/types/workout.ts`)
- `Workout` 接口
- `WorkoutExercise` 接口
- `CreateWorkoutInput` 接口
- `UpdateWorkoutInput` 接口

#### 3. 测试面板 (`frontend/src/dev/components/WorkoutTestPanel.tsx`)
- 简单的表单测试 CRUD 操作
- 显示 API 响应
- 类似 `AuthProfileTestPanel` 的风格
- 测试创建、获取、更新、删除

#### 4. 集成到开发面板 (`frontend/src/App.tsx`)
- 添加 WorkoutTestPanel 到 /dev 路由

### ✅ 验证标准
- ✅ 所有 API 调用成功
- ✅ Token 自动携带
- ✅ 错误处理正常
- ✅ TypeScript 无错误
- ✅ 测试面板功能完整

### ⏱️ 预计时间
**10-15 分钟**（纯 API 集成，简单测试 UI）

### 📝 Git 工作流
```bash
git checkout master
git pull origin master
git checkout -b feature/phase4.2-workout-frontend-api
# 开发 + 测试 + Commit + Push + PR
```

---

## 🔹 Phase 4.3: Workout 生产级 UI（可选）

### 📦 交付内容

#### 1. WorkoutListPage (`frontend/src/pages/WorkoutListPage.tsx`)
- 显示所有训练记录
- 卡片式布局
- 筛选和排序
- 创建新训练按钮

#### 2. WorkoutDetailPage (`frontend/src/pages/WorkoutDetailPage.tsx`)
- 显示单个训练详情
- 练习列表（表格形式）
- 编辑/删除按钮
- 状态切换

#### 3. CreateWorkoutModal (`frontend/src/components/CreateWorkoutModal.tsx`)
- 创建训练记录表单
- 添加练习（动态表单）
- 设置组数/次数/重量
- 表单验证

#### 4. 路由集成 (`frontend/src/App.tsx`)
- `/workouts` - 训练列表
- `/workouts/:id` - 训练详情
- 添加到导航菜单

### ✅ 验证标准
- ✅ UI 美观专业（Tailwind CSS）
- ✅ 完整的 CRUD 流程
- ✅ 响应式设计
- ✅ 加载状态和错误处理
- ✅ 用户体验流畅

### ⏱️ 预计时间
**20-25 分钟**（完整 UI 开发）

### 📝 Git 工作流
```bash
git checkout master
git pull origin master
git checkout -b feature/phase4.3-workout-production-ui
# 开发 + 测试 + Commit + Push + PR
```

---

## 🎯 推荐执行顺序

### **第一步：Phase 4.1（今天）**
1. 更新 Prisma Schema
2. 运行 migration
3. 创建后端路由
4. 测试 API（Postman/Thunder Client）
5. Commit + Push + PR

**等你验证完 Phase 4.1 并 PR 后，再进行 Phase 4.2**

### **第二步：Phase 4.2（明天）**
1. 扩展 API Client
2. 创建测试面板
3. 测试所有 API 调用
4. Commit + Push + PR

### **第三步：Phase 4.3（后天，可选）**
1. 创建生产级 UI 页面
2. 集成路由
3. 完整流程测试
4. Commit + Push + PR

---

## 📋 Phase 4.1 详细任务清单

### ✅ Task 1: 更新 Prisma Schema
- [ ] 添加 `Workout` 模型
- [ ] 添加 `WorkoutExercise` 模型
- [ ] 更新 `User` 模型（添加 workouts 关系）
- [ ] 运行 `npx prisma migrate dev --name add-workout-models`
- [ ] 验证数据库表创建成功

### ✅ Task 2: 创建类型定义
- [ ] 创建 `backend/src/types/workout.ts`
- [ ] 定义 `CreateWorkoutInput`
- [ ] 定义 `UpdateWorkoutInput`
- [ ] 定义 `WorkoutResponse`

### ✅ Task 3: 创建验证器
- [ ] 创建 `backend/src/validators/workoutValidator.ts`
- [ ] 使用 Zod 定义验证 schema
- [ ] 导出验证函数

### ✅ Task 4: 创建路由
- [ ] 创建 `backend/src/routes/workout.ts`
- [ ] 实现 POST /workout（创建）
- [ ] 实现 GET /workout（列表）
- [ ] 实现 GET /workout/:id（详情）
- [ ] 实现 PUT /workout/:id（更新）
- [ ] 实现 DELETE /workout/:id（删除）
- [ ] 添加认证中间件保护

### ✅ Task 5: 集成到主应用
- [ ] 在 `backend/src/index.ts` 中注册路由
- [ ] 测试服务器启动无错误

### ✅ Task 6: API 测试
- [ ] 使用 Postman/Thunder Client 测试所有端点
- [ ] 验证认证 token 正常工作
- [ ] 验证数据正确存储到数据库
- [ ] 验证错误处理

---

## ❓ 审查问题

请回答以下问题，我会根据你的反馈调整计划：

1. **Phase 4.1 的范围是否合适？**（只做后端 API）
2. **是否需要更细的拆分？**（比如先做 Schema，再做 API）
3. **是否需要我先给你完整代码预览？**（让你先看看再决定）
4. **Exercise 库的关联如何处理？**（现在只存 exerciseId 字符串，还是需要完整的 Exercise 模型？）
5. **是否需要添加其他字段？**（比如 calories, heartRate 等）

---

## 🎯 我的建议

**最优方案：**
1. **今天完成 Phase 4.1**（后端 API，15 分钟）
2. **明天完成 Phase 4.2**（前端 API Client，10 分钟）
3. **后天完成 Phase 4.3**（生产 UI，20 分钟）- **可选**

每个阶段独立 PR，保留清晰的开发节点。

---

## 📊 Phase 4 完整时间线

| 阶段 | 内容 | 时间 | PR 节点 |
|------|------|------|---------|
| Phase 4.1 | 后端 API | 15-20 分钟 | ✅ PR #1 |
| Phase 4.2 | 前端 API Client | 10-15 分钟 | ✅ PR #2 |
| Phase 4.3 | 生产 UI（可选） | 20-25 分钟 | ✅ PR #3 |
| **总计** | **完整 Workout 系统** | **45-60 分钟** | **3 个 PR** |

---

## 🚀 下一步行动

**请审查这个计划，告诉我：**
1. ✅ 同意这个拆分方式 → 我立即开始 Phase 4.1
2. 🔄 需要调整 → 具体说明调整内容
3. 📝 需要更详细的某个部分 → 我补充详细信息

**我会根据你的反馈立即调整并开始执行！** 🚀