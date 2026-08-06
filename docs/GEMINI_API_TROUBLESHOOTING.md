# Gemini API 故障排查指南

## 🔍 问题诊断结果

根据模型测试脚本的结果，发现以下问题：

### 测试结果
- ❌ **所有 Gemini 1.5 模型**: 404 错误（模型不存在）
- ⚠️ **Gemini 2.0 模型**: 429 错误（速率限制）

### 根本原因
**你的 API Key 可能没有正确配置或权限不足**

## 🛠️ 解决方案

### 方案 1：在 Google AI Studio 重新生成 API Key（推荐）

1. **访问 Google AI Studio**
   - 网址：https://aistudio.google.com/app/apikey
   - 使用你的 Google 账号登录

2. **创建新的 API Key**
   - 点击 "Create API Key" 或 "Get API Key"
   - 选择一个 Google Cloud 项目（或创建新项目）
   - 复制生成的 API Key

3. **更新环境变量**
   - 在 Railway 项目设置中，更新 `GEMINI_API_KEY` 环境变量
   - 粘贴新的 API Key
   - 重新部署应用

4. **验证 API Key**
   ```bash
   cd backend
   npx ts-node src/utils/testModels.ts
   ```

### 方案 2：使用 Google Cloud Console 配置

如果你使用的是 Google Cloud 项目：

1. **启用 Generative Language API**
   - 访问：https://console.cloud.google.com/apis/library
   - 搜索 "Generative Language API"
   - 点击 "Enable"

2. **检查配额和计费**
   - 访问：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - 确认你的项目有足够的配额
   - 检查计费账户是否已设置

3. **创建或更新 API Key**
   - 访问：https://console.cloud.google.com/apis/credentials
   - 创建新的 API Key 或使用现有的
   - 确保 API Key 没有 IP 限制（或添加 Railway 的 IP）

### 方案 3：临时禁用 AI 功能

如果暂时无法解决 API Key 问题，可以让应用使用 fallback 值：

在 `backend/src/services/geminiService.ts` 中，所有函数都已经有 fallback 逻辑，会在 API 失败时返回默认值。

## 🔑 API Key 检查清单

- [ ] API Key 是否从 Google AI Studio 生成？
- [ ] API Key 是否正确复制（没有多余空格）？
- [ ] Google Cloud 项目是否启用了 Generative Language API？
- [ ] 账户是否有有效的计费方式？
- [ ] 是否在免费配额内？
- [ ] API Key 是否有 IP 限制？

## 📊 当前状态

根据测试结果：
- **Gemini 1.5 系列**: 完全不可用（404）
- **Gemini 2.0 系列**: 存在但被限流（429）

**建议**：
1. 首先尝试方案 1（重新生成 API Key）
2. 如果还是 404，检查 Google Cloud 项目设置
3. 如果是 429，等待速率限制重置（通常 1 分钟）

## 🌐 相关链接

- Google AI Studio: https://aistudio.google.com/
- API 文档: https://ai.google.dev/docs
- Google Cloud Console: https://console.cloud.google.com/
- Gemini API 定价: https://ai.google.dev/pricing

## 💡 临时解决方案

在 API Key 问题解决之前，应用会使用以下 fallback 值：
- 运动提示：通用的安全建议
- 运动推荐：基于经验等级的标准推荐
- 训练报告：简单的完成确认
- 卡路里计算：基于时长和体重的估算

这些 fallback 值虽然不如 AI 生成的个性化，但足以让应用正常运行。