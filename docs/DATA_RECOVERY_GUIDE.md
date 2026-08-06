# ZenFit 数据恢复指南

## 问题描述

清理了数据库中的脏数据后，前端localhost仍然显示旧的脏数据。这是因为：
1. 数据库中的数据已被清空
2. 前端浏览器的localStorage中仍有旧的缓存数据
3. 需要从PDF备份文件恢复数据

## 解决方案

### 方案一：一键恢复（推荐）

#### 步骤1：从PDF恢复数据到数据库

1. 打开命令提示符（CMD）
2. 运行恢复脚本：
   ```bash
   cd c:\zenfit\backend
   restore-data-from-pdf.bat
   ```

3. 脚本会自动：
   - ✅ 获取你的用户ID
   - ✅ 从 `C:\project\report` 目录读取所有PDF文件
   - ✅ 解析PDF中的训练数据
   - ✅ 导入数据到数据库

#### 步骤2：清除前端缓存并重新加载

1. 打开浏览器访问：`http://localhost:5173/refresh-clean-data.html`

2. 按照页面提示操作：
   - 输入JWT token（会自动从localStorage加载）
   - 点击"🔄 刷新对比"查看数据对比
   - 点击"🔄 清除缓存并重新加载干净数据"

3. 刷新前端页面（F5）查看恢复的数据

### 方案二：手动恢复

#### 步骤1：获取用户ID

```bash
cd c:\zenfit\backend
node get-user-id.js
```

复制显示的用户ID。

#### 步骤2：导入PDF数据

```bash
node import-from-pdf.js [你的用户ID]
```

例如：
```bash
node import-from-pdf.js abc-123-def-456
```

#### 步骤3：验证数据

```bash
node check-data-format.js
```

#### 步骤4：清除前端缓存

访问 `http://localhost:5173/refresh-clean-data.html` 并按照提示操作。

## 当前PDF文件

你的PDF备份文件位于：`C:\project\report\`

- `ZenFit_训练报告_2026-01-06.pdf` - 背部/肩部训练
- `ZenFit_训练报告_2026-01-08.pdf` - 胸部/肩部训练
- `ZenFit_训练报告_2026-01-10.pdf` - 腿部训练

## 工具说明

### 1. restore-data-from-pdf.bat
一键恢复脚本，自动完成从PDF到数据库的导入。

### 2. refresh-clean-data.html
前端缓存清理工具，清除localStorage并从后端重新加载数据。

### 3. import-from-pdf.js
PDF解析和导入脚本，支持：
- 自动识别练习名称
- 自动识别肌肉群
- 提取组数、次数、重量
- 提取训练日期和时长

### 4. get-user-id.js
用户ID查询工具，显示所有用户及其训练数据统计。

## 常见问题

### Q1: PDF导入失败，提示"未能从PDF中提取到练习数据"

**原因**：PDF格式不符合预期

**解决方案**：
1. 检查PDF文件是否完整
2. 确认PDF是ZenFit导出的标准格式
3. 查看导入脚本的日志，了解具体解析失败的原因

### Q2: 前端刷新后仍然显示旧数据

**原因**：浏览器缓存未完全清除

**解决方案**：
1. 按 Ctrl+Shift+Delete 打开浏览器清除缓存对话框
2. 选择"缓存的图片和文件"
3. 清除缓存
4. 重新访问 `http://localhost:5173/refresh-clean-data.html`

### Q3: 导入的数据在Progress页面不显示

**原因**：数据格式不符合前端要求

**解决方案**：
1. 运行验证脚本：
   ```bash
   cd c:\zenfit\backend
   node check-data-format.js
   ```
2. 查看输出，确认数据格式是否正确
3. 如果格式有问题，运行修复脚本：
   ```bash
   node fix-workout-format.js
   ```

### Q4: 找不到用户ID

**原因**：数据库中没有用户记录

**解决方案**：
1. 在前端注册一个新账号
2. 重新运行 `get-user-id.js` 获取用户ID

## 数据验证

恢复完成后，建议进行以下验证：

1. **数据库验证**
   ```bash
   cd c:\zenfit\backend
   node check-data-format.js
   ```

2. **前端验证**
   - 访问 Progress 页面
   - 检查日历上是否显示训练记录
   - 点击日期查看详细数据
   - 确认肌肉群分布图是否正确

3. **数据完整性验证**
   - 确认所有PDF文件都已导入
   - 确认训练日期正确
   - 确认练习数据完整（组数、次数、重量）

## 预防措施

为避免将来再次出现数据丢失问题：

1. **定期备份**
   - 定期导出PDF报告
   - 定期备份数据库

2. **谨慎清理**
   - 清理数据前先备份
   - 使用SQL查询确认要删除的数据
   - 分步骤清理，每步验证

3. **使用工具**
   - 使用提供的诊断工具检查数据
   - 使用验证脚本确认数据格式

## 技术细节

### PDF解析逻辑

脚本使用多种策略解析PDF：

1. **表格格式**：`练习名称 | 组数x次数 | 重量kg`
2. **列表格式**：编号列表，每行包含练习信息
3. **灵活格式**：自动识别包含"组"和"次"的行

### 肌肉群识别

使用 `muscle-group-mapper.js` 根据练习名称自动识别肌肉群：
- 关键词匹配（如"卧推"→"chest"）
- 英文名称匹配（如"Bench Press"→"chest"）
- 默认值处理（未识别的练习）

### 数据格式

导入的数据格式符合后端API要求：
```json
{
  "name": "训练名称",
  "description": "训练描述",
  "date": "2026-01-06T00:00:00.000Z",
  "durationMin": 30,
  "exercises": [
    {
      "name": "杠铃卧推",
      "sets": 3,
      "reps": 10,
      "weight": 60,
      "muscleGroup": "chest",
      "muscleGroups": ["chest"]
    }
  ]
}
```

## 相关文件

- [`backend/restore-data-from-pdf.bat`](../backend/restore-data-from-pdf.bat) - 一键恢复脚本
- [`backend/import-from-pdf.js`](../backend/import-from-pdf.js) - PDF导入脚本
- [`backend/get-user-id.js`](../backend/get-user-id.js) - 用户ID查询
- [`backend/muscle-group-mapper.js`](../backend/muscle-group-mapper.js) - 肌肉群识别
- [`frontend/refresh-clean-data.html`](../frontend/refresh-clean-data.html) - 前端缓存清理工具
- [`backend/check-data-format.js`](../backend/check-data-format.js) - 数据格式验证

## 总结

完整的数据恢复流程：

1. ✅ 运行 `restore-data-from-pdf.bat` 从PDF恢复数据到数据库
2. ✅ 访问 `refresh-clean-data.html` 清除前端缓存
3. ✅ 刷新前端页面查看恢复的数据
4. ✅ 运行验证脚本确认数据完整性

如果遇到问题，请查看上面的"常见问题"部分或查看脚本的详细日志输出。
