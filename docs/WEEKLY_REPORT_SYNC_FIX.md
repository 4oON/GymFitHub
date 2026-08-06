# Weekly Report 跨设备同步修复方案

## 问题描述

### 原始问题
1. **手机端无法显示weekly report** - 因为数据只存在浏览器本地IndexedDB
2. **电脑端显示缓存内容** - 数据没有同步到后端,不同设备无法共享

### 根本原因
- Weekly Report只使用IndexedDB本地存储
- 没有后端API支持
- 不同设备之间无法同步数据

## 解决方案

### 1. 数据库层 (Backend)

#### 添加WeeklyReport表
```sql
CREATE TABLE "weekly_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "date_range_start" TEXT NOT NULL,
    "date_range_end" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "muscle_distribution" JSONB NOT NULL,
    "weekly_progress" JSONB,
    "sessions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);
```

**关键特性:**
- 使用复合唯一索引 `(user_id, year, week_number)` 防止重复
- JSONB字段存储复杂数据结构
- 外键关联到users表,支持级联删除

### 2. 后端API (Backend)

#### 新增路由: [`backend/src/routes/weeklyReport.ts`](backend/src/routes/weeklyReport.ts)

**端点:**
- `GET /api/weekly-reports` - 获取用户所有周报告
- `GET /api/weekly-reports/:year/:weekNumber` - 获取特定周报告
- `POST /api/weekly-reports` - 创建或更新周报告 (upsert)
- `POST /api/weekly-reports/batch-sync` - 批量同步
- `DELETE /api/weekly-reports/:id` - 删除报告

**特点:**
- 使用 `authMiddleware` 保护所有端点
- 使用 Prisma `upsert` 实现创建或更新
- 批量同步支持从本地迁移数据

### 3. 前端服务层 (Frontend)

#### 新增: [`WeeklyReportBackendService.ts`](frontend/src/features/report/services/WeeklyReportBackendService.ts)
- 封装所有后端API调用
- 处理认证token
- 数据格式转换 (后端 ↔ 前端)

#### 增强: [`ReportStorageService.ts`](frontend/src/features/report/services/ReportStorageService.ts)

**双层存储策略:**

1. **保存报告** (`saveReport`)
   ```typescript
   // 1. 保存到IndexedDB (本地缓存)
   // 2. 同步到后端 (跨设备共享)
   // 3. 后端失败不影响本地保存
   ```

2. **获取报告** (`getAllReports`)
   ```typescript
   // 1. 优先从后端获取 (最新数据)
   // 2. 更新本地IndexedDB (离线缓存)
   // 3. 后端失败则使用本地数据
   ```

**优势:**
- ✅ 跨设备同步
- ✅ 离线支持
- ✅ 自动缓存
- ✅ 容错机制

### 4. 数据流

```
用户完成训练
    ↓
生成Weekly Report
    ↓
┌─────────────────────────────┐
│  ReportStorageService       │
│  ├─ 保存到IndexedDB (本地)  │
│  └─ 同步到Backend (云端)    │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Backend API                │
│  └─ 存储到PostgreSQL        │
└─────────────────────────────┘
    ↓
其他设备可以访问
```

## 部署步骤

### 1. 执行数据库迁移

在Supabase SQL Editor中执行:
```sql
-- 见 docs/WEEKLY_REPORT_MIGRATION.md
```

### 2. 更新后端代码

```bash
cd backend
npm install
npm run build
```

### 3. 重启后端服务

Railway会自动检测到schema变化并重新部署。

### 4. 前端无需额外操作

前端代码已经自动适配,会在下次部署时生效。

## 测试验证

### 1. 测试后端API

```bash
# 获取所有报告
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.railway.app/api/weekly-reports

# 创建报告
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weekNumber":1,"year":2026,...}' \
  https://your-backend.railway.app/api/weekly-reports
```

### 2. 测试跨设备同步

1. 在电脑端生成一个weekly report
2. 在手机端打开应用
3. 验证报告是否显示

### 3. 测试离线功能

1. 断开网络
2. 查看本地缓存的报告
3. 恢复网络后自动同步

## 数据迁移

如果用户已有本地IndexedDB数据,可以使用批量同步:

```typescript
// 在浏览器控制台执行
const reports = await reportStorage.getAllReports();
await WeeklyReportBackendService.batchSyncReports(reports);
```

## 后续优化

### 短期 (已完成)
- [x] 数据库schema设计
- [x] 后端API实现
- [x] 前端服务层
- [x] 双层存储策略

### 中期 (待实现)
- [ ] 添加AI分析功能
  - 每周肌肉刺激分析
  - 月度volume趋势
  - 训练建议
- [ ] 冲突解决机制
- [ ] 增量同步优化

### 长期
- [ ] 实时同步 (WebSocket)
- [ ] 离线队列管理
- [ ] 数据压缩优化

## 技术栈

- **Backend**: Express.js + Prisma + PostgreSQL
- **Frontend**: React + TypeScript + IndexedDB
- **部署**: Railway (Backend) + Vercel (Frontend)
- **数据库**: Supabase (PostgreSQL)

## 相关文件

### Backend
- [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) - 数据库schema
- [`backend/src/routes/weeklyReport.ts`](backend/src/routes/weeklyReport.ts) - API路由
- [`backend/src/index.ts`](backend/src/index.ts) - 路由注册

### Frontend
- [`frontend/src/features/report/services/WeeklyReportBackendService.ts`](frontend/src/features/report/services/WeeklyReportBackendService.ts) - 后端API服务
- [`frontend/src/features/report/services/ReportStorageService.ts`](frontend/src/features/report/services/ReportStorageService.ts) - 存储服务
- [`frontend/src/features/report/services/WeeklyReportService.ts`](frontend/src/features/report/services/WeeklyReportService.ts) - 报告生成逻辑

## 总结

通过实现双层存储策略(IndexedDB + Backend),我们解决了:
1. ✅ 手机端无法显示报告的问题
2. ✅ 跨设备数据同步
3. ✅ 离线访问支持
4. ✅ 数据持久化和备份

用户现在可以在任何设备上查看和生成weekly reports,数据会自动同步到云端。
