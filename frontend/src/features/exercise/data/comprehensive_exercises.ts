import type { Exercise } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { normalizeEquipment } from '@/features/exercise/utils/equipmentUtils';

// Mapping from muscle_module to MuscleGroup enum
const MUSCLE_GROUP_MAP: Record<string, MuscleGroup> = {
  // Back muscles
  '背阔肌': MuscleGroup.LATS,
  '斜方肌（中背）': MuscleGroup.TRAPS,
  '斜方肌': MuscleGroup.TRAPS,
  '斜方肌下部': MuscleGroup.TRAPS,
  '上斜方肌': MuscleGroup.TRAPS,
  '下背部': MuscleGroup.LOWER_BACK,
  // Chest
  '胸部': MuscleGroup.CHEST,
  '胸大肌': MuscleGroup.CHEST,
  // Arms
  '二头肌': MuscleGroup.BICEPS,
  '三头肌': MuscleGroup.TRICEPS,
  '前臂': MuscleGroup.FOREARMS,
  // Legs
  '股四头肌': MuscleGroup.QUADS,
  '腘绳肌': MuscleGroup.HAMSTRINGS,
  '小腿': MuscleGroup.CALVES,
  // Shoulders
  '肩部': MuscleGroup.SHOULDERS,
  '前束三角肌': MuscleGroup.SHOULDERS,
  '中束三角肌': MuscleGroup.SHOULDERS,
  '后束三角肌': MuscleGroup.SHOULDERS,
  // Core
  '核心': MuscleGroup.ABS, // Defaulting generic Core to Abs for now, or could use Obliques based on context
  '腹肌': MuscleGroup.ABS,
  '腹外斜肌': MuscleGroup.OBLIQUES,
  // Glutes
  '臀部': MuscleGroup.GLUTES,
  '臀大肌': MuscleGroup.GLUTES,
  // Cardio
  '有氧': MuscleGroup.CARDIO,

  // Cables specific mappings (English, capitalized format)
  'Abdominals': MuscleGroup.ABS,
  'Anterior Deltoid': MuscleGroup.SHOULDERS,
  'Posterior Deltoid': MuscleGroup.SHOULDERS,
  'Front Shoulders': MuscleGroup.SHOULDERS,
  'Rear Shoulders': MuscleGroup.SHOULDERS,
  'Biceps': MuscleGroup.BICEPS,
  'Triceps': MuscleGroup.TRICEPS,
  'Forearms': MuscleGroup.FOREARMS,
  'Chest': MuscleGroup.CHEST,
  'Lats': MuscleGroup.LATS,
  'Traps': MuscleGroup.TRAPS,
  'Traps Middle': MuscleGroup.TRAPS,
  'Lowerback': MuscleGroup.LOWER_BACK,
  'Obliques': MuscleGroup.OBLIQUES,
  'Quads': MuscleGroup.QUADS,
  'Hamstrings': MuscleGroup.HAMSTRINGS,
  'Calves': MuscleGroup.CALVES,
  'Glutes': MuscleGroup.GLUTES,
  'Shoulders': MuscleGroup.SHOULDERS,
};

// Mapping from muscle_ids to standardized format (lowercase with underscores)
const MUSCLE_ID_NORMALIZATION: Record<string, string> = {
  // 中文到英文小写
  '臀大肌': 'glutes',
  '臀部': 'glutes',
  '股四头肌': 'quads',
  '腘绳肌': 'hamstrings',
  '小腿': 'calves',
  '胸部': 'chest',
  '胸大肌': 'chest',
  '背阔肌': 'lats',
  '斜方肌': 'traps',
  '斜方肌（中背）': 'traps',
  '上斜方肌': 'traps',
  '斜方肌下部': 'traps',
  '下背部': 'lower_back',
  '二头肌': 'biceps',
  '三头肌': 'triceps',
  '前臂': 'forearms',
  '肩部': 'shoulders',
  '前束三角肌': 'shoulders',
  '中束三角肌': 'shoulders',
  '后束三角肌': 'shoulders',
  '腹肌': 'abs',
  '核心': 'abs',
  '腹外斜肌': 'obliques',
  '有氧': 'cardio',

  // 英文大写到小写
  'Glutes': 'glutes',
  'Quads': 'quads',
  'Hamstrings': 'hamstrings',
  'Calves': 'calves',
  'Chest': 'chest',
  'Lats': 'lats',
  'Traps': 'traps',
  'Traps Middle': 'traps',
  'Lowerback': 'lower_back',
  'Biceps': 'biceps',
  'Triceps': 'triceps',
  'Forearms': 'forearms',
  'Shoulders': 'shoulders',
  'Front Shoulders': 'shoulders',
  'Rear Shoulders': 'shoulders',
  'Anterior Deltoid': 'shoulders',
  'Posterior Deltoid': 'shoulders',
  'Abdominals': 'abs',
  'Obliques': 'obliques',
};

