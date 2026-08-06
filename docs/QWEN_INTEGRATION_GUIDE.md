# QWEN (通义千问) 集成指南

## 📋 概述

已成功将阿里云的通义千问（QWEN）模型集成到 ZenFit 后端，替代 Google Gemini 作为 AI 服务提供商。

## 🔑 配置 API Key

### 1. 本地开发环境

在 `backend/.env` 文件中添加：

```env
QWEN_API_KEY=你的_QWEN_API_KEY
```

### 2. Railway 生产环境

1. 登录 Railway Dashboard
2. 进入你的项目
3. 点击 "Variables" 标签
4. 添加新的环境变量：
   - **Key**: `QWEN_API_KEY`
   - **Value**: 你的 QWEN API Key
5. Railway 会自动重新部署

## 🎯 使用的模型

当前配置使用 **`qwen-vl-max`** 模型（优先推荐）

可用的模型列表（按优先级排序）：
1. ✅ **qwen-vl-max** - 当前使用
2. qwen-vl-max-latest
3. qvq-max
4. qvq-plus
5. qvq-plus-latest
6. qwq-plus
7. qwen3-vl-30b-a3b-thinking
8. qwen3-vl-30b-a3b-instruct
9. deepseek-v3.2
10. qwen3-vl-8b-thinking

### 更改模型

如果需要更改模型，编辑 [`backend/src/services/qwenService.ts`](../backend/src/services/qwenService.ts:11)：

```typescript
const MODEL_NAME = 'qwen-vl-max'; // 修改这里
```

## 📁 已创建/修改的文件

### 新增文件

1. **[`backend/src/services/qwenService.ts`](../backend/src/services/qwenService.ts)**
   - QWEN AI 服务实现
   - 包含所有 AI 功能：运动提示、推荐、报告等
   - 带有重试逻辑和错误处理

2. **[`backend/src/types/dashscope.d.ts`](../backend/src/types/dashscope.d.ts)**
   - DashScope SDK 的 TypeScript 类型定义

3. **[`docs/QWEN_INTEGRATION_GUIDE.md`](./QWEN_INTEGRATION_GUIDE.md)**
   - 本文档

### 修改文件

1. **[`backend/src/controllers/aiController.ts`](../backend/src/controllers/aiController.ts)**
   - 从 `geminiService` 切换到 `qwenService`
   - Gemini 代码已注释保留

2. **[`backend/package.json`](../backend/package.json)**
   - 添加了 `dashscope` 依赖

## 🔧 功能列表

所有 AI 功能都已迁移到 QWEN：

| 功能 | API 端点 | 状态 |
|------|---------|------|
| 运动提示（双语） | `POST /api/ai/exercise-tips` | ✅ |
| 运动推荐 | `POST /api/ai/exercise-recommendation` | ✅ |
| 训练建议 | `POST /api/ai/routine-suggestion` | ✅ |
| 训练报告 | `POST /api/ai/workout-report` | ✅ |
| 卡路里计算 | `POST /api/ai/calculate-calories` | ✅ |

## 🛡️ 错误处理

### 重试机制
- 自动重试 3 次
- 指数退避延迟：1秒 → 2秒 → 4秒
- 只对速率限制错误（429）重试

### Fallback 值
如果 API 调用失败，会返回合理的默认值：
- 运动提示：通用安全建议
- 运动推荐：基于经验等级的标准推荐
- 训练报告：简单的完成确认
- 卡路里：基于时长和体重的估算

## 📊 API 调用示例

### 获取运动提示

```bash
curl -X POST http://localhost:3000/api/ai/exercise-tips \
  -H "Content-Type: application/json" \
  -d '{"exerciseName": "Bench Press"}'
```

响应：
```json
{
  "success": true,
  "data": {
    "english": "Keep core tight. Control the movement. Breathe steadily.",
    "chinese": "核心收紧。控制动作。平稳呼吸。"
  }
}
```

### 获取运动推荐

```bash
curl -X POST http://localhost:3000/api/ai/exercise-recommendation \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseName": "Squat",
    "userWeight": 70,
    "experienceLevel": "Intermediate",
    "mechanic": "Compound"
  }'
```

响应：
```json
{
  "success": true,
  "data": {
    "sets": 4,
    "reps": "6-8",
    "weight": 60,
    "reason": "Progressive overload for intermediate lifter"
  }
}
```

## 🔄 切换回 Gemini（如果需要）

如果需要切换回 Gemini：

1. 编辑 [`backend/src/controllers/aiController.ts`](../backend/src/controllers/aiController.ts)
2. 取消注释 Gemini 导入
3. 将所有 `qwenService` 改回 `geminiService`
4. 确保 `GEMINI_API_KEY` 环境变量已配置

## 📝 注意事项

1. **API Key 安全**
   - 不要将 API Key 提交到 Git
   - 使用环境变量管理
   - Railway 会自动加密环境变量

2. **速率限制**
   - QWEN 免费层有请求限制
   - 重试机制会自动处理 429 错误
   - 建议合理使用 AI 功能

3. **模型选择**
   - `qwen-vl-max` 是推荐的平衡选择
   - 如需更快响应，可尝试 `qvq-plus`
   - 如需更强推理，可尝试 `qwen3-vl-30b-a3b-thinking`

## 🚀 部署步骤

1. **提交代码**
   ```bash
   git add .
   git commit -m "feat: integrate QWEN AI service"
   git push origin master
   ```

2. **配置 Railway**
   - 添加 `QWEN_API_KEY` 环境变量
   - 等待自动部署完成

3. **测试**
   - 访问应用
   - 测试 AI 功能
   - 检查后端日志

## 📞 获取 QWEN API Key

1. 访问阿里云 DashScope 控制台
2. 创建 API Key
3. 复制 Key 并添加到环境变量

## ✅ 完成清单

- [x] 安装 `dashscope` SDK
- [x] 创建 QWEN 服务文件
- [x] 创建类型定义
- [x] 更新 AI Controller
- [x] 添加重试机制
- [x] 添加错误处理
- [ ] 配置本地 `.env` 文件（需要你的 API Key）
- [ ] 配置 Railway 环境变量（需要你的 API Key）
- [ ] 测试所有 AI 功能
- [ ] 部署到生产环境

## 🎉 下一步

**请按照以下步骤完成配置：**

1. 获取你的 QWEN API Key
2. 在本地 `backend/.env` 添加 `QWEN_API_KEY=你的key`
3. 在 Railway 添加环境变量
4. 提交代码并推送
5. 测试 AI 功能是否正常工作

需要帮助？查看 [QWEN 官方文档](https://help.aliyun.com/zh/dashscope/)