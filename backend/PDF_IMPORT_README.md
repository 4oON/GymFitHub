# PDF数据导入 - 快速开始

## 🎯 目标

从PDF训练报告中恢复你的训练数据到数据库。

## 📋 前提条件

- ✅ PDF文件位于：`C:\project\report`
- ✅ 后端服务器正常运行
- ✅ 已安装 `pdf-parse` 依赖

## 🚀 快速开始（3步完成）

### 第一步：获取你的用户ID

```bash
cd backend
node get-user-id.js
```

这会显示所有用户及其ID，找到你的账号对应的ID。

### 第二步：运行导入脚本

导入所有PDF文件：
```bash
node import-from-pdf.js <你的用户ID>
```

或导入特定文件：
```bash
node import-from-pdf.js <你的用户ID> ZenFit_训练报告_2026-01-06.pdf
```

### 第三步：刷新前端缓存

1. 打开浏览器访问：`http://localhost:5173/refresh-clean-data.html`
2. 点击"刷新对比"查看后端数据
3. 点击"清除缓存并重新加载干净数据"
4. 刷新浏览器（F5）

## 📝 示例

```bash
# 1. 查看用户ID
cd backend
node get-user-id.js

# 输出示例：
# 1. test@123.com
#    用户ID: 8048e966-b813-47d4-befe-c30c2e8057c8
#    训练记录: 0 条

# 2. 导入PDF数据
node import-from-pdf.js 8048e966-b813-47d4-befe-c30c2e8057c8

# 输出示例：
# ✅ 成功: 3 个文件
# 用户共有 3 条训练记录
```

## 📂 文件说明

| 文件 | 说明 |
|------|------|
| [`import-from-pdf.js`](import-from-pdf.js) | PDF导入主脚本 |
| [`get-user-id.js`](get-user-id.js) | 用户ID查询工具 |
| [`import-pdf-quickstart.bat`](import-pdf-quickstart.bat) | Windows快速启动脚本 |

## 📖 详细文档

- [PDF导入完整指南](../docs/PDF_IMPORT_GUIDE.md) - 详细说明和故障排除
- [刷新干净数据指南](../docs/REFRESH_CLEAN_DATA_GUIDE.md) - 前端缓存刷新

## ⚠️ 注意事项

1. **PDF格式**：确保PDF是文本格式，不是扫描图片
2. **用户ID**：必须使用正确的用户ID
3. **重复导入**：脚本不会自动检测重复，请注意
4. **前端刷新**：导入后必须刷新前端缓存才能看到数据

## 🔧 故障排除

### 问题1：找不到用户

```
❌ 错误: 找不到用户 xxx
```

**解决**：运行 `node get-user-id.js` 获取正确的用户ID

### 问题2：未能提取练习数据

```
⚠️ 警告: 未能从PDF中提取到练习数据
```

**解决**：
1. 检查PDF是否是文本格式（不是图片）
2. 查看脚本输出的"PDF文本预览"
3. 参考[详细文档](../docs/PDF_IMPORT_GUIDE.md)调整解析规则

### 问题3：前端看不到数据

**解决**：
1. 打开 `http://localhost:5173/refresh-clean-data.html`
2. 清除缓存并重新加载数据
3. 刷新浏览器

## 💡 提示

- 导入前先备份数据库
- 可以先导入一个文件测试
- 查看脚本输出的详细日志
- 导入后验证数据是否正确

## 🎉 完成

导入成功后，你的训练数据就恢复了！可以在前端查看和编辑这些数据。