// Normalize muscle_ids to standardized format
function normalizeMuscleIds(muscleIds: string[]): string[] {
  return muscleIds
    .map(id => {
      // Try direct mapping first
      if (MUSCLE_ID_NORMALIZATION[id]) {
        return MUSCLE_ID_NORMALIZATION[id];
      }
      // Fallback: convert to lowercase with underscores
      return id.toLowerCase().replace(/\s+/g, '_');
    })
    .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
}

// Mapping from mechanic to English
const MECHANIC_MAP: Record<string, 'Compound' | 'Isolation' | 'N/A'> = {
  '复合动作': 'Compound',
  '孤立动作': 'Isolation',
  'Compound': 'Compound',
  'Isolation': 'Isolation',
};

// Mapping from difficulty to English
const DIFFICULTY_MAP: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  '初学者': 'Beginner',
  '新手': 'Beginner',
  '中级': 'Intermediate',
  '高级': 'Advanced',
  'Beginner': 'Beginner',
  'Intermediate': 'Intermediate',
  'Advanced': 'Advanced',
  // Add any other potential variations found in JSONs
  '入门': 'Beginner',
  '进阶': 'Intermediate',
  '资深': 'Advanced'
};

interface JSONExercise {
  'exercise_name_zh': string;
  'muscle_module_en': string;
  'muscle_module_zh': string;
  'muscle_ids': string[];
  'muscle_ids_zh': string[];
  'mechanic': string;
  'difficulty': string;
  'equipment_type': string;
  'equipment_type_zh': string;
  'video-front': string;
  'video-side'?: string;
  'img'?: string;
}

// Cables JSON has a different structure
interface CablesJSONExercise {
  'exercise_name': string;
  'exercise_name_zh': string;
  'muscle_ids': string[];
  'secondary_muscles': string[];
  'mechanic': string;
  'difficulty': string;
  'equipment_type': string;
  'equipment_type_zh': string;
  'url-video-front': string;
  'url-video-side'?: string;
}

function convertJSONToExercise(jsonEx: JSONExercise, index: number, equipmentType: string): Exercise {
  const muscleGroup = MUSCLE_GROUP_MAP[jsonEx.muscle_module_zh] || MuscleGroup.ABS;
  const mechanic = MECHANIC_MAP[jsonEx.mechanic] || 'N/A';
  const difficulty = DIFFICULTY_MAP[jsonEx.difficulty];

  return {
    id: `${equipmentType.toLowerCase()}-${index}-${jsonEx.muscle_module_en.toLowerCase().replace(/\s+/g, '-')}`,
    name: jsonEx.muscle_module_en,
    nameZh: jsonEx.exercise_name_zh,
    muscleGroup: muscleGroup,
    muscle_ids: normalizeMuscleIds(jsonEx.muscle_ids), // Normalize muscle IDs to standardized format
    equipment: normalizeEquipment(jsonEx.equipment_type || equipmentType),
    mechanic: mechanic,
    difficulty: difficulty,
    videoUrl: jsonEx['video-front'],
    gifUrl: jsonEx.img,
    isPrimaryMuscle: true, // This exercise's muscleGroup is the primary target
  };
}

// Special conversion function for Cables JSON (different structure)
function convertCablesJSONToExercise(jsonEx: CablesJSONExercise, index: number): Exercise {
  // Cables uses the first muscle_id as the primary muscle group
  const primaryMuscleId = jsonEx.muscle_ids[0] || 'Chest';
  const muscleGroup = MUSCLE_GROUP_MAP[primaryMuscleId] || MuscleGroup.ABS;
  const mechanic = MECHANIC_MAP[jsonEx.mechanic] || 'N/A';
  const difficulty = DIFFICULTY_MAP[jsonEx.difficulty];

  return {
    id: `cables-${index}-${jsonEx.exercise_name.toLowerCase().replace(/\s+/g, '-')}`,
    name: jsonEx.exercise_name,
    nameZh: jsonEx.exercise_name_zh,
    muscleGroup: muscleGroup,
    muscle_ids: normalizeMuscleIds(jsonEx.muscle_ids), // Normalize muscle IDs to standardized format
    equipment: normalizeEquipment('Cable'),
    mechanic: mechanic,
    difficulty: difficulty,
    videoUrl: jsonEx['url-video-front'],
    isPrimaryMuscle: true, // This exercise's muscleGroup is the primary target
  };
}

