# 🚀 ZenFit 移动端快速启动指南

## 📋 概述

本指南将帮助您在 **30 分钟内** 完成 ZenFit 移动端的基础设置，包括：
- ✅ 后端部署到 Railway
- ✅ 移动端项目初始化
- ✅ 测试端到端连接

---

## ⏱️ 时间估算

| 步骤 | 预计时间 |
|------|---------|
| 1. Railway 后端部署 | 10 分钟 |
| 2. 移动端项目初始化 | 10 分钟 |
| 3. 测试和验证 | 10 分钟 |
| **总计** | **30 分钟** |

---

## 🎯 第一步：Railway 后端部署（10 分钟）

### 1.1 注册 Railway 账号

1. 访问 [https://railway.app](https://railway.app)
2. 点击 **"Login with GitHub"**
3. 授权 Railway 访问您的 GitHub 账号

### 1.2 创建新项目

1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择 `zenfit` 仓库
4. 选择 `mobile-app-development` 分支

### 1.3 配置环境变量

在 Railway 项目设置中添加：

```env
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_random_secret_key
PORT=3001
NODE_ENV=production
```

**生成 JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.4 等待部署完成

- 部署时间：约 2-3 分钟
- 完成后会得到一个公网地址，例如：
  ```
  https://zenfit-backend-production.up.railway.app
  ```

### 1.5 测试后端

```bash
curl https://your-railway-domain.railway.app/api/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-12-24T15:30:00.000Z"
}
```

---

## 📱 第二步：移动端项目初始化（10 分钟）

### 2.1 运行初始化脚本

```bash
# 在项目根目录
bash scripts/init-mobile-app.sh
```

这个脚本会自动：
- ✅ 检查 Node.js 版本
- ✅ 安装 Expo CLI
- ✅ 创建移动端项目
- ✅ 安装所有依赖
- ✅ 创建项目结构
- ✅ 生成配置文件

### 2.2 配置 API 地址

编辑 `mobile/app.json`，将 Railway 后端地址填入：

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-railway-domain.railway.app"
    }
  }
}
```

### 2.3 启动开发服务器

```bash
cd mobile
npx expo start
```

---

## 🧪 第三步：测试和验证（10 分钟）

### 3.1 在手机上安装 Expo Go

- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 3.2 扫描二维码

1. 打开 Expo Go App
2. 扫描终端中显示的二维码
3. 等待应用加载（首次约 30 秒）

### 3.3 测试后端连接

在移动端应用中，应该能够：
- ✅ 看到登录页面
- ✅ 连接到 Railway 后端
- ✅ 进行用户注册/登录

---

## 🎉 完成！

恭喜！您已经成功完成了基础设置。现在可以：

### 继续开发

```bash
# 启动后端（本地开发）
cd backend
npm run dev

# 启动移动端
cd mobile
npx expo start
```

### 查看文档

- 📖 [完整开发指南](./MOBILE_APP_SETUP_GUIDE.md)
- 📋 [实施计划](./MOBILE_APP_IMPLEMENTATION_PLAN.md)
- 🚂 [Railway 部署详解](./RAILWAY_DEPLOYMENT_GUIDE.md)

---

## 🐛 常见问题

### Q1: Railway 部署失败

**解决方案**:
1. 检查 `backend/package.json` 中的脚本
2. 确保 `build` 和 `start` 命令正确
3. 查看 Railway 日志找出具体错误

### Q2: 移动端无法连接后端

**解决方案**:
1. 确认 Railway 后端正在运行
2. 检查 `mobile/app.json` 中的 `apiUrl`
3. 确保手机和电脑在同一网络（开发环境）

### Q3: Expo Go 扫码后无响应

**解决方案**:
1. 确保手机和电脑在同一 WiFi
2. 重启 Expo 开发服务器
3. 尝试使用隧道模式：`npx expo start --tunnel`

---

## 📞 获取帮助

遇到问题？查看：
- [GitHub Issues](https://github.com/your-repo/zenfit/issues)
- [Expo 文档](https://docs.expo.dev)
- [Railway 文档](https://docs.railway.app)

---

## 🎯 下一步

完成基础设置后，建议按以下顺序开发：

1. **Week 1**: 实现用户认证（登录/注册）
2. **Week 2**: 实现训练记录功能
3. **Week 3**: 实现肌肉选择器
4. **Week 4**: 实现数据同步
5. **Week 5-8**: 高级功能和优化

详细计划请查看 [实施计划文档](./MOBILE_APP_IMPLEMENTATION_PLAN.md)。

---

**最后更新**: 2024-12-24  
**预计完成时间**: 30 分钟  
**难度等级**: ⭐⭐☆☆☆（简单）