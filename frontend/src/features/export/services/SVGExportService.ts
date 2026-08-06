import type { WeeklyReport } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

/**
 * SVG Export Service
 * Generates vector-based weekly reports that can be edited in AI/Figma
 */

// Color palette matching the app theme
const MUSCLE_COLORS: Record<string, string> = {
    [MuscleGroup.CHEST]: '#34d399',          // Emerald-400
    [MuscleGroup.SHOULDERS]: '#10b981',      // Emerald-500
    [MuscleGroup.TRICEPS]: '#6ee7b7',        // Emerald-300
    [MuscleGroup.LATS]: '#14b8a6',           // Teal-500
    [MuscleGroup.TRAPS]: '#2dd4bf',          // Teal-400
    [MuscleGroup.LOWER_BACK]: '#0d9488',     // Teal-600
    [MuscleGroup.BICEPS]: '#fbbf24',         // Amber-400
    [MuscleGroup.FOREARMS]: '#f59e0b',       // Amber-500
    [MuscleGroup.ABS]: '#22c55e',            // Green-500
    [MuscleGroup.OBLIQUES]: '#4ade80',       // Green-400
    [MuscleGroup.QUADS]: '#60a5fa',          // Blue-400
    [MuscleGroup.HAMSTRINGS]: '#3b82f6',     // Blue-500
    [MuscleGroup.GLUTES]: '#93c5fd',         // Blue-300
    [MuscleGroup.CALVES]: '#2563eb',         // Blue-600
    [MuscleGroup.CARDIO]: '#94a3b8',         // Slate-400
};

const COLORS = {
    primary: '#10b981',      // Emerald-500
    accent: '#34d399',       // Emerald-400
    text: '#f8fafc',         // Slate-50
    lightText: '#94a3b8',    // Slate-400
    border: '#334155',       // Slate-700
    background: '#020617',   // Slate-950
    cardBg: '#0f172a',       // Slate-900
};

/**
 * Generate donut chart SVG path
 */
const generateDonutPath = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
): string => {
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);

    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

    return [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
    ].join(' ');
};

/**
 * Generate muscle distribution donut chart SVG
 */
const generateDonutChart = (report: WeeklyReport): string => {
    const centerX = 200;
    const centerY = 200;
    const outerRadius = 120;
    const innerRadius = 70;

    const totalVolume = report.stats.totalVolume;
    let currentAngle = -Math.PI / 2; // Start at top

    const segments = report.muscleDistribution.map(muscle => {
        const percentage = muscle.totalWeight / totalVolume;
        const segmentAngle = 2 * Math.PI * percentage;
        const endAngle = currentAngle + segmentAngle;

        const path = generateDonutPath(centerX, centerY, innerRadius, outerRadius, currentAngle, endAngle);
        const color = MUSCLE_COLORS[muscle.muscle] || '#94a3b8';

        // Calculate label position
        const midAngle = (currentAngle + endAngle) / 2;
        const labelRadius = (outerRadius + innerRadius) / 2;
        const labelX = centerX + labelRadius * Math.cos(midAngle);
        const labelY = centerY + labelRadius * Math.sin(midAngle);

        const segment = {
            path,
            color,
            percentage: (percentage * 100).toFixed(1),
            labelX,
            labelY,
            muscle: muscle.muscle,
            weight: Math.round(muscle.totalWeight)
        };

        currentAngle = endAngle;
        return segment;
    });

    return `
        <g id="donut-chart">
            ${segments.map((segment, index) => `
                <path 
                    d="${segment.path}" 
                    fill="${segment.color}" 
                    stroke="${COLORS.background}" 
                    stroke-width="2"
                    id="segment-${index}"
                />
                ${parseFloat(segment.percentage) > 5 ? `
                    <text 
                        x="${segment.labelX}" 
                        y="${segment.labelY}" 
                        text-anchor="middle" 
                        dominant-baseline="middle" 
                        fill="white" 
                        font-size="12" 
                        font-weight="bold"
                        font-family="Arial, sans-serif"
                    >
                        ${segment.percentage}%
                    </text>
                ` : ''}
            `).join('')}
            
            <!-- Center circle -->
            <circle 
                cx="${centerX}" 
                cy="${centerY}" 
                r="${innerRadius}" 
                fill="${COLORS.background}"
            />
            
            <!-- Center text -->
            <text 
                x="${centerX}" 
                y="${centerY - 10}" 
                text-anchor="middle" 
                fill="${COLORS.lightText}" 
                font-size="14" 
                font-family="Arial, sans-serif"
            >
                Total Volume
            </text>
            <text 
                x="${centerX}" 
                y="${centerY + 10}" 
                text-anchor="middle" 
                fill="${COLORS.primary}" 
                font-size="20" 
                font-weight="bold" 
                font-family="Arial, sans-serif"
            >
                ${totalVolume}kg
            </text>
        </g>
    `;
};

