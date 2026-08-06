# PDF数据导入指南

## 概述

这个工具可以从ZenFit导出的PDF训练报告中提取数据，并导入到后端数据库中。

## 前提条件

1. ✅ 已经有PDF格式的训练报告
2. ✅ 知道你的用户ID
3. ✅ 后端数据库正常运行

## 安装步骤

### 第一步：安装依赖

在backend目录下安装pdf-parse库：

```bash
cd backend
npm install pdf-parse
```

### 第二步：获取用户ID

你需要知道你的用户ID才能导入数据。有几种方法：

#### 方法1：从浏览器获取

1. 打开浏览器开发者工具（F12）
2. 进入Console标签
3. 输入：
```javascript
localStorage.getItem('token')
```
4. 复制token，然后解码（可以使用 https://jwt.io）
5. 在解码后的payload中找到userId

#### 方法2：从数据库查询

```bash
cd backend
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.findMany().then(u=>{console.log(u);process.exit()})"
```

这会列出所有用户及其ID。

### 第三步：运行导入脚本

#### 导入所有PDF文件

```bash
cd backend
node import-from-pdf.js <你的用户ID>
```

示例：
```bash
node import-from-pdf.js abc-123-def-456
```

#### 导入特定PDF文件

```bash
node import-from-pdf.js <你的用户ID> <PDF文件名>
```

示例：
```bash
node import-from-pdf.js abc-123-def-456 ZenFit_训练报告_2026-01-06.pdf
```

## 工作原理

### 1. PDF文件格式识别

工具支持多种PDF格式：

#### 格式1：表格格式
```
练习名称 | 组数 x 次数 | 重量kg
深蹲 | 3 x 12 | 60kg
卧推 | 4 x 10 | 50kg
```

#### 格式2：列表格式
```
1. 深蹲
   3组 x 12次
   60kg

2. 卧推
   4组 x 10次
   50kg
```

#### 格式3：灵活格式
```
深蹲
3组 12次
60kg

卧推
4组 10次
50kg
```

### 2. 数据提取流程

```
┌─────────────────────────────────────────────────────────┐
│  1. 读取PDF文件                                          │
│     - 使用pdf-parse库解析PDF                             │
│     - 提取文本内容                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. 提取元数据                                           │
│     - 从文件名提取日期                                    │
│     - 从文本提取训练名称                                  │
│     - 从文本提取训练时长                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. 提取练习数据                                         │
│     - 使用正则表达式匹配练习信息                          │
│     - 提取：名称、组数、次数、重量                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. 导入数据库                                           │
│     - 验证用户ID                                         │
│     - 创建Workout记录                                    │
│     - 保存exercises JSON数据                             │
└─────────────────────────────────────────────────────────┘
```

### 3. 数据结构

导入到数据库的数据结构：

```javascript
{
  userId: "abc-123-def-456",
  name: "训练记录",
  description: "从PDF导入",
  date: "2026-01-06T00:00:00.000Z",
  durationMin: 45,
  exercises: [
    {
      name: "深蹲",
      sets: 3,
      reps: 12,
      weight: 60,
      muscleGroup: "Quads",
      muscleGroups: ["Quads"]  // 🆕 自动识别肌肉群
    },
    {
      name: "卧推",
      sets: 4,
      reps: 10,
      weight: 50,
      muscleGroup: "Chest",
      muscleGroups: ["Chest"]  // 🆕 自动识别肌肉群
    }
  ]
}
```

## 输出示例

```
============================================================
ZenFit PDF数据导入工具
============================================================

用户ID: abc-123-def-456
PDF目录: C:\project\report
✅ 用户验证通过: user@example.com

找到 3 个PDF文件:
  - ZenFit_训练报告_2026-01-06.pdf
  - ZenFit_训练报告_2026-01-08.pdf
  - ZenFit_训练报告_2026-01-10.pdf

============================================================

读取PDF文件: C:\project\report\ZenFit_训练报告_2026-01-06.pdf
PDF页数: 1
PDF文本长度: 1234

--- PDF文本预览 ---
训练名称: 胸部训练
训练时长: 45分钟
...
--- 预览结束 ---

=== 开始解析PDF ===
文件名: ZenFit_训练报告_2026-01-06.pdf
训练日期: 2026-01-06T00:00:00.000Z
训练名称: 胸部训练
训练时长: 45 分钟
提取练习: 卧推 3x12 60kg [Chest]
提取练习: 哑铃飞鸟 3x15 20kg [Chest]
共提取 2 个练习

=== 导入数据到数据库 ===
用户ID: abc-123-def-456
训练名称: 胸部训练
训练日期: 2026-01-06T00:00:00.000Z
✅ 导入成功! Workout ID: xyz-789-uvw-012

============================================================
导入完成!
============================================================
✅ 成功: 3 个文件
❌ 失败: 0 个文件
📊 总计: 3 个文件

查询用户的所有训练记录...

用户共有 3 条训练记录:
  1. 胸部训练 - 2026-01-10 (2 个练习)
  2. 背部训练 - 2026-01-08 (3 个练习)
  3. 腿部训练 - 2026-01-06 (4 个练习)
```

