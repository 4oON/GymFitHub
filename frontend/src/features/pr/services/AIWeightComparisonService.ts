/**
 * AI Weight Comparison Service with Giant Objects Database
 * Hybrid approach: Try AI first, fallback to impressive local database
 * 
 * Features:
 * - Real-time AI generation with high temperature for variety
 * - Giant objects database (aircraft carriers, rockets, etc.)
 * - Proper error handling when backend is unavailable
 * - Single weight PR support
 */

import { apiClient } from '@/services/apiClient';
import { 
    getGiantComparisons, 
    getBestGiantComparison,
    type GiantObject 
} from './WeightComparisonDB';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface AIWeightComparison {
    object: string;
    icon: string;
    count: string;
    exactCount: number;
    singleWeightKg: number;
    description: string;
    funFact: string;
    category: string;
}

export interface AIComparisonResult {
    comparisons: AIWeightComparison[];
    summary: string;
    motivationalQuote: string;
}

export class AIWeightComparisonService {
    private static lastTotalTons: number | null = null;
    private static lastResult: AIComparisonResult | null = null;

    /**
     * Get weight comparison - tries AI first, falls back to giant objects DB
     */
    static async getAIComparison(
        totalTons: number,
        forceRefresh = false,
        userContext?: {
            favoriteExercise?: string;
            trainingStyle?: string;
            recentPR?: string;
        }
    ): Promise<AIComparisonResult> {
        // Use cached result if available and not forcing refresh
        if (!forceRefresh && this.lastResult && this.lastTotalTons === totalTons) {
            return this.lastResult;
        }

        // Try AI first
        // Try AI first (will fall back to local DB if unavailable)
        const aiResult = await this.generateComparison(totalTons, userContext);
        if (aiResult) {
            console.log('[AI] Using AI-generated comparison');
            this.lastResult = aiResult;
            this.lastTotalTons = totalTons;
            return aiResult;
        }
        
        // Use local giant objects database (offline, instant, always available)
        console.log('[AI] Using local Giant Objects Database');
        const dbResult = this.generateFromDatabase(totalTons);
        this.lastResult = dbResult;
        this.lastTotalTons = totalTons;
        return dbResult;
    }

    /**
     * Get comparison for single PR weight
     */
    static async getSingleWeightComparison(
        weightKg: number,
        exerciseName?: string,
        forceRefresh = false
    ): Promise<AIComparisonResult> {
        // Convert to tons for consistent handling
        const tons = weightKg / 1000;
        
        if (!forceRefresh && this.lastResult && this.lastTotalTons === tons) {
            return this.lastResult;
        }

        // For single weights, use database directly (faster, no API call needed)
        const dbResult = this.generateFromDatabase(tons, true);
        this.lastResult = dbResult;
        this.lastTotalTons = tons;
        return dbResult;
    }

    /**
     * Generate from local giant objects database
     */
    private static generateFromDatabase(totalTons: number, isSingleWeight = false): AIComparisonResult {
        const comparisons = getGiantComparisons(totalTons, 3);
        
        const aiComparisons: AIWeightComparison[] = comparisons.map(c => ({
            object: c.object.name,
            icon: c.object.icon,
            count: c.count < 1 ? `${c.countFormatted} of a` : c.countFormatted,
            exactCount: c.count,
            singleWeightKg: c.object.weightKg,
            description: c.object.description,
            funFact: c.object.funFact,
            category: c.object.category
        }));

        // Pick best one for summary
        const best = getBestGiantComparison(totalTons);
        
        let summary: string;
        if (best) {
            if (best.count < 1) {
                summary = `You've lifted ${best.countFormatted} of a ${best.object.name}!`;
            } else {
                summary = `You've lifted ${best.countFormatted} ${best.object.name}s!`;
            }
        } else {
            summary = `You've lifted ${totalTons} tons of pure strength!`;
        }

        const motivationalQuotes = [
            "Your strength moves mountains!",
            "You're in the heavyweight league now!",
            "Olympic-level dedication!",
            "Beast mode: ACTIVATED!",
            "You're a force of nature!",
            "This is legendary territory!",
            "Your power is nuclear!",
            "You've reached astronomical levels!"
        ];

        return {
            comparisons: aiComparisons,
            summary,
            motivationalQuote: motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
        };
    }

    /**
     * Clear cache
     */
    static clearCache(): void {
        console.log('[AI] Cache cleared');
        this.lastResult = null;
        this.lastTotalTons = null;
    }

    /**
     * Try to call AI API
     */
    private static async generateComparison(
        totalTons: number,
        userContext?: {
            favoriteExercise?: string;
            trainingStyle?: string;
            recentPR?: string;
        }
    ): Promise<AIComparisonResult | null> {
        const totalKg = totalTons * 1000;

        const prompt = `Generate 3 impressive weight comparisons for a lifter who moved ${totalTons} tons total.

Use these types of massive objects:
- Space: Saturn V rocket, Space Shuttle, ISS, Falcon Heavy
- Military: Aircraft carriers, nuclear submarines, tanks, bombers  
- Engineering: Eiffel Tower, pyramids, dams, skyscrapers
- Transport: 747 jets, cruise ships, bullet trains
- Nature: Blue whales, dinosaurs, giant trees

Return JSON:
{
  "comparisons": [
    {
      "object": "Name",
      "icon": "emoji",
      "count": "descriptive number",
      "exactCount": number,
      "singleWeightKg": number,
      "description": "what it is",
      "funFact": "impressive fact",
      "category": "category"
    }
  ],
  "summary": "short impressive summary",
  "motivationalQuote": "epic quote"
}`;

        try {
            const token = apiClient.getToken();
            
            // Set timeout to avoid hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an epic fitness motivator. Generate impressive weight comparisons using massive objects like rockets, aircraft carriers, and monuments. Always return valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.9
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Silently fail, will use local DB
                return null;
            }

            const result = await response.json();
            const content = result.content || result.data?.content || '';
            
            if (!content) {
                return null;
            }
            
            return this.parseAIResponse(content, totalTons);
        } catch {
            // API unavailable, will use local database
            return null;
        }
    }

    /**
     * Parse AI response
     */
    private static parseAIResponse(content: string, totalTons: number): AIComparisonResult | null {
        try {
            let cleanContent = content.trim();
            
            // Remove markdown code blocks
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```[\w]*\n?/, '').replace(/```$/, '');
            }
            
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                
                if (data.comparisons && Array.isArray(data.comparisons) && data.comparisons.length > 0) {
                    return {
                        comparisons: data.comparisons.map((c: any) => ({
                            object: c.object || 'Unknown',
                            icon: c.icon || '⚖️',
                            count: c.count || `${c.exactCount || '?'}`,
                            exactCount: c.exactCount || 0,
                            singleWeightKg: c.singleWeightKg || c.single_weight_kg || 0,
                            description: c.description || '',
                            funFact: c.funFact || c.fun_fact || '',
                            category: c.category || 'daily_life'
                        })),
                        summary: data.summary || `You've lifted ${totalTons} tons!`,
                        motivationalQuote: data.motivationalQuote || data.motivational_quote || 'Keep pushing your limits!'
                    };
                }
            }
        } catch (e) {
            console.log('[AI Comparison] Parse error');
        }
        return null;
    }

    static formatComparison(comp: AIWeightComparison): string {
        return `${comp.count} ${comp.object}`;
    }
}
