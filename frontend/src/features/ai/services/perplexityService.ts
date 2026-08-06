import type { Exercise, RecoveryStatus, AiRecommendation } from '@/shared/types';
import { aiConfigStorage } from './AIConfigStorageService';
import { aiConfigBackendService } from './AIConfigBackendService';
import { AIProvider } from '@/shared/types';
import { apiClient } from '@/services/apiClient';

// Helper to make API requests - iOS 兼容版本
const apiRequest = async <T>(endpoint: string, method: string, body?: any): Promise<T> => {
    const url = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + endpoint;
    const token = apiClient.getToken();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // iOS 兼容：添加超时和正确的 fetch 选项
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000); // 65秒超时
    
    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
            // iOS WebView 兼容选项
            mode: 'cors',
            credentials: 'include', // 跨域请求需要传递 token
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        return response.json();
    } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout - please check your network connection');
        }
        
        // iOS 特定错误处理
        if (fetchError.message?.includes('Network request failed')) {
            throw new Error('Network error - please check your connection and try again');
        }
        
        throw fetchError;
    }
};

/**
 * Check if a model requires temperature to be exactly 1
 */
const requiresFixedTemperature = (model: string): boolean => {
    const fixedTempModels = [
        'kimi-k3',
        'kimi-k2.7',
        'kimi-k2.7-code',
        'kimi-k2.6',
        'kimi-k2.5',
        'kimi-k2-0711-preview',
        'kimi-k2-turbo-preview',
        'kimi-k2-thinking',
        'moonshot-v1',
    ];
    return fixedTempModels.some(m => model.toLowerCase().includes(m.toLowerCase()));
};

/**
 * Call AI generation through backend proxy
 * Frontend -> Backend -> AI API (avoids CORS issues)
 */
const callAIGenerate = async (
    messages: Array<{role: string; content: string}>,
    temperature: number = 0.7
): Promise<string> => {
    console.log('[AI Service] Calling backend proxy...');
    
    const data = await apiRequest<{ success: boolean; content: string; error?: string }>('/api/ai/generate', 'POST', {
        messages,
        temperature
    });
    
    if (!data.success) {
        throw new Error(data.error || 'AI generation failed');
    }
    
    return data.content;
};

export const getAiWorkoutRecommendation = async (
    recoveryState: RecoveryStatus[],
    availableExercises: Exercise[],
    targetMuscles: string[],
    userWeight: number,
    equipment: string[] = [],
    exerciseCount: number = 4
): Promise<{ exercise: Exercise; recommendation: AiRecommendation }[]> => {

    console.log('[AI Service] Getting workout recommendation via backend proxy');

    // 1. Prepare Context
    const muscleContext = targetMuscles.length > 0
        ? `Target Muscles: ${targetMuscles.join(', ')}`
        : `Recovered Muscles: ${recoveryState.filter(r => (Date.now() - r.lastWorked) > (r.recoveryDurationHours || 72) * 3600000 * 0.8).map(r => r.muscle).join(', ')}`;

    const equipmentContext = equipment.length > 0
        ? `Available Equipment: ${equipment.join(', ')}`
        : `Available Equipment: Any (Recommend most popular/effective equipment)`;

    const exerciseList = availableExercises.map(e => `"${e.name}" (${e.mechanic}, ${e.muscleGroup})`).join(', ');

    const systemPrompt = `You are an expert fitness coach. Output strict JSON only.`;
    
    const userPrompt = `
User Profile: Weight ${userWeight}kg.
${muscleContext}
${equipmentContext}

Available Exercises: [${exerciseList}]

Task: Create a hypertrophy (muscle building) workout routine.
Rules:
1. Select EXACTLY ${exerciseCount} exercises that best target the specified muscles using the available equipment.
2. If specific equipment is listed, prioritize exercises that use it. If "Any", choose the most effective/popular ones.
3. Include a mix of Compound and Isolation movements.
4. For EACH exercise, recommend:
   - Sets (3-5)
   - Reps (e.g., "8-12", "12-15")
   - Weight: ONLY the specific kg/lb or "Bodyweight" (e.g., "20kg", "Bodyweight"). Do NOT include instructions here.
   - Tip: A short, punchy instruction (max 10 words) focusing on the key form cue or intensity technique.
   - Reason: Detailed explanation of why this exercise was chosen.
   - PopularityRating: 1-3 (integer) representing how popular/effective this exercise is for the target muscle (3=Most Popular, 1=Good).
5. Return ONLY a valid JSON array of objects.

JSON Format:
[
  {
    "exerciseName": "Exact Name from List",
    "sets": 4,
    "reps": "8-12",
    "weight": "20kg",
    "tip": "Squeeze glutes at the top for 2s.",
    "reason": "Compound movement for overall mass.",
    "popularityRating": 3
  }
]
`;

    try {
        const content = await callAIGenerate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.7);

        if (!content) throw new Error('No content received from AI');

        // Parse JSON from content (handle potential markdown wrapping)
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const recommendations: AiRecommendation[] = JSON.parse(cleanContent);

        // Map back to Exercise objects
        const result = recommendations
            .map(rec => {
                const exercise = availableExercises.find(e => e.name === rec.exerciseName);
                if (!exercise) return null;
                return { exercise, recommendation: rec };
            })
            .filter((item): item is { exercise: Exercise; recommendation: AiRecommendation } => !!item);

        console.log('[AI Service] Successfully got', result.length, 'recommendations');
        return result;

    } catch (error) {
        console.error('[AI Service] Recommendation Failed:', error);
        throw error;
    }
};

