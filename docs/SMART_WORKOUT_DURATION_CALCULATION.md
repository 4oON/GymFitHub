# 智能训练时长计算方案

## 问题分析

### 当前问题
- ❌ 使用`workoutStartTime`和结束时间计算，但这包含了所有暂停时间
- ❌ 默认45分钟不准确，无法反映真实训练时长
- ❌ 没有考虑分段训练（上午+下午）的场景

### 用户实际使用场景
1. ✅ 每完成一组都会按rest按钮
2. ✅ 第一个动作完成时间 = 训练开始时间
3. ✅ 最后点击"完成训练"时间 = 训练结束时间
4. ✅ 可能会暂停（分成上午下午训练）

## 新的时间计算逻辑

### 方案1：基于组完成时间戳计算（推荐）

#### 原理
- 使用每组的`completedAt`时间戳
- 第一组完成时间 = 训练开始
- 最后一组完成时间 = 训练结束
- 自动排除暂停时间（超过30分钟的间隔视为暂停）

#### 优点
- ✅ 准确反映实际训练时长
- ✅ 自动处理暂停（不计入训练时间）
- ✅ 支持分段训练
- ✅ 基于真实数据，不需要手动记录

#### 实现逻辑

```typescript
/**
 * 智能计算训练时长
 * 基于组完成时间戳，自动排除暂停时间
 */
function calculateSmartDuration(exercises: ActiveExercise[]): number {
    // 1. 收集所有完成组的时间戳
    const completedTimestamps: number[] = [];
    
    exercises.forEach(ex => {
        ex.sets.forEach(set => {
            if (set.completed && set.completedAt) {
                completedTimestamps.push(set.completedAt);
            }
        });
    });
    
    // 2. 如果没有完成的组，返回0
    if (completedTimestamps.length === 0) {
        return 0;
    }
    
    // 3. 排序时间戳
    completedTimestamps.sort((a, b) => a - b);
    
    // 4. 计算训练时长（排除暂停）
    let totalDuration = 0;
    let sessionStart = completedTimestamps[0];
    
    for (let i = 1; i < completedTimestamps.length; i++) {
        const gap = completedTimestamps[i] - completedTimestamps[i - 1];
        
        // 如果间隔超过30分钟，视为暂停
        if (gap > 30 * 60 * 1000) {
            // 累加当前session的时长
            totalDuration += completedTimestamps[i - 1] - sessionStart;
            // 开始新的session
            sessionStart = completedTimestamps[i];
        }
    }
    
    // 5. 加上最后一个session的时长
    totalDuration += completedTimestamps[completedTimestamps.length - 1] - sessionStart;
    
    // 6. 加上最后一组到点击完成的时间（估算5分钟）
    totalDuration += 5 * 60 * 1000;
    
    // 7. 转换为分钟
    return Math.round(totalDuration / 60000);
}
```

### 方案2：添加手动暂停/恢复功能

#### UI设计
```
┌─────────────────────────────┐
│  Training in Progress       │
│  ⏱️ 45:23 (Active)          │
│                             │
│  [⏸️ Pause] [✅ Finish]     │
└─────────────────────────────┘

暂停后：
┌─────────────────────────────┐
│  Training Paused            │
│  ⏱️ 45:23 (Paused)          │
│                             │
│  [▶️ Resume] [✅ Finish]    │
└─────────────────────────────┘
```

#### 数据结构
```typescript
interface WorkoutSession {
    // ... 现有字段
    durationMinutes: number;  // 总时长（排除暂停）
    pauseSegments?: Array<{   // 暂停记录
        startTime: number;
        endTime?: number;
    }>;
    activeDuration?: number;  // 实际训练时长
}
```

#### 计算逻辑
```typescript
function calculateDurationWithPauses(
    startTime: number,
    endTime: number,
    pauseSegments: Array<{startTime: number, endTime?: number}>
): number {
    let totalPauseTime = 0;
    
    pauseSegments.forEach(pause => {
        if (pause.endTime) {
            totalPauseTime += pause.endTime - pause.startTime;
        }
    });
    
    const totalTime = endTime - startTime;
    const activeDuration = totalTime - totalPauseTime;
    
    return Math.round(activeDuration / 60000);
}
```

## 推荐方案：混合方案

### 结合两种方案的优点

1. **主要使用方案1（自动检测）**
   - 基于组完成时间戳
   - 自动排除长时间暂停（>30分钟）
   - 无需用户手动操作