## 常见问题

### Q: 提示"未能从PDF中提取到练习数据"？

A: 这可能是因为PDF格式不符合预期。解决方法：

1. **查看PDF文本预览**：脚本会显示PDF的前500个字符，检查格式
2. **手动调整格式**：如果PDF是图片格式，需要先OCR转换
3. **修改正则表达式**：根据你的PDF格式修改 [`import-from-pdf.js`](../backend/import-from-pdf.js:40) 中的正则表达式

### Q: 如何处理图片格式的PDF？

A: 如果PDF是扫描件或图片：

1. 使用OCR工具转换为文本PDF（推荐：Adobe Acrobat、在线OCR工具）
2. 或者手动创建JSON文件导入（见下方）

### Q: 可以直接导入JSON格式吗？

A: 可以！创建一个JSON文件：

```json
{
  "name": "训练记录",
  "description": "从JSON导入",
  "date": "2026-01-06",
  "durationMin": 45,
  "exercises": [
    {
      "name": "深蹲",
      "sets": 3,
      "reps": 12,
      "weight": 60,
      "muscleGroups": ["腿部"]
    }
  ]
}
```

然后创建一个简单的导入脚本。

### Q: 导入后如何验证数据？

A: 有几种方法：

#### 方法1：使用脚本查询
```bash
cd backend
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.workout.findMany({where:{userId:'你的用户ID'}}).then(w=>{console.log(JSON.stringify(w,null,2));process.exit()})"
```

#### 方法2：使用前端刷新工具
1. 打开 [`frontend/refresh-clean-data.html`](../frontend/refresh-clean-data.html:1)
2. 查看后端数据统计
3. 点击"刷新对比"

#### 方法3：直接查看前端
1. 刷新浏览器缓存
2. 重新登录
3. 查看训练记录页面

### Q: 导入的数据可以编辑吗？

A: 可以！导入后的数据和正常创建的数据一样，可以在前端进行编辑、删除等操作。

### Q: 如何避免重复导入？

A: 脚本不会自动检测重复。建议：

1. **导入前检查**：先查询数据库中的记录数量
2. **使用特定文件名**：只导入需要的PDF文件
3. **手动验证**：导入后检查记录数量是否正确

如果不小心重复导入，可以使用SQL删除：
```sql
-- 查看重复记录
SELECT name, date, COUNT(*) 
FROM workouts 
WHERE user_id = '你的用户ID'
GROUP BY name, date 
HAVING COUNT(*) > 1;

-- 删除重复记录（保留最新的）
-- 请谨慎使用！
```

## 高级用法

### 自定义PDF解析规则

如果你的PDF格式特殊，可以修改 [`import-from-pdf.js`](../backend/import-from-pdf.js:40) 中的 `extractWorkoutData` 函数：

```javascript
function extractWorkoutData(text, filename) {
  // 添加你自己的解析逻辑
  const customRegex = /你的正则表达式/gi;
  // ...
}
```

### 批量处理多个用户

如果需要为多个用户导入数据：

```bash
# 创建一个批处理脚本
for userId in user1 user2 user3; do
  node import-from-pdf.js $userId
done
```

### 导入后自动同步到前端

导入完成后，前端需要刷新缓存：

1. 使用 [`frontend/refresh-clean-data.html`](../frontend/refresh-clean-data.html:1) 工具
2. 或者清除浏览器localStorage并重新登录

## 相关文档

- [刷新干净数据指南](REFRESH_CLEAN_DATA_GUIDE.md) - 前端缓存刷新
- [清理脏数据指南](../backend/CLEAN_DIRTY_DATA_GUIDE.md) - 数据库清理
- [数据导入规则](DATA_IMPORT_RULES.md) - 数据验证规则

## 技术细节

### 使用的库

- **pdf-parse**: PDF文本提取
- **@prisma/client**: 数据库操作
- **fs**: 文件系统操作

### 文件位置

- 导入脚本: [`backend/import-from-pdf.js`](../backend/import-from-pdf.js:1)
- PDF目录: `C:\project\report`
- 数据库Schema: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:1)

### 性能考虑

- 每个PDF文件单独处理，失败不影响其他文件
- 大文件可能需要较长时间
- 建议一次导入不超过100个文件

## 总结

使用这个工具，你可以：

✅ **快速恢复数据**：从PDF备份中恢复训练记录
✅ **批量导入**：一次导入多个PDF文件
✅ **灵活解析**：支持多种PDF格式
✅ **安全可靠**：验证用户ID，记录详细日志
✅ **易于验证**：导入后可立即查询验证
✅ **🆕 智能识别肌肉群**：自动根据练习名称识别肌肉群，支持中英文

## 🆕 新功能：自动肌肉群识别

### 功能说明

从 **2026-01-16** 开始，PDF导入工具新增了智能肌肉群识别功能。导入时会自动根据练习名称识别对应的肌肉群，解决了之前导入的数据在Progress页面只显示"Chest"的问题。

### 支持的肌肉群

工具支持识别以下15个肌肉群：

