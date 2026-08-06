import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Service
 *
 * 后端统一处理所有Gemini AI API调用
 * API密钥从环境变量中读取，不暴露给前端
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-1.5-flash'; // 使用免费层稳定模型

// 初始化Gemini AI客户端
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * 获取模型实例
 */
const getModel = () => {
    if (!genAI) {
        throw new Error('Gemini API key not configured in backend environment');
    }
    return genAI.getGenerativeModel({ model: MODEL_NAME });
};

/**
 * 带重试逻辑的 API 调用包装器
 * 处理 429 (Rate Limit) 错误，自动重试
 */
const callWithRetry = async <T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;

            // 检查是否是 429 错误
            if (error?.status === 429 || error?.message?.includes('429')) {
                const delay = initialDelay * Math.pow(2, attempt); // 指数退避
                console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // 其他错误直接抛出
            throw error;
        }
    }

    // 所有重试都失败
    throw lastError;
};

/**
 * 获取运动提示（单语言）
 */
export const getExerciseTip = async (exerciseName: string): Promise<string> => {
    try {
        return await callWithRetry(async () => {
            const model = getModel();
            const prompt = `Give me a very short, professional form tip (under 30 words) for the exercise: ${exerciseName}. Focus on safety or efficiency.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text() || "Keep your core tight and maintain controlled movement.";
        });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Focus on controlled movement and proper breathing.";
    }
};

/**
 * 获取运动提示（双语）
 */
export const getExerciseTips = async (exerciseName: string): Promise<{ english: string; chinese: string }> => {
    try {
        return await callWithRetry(async () => {
            const model = getModel();
            const prompt = `For the exercise "${exerciseName}", provide 2-3 KEY FORM TIPS in bilingual format:
    
    Requirements:
    - Each tip should be ONE SHORT SENTENCE (max 15 words)
    - Focus on the MOST CRITICAL form points
    - Make tips actionable and specific
    - Translate naturally to Chinese (not literal translation)
    
    Format your response EXACTLY as:
    EN: [tip 1] | [tip 2] | [tip 3]
    ZH: [提示1] | [提示2] | [提示3]`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text() || "";
            const lines = text.split('\n').filter(l => l.trim());

            let english = "Keep core tight. Control the movement. Breathe steadily.";
            let chinese = "核心收紧。控制动作。平稳呼吸。";

            for (const line of lines) {
                if (line.startsWith('EN:')) {
                    english = line.substring(3).trim();
                } else if (line.startsWith('ZH:')) {
                    chinese = line.substring(3).trim();
                }
            }

            return { english, chinese };
        });
    } catch (error) {
        console.error("Gemini Tips Error:", error);
        return {
            english: "Maintain proper form. Control the movement. Breathe steadily.",
            chinese: "保持正确姿势。控制动作。平稳呼吸。"
        };
    }
};

/**
 * 获取训练建议
 */
export const getRoutineSuggestion = async (muscleGroup: string): Promise<string> => {
    try {
        return await callWithRetry(async () => {
            const model = getModel();
            const prompt = `Suggest 3 distinct exercises for ${muscleGroup} for an intermediate gym goer. Return only the names separated by commas.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text() || "Push Ups, Pull Ups, Squats";
        });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Squat, Bench Press, Deadlift";
    }
};

/**
 * 获取运动推荐
 */