2. **可选添加方案2（手动暂停）**
   - 用户可以手动暂停/恢复
   - 用于短时间休息（<30分钟）
   - 提供更精确的控制

### 实现步骤

#### 步骤1：修改数据结构

```typescript
// frontend/src/shared/types.ts
export interface WorkoutSet {
    id: string;
    weight: number;
    reps: number;
    completed: boolean;
    completedAt?: number;  // ✅ 已有
    restCompletedAt?: number;
}

export interface WorkoutSession {
    id: string;
    date: number;
    createdAt: number;
    syncStatus: 'pending' | 'synced';
    exercises: ActiveExercise[];
    durationMinutes: number;
    volumeLoad: number;
    // 🆕 新增字段
    actualStartTime?: number;  // 第一组完成时间
    actualEndTime?: number;    // 最后一组完成时间
    pauseSegments?: Array<{    // 暂停记录
        startTime: number;
        endTime?: number;
    }>;
}
```

#### 步骤2：实现智能时长计算

```typescript
// frontend/src/utils/workoutDurationCalculator.ts
export class WorkoutDurationCalculator {
    /**
     * 智能计算训练时长
     * @param exercises 训练动作列表
     * @param pauseSegments 手动暂停记录（可选）
     * @returns 训练时长（分钟）
     */
    static calculateSmartDuration(
        exercises: ActiveExercise[],
        pauseSegments?: Array<{startTime: number, endTime?: number}>
    ): {
        durationMinutes: number;
        actualStartTime: number;
        actualEndTime: number;
        autoDetectedPauses: number;
    } {
        // 1. 收集所有完成组的时间戳
        const completedTimestamps: number[] = [];
        
        exercises.forEach(ex => {
            ex.sets.forEach(set => {
                if (set.completed && set.completedAt) {
                    completedTimestamps.push(set.completedAt);
                }
            });
        });
        
        // 2. 如果没有完成的组，返回默认值
        if (completedTimestamps.length === 0) {
            const now = Date.now();
            return {
                durationMinutes: 0,
                actualStartTime: now,
                actualEndTime: now,
                autoDetectedPauses: 0
            };
        }
        
        // 3. 排序时间戳
        completedTimestamps.sort((a, b) => a - b);
        
        const firstSetTime = completedTimestamps[0];
        const lastSetTime = completedTimestamps[completedTimestamps.length - 1];
        
        // 4. 检测自动暂停（间隔>30分钟）
        let totalPauseTime = 0;
        let autoDetectedPauses = 0;
        
        for (let i = 1; i < completedTimestamps.length; i++) {
            const gap = completedTimestamps[i] - completedTimestamps[i - 1];
            
            // 如果间隔超过30分钟，视为暂停
            if (gap > 30 * 60 * 1000) {
                totalPauseTime += gap;
                autoDetectedPauses++;
                console.log(`🔍 Detected pause: ${Math.round(gap / 60000)}min between sets`);
            }
        }
        
        // 5. 计算手动暂停时间
        let manualPauseTime = 0;
        if (pauseSegments) {
            pauseSegments.forEach(pause => {
                if (pause.endTime) {
                    manualPauseTime += pause.endTime - pause.startTime;
                }
            });
        }
        
        // 6. 计算总时长
        const totalTime = lastSetTime - firstSetTime;
        const activeDuration = totalTime - totalPauseTime - manualPauseTime;
        
        // 7. 加上最后一组到点击完成的时间（估算5分钟）
        const finalDuration = activeDuration + (5 * 60 * 1000);
        
        // 8. 确保最小值为5分钟
        const durationMinutes = Math.max(5, Math.round(finalDuration / 60000));
        
        console.log(`⏱️ Duration calculation:
            - First set: ${new Date(firstSetTime).toLocaleTimeString()}
            - Last set: ${new Date(lastSetTime).toLocaleTimeString()}
            - Total time: ${Math.round(totalTime / 60000)}min
            - Auto pauses: ${Math.round(totalPauseTime / 60000)}min (${autoDetectedPauses} detected)
            - Manual pauses: ${Math.round(manualPauseTime / 60000)}min
            - Active duration: ${durationMinutes}min
        `);
        
        return {
            durationMinutes,
            actualStartTime: firstSetTime,
            actualEndTime: lastSetTime,
            autoDetectedPauses
        };
    }
}
```

#### 步骤3：修改MainApp.tsx的完成训练逻辑