| 肌肉群 | 中文关键词示例 | 英文关键词示例 |
|--------|---------------|---------------|
| **Chest** (胸部) | 卧推、推胸、飞鸟、夹胸 | bench press, chest press, fly |
| **Lats** (背阔肌) | 引体、下拉、划船 | pull up, lat, pulldown, row |
| **Traps** (斜方肌) | 耸肩、斜方、提拉 | shrug, trap, upright row |
| **Lower Back** (下背部) | 硬拉、山羊挺身 | deadlift, back extension |
| **Biceps** (二头肌) | 弯举、二头 | curl, bicep |
| **Triceps** (三头肌) | 臂屈伸、三头、下压 | extension, tricep, pushdown |
| **Forearms** (前臂) | 腕弯举、前臂 | wrist curl, forearm |
| **Shoulders** (肩部) | 推举、侧平举、肩推 | press, shoulder, lateral raise |
| **Abs** (腹肌) | 卷腹、仰卧起坐、平板支撑 | crunch, sit up, plank |
| **Obliques** (腹斜肌) | 侧卷腹、俄罗斯转体 | oblique, russian twist |
| **Quads** (股四头肌) | 深蹲、腿屈伸 | squat, leg extension, lunge |
| **Hamstrings** (腘绳肌) | 腿弯举、罗马尼亚硬拉 | leg curl, hamstring, rdl |
| **Calves** (小腿) | 提踵、小腿 | calf raise, calf |
| **Glutes** (臀部) | 臀推、臀桥 | hip thrust, glute bridge |
| **Cardio** (有氧) | 跑步、骑行、划船机 | run, bike, rowing |

### 识别示例

```
练习名称: "杠铃卧推" → 识别为 Chest
练习名称: "哑铃弯举" → 识别为 Biceps
练习名称: "深蹲" → 识别为 Quads
练习名称: "Bench Press" → 识别为 Chest
练习名称: "Pull Up" → 识别为 Lats
```

### 如何使用

无需任何额外操作！只需按照原来的方式运行导入脚本：

```bash
cd backend
node import-from-pdf.js <你的用户ID>
```

导入时会自动识别每个练习的肌肉群，并在控制台输出识别结果：

```
提取练习: 杠铃卧推 3x12 60kg [Chest]
提取练习: 哑铃弯举 3x15 20kg [Biceps]
提取练习: 深蹲 4x10 100kg [Quads]
```

### 修复历史数据

如果你之前已经导入过数据，但肌肉群显示不正确，有两种解决方案：

#### 方案1：重新导入（推荐）

1. 删除旧的导入记录
2. 使用新版本脚本重新导入PDF文件
3. 新导入的数据会自动包含正确的肌肉群信息

#### 方案2：手动修复数据库

如果你有大量历史数据不想重新导入，可以创建一个修复脚本：

```javascript
// backend/fix-muscle-groups.js
const { PrismaClient } = require('@prisma/client');
const { identifyMuscleGroup } = require('./muscle-group-mapper');

const prisma = new PrismaClient();

async function fixMuscleGroups(userId) {
    const workouts = await prisma.workout.findMany({
        where: { userId: userId }
    });

    for (const workout of workouts) {
        const updatedExercises = workout.exercises.map(ex => {
            const muscleGroup = identifyMuscleGroup(ex.name);
            return {
                ...ex,
                muscleGroup: muscleGroup,
                muscleGroups: [muscleGroup]
            };
        });

        await prisma.workout.update({
            where: { id: workout.id },
            data: { exercises: updatedExercises }
        });

        console.log(`✅ 修复记录: ${workout.name} (${workout.date})`);
    }

    console.log(`🎉 完成！共修复 ${workouts.length} 条记录`);
}

// 运行修复
const userId = process.argv[2];
if (!userId) {
    console.error('请提供用户ID: node fix-muscle-groups.js <用户ID>');
    process.exit(1);
}

fixMuscleGroups(userId)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

运行修复脚本：

```bash
cd backend
node fix-muscle-groups.js <你的用户ID>
```

### 技术实现

肌肉群识别功能由 [`backend/muscle-group-mapper.js`](../backend/muscle-group-mapper.js:1) 模块提供，使用关键词匹配算法：

1. 将练习名称转换为小写
2. 遍历所有肌肉群的关键词列表
3. 找到第一个匹配的关键词
4. 返回对应的肌肉群

如果没有匹配到任何关键词，会使用默认值 `Chest` 并在控制台输出警告。

### 自定义关键词

如果你有特殊的练习名称需要识别，可以编辑 [`backend/muscle-group-mapper.js`](../backend/muscle-group-mapper.js:1) 文件，在对应肌肉群的关键词数组中添加新的关键词：

```javascript
// 例如：添加"平板卧推"关键词到胸部
[MuscleGroup.CHEST]: [
    '卧推', '推胸', '飞鸟', '夹胸', '胸推', '胸部',
    '平板卧推',  // 🆕 添加新关键词
    'bench press', 'chest press', 'fly', 'flyes', 'pec', 'chest',
    'push up', 'pushup', 'dip'
],
```

现在你可以从PDF文件中恢复你的训练数据了！
