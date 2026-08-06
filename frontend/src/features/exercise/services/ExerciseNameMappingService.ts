/**
 * Exercise Name Mapping Service
 * 
 * This service provides comprehensive mapping between English and Chinese exercise names
 * by reading from all Library JSON files (8 equipment categories).
 * 
 * Data Structure from Library JSON files:
 * - exercise_name_zh: Chinese exercise name
 * - exercise_name: English exercise name (in some files)
 * - muscle_module_en: English muscle module identifier
 * - equipment_type_zh: Chinese equipment type
 */

interface LibraryExercise {
    exercise_name_zh: string;
    exercise_name?: string;
    muscle_module_en?: string;  // Made optional since cables file doesn't have it
    equipment_type_zh: string;
    muscle_ids: string[];
    muscle_ids_zh: string[];
    difficulty: string;
    mechanic: string;
    equipment_type: string;
}

interface LibraryData {
    total_exercise_count: number;
    data?: LibraryExercise[];
    exercises?: LibraryExercise[];
}

class ExerciseNameMappingService {
    private exerciseMap: Map<string, string> = new Map();
    private reverseMap: Map<string, string> = new Map();
    private isInitialized = false;

    /**
     * Initialize the mapping service by loading all Library JSON files
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        const libraryFiles = [
            'barbell-final-video.json',
            'dumbbell-final-video.json',
            'bodyweigh-final-video.json',
            'cables-final-video.json',
            'machine-final-video.json',
            'band-final-video.json',
            'smith-final-video.json',
            'recovery-final-video.json'
        ];

        try {
            for (const filename of libraryFiles) {
                await this.loadLibraryFile(filename);
            }

            console.log(`✅ Exercise mapping initialized with ${this.exerciseMap.size} exercises from ${libraryFiles.length} equipment categories`);
            this.isInitialized = true;
        } catch (error) {
            console.error('❌ Failed to initialize exercise mapping:', error);
            throw error;
        }
    }

    /**
     * Load a single Library JSON file and extract exercise mappings
     */
    private async loadLibraryFile(filename: string): Promise<void> {
        try {
            const response = await fetch(`/Library/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filename}: ${response.status}`);
            }

            const data: LibraryData = await response.json();
            const exercises = data.data || data.exercises || [];

            let mappedCount = 0;
            for (const exercise of exercises) {
                if (exercise.exercise_name_zh) {
                    // Use muscle_module_en as primary key, exercise_name as fallback
                    const primaryKey = exercise.muscle_module_en || exercise.exercise_name;

                    if (primaryKey) {
                        // Map English identifier to Chinese name
                        this.exerciseMap.set(primaryKey, exercise.exercise_name_zh);

                        // Create reverse mapping (Chinese to English)
                        this.reverseMap.set(exercise.exercise_name_zh, primaryKey);

                        // Also map exercise_name if available and different from primary key
                        if (exercise.exercise_name && exercise.exercise_name !== primaryKey) {
                            this.exerciseMap.set(exercise.exercise_name, exercise.exercise_name_zh);
                            this.reverseMap.set(exercise.exercise_name_zh, exercise.exercise_name);
                        }

                        mappedCount++;
                    }
                }
            }

            console.log(`📚 Loaded ${mappedCount} exercise mappings from ${filename}`);
        } catch (error) {
            console.error(`❌ Error loading ${filename}:`, error);
            // Continue loading other files even if one fails
        }
    }

    /**
     * Get Chinese name for an English exercise identifier
     */
    getChineseName(englishName: string): string {
        if (!this.isInitialized) {
            console.warn('⚠️ Exercise mapping not initialized, returning original name');
            return englishName;
        }

        const chineseName = this.exerciseMap.get(englishName);
        if (chineseName) {
            return chineseName;
        }

        // Try fuzzy matching for common variations
        const fuzzyMatch = this.findFuzzyMatch(englishName);
        if (fuzzyMatch) {
            return fuzzyMatch;
        }

        console.log(`🔍 No Chinese mapping found for: "${englishName}"`);
        return englishName; // Return original if no mapping found
    }

    /**
     * Get English name for a Chinese exercise name
     */
    getEnglishName(chineseName: string): string {
        if (!this.isInitialized) {
            console.warn('⚠️ Exercise mapping not initialized, returning original name');
            return chineseName;
        }

        const englishName = this.reverseMap.get(chineseName);
        return englishName || chineseName;
    }

    /**
     * Fuzzy matching for exercise names with common variations
     */
    private findFuzzyMatch(englishName: string): string | null {
        const normalizedInput = englishName.toLowerCase().trim();

        // Try exact match first (case insensitive)
        for (const [key, value] of this.exerciseMap.entries()) {
            if (key.toLowerCase() === normalizedInput) {
                return value;
            }
        }

        // Try partial matching for compound exercise names
        for (const [key, value] of this.exerciseMap.entries()) {
            const normalizedKey = key.toLowerCase();

            // Check if the input contains the key or vice versa
            if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
                return value;
            }
        }

        return null;
    }

    /**
     * Get all available exercise mappings
     */
    getAllMappings(): Array<{ english: string; chinese: string }> {
        const mappings: Array<{ english: string; chinese: string }> = [];

        for (const [english, chinese] of this.exerciseMap.entries()) {
            mappings.push({ english, chinese });
        }

        return mappings.sort((a, b) => a.english.localeCompare(b.english));
    }

    /**
     * Get mapping statistics
     */
    getStats(): { totalMappings: number; isInitialized: boolean } {
        return {
            totalMappings: this.exerciseMap.size,
            isInitialized: this.isInitialized
        };
    }

    /**
     * Search for exercises by partial name (both English and Chinese)
     */
    searchExercises(query: string): Array<{ english: string; chinese: string }> {
        const normalizedQuery = query.toLowerCase().trim();
        const results: Array<{ english: string; chinese: string }> = [];

        for (const [english, chinese] of this.exerciseMap.entries()) {
            if (
                english.toLowerCase().includes(normalizedQuery) ||
                chinese.includes(query) // Chinese characters are case-sensitive
            ) {
                results.push({ english, chinese });
            }
        }

        return results.slice(0, 20); // Limit results to prevent UI overflow
    }
}

// Create singleton instance
export const exerciseNameMapping = new ExerciseNameMappingService();

// Auto-initialize when the module is imported
exerciseNameMapping.initialize().catch(error => {
    console.error('❌ Failed to auto-initialize exercise mapping:', error);
});

export default exerciseNameMapping;