# 锻炼时长计算问题分析

## 问题描述

用户报告1月15日的训练时长显示为45分钟，但实际应该是61分钟。PDF导出中显示的时长不准确。

## 根本原因

### 1. 时长计算逻辑

在 [`MainApp.tsx:1059-1067`](../frontend/src/pages/MainApp.tsx:1059-1067) 中，训练完成时使用 [`WorkoutDurationCalculator.calculateSmartDuration()`](../frontend/src/utils/WorkoutDurationCalculator.ts:40) 计算时长：

```typescript
// 🆕 使用智能时长计算
// 基于组完成时间戳，自动检测并排除暂停时间
const durationResult = WorkoutDurationCalculator.calculateSmartDuration(activeWorkout);

let durationMinutes = durationResult.durationMinutes;
```

### 2. 计算器的问题

[`WorkoutDurationCalculator.ts`](../frontend/src/utils/WorkoutDurationCalculator.ts:1) 中存在以下问题：

#### 问题1：固定的缓冲时间（第77行）
```typescript
// 7. 加上完成后的缓冲时间
const finalDuration = activeDuration + this.COMPLETION_BUFFER_MS;
```

**问题**：无论实际情况如何，都会自动添加5分钟的缓冲时间（`COMPLETION_BUFFER_MS = 5 * 60 * 1000`）。

#### 问题2：暂停检测阈值过大（第25行）
```typescript
/** 暂停检测阈值（毫秒）- 超过此时间视为暂停 */
private static readonly PAUSE_THRESHOLD_MS = 30 * 60 * 1000; // 30分钟
```

**问题**：只有当两组之间的间隔超过30分钟时才会被视为暂停。这意味着：
- 5-10分钟的休息不会被检测为暂停
- 实际训练时长可能包含了长时间的休息

#### 问题3：最小时长限制（第80-83行）
```typescript
// 8. 确保最小值
const durationMinutes = Math.max(
    this.MIN_DURATION_MINUTES,
    Math.round(finalDuration / 60000)
);
```

**问题**：强制最小时长为5分钟，可能不适用于所有情况。

### 3. PDF导出使用的数据

在 [`PDFExportService.ts:585`](../frontend/src/features/export/services/PDFExportService.ts:585) 中，PDF直接使用 `session.durationMinutes`：

```typescript
const metrics = [
    { label: 'DURATION', val: session.durationMinutes || 0, unit: 'MIN', x: durationX },
    { label: 'CALORIES', val: advancedCalories, unit: 'KCAL', x: caloriesX },
    { label: 'SETS', val: totalSets, unit: '', x: setsX }
];
```

这意味着PDF显示的时长完全依赖于训练完成时计算的 `durationMinutes`。

## 实际案例分析

### 1月15日训练

**期望时长**：61分钟  
**实际显示**：45分钟  
**差异**：-16分钟

可能的原因：
1. **缓冲时间计算错误**：如果实际训练时长是56分钟，加上5分钟缓冲 = 61分钟
2. **暂停时间被错误扣除**：如果有16分钟的休息被错误地从总时长中扣除
3. **组完成时间戳不准确**：如果第一组或最后一组的时间戳记录不正确

## 解决方案

### 方案1：优化时长计算逻辑（推荐）

修改 [`WorkoutDurationCalculator.ts`](../frontend/src/utils/WorkoutDurationCalculator.ts:1)：