export const getExerciseRecommendation = async (params: {
    exerciseName: string;
    userWeight: number;
    experienceLevel: string;
    mechanic: string;
    lastWorkout?: {
        sets: Array<{ weight: number; reps: number }>;
        daysAgo: number;
    };
}): Promise<{
    sets: number;
    reps: string;
    weight: number;
    reason: string;
}> => {
    const { exerciseName, userWeight, experienceLevel, mechanic, lastWorkout } = params;

    try {
        return await callWithRetry(async () => {
            const model = getModel();
            const historyContext = lastWorkout
                ? `Last workout (${lastWorkout.daysAgo} days ago): ${lastWorkout.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}`
                : 'First time performing this exercise';

            const prompt = `As a professional strength coach, recommend a workout for:
    
Exercise: ${exerciseName}
Type: ${mechanic}
User Weight: ${userWeight}kg
Experience: ${experienceLevel}
History: ${historyContext}

Provide a specific recommendation in this EXACT format:
SETS: [number]
REPS: [range like "8-10" or "6-8"]
WEIGHT: [number in kg]
REASON: [One short sentence explaining why, max 15 words]

Guidelines:
- Beginners: Higher reps (10-12), lighter weight (30-40% bodyweight for compounds)
- Intermediate: Moderate reps (6-10), progressive overload
- Advanced: Lower reps (4-6), heavier weight
- Compound exercises: Lower reps, heavier weight
- Isolation exercises: Higher reps, moderate weight
- If history exists: Add 2.5-5kg or 1-2 reps for progression
- Be conservative and prioritize safety`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text() || "";
            const lines = text.split('\n').filter(l => l.trim());

            let sets = 3;
            let reps = "8-10";
            let weight = Math.round(userWeight * 0.5);
            let reason = "Start with moderate weight and volume";

            for (const line of lines) {
                if (line.startsWith('SETS:')) {
                    sets = parseInt(line.substring(5).trim()) || 3;
                } else if (line.startsWith('REPS:')) {
                    reps = line.substring(5).trim();
                } else if (line.startsWith('WEIGHT:')) {
                    weight = parseFloat(line.substring(7).trim()) || weight;
                } else if (line.startsWith('REASON:')) {
                    reason = line.substring(7).trim();
                }
            }

            return { sets, reps, weight, reason };
        });
    } catch (error) {
        console.error("Gemini Recommendation Error:", error);

        // Fallback logic
        const isCompound = mechanic === 'Compound';
        const sets = experienceLevel === 'Beginner' ? 3 : experienceLevel === 'Intermediate' ? 4 : 5;
        const reps = isCompound ? "6-8" : "10-12";
        const baseWeight = userWeight * (isCompound ? 0.6 : 0.3);
        const weight = Math.round(baseWeight / 2.5) * 2.5;

        return {
            sets,
            reps,
            weight,
            reason: "Standard recommendation based on experience level"
        };
    }
};

/**
 * 生成训练报告
 */
export const generateWorkoutReport = async (params: {
    exercises: Array<{
        exerciseName: string;
        sets: Array<{ weight?: number; reps: number }>;
    }>;
    duration: number;
}): Promise<string> => {
    const { exercises, duration } = params;

    try {
        return await callWithRetry(async () => {
            const model = getModel();
            const summary = exercises.map(ex =>
                `${ex.exerciseName}: ${ex.sets.length} sets, best weight: ${Math.max(...ex.sets.map(s => s.weight || 0))}kg`
            ).join('; ');

            const prompt = `
      Analyze this gym workout session (Duration: ${duration} min).
      Exercises: ${summary}.
      
      Provide a response in Markdown format with 2 short sections:
      1. **Performance**: A 1-sentence encouragement about the volume or intensity.
      2. **Recovery Tip**: A 1-sentence specific recovery advice for the muscles worked.
      
      Keep it professional, encouraging, and concise (under 60 words total).
    `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text() || "Great workout! Remember to hydrate and stretch the worked muscles.";
        });
    } catch (error) {
        console.error("Gemini Report Error:", error);
        return "Workout completed successfully. Focus on protein intake for recovery.";
    }
};

/**
 * 使用AI计算卡路里消耗
 */
export const calculateCaloriesWithAI = async (params: {
    durationMinutes: number;
    bodyWeight: number;
    exercises: Array<{
        name: string;
        sets: number;
        reps: number;
        weight: number;
        muscleGroup: string;
    }>;
}): Promise<number> => {
    const { durationMinutes, bodyWeight, exercises } = params;

    // Fallback calculation
    const fallbackCalories = Math.round((durationMinutes / 60) * 5 * bodyWeight);

    if (exercises.length === 0 || durationMinutes <= 0 || bodyWeight <= 0) {
        return fallbackCalories;
    }

    try {
        return await callWithRetry(async () => {
            const model = getModel();
            const exerciseList = exercises.map(ex =>
                `${ex.name}: ${ex.sets} sets × ${ex.reps} reps @ ${ex.weight}kg (${ex.muscleGroup})`
            ).join('\n');

            const prompt = `Calculate calories burned for this workout:

Workout Details:
- Duration: ${durationMinutes} minutes
- Body Weight: ${bodyWeight} kg
- Exercises:
${exerciseList}

Consider:
- Exercise intensity and muscle groups involved
- Rest periods between sets
- Individual metabolic factors
- Compound vs isolation movements

Provide ONLY a single number representing total calories burned. No explanation needed.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text()?.trim() || "";

            // Extract number from response
            const calories = parseInt(text.replace(/[^\d]/g, ''));

            // Validate result is reasonable (between 50-2000 calories)
            if (isNaN(calories) || calories < 50 || calories > 2000) {
                return fallbackCalories;
            }

            return calories;
        });
    } catch (error) {
        console.error('Error calculating calories with AI:', error);
        return fallbackCalories;
    }
};