// Load all exercises from JSON files using fetch
async function loadAllExercisesAsync(): Promise<Exercise[]> {
  const allExercises: Exercise[] = [];

  console.log('🔄 Loading exercises from JSON files...');

  try {
    // Load Barbell exercises
    const barbellResponse = await fetch('/Library/barbell-final-video.json');
    const barbellData = await barbellResponse.json();
    if (barbellData && barbellData.data) {
      barbellData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Barbell'));
      });
      console.log(`✅ Loaded ${barbellData.data.length} Barbell exercises`);
    }

    // Load Dumbbell exercises
    const dumbbellResponse = await fetch('/Library/dumbbell-final-video.json');
    const dumbbellData = await dumbbellResponse.json();
    if (dumbbellData && dumbbellData.data) {
      dumbbellData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Dumbbell'));
      });
      console.log(`✅ Loaded ${dumbbellData.data.length} Dumbbell exercises`);
    }

    // Load Machine exercises
    const machineResponse = await fetch('/Library/machine-final-video.json');
    const machineData = await machineResponse.json();
    if (machineData && machineData.data) {
      machineData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Machine'));
      });
      console.log(`✅ Loaded ${machineData.data.length} Machine exercises`);
    }

    // Load Band exercises
    const bandResponse = await fetch('/Library/band-final-video.json');
    const bandData = await bandResponse.json();
    if (bandData && bandData.data) {
      bandData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Band'));
      });
      console.log(`✅ Loaded ${bandData.data.length} Band exercises`);
    }

    // Load Bodyweight exercises
    const bodyweightResponse = await fetch('/Library/bodyweigh-final-video.json');
    const bodyweightData = await bodyweightResponse.json();
    if (bodyweightData && bodyweightData.data) {
      bodyweightData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Bodyweight'));
      });
      console.log(`✅ Loaded ${bodyweightData.data.length} Bodyweight exercises`);
    }

    // Load Recovery exercises
    const recoveryResponse = await fetch('/Library/recovery-final-video.json');
    const recoveryData = await recoveryResponse.json();
    if (recoveryData && recoveryData.data) {
      recoveryData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Recovery'));
      });
      console.log(`✅ Loaded ${recoveryData.data.length} Recovery exercises`);
    }

    // Load Smith exercises
    const smithResponse = await fetch('/Library/smith-final-video.json');
    const smithData = await smithResponse.json();
    if (smithData && smithData.data) {
      smithData.data.forEach((ex: any, idx: number) => {
        allExercises.push(convertJSONToExercise(ex, idx, 'Smith'));
      });
      console.log(`✅ Loaded ${smithData.data.length} Smith exercises`);
    }

    // Load Cables exercises (different JSON structure)
    const cablesResponse = await fetch('/Library/cables-final-video.json');
    const cablesData = await cablesResponse.json();
    if (cablesData && cablesData.exercises) {
      cablesData.exercises.forEach((ex: any, idx: number) => {
        allExercises.push(convertCablesJSONToExercise(ex, idx));
      });
      console.log(`✅ Loaded ${cablesData.exercises.length} Cables exercises`);
    }

    console.log(`🎉 Total exercises loaded: ${allExercises.length}`);

    // Debug: Show a sample exercise with muscle_ids
    if (allExercises.length > 0) {
      const sample = allExercises.find(ex => ex.muscle_ids && ex.muscle_ids.length > 0);
      if (sample) {
        console.log('📋 Sample exercise with muscle_ids:', {
          name: sample.name,
          muscle_ids: sample.muscle_ids,
          difficulty: sample.difficulty,
          mechanic: sample.mechanic
        });
      }
    }
  } catch (error) {
    console.error('❌ Error loading exercises:', error);
  }

  return allExercises;
}

// Export a promise that resolves to the exercises
export const COMPREHENSIVE_EXERCISES_PROMISE = loadAllExercisesAsync();

// For backward compatibility, export an empty array that will be populated
export let COMPREHENSIVE_EXERCISES: Exercise[] = [];

// Initialize the exercises
COMPREHENSIVE_EXERCISES_PROMISE.then(exercises => {
  COMPREHENSIVE_EXERCISES = exercises;
  console.log('✅ COMPREHENSIVE_EXERCISES initialized with', exercises.length, 'exercises');
});
