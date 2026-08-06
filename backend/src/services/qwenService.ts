/**
 * QWEN AI Service (阿里云通义千问)
 *
 * 使用阿里云的通义千问模型提供 AI 功能
 * API密钥从环境变量中读取
 * 直接使用 HTTP API 调用，不依赖 dashscope SDK
 */

const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const MODEL_NAME = 'qwen-max'; // 使用 qwen-max 模型
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

/**
 * 带重试逻辑的 API 调用包装器
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

            // 检查是否是速率限制错误
            if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('rate limit')) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // 其他错误直接抛出
            throw error;
        }
    }

    throw lastError;
};

/**
 * 调用 QWEN 模型生成文本（使用 HTTP API）
 */
const generateText = async (prompt: string, model: string = MODEL_NAME): Promise<string> => {
    if (!QWEN_API_KEY) {
        throw new Error('QWEN API key not configured');
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${QWEN_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                input: {
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                },
                parameters: {
                    result_format: 'message'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`QWEN API error (${response.status}): ${errorText}`);
        }

        const data: any = await response.json();

        if (data.output?.choices?.[0]?.message?.content) {
            return data.output.choices[0].message.content;
        } else {
            throw new Error(`QWEN API unexpected response format: ${JSON.stringify(data)}`);
        }
    } catch (error: any) {
        console.error('QWEN API Error:', error);
        throw error;
    }
};

/**
 * 获取运动提示（单语言）
 */
export const getExerciseTip = async (exerciseName: string): Promise<string> => {
    try {
        return await callWithRetry(async () => {
            const prompt = `Give me a very short, professional form tip (under 30 words) for the exercise: ${exerciseName}. Focus on safety or efficiency.`;
            return await generateText(prompt);
        });
    } catch (error) {
        console.error("QWEN API Error:", error);
        return "Focus on controlled movement and proper breathing.";
    }
};

/**
 * 获取运动提示（双语）
 */
export const getExerciseTips = async (exerciseName: string): Promise<{ english: string; chinese: string }> => {
    try {
        return await callWithRetry(async () => {
            const prompt = `For the exercise "${exerciseName}", provide 2-3 KEY FORM TIPS in bilingual format:

Requirements:
- Each tip should be ONE SHORT SENTENCE (max 15 words)
- Focus on the MOST CRITICAL form points
- Make tips actionable and specific
- Translate naturally to Chinese (not literal translation)

Format your response EXACTLY as:
EN: [tip 1] | [tip 2] | [tip 3]
ZH: [提示1] | [提示2] | [提示3]`;

            const text = await generateText(prompt);
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
        console.error("QWEN Tips Error:", error);
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
            const prompt = `Suggest 3 distinct exercises for ${muscleGroup} for an intermediate gym goer. Return only the names separated by commas.`;
            return await generateText(prompt);
        });
    } catch (error) {
        console.error("QWEN API Error:", error);
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

            const text = await generateText(prompt);
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
        console.error("QWEN Recommendation Error:", error);

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

            return await generateText(prompt);
        });
    } catch (error) {
        console.error("QWEN Report Error:", error);
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

            const text = await generateText(prompt);
            const calories = parseInt(text.replace(/[^\d]/g, ''));

            // Validate result is reasonable (between 50-2000 calories)
            if (isNaN(calories) || calories < 50 || calories > 2000) {
                return fallbackCalories;
            }

            return calories;
        });
    } catch (error) {
        console.error('Error calculating calories with QWEN:', error);
        return fallbackCalories;
    }
};