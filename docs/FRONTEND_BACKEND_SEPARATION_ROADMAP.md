# 🗺️ ZenFit 前后端分离架构蓝图

## 📋 文档概述

**目标：** 将 ZenFit 从纯前端应用重构为前后端分离架构  
**原则：** 渐进式迁移，保持功能稳定，每个阶段可独立验证  
**时间跨度：** 预计 4-6 周（根据实际进度调整）

---

## 🎯 核心目标

### 前端职责
- ✅ 显示界面（React 组件、样式、交互动画）
- ✅ 收集用户输入（表单、按钮、滑动等）
- ✅ 调用后端 API：`fetch('/api/xxx')` 并渲染结果
- ✅ 做少量和界面相关的计算（例如分页、排序）

### 后端职责
- ✅ 复杂业务逻辑（例如如何计算推荐重量、生成报告、历史记录分析）
- ✅ 调用外部服务（Gemini、数据库、第三方 API）
- ✅ 存储和读取数据（数据库、文件）
- ✅ 管理敏感信息（API Key、用户隐私数据）

---

## 📊 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  UI 组件     │  │  状态管理    │  │  API 客户端  │      │
│  │  (展示层)    │  │  (本地状态)  │  │  (fetch)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    后端 (Node.js/Express)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API 路由    │  │  业务逻辑    │  │  数据访问    │      │
│  │  (控制器)    │  │  (服务层)    │  │  (数据库)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  外部 API    │  │  认证授权    │                         │
│  │  (Gemini等)  │  │  (JWT/OAuth) │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    数据库 (PostgreSQL)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  用户数据    │  │  训练记录    │  │  AI 配置     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Phase 0: 准备阶段（1-2 天）

### 目标
- 确定技术栈
- 设计 API 规范
- 准备开发环境

### 任务清单

#### 0.1 技术选型
- [x] **后端框架：** Node.js + Express.js
- [x] **数据库：** PostgreSQL (Supabase 托管)
- [x] **ORM：** Prisma
- [x] **认证：** JWT + bcrypt
- [x] **API 文档：** OpenAPI/Swagger

#### 0.2 API 设计规范
- [x] RESTful API 设计原则
- [x] 统一响应格式
- [x] 错误处理规范
- [x] 版本控制策略

#### 0.3 开发环境准备
- [x] 创建 `backend/` 目录
- [x] 初始化 Node.js 项目
- [x] 配置 TypeScript
- [x] 设置 ESLint + Prettier

### 交付物
- ✅ `docs/API_DESIGN_SPEC.md` - API 设计规范文档
- ✅ `backend/package.json` - 后端项目配置
- ✅ `backend/tsconfig.json` - TypeScript 配置

---

## 🏗️ Phase 1: 用户认证系统（3-5 天）

### 目标
建立基础的用户注册、登录、认证系统

### 当前进度
- ✅ **Step 1**: 后端项目骨架搭建完成
- ⏳ **Step 2**: 数据库配置（进行中）
- ⏳ **Step 3**: 注册 API 实现
- ⏳ **Step 4**: 前端集成

### 任务清单

#### 1.1 后端 - 数据库设计
```sql
-- users 表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- user_profiles 表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  age INTEGER,
  gender VARCHAR(20),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  fitness_goal VARCHAR(50),
  experience_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 后端 - API 端点
- [ ] `POST /api/auth/register` - 用户注册
- [ ] `POST /api/auth/login` - 用户登录
- [ ] `POST /api/auth/logout` - 用户登出
- [ ] `GET /api/auth/me` - 获取当前用户信息
- [ ] `PUT /api/auth/profile` - 更新用户资料

#### 1.3 后端 - 业务逻辑
- [ ] 密码加密（bcrypt）
- [ ] JWT Token 生成和验证
- [ ] 中间件：认证检查
- [ ] 中间件：错误处理

#### 1.4 前端 - API 客户端
```typescript
// src/services/api/authClient.ts
export const authAPI = {
  register: (data: RegisterData) => fetch('/api/auth/register', {...}),
  login: (data: LoginData) => fetch('/api/auth/login', {...}),
  logout: () => fetch('/api/auth/logout', {...}),
  getProfile: () => fetch('/api/auth/me', {...}),
  updateProfile: (data: ProfileData) => fetch('/api/auth/profile', {...})
};
```

#### 1.5 前端 - UI 组件
- [ ] 登录页面（`LoginPage.tsx`）
- [ ] 注册页面（`RegisterPage.tsx`）
- [ ] 用户资料页面（`ProfilePage.tsx`）
- [ ] 认证状态管理（Context/Redux）

### 测试验证
- [ ] 用户可以注册新账号
- [ ] 用户可以登录并获得 Token
- [ ] Token 过期后自动跳转登录
- [ ] 未登录用户无法访问受保护页面

---

## 💪 Phase 2: 训练记录系统（5-7 天）

### 目标
将训练记录从 localStorage 迁移到后端数据库

### 数据库设计
```sql
-- workouts 表
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  routine_name VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- workout_exercises 表
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  muscle_group VARCHAR(100),
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- workout_sets 表
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL(6,2),
  reps INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API 端点
