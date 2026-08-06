# Vercel部署数据显示问题诊断指南

## 问题描述

**症状**：
- ✅ 本地 `npm run dev`：可以正常显示所有锻炼记录和肌肉恢复状态
- ✅ 手机测试版app：可以正常显示所有数据
- ❌ Vercel部署的网页版：无法显示1月份的锻炼记录和肌肉恢复状态

**报告时间**：2026-01-06

## 根本原因分析

### 1. 环境变量配置问题（最可能）

**问题**：Vercel部署时可能没有正确配置`VITE_API_URL`环境变量

**证据**：
- 本地`.env`文件配置：`VITE_API_URL=https://kilo-zenfit-production.up.railway.app`
- Vercel不会自动读取`.env`文件，需要在Vercel控制台手动配置
- 如果环境变量缺失，前端会使用默认值`http://localhost:3001`（无法在生产环境访问）

**代码位置**：[`frontend/src/services/apiClient.ts:32`](../frontend/src/services/apiClient.ts)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 2. 部署分支不匹配

**问题**：Vercel可能部署的是`master`分支，而不是包含最新代码的`feature/ios-health-data-sync`分支

**当前分支状态**：
```bash
* feature/ios-health-data-sync  # 当前开发分支（包含所有最新功能）
  master                         # 主分支（可能是旧代码）
```

### 3. 浏览器缓存问题

**问题**：浏览器可能缓存了旧版本的前端代码

### 4. API响应数据问题

**问题**：后端API可能返回了空数据或错误数据

## 诊断步骤

### 步骤1：检查Vercel环境变量配置

1. 登录Vercel控制台
2. 进入ZenFit项目设置
3. 查看Environment Variables部分
4. **必须配置**：
   ```
   VITE_API_URL = https://kilo-zenfit-production.up.railway.app
   ```

### 步骤2：检查Vercel部署分支

1. 在Vercel项目设置中查看Git配置
2. 确认Production Branch是否为`master`
3. 检查最近的部署记录，确认部署的commit hash

### 步骤3：检查浏览器控制台

在Vercel部署的网站上：
1. 打开浏览器开发者工具（F12）
2. 查看Console标签页的错误信息
3. 查看Network标签页：
   - 检查API请求的URL是否正确
   - 检查API响应的状态码和数据
   - 特别关注`/api/workout`和`/api/profile/me`请求

### 步骤4：验证后端API

直接测试后端API：
```bash
# 测试健康检查
curl https://kilo-zenfit-production.up.railway.app/api/health

# 测试获取锻炼记录（需要替换YOUR_TOKEN）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://kilo-zenfit-production.up.railway.app/api/workout
```

## 解决方案

### 方案1：配置Vercel环境变量（推荐）

**如果Vercel缺少环境变量配置**：

1. 登录Vercel控制台
2. 进入项目 → Settings → Environment Variables
3. 添加环境变量：
   - **Name**: `VITE_API_URL`
   - **Value**: `https://kilo-zenfit-production.up.railway.app`
   - **Environment**: Production, Preview, Development（全选）
4. 点击Save
5. 重新部署项目：
   - 进入Deployments标签
   - 点击最新部署的三个点菜单
   - 选择"Redeploy"

### 方案2：合并分支到master（如果分支不匹配）

**如果Vercel部署的是旧的master分支**：

```bash
# 1. 切换到master分支
git checkout master

# 2. 合并feature分支
git merge feature/ios-health-data-sync

# 3. 推送到远程
git push origin master

# 4. Vercel会自动触发新的部署
```

### 方案3：清除浏览器缓存

1. 在Vercel网站上按`Ctrl + Shift + R`（Windows）或`Cmd + Shift + R`（Mac）强制刷新
2. 或者清除浏览器缓存：
   - Chrome: Settings → Privacy and security → Clear browsing data
   - 选择"Cached images and files"
   - 时间范围选择"All time"

### 方案4：修改Vercel部署分支

**如果想直接部署feature分支**：

1. 在Vercel项目设置中
2. Git → Production Branch
3. 改为`feature/ios-health-data-sync`
4. 保存并重新部署

## 验证修复

修复后，在Vercel部署的网站上验证：

1. ✅ 可以看到1月份的锻炼记录
2. ✅ 肌肉图正确显示恢复状态
3. ✅ 浏览器控制台没有API错误
4. ✅ Network标签显示API请求成功（200状态码）

## 预防措施

### 1. 创建`.env.production`文件

在`frontend/`目录下创建：
```bash
# .env.production
VITE_API_URL=https://kilo-zenfit-production.up.railway.app
```

### 2. 更新`.gitignore`

确保`.env`文件被忽略，但`.env.production`可以提交：
```gitignore
# Local env files
.env.local
.env.*.local
.env

# But allow production env template
!.env.production
```

### 3. 添加环境变量检查

在`apiClient.ts`中添加警告：
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 开发环境警告
if (import.meta.env.MODE === 'production' && API_BASE_URL.includes('localhost')) {
  console.error('⚠️ 生产环境使用了localhost API地址！请检查VITE_API_URL环境变量');
}
```

## 相关文档

- [Vercel环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [`frontend/.env`](../frontend/.env) - 本地环境变量配置
- [`frontend/src/services/apiClient.ts`](../frontend/src/services/apiClient.ts) - API客户端配置

## 联系信息

如果问题持续存在，请提供：
1. Vercel部署URL
2. 浏览器控制台截图（Console和Network标签）
3. Vercel环境变量配置截图
4. 最近的部署日志

---

**创建时间**：2026-01-06  
**最后更新**：2026-01-06  
**状态**：待验证