```typescript
/**
 * 智能计算训练时长 - 优化版
 * 
 * @param exercises 训练动作列表
 * @param pauseSegments 手动暂停记录（可选）
 * @param options 计算选项
 * @returns 训练时长计算结果
 */
static calculateSmartDuration(
    exercises: ActiveExercise[],
    pauseSegments?: Array<{ startTime: number; endTime?: number }>,
    options?: {
        completionBufferMinutes?: number; // 完成缓冲时间（分钟），默认2分钟
        pauseThresholdMinutes?: number;   // 暂停检测阈值（分钟），默认10分钟
        minDurationMinutes?: number;      // 最小时长（分钟），默认5分钟
    }
): DurationCalculationResult {
    const {
        completionBufferMinutes = 2,  // 减少缓冲时间从5分钟到2分钟
        pauseThresholdMinutes = 10,   // 降低暂停阈值从30分钟到10分钟
        minDurationMinutes = 5
    } = options || {};

    // 1. 收集所有完成组的时间戳
    const completedTimestamps = this.collectCompletedTimestamps(exercises);

    // 2. 如果没有完成的组，返回默认值
    if (completedTimestamps.length === 0) {
        const now = Date.now();
        return {
            durationMinutes: 0,
            actualStartTime: now,
            actualEndTime: now,
            autoDetectedPauses: 0,
            totalPauseMinutes: 0,
        };
    }

    // 3. 排序时间戳
    completedTimestamps.sort((a, b) => a - b);

    const firstSetTime = completedTimestamps[0];
    const lastSetTime = completedTimestamps[completedTimestamps.length - 1];

    // 4. 检测自动暂停（使用新的阈值）
    const autoPauseResult = this.detectAutoPauses(
        completedTimestamps,
        pauseThresholdMinutes * 60 * 1000
    );

    // 5. 计算手动暂停时间
    const manualPauseTime = this.calculateManualPauseTime(pauseSegments);

    // 6. 计算总时长
    const totalTime = lastSetTime - firstSetTime;
    const totalPauseTime = autoPauseResult.totalPauseTime + manualPauseTime;
    const activeDuration = totalTime - totalPauseTime;

    // 7. 加上完成后的缓冲时间（使用可配置的值）
    const finalDuration = activeDuration + (completionBufferMinutes * 60 * 1000);

    // 8. 确保最小值
    const durationMinutes = Math.max(
        minDurationMinutes,
        Math.round(finalDuration / 60000)
    );

    // 9. 输出日志
    this.logCalculation({
        firstSetTime,
        lastSetTime,
        totalTime,
        autoPauseResult,
        manualPauseTime,
        durationMinutes,
        completionBufferMinutes,
        pauseThresholdMinutes
    });

    return {
        durationMinutes,
        actualStartTime: firstSetTime,
        actualEndTime: lastSetTime,
        autoDetectedPauses: autoPauseResult.pauseCount,
        totalPauseMinutes: Math.round(totalPauseTime / 60000),
    };
}

/**
 * 检测自动暂停 - 支持自定义阈值
 */
private static detectAutoPauses(
    sortedTimestamps: number[],
    pauseThresholdMs: number = 30 * 60 * 1000
): {
    totalPauseTime: number;
    pauseCount: number;
    pauses: Array<{ startTime: number; endTime: number; duration: number }>;
} {
    let totalPauseTime = 0;
    let pauseCount = 0;
    const pauses: Array<{ startTime: number; endTime: number; duration: number }> = [];

    for (let i = 1; i < sortedTimestamps.length; i++) {
        const gap = sortedTimestamps[i] - sortedTimestamps[i - 1];

        // 如果间隔超过阈值，视为暂停
        if (gap > pauseThresholdMs) {
            totalPauseTime += gap;
            pauseCount++;
            pauses.push({
                startTime: sortedTimestamps[i - 1],
                endTime: sortedTimestamps[i],
                duration: gap,
            });

            console.log(
                `🔍 Detected pause #${pauseCount}: ${Math.round(gap / 60000)}min ` +
                `(${new Date(sortedTimestamps[i - 1]).toLocaleTimeString()} - ` +
                `${new Date(sortedTimestamps[i]).toLocaleTimeString()})`
            );
        }
    }

    return { totalPauseTime, pauseCount, pauses };
}
```

### 方案2：添加手动时长调整功能

在训练完成时，允许用户手动调整时长：

```typescript
// MainApp.tsx 中的 handleFinishWorkout 函数
const handleFinishWorkout = async () => {
    if (activeWorkout.length === 0) return;

    // 计算智能时长
    const durationResult = WorkoutDurationCalculator.calculateSmartDuration(activeWorkout, undefined, {
        completionBufferMinutes: 2,  // 使用更合理的缓冲时间
        pauseThresholdMinutes: 10,   // 使用更敏感的暂停检测
        minDurationMinutes: 5
    });
    
    let durationMinutes = durationResult.durationMinutes;

    // 显示时长确认对话框
    setModalContent({
        title: "确认训练时长",
        content: (
            <div>
                <p className="text-slate-300 mb-4">
                    系统计算的训练时长为 <strong>{durationMinutes}分钟</strong>
                </p>
                <p className="text-slate-400 text-sm mb-4">
                    如果不准确，请手动调整：
                </p>
                <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <button
                    onClick={() => proceedWithFinishWorkout(durationMinutes)}
                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl"
                >
                    确认并完成训练
                </button>
            </div>
        )
    });
};
```

### 方案3：基于实际时间戳计算（最准确）

如果你有准确的训练开始和结束时间戳，可以直接使用：

```typescript
// 使用实际的训练开始和结束时间
const actualDuration = (Date.now() - workoutStartTime) / 60000; // 转换为分钟
const durationMinutes = Math.round(actualDuration);
```

## 诊断工具

创建一个诊断脚本来检查1月15日的训练数据：

```javascript
// backend/check-specific-dates.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkoutDuration() {
    try {
        // 查询1月15日的训练记录
        const workouts = await prisma.workout.findMany({
            where: {
                date: {
                    gte: new Date('2026-01-15T00:00:00Z'),
                    lt: new Date('2026-01-16T00:00:00Z')
                }
            },
            orderBy: { date: 'asc' }
        });

        console.log(`\n找到 ${workouts.length} 条1月15日的训练记录\n`);

        for (const workout of workouts) {
            console.log(`\n=== 训练记录 ${workout.id} ===`);
            console.log(`日期: ${workout.date}`);
            console.log(`时长: ${workout.durationMin} 分钟`);
            console.log(`状态: ${workout.status}`);

            // 解析exercises字段
            const exercises = JSON.parse(workout.exercises);
            console.log(`\n动作数量: ${exercises.length}`);

            // 收集所有组的完成时间戳
            const timestamps = [];
            exercises.forEach((ex, index) => {
                console.log(`\n动作 ${index + 1}: ${ex.exerciseName || '未知'}`);
                console.log(`  肌肉群: ${ex.muscleGroup || '未知'}`);
                console.log(`  组数: ${ex.sets?.length || 0}`);

                if (ex.sets && Array.isArray(ex.sets)) {
                    ex.sets.forEach((set, setIndex) => {
                        if (set.completed && set.completedAt) {
                            timestamps.push(set.completedAt);
                            const time = new Date(set.completedAt).toLocaleTimeString('zh-CN');
                            console.log(`    组 ${setIndex + 1}: ${set.weight}kg x ${set.reps}次 (完成于 ${time})`);
                        }
                    });
                }
            });

            // 分析时间戳
            if (timestamps.length > 0) {
                timestamps.sort((a, b) => a - b);
                const firstSet = timestamps[0];
                const lastSet = timestamps[timestamps.length - 1];
                const totalDuration = (lastSet - firstSet) / 60000; // 转换为分钟

                console.log(`\n=== 时长分析 ===`);
                console.log(`第一组完成时间: ${new Date(firstSet).toLocaleTimeString('zh-CN')}`);
                console.log(`最后一组完成时间: ${new Date(lastSet).toLocaleTimeString('zh-CN')}`);
                console.log(`实际训练时长: ${Math.round(totalDuration)} 分钟`);
                console.log(`数据库记录时长: ${workout.durationMin} 分钟`);
                console.log(`差异: ${Math.round(totalDuration - workout.durationMin)} 分钟`);

                // 检测暂停
                console.log(`\n=== 组间间隔分析 ===`);
                for (let i = 1; i < timestamps.length; i++) {
                    const gap = (timestamps[i] - timestamps[i - 1]) / 60000;
                    if (gap > 5) { // 超过5分钟的间隔
                        console.log(`⚠️ 长间隔: ${Math.round(gap)} 分钟 (${new Date(timestamps[i - 1]).toLocaleTimeString('zh-CN')} - ${new Date(timestamps[i]).toLocaleTimeString('zh-CN')})`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('❌ 查询失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkWorkoutDuration();
```

## 执行步骤

### 1. 运行诊断脚本

```bash
cd backend
node check-specific-dates.js
```

这将显示：
- 1月15日的所有训练记录
- 每个动作的详细信息
- 所有组的完成时间戳
- 实际训练时长 vs 记录时长
- 组间间隔分析

### 2. 根据诊断结果选择方案

- 如果差异是由于缓冲时间或暂停检测问题：使用**方案1**
- 如果需要用户手动确认时长：使用**方案2**
- 如果有准确的开始/结束时间戳：使用**方案3**

### 3. 更新代码并推送

```bash
# 修改代码后
git add .
git commit -m "Fix workout duration calculation logic"
git push origin master
```

### 4. 在Railway上测试

Railway会自动检测推送并重新部署。部署完成后：
1. 完成一次新的训练
2. 检查时长是否准确
3. 导出PDF验证时长显示

## 相关文件

- [`WorkoutDurationCalculator.ts`](../frontend/src/utils/WorkoutDurationCalculator.ts:1) - 时长计算器
- [`MainApp.tsx:1059-1067`](../frontend/src/pages/MainApp.tsx:1059-1067) - 训练完成逻辑
- [`PDFExportService.ts:585`](../frontend/src/features/export/services/PDFExportService.ts:585) - PDF时长显示
- [`check-specific-dates.js`](../backend/check-specific-dates.js:1) - 诊断脚本

## 预防措施

1. **记录详细日志**：在时长计算时记录所有中间步骤
2. **添加单元测试**：为时长计算器添加测试用例
3. **用户反馈机制**：允许用户报告时长不准确的情况
4. **数据验证**：在保存训练记录前验证时长的合理性
