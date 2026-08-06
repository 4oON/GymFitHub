import type { WorkoutSession, UserProfile } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { generateMuscleHighlights, getMuscleDistributionData, MUSCLE_PATHS, MUSCLE_VIEW_MAPPING } from '../../anatomy/services/MuscleHighlightService';
import { getMuscleColorRGB } from '../../anatomy/constants/muscleColors';
import { calculateAdvancedCalories } from '../../profile/services/CalorieCalculationService';

/**
 * HTML Template Service
 * Generates dynamic HTML reports with accurate muscle highlighting
 * Integrates workout data with the enhanced HTML template
 */

interface TemplateData {
    // Basic session info
    date: string;
    bodyWeight: number;
    totalVolume: number;
    exerciseCount: number;
    totalReps: number;
    duration: number;
    calories: number;
    totalSets: number;
    avgSets: number;
    avgReps: number;
    avgLoad: number;

    // Muscle distribution data
    muscleDistribution: any[];

    // Exercise details
    exercises: any[];

    // Session insights
    insights: any[];
}

/**
 * Generate enhanced HTML report with muscle highlighting
 */
export const generateEnhancedHTMLReport = async (
    sessions: WorkoutSession[],
    userProfile: UserProfile,
    type: 'daily' | 'weekly' = 'daily'
): Promise<string> => {
    try {
        // Use embedded template for better compatibility
        let template = getEmbeddedTemplate();

        // Calculate template data
        const templateData = calculateTemplateData(sessions, userProfile);

        // Generate muscle highlights
        const muscleHighlights = generateMuscleHighlights(sessions, type);

        // Replace template placeholders
        template = replacePlaceholders(template, templateData);

        // Inject muscle highlighting data
        template = injectMuscleHighlighting(template, muscleHighlights, templateData.muscleDistribution);

        // Inject exercise data
        template = injectExerciseData(template, templateData.exercises);

        // Inject session insights
        template = injectSessionInsights(template, templateData.insights);

        return template;

    } catch (error) {
        console.error('HTML template generation error:', error);
        throw new Error('Failed to generate HTML template');
    }
};

/**
 * Calculate all template data from sessions
 */
