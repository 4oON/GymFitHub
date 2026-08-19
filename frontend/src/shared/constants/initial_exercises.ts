
import type { Exercise } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

// A curated list derived from the user's comprehensive database.
// Includes top exercises for each muscle group across different equipment types.
export const INITIAL_EXERCISES: Exercise[] = [
  // --- GLUTES (Requested) ---
  {
    id: 'bb-hip-thrust',
    name: 'Barbell Hip Thrust',
    nameZh: '杠铃臀桥',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS, MuscleGroup.ABS],
    equipment: 'Barbell',
    mechanic: 'Compound',
    difficulty: 'Intermediate',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-hip-thrust-front.mp4'
  },
  {
    id: 'smith-hip-thrust',
    name: 'Smith Machine Hip Thrust',
    nameZh: '史密斯机臀桥',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS],
    equipment: 'Smith',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Smithmachine-hip-thrust-side.mp4'
  },
  {
    id: 'db-hip-thrust',
    name: 'Dumbbell Hip Thrust',
    nameZh: '哑铃臀桥',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-hip-thrust-side.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'mach-glute-kickback',
    name: 'Machine Glute Kickback',
    nameZh: '器械臀部后踢',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS],
    equipment: 'Machine',
    mechanic: 'Isolation',
    difficulty: 'Beginner',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-glute-kickback-front.mp4'
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull Through',
    nameZh: '绳索胯下后拉',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.LOWER_BACK],
    equipment: 'Cable',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Cable-cable-pull-through-side.mp4'
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    nameZh: '绳索后踢',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.HAMSTRINGS],
    equipment: 'Cable',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Cable-cable-kickback-side.mp4'
  },
  {
    id: 'mach-abduction',
    name: 'Machine Hip Abduction',
    nameZh: '坐姿髋外展',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [],
    equipment: 'Machine',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-hip-abduction-front.mp4'
  },
  {
    id: 'bw-glute-bridge',
    name: 'Glute Bridge',
    nameZh: '徒手臀桥',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.ABS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-glute-bridge-front.mp4'
  },
  {
    id: 'db-romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift',
    nameZh: '哑铃罗马尼亚硬拉',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.LOWER_BACK],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-romanian-deadlift-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'bw-bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    nameZh: '保加利亚分腿蹲',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bulgarian-split-squat-front.mp4'
  },
  {
    id: 'smith-donkey-kick',
    name: 'Smith Machine Donkey Kick',
    nameZh: '史密斯机驴式后踢',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [],
    equipment: 'Smith',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Smithmachine-glute-kickback-side.mp4'
  },
  {
    id: 'landmine-sumo',
    name: 'Landmine Sumo Deadlift',
    nameZh: '地雷架相扑硬拉',
    muscleGroup: MuscleGroup.GLUTES,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS, MuscleGroup.LOWER_BACK],
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-sumo-deadlift-front.mp4'
  },

  // --- CHEST ---
  {
    id: 'db-bench-press',
    name: 'Dumbbell Bench Press',
    nameZh: '哑铃卧推',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS], // Triceps, Front Delt
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    difficulty: 'Intermediate',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-bench-press-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'bb-bench-press',
    name: 'Barbell Bench Press',
    nameZh: '杠铃卧推',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bench-press-front.mp4'
  },
  {
    id: 'mach-chest-press',
    name: 'Machine Chest Press',
    nameZh: '坐姿推胸机',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    equipment: 'Machine',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-chest-press-front.mp4'
  },
  {
    id: 'db-incline-fly',
    name: 'Dumbbell Incline Chest Fly',
    nameZh: '上斜哑铃飞鸟',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    equipment: 'Dumbbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-incline-chest-fly-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'smith-bench',
    name: 'Smith Machine Bench Press',
    nameZh: '史密斯机卧推',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    equipment: 'Smith',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Smithmachine-bench-press-front.mp4'
  },

  // --- BACK ---
  {
    id: 'lat-pulldown',
    name: 'Machine Pulldown',
    nameZh: '器械下拉',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Machine',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-pulldown-front.mp4'
  },
  {
    id: 'bb-bent-over-row',
    name: 'Barbell Bent Over Row',
    nameZh: '杠铃俯身划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.HAMSTRINGS, MuscleGroup.LOWER_BACK], // Isometrics
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-bent-over-row-front.mp4'
  },
  {
    id: 'db-single-arm-row',
    name: 'Dumbbell Single Arm Row',
    nameZh: '单臂哑铃划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.ABS, MuscleGroup.OBLIQUES],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-single-arm-row-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'seated-cable-row',
    name: 'Machine Seated Cable Row',
    nameZh: '器械坐姿划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Machine',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-seated-cable-row-front.mp4'
  },
  {
    id: 'band-row',
    name: 'Band Row',
    nameZh: '弹力带划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Band',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Band-band-row-front.mp4'
  },
  // --- LATS (New Additions) ---
  {
    id: 'bb-pendlay-row',
    name: 'Barbell Pendlay Row',
    nameZh: '杠铃潘德雷划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.LOWER_BACK, MuscleGroup.ABS],
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-pronated-pendlay-row-front.mp4'
  },
  {
    id: 'bb-t-bar-row',
    name: 'T-Bar Row',
    nameZh: 'T杠划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.LOWER_BACK, MuscleGroup.ABS],
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-landmine-t-bar-rows-front.mp4'
  },
  {
    id: 'db-pullover',
    name: 'Dumbbell Pullover',
    nameZh: '哑铃仰卧上拉',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.CHEST, MuscleGroup.TRICEPS],
    equipment: 'Dumbbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-pullover-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'db-renegade-row',
    name: 'Dumbbell Renegade Row',
    nameZh: '哑铃叛逆划船',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.OBLIQUES, MuscleGroup.BICEPS],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-renegade-row-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'mach-lat-pulldown-v-bar',
    name: 'V-Bar Lat Pulldown',
    nameZh: 'V把高位下拉',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Machine',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-plate-loaded-pulldown-front.mp4'
  },
  {
    id: 'mach-assisted-pullup',
    name: 'Assisted Pull Up',
    nameZh: '辅助引体向上',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Machine',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-assisted-pullup-front.mp4',
    weightInputMode: 'assisted_subtraction' // Actual weight = bodyweight - assistance
  },
  {
    id: 'bw-wide-pullup',
    name: 'Wide Grip Pull Up',
    nameZh: '宽握引体向上',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pullup-front.mp4'
  },
  {
    id: 'bw-scapular-pullup',
    name: 'Scapular Pull Up',
    nameZh: '肩胛引体',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Recovery-scapular-depression-front.mp4'
  },

  // --- TRAPS (New Additions) ---
  {
    id: 'bb-shrug',
    name: 'Barbell Shrug',
    nameZh: '杠铃耸肩',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    equipment: 'Barbell',
    mechanic: 'Isolation',
    difficulty: 'Beginner',
    muscle_ids: ['traps', 'traps-middle'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-barbell-shrug-front.mp4'
  },
  {
    id: 'bb-upright-row',
    name: 'Barbell Upright Row',
    nameZh: '杠铃直立划船',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.BICEPS],
    equipment: 'Barbell',
    mechanic: 'Compound',
    difficulty: 'Intermediate',
    muscle_ids: ['traps', 'shoulders', 'biceps'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-upright-row-front.mp4'
  },
  {
    id: 'db-shrug',
    name: 'Dumbbell Shrug',
    nameZh: '哑铃耸肩',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    equipment: 'Dumbbell',
    mechanic: 'Isolation',
    difficulty: 'Beginner',
    muscle_ids: ['traps', 'traps-middle'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-seated-shrug-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'db-farmers-walk',
    name: 'Farmers Walk',
    nameZh: '农夫行走',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.FOREARMS, MuscleGroup.ABS, MuscleGroup.QUADS],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    difficulty: 'Intermediate',
    muscle_ids: ['traps', 'forearms', 'core', 'legs'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-farmer-walk-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'mach-shrug',
    name: 'Machine Shrug',
    nameZh: '器械耸肩',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    equipment: 'Machine',
    mechanic: 'Isolation',
    difficulty: 'Beginner',
    muscle_ids: ['traps', 'traps-middle'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-seated-shrug-front.mp4'
  },
  {
    id: 'band-shrug',
    name: 'Band Shrug',
    nameZh: '弹力带耸肩',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.FOREARMS],
    equipment: 'Band',
    mechanic: 'Isolation',
    difficulty: 'Beginner',
    muscle_ids: ['traps', 'traps-middle'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Band-band-shrug-front.mp4'
  },
  {
    id: 'bw-pike-shrug',
    name: 'Pike Shrug',
    nameZh: '徒手倒V式耸肩',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    difficulty: 'Intermediate',
    muscle_ids: ['traps', 'shoulders'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bodyweight-pike-shrug-front.mp4'
  },
  {
    id: 'bw-elevated-pike-shrug',
    name: 'Elevated Pike Shoulder Shrug',
    nameZh: '抬脚倒V式肩耸',
    muscleGroup: MuscleGroup.TRAPS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    difficulty: 'Intermediate',
    muscle_ids: ['traps', 'shoulders'],
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-elevated-pike-shoulder-shrug-front.mp4'
  },

  // --- LEGS ---
  {
    id: 'bb-squat',
    name: 'Barbell Squat',
    nameZh: '杠铃深蹲',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.LOWER_BACK],
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-squat-front.mp4'
  },
  {
    id: 'db-goblet-squat',
    name: 'Dumbbell Goblet Squat',
    nameZh: '哑铃高脚杯深蹲',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.FOREARMS],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-goblet-squat-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'leg-press',
    name: 'Machine Leg Press',
    nameZh: '坐姿腿推机',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.GLUTES],
    equipment: 'Machine',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Smithmachine-leg-press-side.mp4'
  },
  {
    id: 'bb-deadlift',
    name: 'Barbell Deadlift',
    nameZh: '杠铃硬拉',
    muscleGroup: MuscleGroup.HAMSTRINGS, // Hamstrings/Glutes
    secondaryMuscles: [MuscleGroup.LOWER_BACK, MuscleGroup.ABS, MuscleGroup.FOREARMS],
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-deadlift-front.mp4'
  },
  {
    id: 'leg-extension',
    name: 'Machine Leg Extension',
    nameZh: '坐姿腿屈伸',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [],
    equipment: 'Machine',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-leg-extension-front.mp4'
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    nameZh: '坐姿腿弯举',
    muscleGroup: MuscleGroup.HAMSTRINGS,
    secondaryMuscles: [],
    equipment: 'Machine',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-seated-leg-curl-front.mp4'
  },
  {
    id: 'calf-raise-standing',
    name: 'Machine Standing Calf Raises',
    nameZh: '器械站姿提踵',
    muscleGroup: MuscleGroup.CALVES,
    secondaryMuscles: [],
    equipment: 'Machine',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-machine-standing-calf-raises-front.mp4'
  },

  // --- SHOULDERS ---
  {
    id: 'bb-overhead-press',
    name: 'Barbell Overhead Press',
    nameZh: '杠铃推举',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.ABS], // Triceps
    equipment: 'Barbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-overhead-press-front.mp4'
  },
  {
    id: 'db-shoulder-press',
    name: 'Dumbbell Seated Overhead Press',
    nameZh: '坐姿哑铃推举',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.TRICEPS],
    equipment: 'Dumbbell',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-seated-overhead-press-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'db-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    nameZh: '哑铃侧平举',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-lateral-raise-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'band-face-pull',
    name: 'Band Face Pull',
    nameZh: '弹力带面拉',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.TRAPS, MuscleGroup.LOWER_BACK],
    equipment: 'Band',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Band-band-face-pull-front.mp4'
  },
  {
    id: 'smith-upright-row',
    name: 'Smith Machine Upright Row',
    nameZh: '史密斯机直立划船',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.TRAPS, MuscleGroup.BICEPS],
    equipment: 'Smith',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Smithmachine-upright-row-front.mp4'
  },

  // --- ARMS ---
  {
    id: 'bb-curl',
    name: 'Barbell Curl',
    nameZh: '杠铃弯举',
    muscleGroup: MuscleGroup.BICEPS,
    secondaryMuscles: [],
    equipment: 'Barbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-curl-front.mp4'
  },
  {
    id: 'db-hammer-curl',
    name: 'Dumbbell Hammer Curl',
    nameZh: '哑铃锤式弯举',
    muscleGroup: MuscleGroup.BICEPS,
    secondaryMuscles: [MuscleGroup.FOREARMS], // Forearms
    equipment: 'Dumbbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Dumbbells-dumbbell-hammer-curl-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },
  {
    id: 'tricep-pushdown',
    name: 'Machine Tricep Pushdown',
    nameZh: '器械三头肌下压',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [],
    equipment: 'Machine',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Machine-machine-tricep-pushdown-front.mp4'
  },
  {
    id: 'skullcrusher',
    name: 'Barbell Skullcrusher',
    nameZh: '杠铃仰卧臂屈伸',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [],
    equipment: 'Barbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Barbell-barbell-skullcrusher-front.mp4'
  },
  {
    id: 'db-kickback',
    name: 'Dumbbell Tricep Kickback',
    nameZh: '哑铃三头肌后伸',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [],
    equipment: 'Dumbbell',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-dumbbell-tricep-kickback-front.mp4',
    weightInputMode: 'dumbbell_per_side'
  },

  // --- TOP 50 BODYWEIGHT EXERCISES ---
  // PUSH
  {
    id: 'bw-push-up',
    name: 'Push Up',
    nameZh: '标准俯卧撑',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS, MuscleGroup.ABS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-push-up-front.mp4'
  },
  {
    id: 'bw-diamond-push-up',
    name: 'Diamond Push Ups',
    nameZh: '钻石俯卧撑',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [MuscleGroup.CHEST, MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-diamond-push-ups-front.mp4'
  },
  {
    id: 'bw-pike-push-up',
    name: 'Pike Push Up',
    nameZh: '折刀俯卧撑',
    muscleGroup: MuscleGroup.SHOULDERS,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.CHEST],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bodyweight-pike-press-front.mp4'
  },
  {
    id: 'bw-decline-push-up',
    name: 'Decline Push Up',
    nameZh: '下斜俯卧撑',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-decline-push-up-front.mp4'
  },
  {
    id: 'bw-incline-push-up',
    name: 'Incline Push Up',
    nameZh: '上斜俯卧撑',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bodyweight-elevated-push-up-front.mp4'
  },
  {
    id: 'bw-dips-bench',
    name: 'Bench Dips',
    nameZh: '椅上臂屈伸',
    muscleGroup: MuscleGroup.TRICEPS,
    secondaryMuscles: [MuscleGroup.CHEST, MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bench-dips-front.mp4'
  },

  // PULL
  {
    id: 'bw-pull-ups',
    name: 'Pull Ups',
    nameZh: '正手引体向上',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.ABS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-pullup-front.mp4'
  },
  {
    id: 'bw-chin-ups',
    name: 'Chin Ups',
    nameZh: '反手引体向上',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-chinup-front.mp4'
  },
  {
    id: 'bw-inverted-row',
    name: 'Inverted Row',
    nameZh: '澳洲引体向上',
    muscleGroup: MuscleGroup.LATS,
    secondaryMuscles: [MuscleGroup.BICEPS, MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-reverse-row-front.mp4'
  },
  {
    id: 'bw-superman',
    name: 'Supermans',
    nameZh: '超人式',
    muscleGroup: MuscleGroup.LOWER_BACK,
    secondaryMuscles: [MuscleGroup.GLUTES],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-supermans-front.mp4'
  },
  {
    id: 'bw-dead-hang',
    name: 'Dead Hang',
    nameZh: '悬垂',
    muscleGroup: MuscleGroup.LATS, // Or Forearms/Grip
    secondaryMuscles: [MuscleGroup.FOREARMS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-dead-hang-front.mp4',
    trackingMode: 'duration', // Time-based exercise (seconds)
    weightInputMode: 'standard' // Bodyweight is used automatically
  },

  // LEGS
  {
    id: 'bw-squat',
    name: 'Bodyweight Squat',
    nameZh: '徒手深蹲',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.ABS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bodyweight-squat-front.mp4'
  },
  {
    id: 'bw-jump-squat',
    name: 'Jump Squats',
    nameZh: '深蹲跳',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.CARDIO],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-jump-squats-front.mp4'
  },
  {
    id: 'bw-forward-lunge',
    name: 'Forward Lunge',
    nameZh: '前弓步',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.GLUTES],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-forward-lunges-front.mp4'
  },
  {
    id: 'bw-reverse-lunge',
    name: 'Reverse Lunge',
    nameZh: '后弓步',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.GLUTES],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bodyweight-reverse-lunge-front.mp4'
  },
  {
    id: 'bw-wall-sit',
    name: 'Wall Sit',
    nameZh: '靠墙静蹲',
    muscleGroup: MuscleGroup.QUADS,
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-wall-sit-front.mp4'
  },

  // CORE
  {
    id: 'bw-plank',
    name: 'Forearm Plank',
    nameZh: '平板支撑',
    muscleGroup: MuscleGroup.ABS,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-forearm-plank-front.mp4'
  },
  {
    id: 'bw-side-plank',
    name: 'Side Plank',
    nameZh: '侧平板支撑',
    muscleGroup: MuscleGroup.OBLIQUES,
    secondaryMuscles: [MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-elbow-side-plank-front.mp4'
  },
  {
    id: 'bw-crunch',
    name: 'Crunch',
    nameZh: '卷腹',
    muscleGroup: MuscleGroup.ABS,
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-crunch-front.mp4'
  },
  {
    id: 'bw-leg-raise',
    name: 'Laying Leg Raise',
    nameZh: '仰卧抬腿',
    muscleGroup: MuscleGroup.ABS,
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-laying-leg-raises-front.mp4'
  },
  {
    id: 'bw-bicycle-crunch',
    name: 'Bicycle Crunch',
    nameZh: '自行车卷腹',
    muscleGroup: MuscleGroup.ABS,
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bicycle-crunch-front.mp4'
  },
  {
    id: 'bw-russian-twist',
    name: 'Russian Twist',
    nameZh: '俄罗斯转体',
    muscleGroup: MuscleGroup.OBLIQUES,
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-russian-twist-front.mp4'
  },
  {
    id: 'bw-dead-bug',
    name: 'Dead Bug',
    nameZh: '死虫式',
    muscleGroup: MuscleGroup.ABS,
    secondaryMuscles: [],
    equipment: 'Bodyweight',
    mechanic: 'Isolation',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-dead-bug-front.mp4'
  },

  // CARDIO (Expanded)
  {
    id: 'bw-burpee',
    name: 'Burpee',
    nameZh: '波比跳',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS, MuscleGroup.CHEST, MuscleGroup.TRICEPS, MuscleGroup.ABS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-burpee-front.mp4'
  },
  {
    id: 'bw-mountain-climber',
    name: 'Mountain Climber',
    nameZh: '登山者',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [MuscleGroup.ABS, MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-bodyweight-mountain-climber-front.mp4'
  },
  {
    id: 'bw-jumping-jacks',
    name: 'Jumping Jacks',
    nameZh: '开合跳',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [MuscleGroup.CALVES, MuscleGroup.SHOULDERS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-jump-squats-front.mp4' // Fallback to jump squats as video not provided
  },
  {
    id: 'bw-high-knees',
    name: 'High Knees',
    nameZh: '高抬腿',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.ABS],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-jumping-mountain-climber-front.mp4' // Fallback
  },
  {
    id: 'bw-skaters',
    name: 'Skaters',
    nameZh: '滑冰跳',
    muscleGroup: MuscleGroup.CARDIO,
    secondaryMuscles: [MuscleGroup.QUADS, MuscleGroup.GLUTES],
    equipment: 'Bodyweight',
    mechanic: 'Compound',
    videoUrl: 'https://media.musclewiki.com/media/uploads/videos/branded/male-Bodyweight-bodyweight-alternating-lateral-lunge-front.mp4' // Fallback to lateral lunge
  }
];

export const MOCK_HISTORY: any[] = [
  { date: '2023-10-01', volume: 4500 },
  { date: '2023-10-03', volume: 4800 },
  { date: '2023-10-05', volume: 4600 },
  { date: '2023-10-08', volume: 5200 },
  { date: '2023-10-10', volume: 5100 },
  { date: '2023-10-12', volume: 5500 },
  { date: '2023-10-15', volume: 5900 },
];
