# ZenFit Backend API

ZenFit 健身应用的后端 API 服务器。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

## 📋 可用脚本

- `npm run dev` - 启动开发服务器（带热重载）
- `npm run build` - 构建生产版本
- `npm start` - 启动生产服务器

## 🔌 API 端点

### 健康检查

- `GET /api/health` - 服务器健康检查
- `GET /api/health/ping` - 简单的 ping 测试

### 测试示例

```bash
# 健康检查
curl http://localhost:3001/api/health

# Ping 测试
curl http://localhost:3001/api/health/ping
```

## 📁 项目结构

```
backend/
├── src/
│   ├── index.ts          # 应用入口
│   ├── routes/           # 路由定义
│   │   └── health.ts     # 健康检查路由
│   └── types/            # TypeScript 类型定义
│       └── index.ts
├── .env                  # 环境变量（不提交到 Git）
├── .env.example          # 环境变量示例
├── .gitignore
├── nodemon.json          # Nodemon 配置
├── package.json
├── tsconfig.json         # TypeScript 配置
└── README.md
```

## 🛠️ 技术栈

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Dev Tools**: Nodemon, ts-node

## 📝 开发进度

- ✅ Step 1: 后端项目骨架创建完成
- ⏳ Step 2: 数据库配置（待完成）
- ⏳ Step 3: 用户注册 API（待完成）
- ⏳ Step 4: 前端集成（待完成）

## 📚 相关文档

- [Phase 1 执行计划](../docs/BACKEND_PHASE1_EXECUTION_PLAN.md)
- [前后端分离架构蓝图](../docs/FRONTEND_BACKEND_SEPARATION_ROADMAP.md)

## 🔒 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | `3001` |
| `NODE_ENV` | 运行环境 | `development` |
| `DATABASE_URL` | 数据库连接字符串 | - |
| `JWT_SECRET` | JWT 密钥 | - |
| `GEMINI_API_KEY` | Gemini API 密钥 | - |

---

**版本**: 1.0.0  
**最后更新**: 2025-12-06