- [ ] `POST /api/workouts` - 创建新训练
- [ ] `GET /api/workouts` - 获取训练列表
- [ ] `GET /api/workouts/:id` - 获取训练详情
- [ ] `PUT /api/workouts/:id` - 更新训练
- [ ] `DELETE /api/workouts/:id` - 删除训练

---

## 🤖 Phase 3: AI 推荐系统（4-6 天）

### 目标
将 AI 推荐逻辑从前端移到后端，保护 API Key

### API 端点
- [ ] `POST /api/ai/recommend-weight` - 推荐训练重量
- [ ] `POST /api/ai/recommend-routine` - 推荐训练计划
- [ ] `POST /api/ai/analyze-progress` - 分析训练进度

### 数据库设计
```sql
-- ai_recommendations 表
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50),
  input_data JSONB,
  output_data JSONB,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Phase 4: 报告和分析系统（3-5 天）

### 目标
将报告生成逻辑移到后端，支持更复杂的数据分析

### API 端点
- [ ] `GET /api/reports/weekly/:weekId` - 获取周报告
- [ ] `GET /api/reports/monthly/:month` - 获取月报告
- [ ] `GET /api/reports/progress` - 获取进度分析
- [ ] `POST /api/reports/export` - 导出报告（PDF/JSON）

---

## 🎨 Phase 5: 导出和分享功能（2-3 天）

### 目标
将 PDF/PNG 导出逻辑移到后端，提高生成质量

### API 端点
- [ ] `POST /api/export/pdf` - 生成 PDF
- [ ] `POST /api/export/png` - 生成 PNG
- [ ] `POST /api/export/share` - 生成分享链接

---

## 🔒 Phase 6: 安全和性能优化（3-4 天）

### 安全加固
- [ ] 实现 Rate Limiting
- [ ] 添加 CSRF 保护
- [ ] 实现 SQL 注入防护
- [ ] 添加 XSS 防护
- [ ] 配置 HTTPS

### 性能优化
- [ ] 实现 Redis 缓存
- [ ] 数据库查询优化
- [ ] API 响应压缩
- [ ] 实现分页和懒加载

---

## 🚀 Phase 7: 部署和上线（2-3 天）

### 部署步骤
1. [ ] 部署数据库（Supabase）
2. [ ] 部署后端 API（Railway/Render）
3. [ ] 部署前端（Vercel）
4. [ ] 配置 CORS 和环境变量
5. [ ] 运行数据库迁移
6. [ ] 验证所有功能

---

## 🛠️ 技术栈总结

### 后端
- **Runtime:** Node.js 20+
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 15+ (Supabase)
- **ORM:** Prisma 5.x
- **Authentication:** JWT + bcrypt
- **Testing:** Jest + Supertest

### 前端
- **Framework:** React 18+
- **Language:** TypeScript 5.x
- **Build Tool:** Vite 5.x
- **State Management:** React Context
- **HTTP Client:** Fetch API
- **UI Library:** Tailwind CSS

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Hosting (Backend):** Railway / Render
- **Hosting (Frontend):** Vercel
- **Database:** Supabase

---

## 📈 成功指标

### 技术指标
- ✅ API 响应时间 < 200ms（P95）
- ✅ 数据库查询时间 < 100ms（P95）
- ✅ 前端首屏加载 < 2s
- ✅ 测试覆盖率 > 80%
- ✅ 无严重安全漏洞

### 业务指标
- ✅ 用户数据 100% 迁移成功
- ✅ 功能完整性 100%
- ✅ 用户满意度 > 90%
- ✅ 系统可用性 > 99.9%

---

## 📝 重要提醒

### 数据安全
1. **永远不要**在前端存储敏感信息（API Key、密码）
2. **始终**使用 HTTPS 传输数据
3. **定期**备份数据库
4. **实施**访问控制和权限管理

### 开发原则
1. **渐进式迁移** - 每个 Phase 独立完成和测试
2. **保持向后兼容** - 迁移期间前端仍可正常工作
3. **充分测试** - 每个功能都要有测试覆盖
4. **文档先行** - API 设计先于实现

---

## 🔗 相关文档

- [Phase 1 详细执行计划](./BACKEND_PHASE1_EXECUTION_PLAN.md)
- [Git 工作流程指南](./GIT_WORKFLOW_GUIDE.md)
- [API 设计规范](./API_DESIGN_SPEC.md)（待创建）

---

**最后更新：** 2024-12-06  
**当前阶段：** Phase 1 - Step 1 ✅ 完成