```typescript
// frontend/src/pages/MainApp.tsx
const handleFinishWorkout = async () => {
    if (activeWorkout.length === 0) return;
    
    setModalContent({
        title: "Finishing Workout...",
        content: (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin text-emerald-500 h-10 w-10 mb-4" />
                <p className="text-slate-400 text-center">Calculating duration & <br />Generating AI Report...</p>
            </div>
        )
    });
    
    // 🆕 使用智能时长计算
    const durationResult = WorkoutDurationCalculator.calculateSmartDuration(
        activeWorkout,
        pauseSegments  // 如果有手动暂停记录
    );
    
    const volumeLoad = activeWorkout.reduce((acc, ex) => 
        acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => 
            sAcc + (s.weight * s.reps), 0
        ), 0
    );
    
    const sessionTime = getCurrentTimestamp();
    const newSession: WorkoutSession = {
        id: generateUUID(),
        date: sessionTime,
        createdAt: sessionTime,
        syncStatus: 'pending',
        exercises: activeWorkout,
        durationMinutes: durationResult.durationMinutes,  // ✅ 使用智能计算的时长
        volumeLoad,
        actualStartTime: durationResult.actualStartTime,
        actualEndTime: durationResult.actualEndTime,
        pauseSegments: pauseSegments
    };
    
    // ... 继续同步到后端
};
```

## 数据验证调整

### 更新验证规则

```typescript
// frontend/src/services/WorkoutSyncService.ts
private static validateWorkoutSession(session: WorkoutSession): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];
    
    // 验证1：训练时长合理性（调整为更宽松的范围）
    // 最短5分钟，最长12小时（考虑分段训练）
    if (!session.durationMinutes || session.durationMinutes < 5 || session.durationMinutes > 720) {
        errors.push(`Invalid duration: ${session.durationMinutes}min (expected 5-720)`);
    }
    
    // 验证2：如果有actualStartTime和actualEndTime，验证它们的合理性
    if (session.actualStartTime && session.actualEndTime) {
        const timeDiff = session.actualEndTime - session.actualStartTime;
        const timeDiffMinutes = Math.round(timeDiff / 60000);
        
        // 实际时间跨度应该大于等于训练时长
        if (timeDiffMinutes < session.durationMinutes) {
            errors.push(`Time span (${timeDiffMinutes}min) is less than duration (${session.durationMinutes}min)`);
        }
    }
    
    // ... 其他验证保持不变
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
```

## UI改进（可选）

### 添加暂停按钮

```typescript
// frontend/src/features/workout/components/InProgressWorkout.tsx
const [isPaused, setIsPaused] = useState(false);
const [pauseSegments, setPauseSegments] = useState<Array<{startTime: number, endTime?: number}>>([]);

const handlePause = () => {
    if (isPaused) {
        // 恢复训练
        setPauseSegments(prev => {
            const updated = [...prev];
            const lastPause = updated[updated.length - 1];
            if (lastPause && !lastPause.endTime) {
                lastPause.endTime = Date.now();
            }
            return updated;
        });
        setIsPaused(false);
    } else {
        // 暂停训练
        setPauseSegments(prev => [...prev, { startTime: Date.now() }]);
        setIsPaused(true);
    }
};

// 在UI中添加暂停按钮
<button
    onClick={handlePause}
    className={`px-4 py-2 rounded-xl font-bold ${
        isPaused 
            ? 'bg-emerald-500 text-white' 
            : 'bg-amber-500 text-white'
    }`}
>
    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
</button>
```

## 总结

### 推荐实现顺序

1. ✅ **立即实现：智能时长计算（方案1）**
   - 基于组完成时间戳
   - 自动检测暂停（>30分钟）
   - 无需UI改动

2. ⏳ **后续优化：手动暂停功能（方案2）**
   - 添加暂停/恢复按钮
   - 用于短时间休息
   - 提供更精确的控制

### 优点

- ✅ 准确反映实际训练时长
- ✅ 自动处理分段训练（上午+下午）
- ✅ 不需要用户手动记录开始/结束时间
- ✅ 基于真实数据，可验证
- ✅ 向后兼容（现有数据可以重新计算）

### 注意事项

- ⚠️ 需要确保每组都有`completedAt`时间戳
- ⚠️ 30分钟的暂停阈值可以根据实际使用调整
- ⚠️ 最后5分钟的缓冲时间可以根据实际情况调整
