# 如何测试iOS健康数据API

## 📋 测试前准备

### 1. 完成数据库迁移

打开一个新的命令行窗口（CMD或PowerShell），运行：

```bash
cd c:\zenfit\backend
npx prisma migrate dev --name add_ios_health_data
npx prisma generate
```

等待迁移完成，看到 "Your database is now in sync with your schema" 消息。

### 2. 启动后端服务

在同一个命令行窗口中运行：

```bash
npm run dev
```

看到类似这样的输出表示成功：
```
🚀 ZenFit Backend Server is running on http://localhost:3001
📊 Health check: http://localhost:3001/api/health
```

**重要：保持这个窗口打开，不要关闭！**

---

## 🧪 运行测试

### 方法1：使用测试脚本（推荐）

打开**另一个新的**命令行窗口，运行：

```bash
cd c:\zenfit\backend
node test-health-api.js
```

您会看到类似这样的输出：

```
============================================================
🧪 iOS健康数据API测试开始
============================================================
📍 API地址: http://localhost:3001
⏰ 测试时间: 2026/1/6 10:04:45

📝 测试1: 注册新用户
✅ 注册成功或用户已存在

🔐 测试2: 用户登录
✅ 登录成功
   Token: eyJhbGciOiJIUzI1NiIs...

🔍 测试3: 检查健康数据授权状态
✅ 授权状态查询成功
   启用状态: false
   同意状态: false

✨ 测试4: 启用健康数据同步
✅ 健康数据同步已启用
   消息: Health data sync enabled successfully

📊 测试5: 同步健康数据
✅ 第1天 数据同步成功 - 体重: 75.5kg, 体脂率: 19%
✅ 第2天 数据同步成功 - 体重: 75.2kg, 体脂率: 18.8%
✅ 第3天 数据同步成功 - 体重: 74.9kg, 体脂率: 18.5%

📈 测试6: 获取最新健康数据
✅ 获取最新数据成功
   体重: 74.9 kg
   体脂率: 18.5 %
   性别: male

📜 测试7: 获取健康数据历史
✅ 获取历史记录成功
   记录数量: 3

💪 测试8: 计算推荐训练重量
✅ 重量计算成功
   推荐重量: 61 kg
   调整建议: 体重增加，建议增加训练重量
   变化百分比: 1.67 %

📉 测试9: 获取体重趋势
✅ 趋势分析成功
   趋势: decreasing
   变化量: -0.6 kg
   平均体重: 75.2 kg
   数据点数: 3

🔒 测试10: 禁用健康数据同步
✅ 健康数据同步已禁用
   消息: Health data sync disabled successfully

============================================================
📊 测试结果汇总
============================================================
✅ 通过: 10 个测试
❌ 失败: 0 个测试
📈 成功率: 100.0%
============================================================

🎉 所有测试通过！iOS健康数据API工作正常！
```

---

### 方法2：使用Postman（图形界面）

如果您不熟悉命令行，可以使用Postman：

1. **下载Postman**
   - 访问：https://www.postman.com/downloads/
   - 下载并安装Windows版本

2. **导入测试集合**
   - 打开Postman
   - 点击 "Import"
   - 选择 "Raw text"
   - 粘贴以下内容：

```json
{
  "info": {
    "name": "ZenFit Health API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Register",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
        },
        "url": {"raw": "http://localhost:3001/api/auth/register"}
      }
    },
    {
      "name": "2. Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
        },
        "url": {"raw": "http://localhost:3001/api/auth/login"}
      }
    },
    {
      "name": "3. Check Authorization",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer YOUR_TOKEN_HERE"}],
        "url": {"raw": "http://localhost:3001/api/health/authorization"}
      }
    },
    {
      "name": "4. Enable Health Sync",
      "request": {
        "method": "POST",
        "header": [{"key": "Authorization", "value": "Bearer YOUR_TOKEN_HERE"}],
        "url": {"raw": "http://localhost:3001/api/health/enable"}
      }
    },
    {
      "name": "5. Sync Health Data",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer YOUR_TOKEN_HERE"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"weight\":75.5,\"bodyFatPercent\":18.5,\"gender\":\"male\"}"
        },
        "url": {"raw": "http://localhost:3001/api/health/sync"}
      }
    },
    {
      "name": "6. Get Latest Data",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer YOUR_TOKEN_HERE"}],
        "url": {"raw": "http://localhost:3001/api/health/latest"}
      }
    },
    {
      "name": "7. Calculate Weight",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer YOUR_TOKEN_HERE"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"lastWorkoutWeight\":60}"
        },
        "url": {"raw": "http://localhost:3001/api/health/calculate-weight"}
      }
    }
  ]
}
```

3. **运行测试**
   - 先运行 "1. Register" 和 "2. Login"
   - 从Login响应中复制token
   - 将其他请求中的 "YOUR_TOKEN_HERE" 替换为实际token
   - 依次运行其他测试

---

## ❓ 常见问题

### Q1: 测试失败，显示"请求失败"
**A:** 确保后端服务正在运行。检查是否看到 "Server is running" 消息。

### Q2: 数据库迁移失败
**A:** 检查 `.env` 文件中的 `DATABASE_URL` 是否正确配置。

### Q3: 所有测试都失败
**A:** 按顺序检查：
1. 后端服务是否运行？
2. 数据库是否连接成功？
3. 端口3001是否被占用？

### Q4: 如何查看数据库中的数据？
**A:** 运行以下命令打开Prisma Studio：
```bash
cd c:\zenfit\backend
npx prisma studio
```
在浏览器中打开 http://localhost:5555 查看数据。

---

## 📝 测试步骤总结

1. ✅ 打开命令行窗口1 → 运行数据库迁移
2. ✅ 在同一窗口 → 启动后端服务（保持运行）
3. ✅ 打开命令行窗口2 → 运行测试脚本
4. ✅ 查看测试结果

**就这么简单！**

---

## 🎯 预期结果

如果一切正常，您应该看到：
- ✅ 10个测试全部通过
- ✅ 成功率100%
- ✅ 数据正确保存到数据库

这表示iOS健康数据API已经完全可用！