const fs = require('fs');
const path = require('path');

// Configuration
const LIBRARY_DIR = path.join(__dirname, '../Library');
const CONSTANTS_FILE = path.join(__dirname, '../constants.ts');
const OUTPUT_FILE = path.join(__dirname, '../data/comprehensive_exercises.ts');

// Muscle Group Mapping
const MUSCLE_MAP = {
    'chest': 'MuscleGroup.CHEST',
    'pecs': 'MuscleGroup.CHEST',
    'lats': 'MuscleGroup.BACK',
    'traps': 'MuscleGroup.BACK',
    'lower back': 'MuscleGroup.BACK',
    'back': 'MuscleGroup.BACK',
    'quads': 'MuscleGroup.LEGS',
    'hamstrings': 'MuscleGroup.LEGS',
    'calves': 'MuscleGroup.LEGS',
    'legs': 'MuscleGroup.LEGS',
    'glutes': 'MuscleGroup.GLUTES',
    'hips': 'MuscleGroup.GLUTES',
    'shoulders': 'MuscleGroup.SHOULDERS',
    'delts': 'MuscleGroup.SHOULDERS',
    'front-shoulders': 'MuscleGroup.SHOULDERS',
    'rear-shoulders': 'MuscleGroup.SHOULDERS',
    'biceps': 'MuscleGroup.ARMS',
    'triceps': 'MuscleGroup.ARMS',
    'forearms': 'MuscleGroup.ARMS',
    'arms': 'MuscleGroup.ARMS',
    'abs': 'MuscleGroup.CORE',
    'obliques': 'MuscleGroup.CORE',
    'core': 'MuscleGroup.CORE',
    'cardio': 'MuscleGroup.CARDIO',
    'full body': 'MuscleGroup.CARDIO'
};

// Equipment Mapping
const EQUIPMENT_MAP = {
    'dumbbell': 'Dumbbell',
    'barbell': 'Barbell',
    'machine': 'Machine',
    'bodyweight': 'Bodyweight',
    'cable': 'Cable',
    'band': 'Band',
    'smith machine': 'Smith Machine',
    'kettlebell': 'Kettlebell'
};

// Helper to extract IDs from constants.ts
function getExistingIds() {
    try {
        const content = fs.readFileSync(CONSTANTS_FILE, 'utf8');
        const regex = /id:\s*'([^']+)'/g;
        const ids = new Set();
        let match;
        while ((match = regex.exec(content)) !== null) {
            ids.add(match[1]);
        }
        return ids;
    } catch (err) {
        console.error("Error reading constants.ts:", err);
        return new Set();
    }
}

// Helper to map muscles
function mapMuscle(rawMuscle) {
    if (!rawMuscle) return null;
    const lower = rawMuscle.toLowerCase().trim();
    return MUSCLE_MAP[lower] || null;
}

// Helper to map secondary muscles
function deriveSecondaryMuscles(primaryMuscle, rawSecondary) {
    const secondary = new Set();

    // Add explicit secondary muscles from JSON if mapped
    if (Array.isArray(rawSecondary)) {
        rawSecondary.forEach(m => {
            const mapped = mapMuscle(m);
            if (mapped && mapped !== primaryMuscle) {
                secondary.add(mapped);
            }
        });
    }

    // Biomechanical defaults
    if (primaryMuscle === 'MuscleGroup.CHEST') {
        secondary.add('MuscleGroup.ARMS'); // Triceps
        secondary.add('MuscleGroup.SHOULDERS');
    } else if (primaryMuscle === 'MuscleGroup.BACK') {
        secondary.add('MuscleGroup.ARMS'); // Biceps
    } else if (primaryMuscle === 'MuscleGroup.LEGS') {
        secondary.add('MuscleGroup.GLUTES');
    }

    return Array.from(secondary);
}

function processFiles() {
    const existingIds = getExistingIds();
    console.log(`Found ${existingIds.size} existing exercises.`);

    const files = fs.readdirSync(LIBRARY_DIR).filter(f => f.endsWith('.json'));
    let allExercises = [];
    let skippedCount = 0;

    files.forEach(file => {
        let content = fs.readFileSync(path.join(LIBRARY_DIR, file), 'utf8');
        // Strip BOM if present
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        try {
            const json = JSON.parse(content);
            const data = json.data || [];

            data.forEach(item => {
                // 1. ID Generation
                const id = item.muscle_module_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                // 2. Skip if exists
                if (existingIds.has(id)) {
                    skippedCount++;
                    return;
                }

                // 3. Validation & Mapping
                const name = item.muscle_module_en;
                const nameZh = item.exercise_name_zh;

                // Muscle Group
                const primaryRaw = item.muscle_ids && item.muscle_ids.length > 0 ? item.muscle_ids[0] : null;
                const muscleGroup = mapMuscle(primaryRaw);

                // Equipment
                const equipment = EQUIPMENT_MAP[item.equipment_type?.toLowerCase()];

                // Video
                const videoUrl = item['video-front'] || item['video-side'];

                // Mechanic
                let mechanic = 'Compound'; // Default
                if (item.mechanic === '孤立动作' || item.mechanic === 'Isolation') mechanic = 'Isolation';
                if (item.mechanic === '复合动作' || item.mechanic === 'Compound') mechanic = 'Compound';

                // STRICT VALIDATION
                if (!id || !name || !muscleGroup || !equipment || !videoUrl) {
                    // console.log(`Skipping invalid item: ${name} (Missing: ${!id?'ID ':''}${!muscleGroup?'Muscle ':''}${!equipment?'Equip ':''}${!videoUrl?'Video':''})`);
                    return;
                }

                // Secondary Muscles
                const secondaryMuscles = deriveSecondaryMuscles(muscleGroup, item.muscle_ids);

                allExercises.push({
                    id,
                    name,
                    nameZh,
                    muscleGroup, // String literal for now, will be replaced in output
                    secondaryMuscles,
                    equipment,
                    mechanic,
                    videoUrl
                });

                // Add to existing IDs to prevent duplicates within the batch
                existingIds.add(id);
            });

        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    });

    console.log(`Processed ${allExercises.length} new exercises. Skipped ${skippedCount} duplicates.`);

    // Generate Output
    const outputContent = `import { Exercise, MuscleGroup } from '../types';

export const COMPREHENSIVE_EXERCISES: Exercise[] = [
${allExercises.map(ex => `  {
    id: '${ex.id}',
    name: "${ex.name.replace(/"/g, '\\"')}",
    nameZh: "${ex.nameZh ? ex.nameZh.replace(/"/g, '\\"') : ''}",
    muscleGroup: ${ex.muscleGroup},
    secondaryMuscles: [${ex.secondaryMuscles.join(', ')}],
    equipment: '${ex.equipment}',
    mechanic: '${ex.mechanic}',
    videoUrl: '${ex.videoUrl}'
  }`).join(',\n')}
];
`;

    // Ensure data dir exists
    const dataDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(OUTPUT_FILE, outputContent);
    console.log(`Generated ${OUTPUT_FILE}`);
}

processFiles();