export const getAiExerciseAlternative = async (
    originalExerciseName: string,
    targetMuscle: string,
    userProfile: { weight: number },
    constraints: { equipment?: string[]; difficulty?: string },
    availableExercises: Exercise[]
): Promise<{ exercise: Exercise; recommendation: AiRecommendation } | null> => {

    const equipmentText = constraints.equipment && constraints.equipment.length > 0
        ? `Must use: ${constraints.equipment.join(', ')}`
        : 'Any equipment (prioritize popular)';

    const difficultyText = constraints.difficulty
        ? `Difficulty Level: ${constraints.difficulty}`
        : 'Any difficulty';

    const exerciseList = availableExercises
        .filter(e => e.muscleGroup === targetMuscle || e.secondaryMuscles?.includes(targetMuscle as never))
        .map(e => `"${e.name}" (${e.mechanic}, ${e.equipment || 'Unspecified'})`)
        .join(', ');

    const systemPrompt = `You are an expert fitness coach. Output strict JSON only.`;
    
    const userPrompt = `
Task: Find a BETTER alternative for the exercise "${originalExerciseName}".
Target Muscle: ${targetMuscle}
User Weight: ${userProfile.weight}kg

Constraints:
1. ${equipmentText}
2. ${difficultyText}
3. MUST be different from "${originalExerciseName}"

Available Exercises to choose from: [${exerciseList}]

Return a SINGLE valid JSON object (NOT an array):
{
    "exerciseName": "Exact Name from List",
    "sets": 3-4,
    "reps": "8-12",
    "weight": "specific kg or bodyweight",
    "reason": "Why this is a good alternative based on constraints.",
    "popularityRating": 1-3
}
`;

    try {
        const content = await callAIGenerate([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ], 0.7);

        if (!content) throw new Error('No content');

        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const rec: AiRecommendation = JSON.parse(cleanContent);

        const exercise = availableExercises.find(e => e.name === rec.exerciseName);
        if (!exercise) return null;

        return { exercise, recommendation: rec };

    } catch (error) {
        console.error('[AI Service] Swap Failed:', error);
        throw error;
    }
};

/**
 * Check if AI is properly configured
 */
export const isAIConfigured = (): boolean => {
    return aiConfigStorage.isConfigured();
};

/**
 * Get current AI configuration info
 */
export const getAIConfigInfo = () => {
    const config = aiConfigStorage.getConfig();
    const model = aiConfigStorage.getCurrentModel(config);
    return {
        provider: config.provider,
        model: model?.name || config.modelId,
        enabled: config.enabled,
        isConfigured: aiConfigStorage.isConfigured(),
        apiUrl: aiConfigStorage.getApiUrl(config)
    };
};