/**
 * Generate legend SVG
 */
const generateLegend = (report: WeeklyReport): string => {
    const startX = 450;
    const startY = 80;
    const itemHeight = 25;

    return `
        <g id="legend">
            <text 
                x="${startX}" 
                y="${startY - 10}" 
                fill="${COLORS.text}" 
                font-size="16" 
                font-weight="bold" 
                font-family="Arial, sans-serif"
            >
                Muscle Groups
            </text>
            
            ${report.muscleDistribution.map((muscle, index) => {
        const y = startY + (index * itemHeight);
        const color = MUSCLE_COLORS[muscle.muscle] || '#94a3b8';
        const percentage = ((muscle.totalWeight / report.stats.totalVolume) * 100).toFixed(1);

        return `
                    <g id="legend-item-${index}">
                        <rect 
                            x="${startX}" 
                            y="${y - 8}" 
                            width="16" 
                            height="16" 
                            fill="${color}" 
                            rx="2"
                        />
                        <text 
                            x="${startX + 25}" 
                            y="${y + 4}" 
                            fill="${COLORS.text}" 
                            font-size="14" 
                            font-family="Arial, sans-serif"
                        >
                            ${muscle.muscle}
                        </text>
                        <text 
                            x="${startX + 200}" 
                            y="${y + 4}" 
                            fill="${COLORS.lightText}" 
                            font-size="12" 
                            font-family="Arial, sans-serif" 
                            text-anchor="end"
                        >
                            ${Math.round(muscle.totalWeight)}kg (${percentage}%)
                        </text>
                    </g>
                `;
    }).join('')}
        </g>
    `;
};

/**
 * Generate statistics cards SVG
 */
const generateStatsCards = (report: WeeklyReport): string => {
    const stats = [
        { label: 'Exercises', value: report.stats.totalExercises.toString() },
        { label: 'Sets', value: report.stats.totalSets.toString() },
        { label: 'Reps', value: report.stats.totalReps.toString() },
        { label: 'Volume', value: `${report.stats.totalVolume}kg` },
        { label: 'Duration', value: `${report.stats.totalDuration}min` },
        { label: 'Calories', value: `${report.stats.totalCalories}kcal` }
    ];

    const cardWidth = 120;
    const cardHeight = 80;
    const startX = 50;
    const startY = 450;
    const gap = 20;

    return `
        <g id="stats-cards">
            ${stats.map((stat, index) => {
        const x = startX + (index % 3) * (cardWidth + gap);
        const y = startY + Math.floor(index / 3) * (cardHeight + gap);

        return `
                    <g id="stat-card-${index}">
                        <rect 
                            x="${x}" 
                            y="${y}" 
                            width="${cardWidth}" 
                            height="${cardHeight}" 
                            fill="${COLORS.cardBg}" 
                            stroke="${COLORS.border}" 
                            stroke-width="1" 
                            rx="8"
                        />
                        <text 
                            x="${x + cardWidth / 2}" 
                            y="${y + 25}" 
                            text-anchor="middle" 
                            fill="${COLORS.lightText}" 
                            font-size="12" 
                            font-family="Arial, sans-serif"
                        >
                            ${stat.label}
                        </text>
                        <text 
                            x="${x + cardWidth / 2}" 
                            y="${y + 50}" 
                            text-anchor="middle" 
                            fill="${COLORS.accent}" 
                            font-size="18" 
                            font-weight="bold" 
                            font-family="Arial, sans-serif"
                        >
                            ${stat.value}
                        </text>
                    </g>
                `;
    }).join('')}
        </g>
    `;
};

