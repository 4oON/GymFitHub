# 从JSON文件导入训练数据

由于PDF解析库存在兼容性问题，我为你创建了一个更简单可靠的方案：**从JSON文件导入数据**。

## 方案1：从JSON文件导入（推荐）

### 步骤1：创建JSON文件

根据你的PDF内容，创建一个JSON文件（例如 `workouts.json`）：

```json
[
  {
    "name": "胸部训练",
    "description": "从PDF导入",
    "date": "2026-01-06",
    "durationMin": 45,
    "exercises": [
      {
        "name": "卧推",
        "muscleGroup": "Chest",
        "sets": [
          { "reps": 12, "weight": 60, "completed": true },
          { "reps": 10, "weight": 65, "completed": true },
          { "reps": 8, "weight": 70, "completed": true }
        ]
      },
      {
        "name": "哑铃飞鸟",
        "muscleGroup": "Chest",
        "sets": [
          { "reps": 15, "weight": 20, "completed": true },
          { "reps": 15, "weight": 20, "completed": true },
          { "reps": 12, "weight": 22, "completed": true }
        ]
      }
    ]
  },
  {
    "name": "背部训练",
    "description": "从PDF导入",
    "date": "2026-01-08",
    "durationMin": 50,
    "exercises": [
      {
        "name": "引体向上",
        "muscleGroup": "Lats",
        "sets": [
          { "reps": 10, "weight": 0, "completed": true },
          { "reps": 8, "weight": 0, "completed": true },
          { "reps": 6, "weight": 0, "completed": true }
        ]
      }
    ]
  }
]
```

### 步骤2：运行导入脚本

```bash
cd backend
node import-from-json.js <你的用户ID> <JSON文件路径>
```

示例：
```bash
node import-from-json.js 83381e3a-c430-48ca-9fba-b799bc64cc4b C:\project\report\workouts.json
```

## 方案2：从前端localStorage导入

如果你的数据还在浏览器的localStorage中：

### 步骤1：导出localStorage数据

在浏览器Console中运行：
```javascript
// 导出训练记录
const workouts = JSON.parse(localStorage.getItem('workout-sessions') || '[]');
console.log(JSON.stringify(workouts, null, 2));

// 复制输出的JSON，保存为文件
```

### 步骤2：使用JSON导入工具导入

```bash
node import-from-json.js <用户ID> <保存的JSON文件>
```

## 方案3：手动从PDF提取数据

如果PDF是文本格式，你可以：

1. 打开PDF文件
2. 复制文本内容
3. 根据格式手动创建JSON文件
4. 使用JSON导入工具导入

### PDF文本格式示例

如果你的PDF包含类似这样的文本：
```
训练名称: 胸部训练
训练时长: 45分钟
日期: 2026-01-06

练习详情:
1. 卧推
   3组 x 12次
   60kg

2. 哑铃飞鸟
   3组 x 15次
   20kg
```

你可以手动转换为JSON格式。

## 肌肉群对照表

在创建JSON时，使用以下肌肉群名称：

| 中文 | 英文代码 |
|------|---------|
| 胸部 | Chest |
| 背部 | Lats |
| 肩部 | Shoulders |
| 腿部 | Quads |
| 腘绳肌 | Hamstrings |
| 臀部 | Glutes |
| 二头肌 | Biceps |
| 三头肌 | Triceps |
| 腹肌 | Abs |
| 小腿 | Calves |
| 前臂 | Forearms |
| 斜方肌 | Traps |

## 常见问题

### Q: 如何从PDF中提取数据？

A: 有几种方法：
1. 如果PDF是文本格式，直接复制粘贴
2. 使用在线PDF转文本工具
3. 手动查看PDF并创建JSON

### Q: JSON格式错误怎么办？

A: 使用在线JSON验证工具（如 jsonlint.com）检查格式

### Q: 可以批量导入多个训练吗？

A: 可以！在JSON数组中添加多个训练对象即可

## 下一步

创建好JSON文件后，使用 [`import-from-json.js`](import-from-json.js) 脚本导入数据。
