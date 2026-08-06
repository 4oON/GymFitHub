# ZenFit Pro - Exercise Data Import Rules

This document defines the rules for converting raw exercise JSON data into the `Exercise` TypeScript interface used in `constants.ts`.

## 1. Target File & Interface
**Target File:** `constants.ts` -> `INITIAL_EXERCISES` array.
**Interface:**
```typescript
export interface Exercise {
  id: string;             // Unique ID (kebab-case)
  name: string;           // English Name
  nameZh?: string;        // Chinese Name
  muscleGroup: MuscleGroup; // Primary Muscle Category
  secondaryMuscles?: MuscleGroup[]; // Muscles used synergistically
  equipment?: string;     // Standardized Equipment Name
  mechanic?: MechanicType; // 'Compound' or 'Isolation'
  videoUrl?: string;      // MP4 URL
}
```

---

## 2. Mapping Rules

### A. ID Generation (`id`)
*   **Rule:** Convert the English name to lowercase kebab-case.
*   **Example:** "Dumbbell Bench Press" -> `'db-bench-press'`
*   **Prefixes (Optional but recommended):**
    *   Dumbbell -> `db-`
    *   Barbell -> `bb-`
    *   Bodyweight -> `bw-`
    *   Machine -> `mach-`
    *   Cable -> `cable-`

### B. Name Mapping (`name` & `nameZh`)
*   `name`: Use the English name (`muscle_module_en` or derived from URL). Capitalize Words.
*   `nameZh`: Use the Chinese name (`exercise_name_zh`).

### C. Muscle Group Mapping (`muscleGroup`)
Map specific muscles from JSON to the App's broad `MuscleGroup` Enum.

| Raw JSON Muscle (Approx) | App MuscleGroup Enum |
| :--- | :--- |
| Chest, Pecs | `MuscleGroup.CHEST` |
| Lats, Traps, Lower Back, Back | `MuscleGroup.BACK` |
| Quads, Hamstrings, Calves, Legs | `MuscleGroup.LEGS` |
| Glutes, Hips | `MuscleGroup.GLUTES` |
| Shoulders, Delts | `MuscleGroup.SHOULDERS` |
| Biceps, Triceps, Forearms | `MuscleGroup.ARMS` |
| Abs, Obliques, Core | `MuscleGroup.CORE` |
| Cardio, Full Body | `MuscleGroup.CARDIO` |

### D. Secondary Muscles (`secondaryMuscles`)
*   **Critical for Recovery Algorithm:** Identify muscles that assist the movement but are not the primary mover.
*   **Logic:**
    *   **Push Movements (Chest/Shoulders):** Usually involve `MuscleGroup.TRICEPS` or `MuscleGroup.SHOULDERS`.
    *   **Pull Movements (Back):** Usually involve `MuscleGroup.BICEPS` or `MuscleGroup.FOREARMS`.
    *   **Leg Compounds (Squats/Lunges):** Usually involve `MuscleGroup.GLUTES` and `MuscleGroup.CORE`.
    *   **Core:** Often involves `MuscleGroup.HIP_FLEXORS` (map to Legs) or nothing.

### E. Equipment Standardization (`equipment`)
The app filter uses specific strings. Map raw data to these exact strings:
1.  `'Dumbbell'`
2.  `'Barbell'`
3.  `'Machine'`
4.  `'Bodyweight'`
5.  `'Cable'`
6.  `'Band'`
7.  `'Smith Machine'`
8.  `'Kettlebell'`

### F. Mechanic Mapping (`mechanic`)
*   **JSON:** "复合动作" -> **App:** `'Compound'`
*   **JSON:** "孤立动作" -> **App:** `'Isolation'`
*   *Note:* If unknown, default to 'Compound' for multi-joint movements, 'Isolation' for single-joint.

### G. Video URL (`videoUrl`)
*   Prefer `video-front` from source JSON.
*   If unavailable, use `video-side`.

---

## 3. Example Transformation

**Input (Raw JSON):**
```json
{
    "exercise_name_zh": "哑铃卧推",
    "muscle_module_en": "Dumbbell Bench Press",
    "muscle_ids": ["chest", "triceps"],
    "mechanic": "复合动作",
    "equipment_type": "dumbbell",
    "video-front": "https://example.com/video.mp4"
}
```

**Output (constants.ts):**
```typescript
{
  id: 'db-bench-press',
  name: 'Dumbbell Bench Press',
  nameZh: '哑铃卧推',
  muscleGroup: MuscleGroup.CHEST, // Primary
  secondaryMuscles: [MuscleGroup.ARMS, MuscleGroup.SHOULDERS], // Derived logic: Bench press uses Arms (Triceps) & Shoulders
  equipment: 'Dumbbell',
  mechanic: 'Compound',
  videoUrl: 'https://example.com/video.mp4'
},
```

---

## 4. Batch Processing Prompt (For AI)
*Copy and paste this into an AI to process your files:*

> "Please convert the following JSON exercise list into a TypeScript array for my React app.
> Use the 'Exercise' interface.
> Map 'mechanic' (复合=Compound, 孤立=Isolation).
> Map muscles to these Enums: CHEST, BACK, LEGS, GLUTES, SHOULDERS, ARMS, CORE, CARDIO.
> Ensure 'secondaryMuscles' are populated based on biomechanics (e.g., Chest exercises involve Arms/Shoulders).
> Standardize equipment to: Dumbbell, Barbell, Machine, Bodyweight, Band, Cable, Smith Machine.
> Here is the JSON data: [PASTE DATA HERE]"
