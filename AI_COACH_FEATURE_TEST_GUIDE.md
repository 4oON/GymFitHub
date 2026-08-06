# AI Coach Feature Test Guide

## 功能概述

AI教练功能允许用户：
1. 与AI教练进行对话，获取训练建议和答疑
2. 让AI根据个人需求生成客制化训练计划
3. AI会智能搭配复合动作（Compound）和孤立动作（Isolation）
4. 所有对话和训练计划都保存在后台，支持跨平台访问

## 数据库变更

新增以下表：
- `ai_coach_conversations` - 对话会话
- `ai_coach_messages` - 对话消息
- `ai_coach_routines` - AI生成的训练计划

## 后端API端点

### 对话管理
- `GET /api/ai/coach/conversations` - 获取用户的所有对话
- `POST /api/ai/coach/conversations` - 创建新对话
- `GET /api/ai/coach/conversations/:id` - 获取对话详情
- `DELETE /api/ai/coach/conversations/:id` - 删除对话
- `PUT /api/ai/coach/conversations/:id/title` - 更新对话标题

### 消息
- `POST /api/ai/coach/conversations/:id/messages` - 发送消息

### 训练计划
- `POST /api/ai/coach/conversations/:id/routines` - 生成客制化训练计划
- `GET /api/ai/coach/routines` - 获取用户的AI推荐训练计划
- `POST /api/ai/coach/routines/:id/save` - 保存训练计划
- `POST /api/ai/coach/routines/:id/use` - 标记训练计划为已使用

## 测试步骤

### 1. 数据库迁移
```bash
cd backend
# 使用Prisma迁移
npx prisma migrate dev --name add_ai_coach_tables

# 或者手动执行SQL
psql $DATABASE_URL -f prisma/migrations/20250401_add_ai_coach_tables/migration.sql
```

### 2. 后端测试
```bash
cd backend
npm run dev
```

测试API端点：
```bash
# 1. 登录获取token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "yourpassword"}'

# 2. 创建对话
curl -X POST http://localhost:3001/api/ai/coach/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "Test Conversation"}'

# 3. 发送消息
curl -X POST http://localhost:3001/api/ai/coach/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content": "帮我设计一个胸肌训练计划"}'

# 4. 生成训练计划
curl -X POST http://localhost:3001/api/ai/coach/conversations/CONVERSATION_ID/routines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "focusMuscles": ["Chest", "Triceps"],
    "routineType": "balanced",
    "difficulty": "intermediate"
  }'
```

### 3. 前端测试
```bash
cd frontend
npm run dev
```

测试功能：
1. 打开应用，进入Training Coach页面
2. 点击"AI教练对话"按钮，打开对话弹窗
3. 发送消息与AI教练对话
4. 点击"生成客制化计划"按钮，让AI生成训练计划
5. 检查生成的训练计划中是否包含复合动作和孤立动作的合理搭配

## 功能检查清单

### 对话功能
- [ ] 可以创建新对话
- [ ] 可以查看对话历史
- [ ] 可以发送消息给AI教练
- [ ] AI能够回复并理解上下文
- [ ] 可以删除对话

### 训练计划生成
- [ ] 可以请求AI生成训练计划
- [ ] 生成的计划包含复合动作和孤立动作
- [ ] 可以保存训练计划
- [ ] 可以查看历史生成的训练计划
- [ ] 训练计划显示在Training Coach卡片中

### iOS兼容性
- [ ] 在iOS Safari中正常工作
- [ ] 没有使用`alert()`等被禁止的API
- [ ] localStorage有try-catch保护
- [ ] 触摸目标至少44px

## 已知限制

1. AI生成训练计划需要Gemini API key配置正确
2. 初次加载可能需要等待API响应
3. 生成的训练计划仅供参考，请根据实际情况调整

## 故障排除

### 问题：无法创建对话
- 检查数据库表是否已创建
- 检查用户是否已登录
- 查看后端日志

### 问题：AI不回复
- 检查GEMINI_API_KEY环境变量
- 检查网络连接
- 查看后端错误日志

### 问题：训练计划不显示
- 检查AI routines API是否正常工作
- 检查前端是否正确获取数据