const calculateTemplateData = (sessions: WorkoutSession[], userProfile: UserProfile): TemplateData => {
    // Combine all exercises from all sessions
    const allExercises = sessions.flatMap(session => session.exercises);

    // Calculate basic stats
    const totalVolume = sessions.reduce((sum, session) => sum + session.volumeLoad, 0);
    const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = allExercises.reduce((sum, ex) =>
        sum + ex.sets.filter(s => s.completed).reduce((reps, set) => reps + set.reps, 0), 0);
    const totalDuration = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

    // Calculate calories
    let totalCalories = 0;
    try {
        totalCalories = sessions.reduce((sum, session) => {
            try {
                return sum + calculateAdvancedCalories(session, userProfile);
            } catch {
                return sum + Math.round((session.durationMinutes || 0) / 60 * 5 * userProfile.weight);
            }
        }, 0);
    } catch {
        totalCalories = Math.round(totalDuration / 60 * 5 * userProfile.weight);
    }

    // Calculate muscle distribution
    const muscleDistribution = getMuscleDistributionData(sessions);

    // Format date
    const date = sessions.length === 1
        ? new Date(sessions[0].date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : `${new Date(sessions[0].date).toLocaleDateString()} - ${new Date(sessions[sessions.length - 1].date).toLocaleDateString()}`;

    // Format exercises for table
    const exercises = allExercises.map(ex => {
        const completedSets = ex.sets.filter(s => s.completed);
        if (completedSets.length === 0) return null;

        const reps = completedSets.map(s => s.reps).join(', ');
        const weights = completedSets.map(s => s.weight).join(', ');
        const volume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

        return {
            name: ex.exerciseName,
            sets: completedSets.length,
            reps,
            weights,
            volume: Math.round(volume)
        };
    }).filter(Boolean);

    // Generate session insights
    const insights = generateSessionInsights(muscleDistribution, totalVolume, totalDuration, allExercises.length);

    return {
        date,
        bodyWeight: userProfile.weight,
        totalVolume,
        exerciseCount: allExercises.length,
        totalReps,
        duration: totalDuration,
        calories: totalCalories,
        totalSets,
        avgSets: Math.round(totalSets / allExercises.length * 10) / 10,
        avgReps: Math.round(totalReps / totalSets * 10) / 10,
        avgLoad: Math.round(totalVolume / totalReps * 10) / 10,
        muscleDistribution,
        exercises,
        insights
    };
};

/**
 * Replace template placeholders with actual data
 */
const replacePlaceholders = (template: string, data: TemplateData): string => {
    const replacements: Record<string, string> = {
        '{{DATE}}': data.date,
        '{{BODY_WEIGHT}}': data.bodyWeight.toString(),
        '{{TOTAL_VOLUME}}': data.totalVolume.toString(),
        '{{EXERCISE_COUNT}}': data.exerciseCount.toString(),
        '{{TOTAL_REPS}}': data.totalReps.toString(),
        '{{DURATION}}': data.duration.toString(),
        '{{CALORIES}}': data.calories.toString(),
        '{{TOTAL_SETS}}': data.totalSets.toString(),
        '{{AVG_SETS}}': data.avgSets.toString(),
        '{{AVG_REPS}}': data.avgReps.toString(),
        '{{AVG_LOAD}}': data.avgLoad.toString()
    };

    let result = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
        result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
};

/**
 * Inject muscle highlighting JavaScript and additional muscle paths
 */
const injectMuscleHighlighting = (template: string, highlights: any[], muscleDistribution: any[]): string => {
    // Generate additional muscle group SVG paths for all trained muscles
    const frontMuscles = generateMuscleGroupSVGs('front', highlights);
    const backMuscles = generateMuscleGroupSVGs('back', highlights);

    // Inject additional muscle paths into front SVG
    template = template.replace(
        '<!-- Additional muscle groups will be added here by agent -->',
        frontMuscles
    );

    // Inject additional muscle paths into back SVG
    template = template.replace(
        '<!-- Additional back muscle groups will be added here by agent -->',
        backMuscles
    );

    // Generate initialization script
    const initScript = `
        <script>
        // Initialize muscle highlighting with actual data
        document.addEventListener('DOMContentLoaded', function() {
            const muscleData = ${JSON.stringify(muscleDistribution)};
            const totalVolume = ${muscleDistribution.reduce((sum, d) => sum + d.totalWeight, 0)};
            
            if (window.initializeMuscleHighlighting) {
                window.initializeMuscleHighlighting(muscleData, totalVolume);
            }
        });
        </script>
    `;

    // Inject before closing body tag
    template = template.replace('</body>', `${initScript}</body>`);

    return template;
};

/**
 * Generate SVG muscle group elements for highlighting
 */
const generateMuscleGroupSVGs = (view: 'front' | 'back', highlights: any[]): string => {
    const viewMapping = MUSCLE_VIEW_MAPPING[view];
    let svgElements = '';

    highlights.forEach(highlight => {
        const muscleKey = viewMapping[highlight.muscle as keyof typeof viewMapping];
        if (muscleKey && MUSCLE_PATHS[muscleKey as keyof typeof MUSCLE_PATHS]) {
            const path = MUSCLE_PATHS[muscleKey as keyof typeof MUSCLE_PATHS];
            const gradientId = `gradient-${highlight.muscle.toLowerCase().replace(/_/g, '-')}`;

            // 不在SVG内添加文字标注，避免溢出问题
            svgElements += `
                <!-- ${highlight.muscle} -->
                <g class="muscle-group" data-muscle="${highlight.muscle.toLowerCase()}" style="opacity: 0;">
                    <path d="${path}"
                          fill="url(#${gradientId})"
                          stroke="var(--color-${highlight.muscle.toLowerCase().replace(/_/g, '-')})"
                          stroke-width="1.5"
                          stroke-opacity="0.9"/>
                </g>
            `;
        }
    });

    return svgElements;
};

/**
 * Inject exercise data into table
 */
const injectExerciseData = (template: string, exercises: any[]): string => {
    const tableRows = exercises.map(ex => {
        // 截断过长的动作名称，更激进的截断策略
        const exerciseName = ex.name.length > 25 ? ex.name.substring(0, 22) + '...' : ex.name;

        // 处理reps和weights，确保不会太长
        const repsDisplay = ex.reps.length > 20 ? ex.reps.substring(0, 17) + '...' : ex.reps;
        const weightsDisplay = ex.weights.length > 20 ? ex.weights.substring(0, 17) + '...' : ex.weights;

        return `
        <tr>
            <td title="${ex.name}">${exerciseName}</td>
            <td>${ex.sets}</td>
            <td title="${ex.reps}">${repsDisplay}</td>
            <td title="${ex.weights}">${weightsDisplay}</td>
            <td><strong>${ex.volume}</strong></td>
        </tr>
    `;
    }).join('');

    return template.replace(
        '<!-- Dynamic exercise data will be populated by agent -->',
        tableRows
    );
};

/**
 * Inject session insights
 */
const injectSessionInsights = (template: string, insights: any[]): string => {
    const insightCards = insights.map(insight => `
        <div class="bottom-item">
            <div class="bottom-item-label">${insight.label}</div>
            <div class="bottom-item-value">${insight.value}</div>
        </div>
    `).join('');

    return template.replace(
        '<!-- Dynamic insights will be populated by agent -->',
        insightCards
    );
};

/**
 * Generate session insights
 */
const generateSessionInsights = (muscleDistribution: any[], totalVolume: number, duration: number, exerciseCount: number): any[] => {
    const insights = [];

    // Primary focus
    if (muscleDistribution.length > 0) {
        const primaryMuscle = muscleDistribution[0];
        const percentage = ((primaryMuscle.totalWeight / totalVolume) * 100).toFixed(0);
        insights.push({
            label: 'Primary focus',
            value: `${primaryMuscle.muscle} (${percentage}%)`
        });
    }

    // Training density
    const density = duration > 0 ? (totalVolume / duration).toFixed(1) : '0';
    insights.push({
        label: 'Density',
        value: `${density} kg/min`
    });

    // Volume distribution
    const upperBodyMuscles = ['CHEST', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LATS', 'TRAPS'];
    const upperBodyVolume = muscleDistribution
        .filter(d => upperBodyMuscles.includes(d.muscle))
        .reduce((sum, d) => sum + d.totalWeight, 0);
    const upperBodyPercentage = ((upperBodyVolume / totalVolume) * 100).toFixed(0);

    insights.push({
        label: 'Upper body share',
        value: `${upperBodyPercentage}% volume`
    });

    return insights;
};

/**
 * Generate weekly report HTML
 */
export const generateWeeklyHTMLReport = async (
    sessions: WorkoutSession[],
    userProfile: UserProfile
): Promise<string> => {
    return generateEnhancedHTMLReport(sessions, userProfile, 'weekly');
};

/**
 * Generate daily report HTML
 */
/**
 * Get embedded HTML template (fallback for when file loading fails)
 */
const getEmbeddedTemplate = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enhanced Workout Report – Muscle Highlighting</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f5f5f7;
            padding: 20px;
        }
        .a4-container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: #fff;
            padding: 19mm;
            box-shadow: 0 8px 25px rgba(15, 23, 42, .12);
            border-radius: 8px;
            overflow: visible;
        }
        :root {
            --color-chest: #ef4444; --color-quads: #3b82f6; --color-lats: #06b6d4; --color-abs: #22c55e;
            --color-shoulders: #8b5cf6; --color-biceps: #f59e0b; --color-triceps: #ec4899; --color-forearms: #10b981;
            --color-obliques: #f97316; --color-traps: #6366f1; --color-glutes: #84cc16; --color-hamstrings: #f43f5e;
            --color-calves: #14b8a6; --color-lowerback: #a855f7;
        }
        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
        }
        .report-title { font-size: 16pt; font-weight: 700; color: #1e293b; letter-spacing: .03em; }
        .report-sub { font-size: 10pt; color: #6b7280; }
        .highlight-sub { font-size: 9pt; color: #6b7280; }
        .highlight-value { font-size: 28px; font-weight: 700; color: #1d4ed8; }
        .panel {
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            overflow: visible;
            background: #fff;
            margin-bottom: 10px;
        }
        .panel-header {
            background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
            color: #fff;
            padding: 8px 12px;
            font-size: 12pt;
            font-weight: 600;
        }
        .panel-header .sub { font-size: 9pt; font-weight: 400; opacity: 0.9; margin-left: 8px; }
        .panel-body { padding: 16px; overflow: visible; }
        .muscle-overview-row {
            display: grid;
            grid-template-columns: 0.38fr 0.62fr;
            gap: 20px;
            align-items: stretch;
            min-height: 280px;
        }
        .chart-wrapper { position: relative; width: 160px; height: 160px; margin: 0 auto; }
        .body-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 8px;
            padding: 12px;
            overflow: visible;
        }
        .body-pair {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            justify-items: center;
            align-items: end;
        }
        .body-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .body-item svg {
            width: 120px;
            height: auto;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
            overflow: visible;
        }
        .body-label {
            font-size: 8pt;
            color: #6b7280;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .muscle-group {
            transition: opacity 0.3s ease;
        }
        .muscle-group.active {
            opacity: 1 !important;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            table-layout: fixed;
        }
        th, td {
            padding: 5px 6px;
            border-bottom: 1px solid #f3f4f6;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        th {
            text-align: left;
            font-weight: 600;
            font-size: 8pt;
            color: #6b7280;
            background: #f9fafb;
            text-transform: uppercase;
            white-space: nowrap;
        }
        td {
            vertical-align: top;
            line-height: 1.3;
            font-size: 8pt;
            max-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        td:first-child {
            width: 32%;
            white-space: normal;
            word-break: break-word;
        }
        td:nth-child(2) {
            width: 8%;
            text-align: center;
        }
        td:nth-child(3) {
            width: 22%;
            font-size: 7pt;
            white-space: normal;
        }
        td:nth-child(4) {
            width: 22%;
            font-size: 7pt;
            white-space: normal;
        }
        td:nth-child(5) {
            width: 16%;
            text-align: right;
            font-weight: 600;
        }
        @media print {
            body { background: none; padding: 0; }
            .a4-container {
                width: 100%;
                height: auto;
                box-shadow: none;
                margin: 0;
                border-radius: 0;
                padding: 0.75in;
                overflow: visible;
            }
            .panel { overflow: visible; }
            .panel-body { overflow: visible; }
            .body-block { overflow: visible; }
            .body-item svg { overflow: visible; }
            @page {
                margin: 0.75in;
                size: A4;
            }
        }
    </style>
</head>
<body>
    <div class="a4-container">
        <div class="top-bar">
            <div class="top-info">
                <div class="report-title">Enhanced Workout Report</div>
                <div class="report-sub">{{DATE}} · Body Weight: {{BODY_WEIGHT}} kg</div>
            </div>
            <div class="highlight-metric">
                <div class="highlight-value">{{TOTAL_VOLUME}} kg</div>
                <div class="highlight-sub">{{EXERCISE_COUNT}} exercises · {{TOTAL_REPS}} reps</div>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">
                <span>Muscle Group Overview</span>
                <span class="sub">Volume distribution & body activation</span>
            </div>
            <div class="panel-body">
                <div class="muscle-overview-row">
                    <div class="chart-block">
                        <div class="chart-wrapper">
                            <canvas id="muscleChart"></canvas>
                        </div>
                        <div class="legend-list" id="muscleLegend">
                            <!-- Dynamic legend will be populated by agent -->
                        </div>
                    </div>

                    <div class="body-block">
                        <div class="body-pair">
                            <div class="body-item">
                                <svg viewBox="0 0 400 700" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="gradient-chest" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style="stop-color:var(--color-chest);stop-opacity:0.8" />
                                            <stop offset="100%" style="stop-color:var(--color-chest);stop-opacity:0.3" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M198.55,55.64c-7.09,7.7-6.76,16.47-4.38,25.92..." fill="#ffffff" stroke="#9ca3af" stroke-width="1.5" />
                                    <!-- Additional muscle groups will be added here by agent -->
                                </svg>
                                <span class="body-label">Front</span>
                            </div>
                            <div class="body-item">
                                <svg viewBox="0 0 400 700" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M234.76,172.23c-3.04,14.41-6.67,28.95..." fill="#ffffff" stroke="#9ca3af" stroke-width="1.5" />
                                    <!-- Additional back muscle groups will be added here by agent -->
                                </svg>
                                <span class="body-label">Back</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="panel">
            <div class="panel-header">
                <span>Exercise Details</span>
            </div>
            <div class="panel-body" style="padding:12px;">
                <table id="exerciseTable">
                    <thead>
                        <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Load (kg)</th><th>Volume</th></tr>
                    </thead>
                    <tbody>
                        <!-- Dynamic exercise data will be populated by agent -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        class MuscleHighlighter {
            constructor() { this.muscleData = []; this.chart = null; }
            init(muscleDistribution, totalVolume) {
                this.muscleData = muscleDistribution;
                this.createChart(totalVolume);
                this.highlightMuscles();
            }
            createChart(totalVolume) {
                const ctx = document.getElementById('muscleChart').getContext('2d');
                const labels = this.muscleData.map(d => d.muscle);
                const data = this.muscleData.map(d => d.totalWeight);
                const colors = ['#ef4444', '#3b82f6', '#06b6d4', '#22c55e', '#8b5cf6'];
                this.chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }] },
                    options: { cutout: '68%', responsive: true, plugins: { legend: { display: false } } }
                });
            }
            highlightMuscles() {
                document.querySelectorAll('.muscle-group').forEach(group => { group.style.opacity = '0'; });
                this.muscleData.forEach(data => {
                    const muscleElements = document.querySelectorAll(\`[data-muscle="\${data.muscle.toLowerCase()}"]\`);
                    muscleElements.forEach(element => {
                        element.style.opacity = '0.7';
                        element.classList.add('active');
                    });
                });
            }
        }
        window.muscleHighlighter = new MuscleHighlighter();
        window.initializeMuscleHighlighting = function(muscleDistribution, totalVolume) {
            window.muscleHighlighter.init(muscleDistribution, totalVolume);
        };
    </script>
</body>
</html>`;
};

export const generateDailyHTMLReport = async (
    session: WorkoutSession,
    userProfile: UserProfile
): Promise<string> => {
    return generateEnhancedHTMLReport([session], userProfile, 'daily');
};