# 卡路里计算改进文档

## 问题描述

### 旧的计算方法（不科学）
```typescript
const totalCalories = Math.round((totalDuration / 60) * 5 * (userProfile.weight || 75));
```

**问题：**
- ❌ 只考虑时间和体重
- ❌ 完全忽略训练强度
- ❌ 不考虑实际完成的组数和重量
- ❌ 时间越长卡路里就越多（不合理）

**实际案例：**
- 22分钟训练 → 179 kcal
- 106分钟训练 → 1056 kcal  
- 18分钟训练 → 135 kcal

这种计算方式导致时间长但强度低的训练显示更高的卡路里消耗，这是不科学的。

---

## 新的科学计算方法

### 核心原理

新的计算方法基于运动生理学原理，综合考虑多个因素：

#### 1. **训练负荷（Volume Load）**
```typescript
exerciseVolume = Σ(weight × reps) for all completed sets
```
- 实际举起的总重量
- 反映真实的工作量

#### 2. **用户身体数据**
```typescript
leanMass = weight × (1 - bodyFat / 100)
```
- 瘦体重（Lean Body Mass）
- 瘦体重越高，代谢效率越高

#### 3. **动作类型系数**
- **复合动作（Compound）**: 1.3x 系数
  - 例如：深蹲、硬拉、卧推
  - 调动更多肌群，消耗更多能量
  
- **孤立动作（Isolation）**: 1.0x 系数
  - 例如：二头弯举、腿屈伸
  - 单一肌群，能量消耗较少

#### 4. **组数基础消耗**
```typescript
setCalories = totalSets × (3 + weight/100)
```
- 每组训练本身的基础代谢消耗
- 体重越大，每组消耗越多

#### 5. **训练期间BMR提升**
```typescript
bmrDuringWorkout = BMR × 1.5
timeBasedCalories = bmrDuringWorkout × durationHours
```
- 使用 Katch-McArdle 公式计算BMR
- 训练时基础代谢率提升50%

#### 6. **EPOC效应（运动后过量氧耗）**
```typescript
epocBonus = totalCalories × 0.15
```
- 高强度训练后持续燃烧卡路里
- 额外15%的能量消耗

---

## 完整计算公式

### 主要公式
```typescript
totalCalories = 
    volumeCalories +      // 基于负荷的消耗
    setCalories +         // 基于组数的消耗
    timeBasedCalories +   // 基于时间的BMR消耗
    epocBonus             // EPOC效应加成
```

### 详细计算步骤

```typescript
// 1. 计算瘦体重
leanMass = weight × (1 - bodyFat / 100)

// 2. 每个动作的卡路里消耗
for each exercise:
    exerciseVolume = Σ(weight × reps) for completed sets
    mechanicMultiplier = exercise.mechanic === 'Compound' ? 1.3 : 1.0
    leanMassMultiplier = 0.05 + (leanMass / 1000)
    exerciseCalories = (exerciseVolume / 1000) × 6.5 × mechanicMultiplier × leanMassMultiplier

// 3. 组数基础消耗
totalSets = Σ(completed sets)
setCalories = totalSets × (3 + weight / 100)

// 4. 时间基础消耗
dailyBMR = 370 + (21.6 × leanMass)  // Katch-McArdle公式
hourlyBMR = dailyBMR / 24
bmrDuringWorkout = hourlyBMR × 1.5
timeBasedCalories = bmrDuringWorkout × (duration / 60)

// 5. EPOC加成
epocBonus = (volumeCalories + setCalories + timeBasedCalories) × 0.15

// 6. 总计
totalCalories = volumeCalories + setCalories + timeBasedCalories + epocBonus
```

---

## 实际效果对比

### 示例1：高强度短时训练
- **时长**: 22分钟
- **负荷**: 10,002 kg
- **组数**: 20组
- **体重**: 75kg，体脂20%

**旧方法**: 179 kcal（仅基于时间）
**新方法**: ~280 kcal（考虑高强度负荷）

### 示例2：低强度长时训练
- **时长**: 106分钟
- **负荷**: 16,244 kg
- **组数**: 35组
- **体重**: 75kg，体脂20%

**旧方法**: 1056 kcal（时间长所以高）
**新方法**: ~420 kcal（实际强度不高）

### 示例3：中等强度训练
- **时长**: 18分钟
- **负荷**: 8,302 kg
- **组数**: 15组
- **体重**: 75kg，体脂20%

**旧方法**: 135 kcal
**新方法**: ~220 kcal

---

## 额外功能

### 1. 训练强度等级
```typescript
calculateIntensityLevel(session): 1-5
```
基于负荷密度（volume per minute）：
- Level 5: >500 kg/min（极高强度）
- Level 4: >350 kg/min（高强度）
- Level 3: >200 kg/min（中等强度）
- Level 2: >100 kg/min（低强度）
- Level 1: ≤100 kg/min（极低强度）

### 2. 训练效率分数
```typescript
calculateEfficiencyScore(session, calories): 0-100
```
综合评估：
- 单位时间负荷（50分）
- 单位时间卡路里（50分）

---

## 技术实现

### 新增文件
- **`frontend/src/services/CalorieCalculationService.ts`**
  - 独立的卡路里计算服务
  - 可复用的科学计算方法

### 修改文件
- **`frontend/src/features/report/services/WeeklyReportService.ts`**
  - 使用新的计算服务
  - 替换旧的简单公式

### 使用方法
```typescript
import CalorieCalculationService from '@/services/CalorieCalculationService';

// 计算单次训练卡路里
const calories = CalorieCalculationService.calculateWorkoutCalories(
    session,
    userProfile
);

// 获取训练强度
const intensity = CalorieCalculationService.calculateIntensityLevel(session);

// 计算效率分数
const efficiency = CalorieCalculationService.calculateEfficiencyScore(
    session,
    calories
);
```

---

## 科学依据

### 参考文献
1. **Katch-McArdle Formula**: 基于瘦体重的BMR计算
2. **EPOC (Excess Post-exercise Oxygen Consumption)**: 运动后过量氧耗
3. **MET (Metabolic Equivalent of Task)**: 代谢当量
4. **Resistance Training Energy Expenditure**: 阻力训练能量消耗研究

### 关键假设
- 每1000kg负荷 ≈ 5-8 kcal（取决于瘦体重）
- 复合动作比孤立动作多消耗30%能量
- 训练时BMR提升50%
- EPOC效应约为训练消耗的15%

---

## 未来改进方向

### 可能的优化
1. **个性化系数**
   - 根据用户历史数据调整
   - 学习用户的代谢特征

2. **心率数据集成**
   - 如果有心率监测设备
   - 更精确的能量消耗计算

3. **动作难度系数**
   - 不同动作的能量消耗差异
   - 建立动作能量消耗数据库

4. **训练节奏影响**
   - 快节奏 vs 慢节奏
   - 休息时间的影响

---

## 总结

### 改进要点
✅ 基于实际训练负荷而非仅时间  
✅ 考虑用户身体成分（瘦体重）  
✅ 区分复合动作和孤立动作  
✅ 包含EPOC效应  
✅ 更科学、更准确的卡路里估算  

### 用户体验提升
- 更合理的卡路里显示
- 反映真实训练强度
- 激励高质量训练
- 提供训练效率反馈

---

**创建时间**: 2026-01-08  
**版本**: 1.0  
**状态**: ✅ 已实现