/**
 * Generate header SVG
 */
const generateHeader = (report: WeeklyReport): string => {
    return `
        <g id="header">
            <rect 
                x="0" 
                y="0" 
                width="800" 
                height="60" 
                fill="${COLORS.background}"
            />
            <text 
                x="400" 
                y="25" 
                text-anchor="middle" 
                fill="${COLORS.primary}" 
                font-size="24" 
                font-weight="bold" 
                font-family="Arial, sans-serif"
            >
                ZenFit Weekly Report
            </text>
            <text 
                x="400" 
                y="45" 
                text-anchor="middle" 
                fill="${COLORS.lightText}" 
                font-size="14" 
                font-family="Arial, sans-serif"
            >
                Week ${report.weekNumber}, ${report.year} | ${report.dateRange.start} to ${report.dateRange.end}
            </text>
        </g>
    `;
};

/**
 * Generate complete weekly report SVG
 */
export const generateWeeklyReportSVG = (report: WeeklyReport): string => {
    const width = 800;
    const height = 650;

    return `
        <svg 
            width="${width}" 
            height="${height}" 
            viewBox="0 0 ${width} ${height}" 
            xmlns="http://www.w3.org/2000/svg"
            style="background-color: ${COLORS.background};"
        >
            <defs>
                <style>
                    .zenfit-report {
                        font-family: 'Arial', sans-serif;
                    }
                    .zenfit-title {
                        font-weight: bold;
                        fill: ${COLORS.primary};
                    }
                    .zenfit-text {
                        fill: ${COLORS.text};
                    }
                    .zenfit-light-text {
                        fill: ${COLORS.lightText};
                    }
                </style>
            </defs>
            
            <!-- Background -->
            <rect width="100%" height="100%" fill="${COLORS.background}"/>
            
            <!-- Header -->
            ${generateHeader(report)}
            
            <!-- Donut Chart -->
            ${generateDonutChart(report)}
            
            <!-- Legend -->
            ${generateLegend(report)}
            
            <!-- Statistics Cards -->
            ${generateStatsCards(report)}
            
            <!-- Footer -->
            <text 
                x="400" 
                y="630" 
                text-anchor="middle" 
                fill="${COLORS.lightText}" 
                font-size="10" 
                font-family="Arial, sans-serif"
            >
                Generated by ZenFit Pro | ${new Date().toLocaleDateString()}
            </text>
        </svg>
    `;
};

/**
 * Export weekly report as SVG file
 */
export const exportWeeklyReportSVG = async (report: WeeklyReport): Promise<void> => {
    const svgContent = generateWeeklyReportSVG(report);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });

    const filename = `ZenFit_Week_${report.weekNumber}_${report.year}.svg`;

    try {
        // Try File System Access API
        // @ts-ignore
        if (window.showSaveFilePicker) {
            // @ts-ignore
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'SVG Vector Image',
                    accept: { 'image/svg+xml': ['.svg'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.warn('File System Access API failed, falling back:', err);
        } else {
            return; // User cancelled
        }
    }

    // Fallback download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Generate SVG for comparison between two weeks
 */
export const generateComparisonSVG = (
    currentWeek: WeeklyReport,
    previousWeek: WeeklyReport
): string => {
    const width = 1200;
    const height = 800;

    // This will be implemented in the comparison feature task
    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${COLORS.background}"/>
            <text x="600" y="400" text-anchor="middle" fill="${COLORS.text}" font-size="24">
                Comparison SVG - Coming Soon
            </text>
        </svg>
    `;
};