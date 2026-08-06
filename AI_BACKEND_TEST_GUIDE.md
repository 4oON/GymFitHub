# AI 后端代理测试指南

## 快速开始（本地测试）

### 1. 启动后端服务

```bash
cd backend

# 安装依赖（如果还没装）
npm install

# 配置环境变量
copy .env.example .env
# 编辑 .env，确保有 DATABASE_URL 和其他必要配置

# 启动开发服务器
npm run dev
```

后端默认运行在 `http://localhost:3001`

### 2. 配置前端连接本地后端

编辑 `frontend/.env`：

```bash
# 注释掉生产环境 URL
# VITE_API_URL=https://kilo-zenfit-production.up.railway.app

# 启用本地后端
VITE_API_URL=http://localhost:3001
```

### 3. 启动前端

```bash
cd frontend
npm run dev
```

### 4. 测试 AI 功能

1. 打开 http://localhost:5173
2. 登录账号
3. 进入 Profile > AI Configuration
4. 添加一个 AI 配置（Moonshot/OpenAI 等）
5. 测试 Routine Creator 的 AI 生成功能

---

## 测试清单

### ✅ 后端 API 测试

```bash
# 1. 测试 AI 配置 CRUD
curl -X GET http://localhost:3001/api/ai/configs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. 测试 AI 生成接口（需要先在数据库配置 AI）
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a fitness coach."},
      {"role": "user", "content": "Recommend a chest exercise"}
    ],
    "temperature": 0.7
  }'
```

### ✅ 前端功能测试

1. **AI Configuration Manager**
   - [ ] 能添加新配置
   - [ ] 能编辑配置
   - [ ] 能删除配置
   - [ ] 能设置默认配置
   - [ ] 能显示余额（Moonshot）

2. **Routine Creator AI**
   - [ ] 点击 AI 按钮弹出配置
   - [ ] 选择肌肉群后生成推荐
   - [ ] 推荐结果显示正常
   - [ ] 错误提示清晰（无 fallback）

3. **MainApp 智能推荐**
   - [ ] 首页显示智能推荐
   - [ ] 推荐来自后端 AI
   - [ ] 可以接受/拒绝推荐

---

## 安全合并策略

### 方案 A：创建独立 PR（推荐）

```bash
# 1. 从 main 创建新分支
git checkout main
git pull origin main
git checkout -b feature/backend-ai-proxy

# 2. 只复制关键更改
git checkout ai-config-branch -- backend/src/controllers/aiConfigController.ts
git checkout ai-config-branch -- backend/src/routes/ai.ts
git checkout ai-config-branch -- frontend/src/features/ai/services/perplexityService.ts
git checkout ai-config-branch -- frontend/src/features/routine/components/RoutineCreator.tsx

# 3. 修复导入路径
git add .
git commit -m "feat: add backend AI proxy to avoid CORS issues"

# 4. 推送并创建 PR
git push origin feature/backend-ai-proxy
```

### 方案 B：分阶段合并

**Phase 1: 后端（安全）**
- 只合 backend/ 的更改
- 前端保持原有逻辑
- 验证后端 API 工作正常

**Phase 2: 前端（有风险）**
- 合 frontend/ 的更改
- 全面测试所有 AI 功能
- 准备好回滚方案

### 方案 C：Feature Flag（最安全）

在代码中加入开关：

```typescript
// 使用后端代理（新方式）
const USE_BACKEND_PROXY = true;

if (USE_BACKEND_PROXY) {
    return callBackendProxy();
} else {
    return callDirectAPI(); // 旧方式，作为 fallback
}
```

---

## 常见问题

### Q: 后端启动失败？

检查：
1. `.env` 文件存在且配置正确
2. `DATABASE_URL` 可以连接（使用 Supabase 的连接字符串）
3. 端口 3001 未被占用

### Q: 前端报 CORS 错误？

确保后端 `index.ts` 已配置 CORS：

```typescript
app.use(cors({
    origin: ['http://localhost:5173', 'https://your-vercel-app.vercel.app'],
    credentials: true
}));
```

### Q: AI 生成报错 "No AI configuration found"？

1. 确认已在 Profile > AI Configuration 添加配置
2. 确认已设置默认配置
3. 检查后端数据库是否有数据：

```sql
SELECT * FROM ai_provider_configs WHERE user_id = 'your-user-id';
```

---

## 回滚方案

如果合并后出问题：

```bash
# 回滚到上一个版本
git revert HEAD

# 或者强制回滚到指定 commit
git reset --hard <stable-commit-hash>
git push -f origin main
```

建议合并前先在 Railway 创建数据库备份。
