import { jsPDF } from 'jspdf';
import type { WeeklyReport } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';

/**
 * Vector PDF Export Service
 * Generates PDF reports using jsPDF drawing API (no screenshots)
 * Creates fully vector-based PDFs that are scalable and editable
 */

// Color palette matching the app theme (RGB values for jsPDF)
const MUSCLE_COLORS: Record<string, [number, number, number]> = {
    [MuscleGroup.CHEST]: [52, 211, 153],          // Emerald-400
    [MuscleGroup.SHOULDERS]: [16, 185, 129],      // Emerald-500
    [MuscleGroup.TRICEPS]: [110, 231, 183],       // Emerald-300
    [MuscleGroup.LATS]: [20, 184, 166],           // Teal-500
    [MuscleGroup.TRAPS]: [45, 212, 191],          // Teal-400
    [MuscleGroup.LOWER_BACK]: [13, 148, 136],     // Teal-600
    [MuscleGroup.BICEPS]: [251, 191, 36],         // Amber-400
    [MuscleGroup.FOREARMS]: [245, 158, 11],       // Amber-500
    [MuscleGroup.ABS]: [34, 197, 94],             // Green-500
    [MuscleGroup.OBLIQUES]: [74, 222, 128],       // Green-400
    [MuscleGroup.QUADS]: [96, 165, 250],          // Blue-400
    [MuscleGroup.HAMSTRINGS]: [59, 130, 246],     // Blue-500
    [MuscleGroup.GLUTES]: [147, 197, 253],        // Blue-300
    [MuscleGroup.CALVES]: [37, 99, 235],          // Blue-600
    [MuscleGroup.CARDIO]: [148, 163, 184],        // Slate-400
};

const COLORS = {
    primary: [16, 185, 129] as [number, number, number],      // Emerald-500
    accent: [52, 211, 153] as [number, number, number],       // Emerald-400
    text: [248, 250, 252] as [number, number, number],        // Slate-50
    lightText: [148, 163, 184] as [number, number, number],   // Slate-400
    border: [51, 65, 85] as [number, number, number],         // Slate-700
    background: [2, 6, 23] as [number, number, number],       // Slate-950
    cardBg: [15, 23, 42] as [number, number, number],         // Slate-900
};

/**
 * Draw vector donut chart using jsPDF drawing API
 */
const drawVectorDonutChart = (
    doc: jsPDF,
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    report: WeeklyReport
) => {
    const totalVolume = report.stats.totalVolume;
    let currentAngle = -Math.PI / 2; // Start at top

    // Draw each segment
    report.muscleDistribution.forEach((muscle, index) => {
        const percentage = muscle.totalWeight / totalVolume;
        const segmentAngle = 2 * Math.PI * percentage;
        const endAngle = currentAngle + segmentAngle;

        // Get color for this muscle group
        const color = MUSCLE_COLORS[muscle.muscle] || [150, 150, 150];
        doc.setFillColor(...color);
        doc.setDrawColor(...COLORS.background);
        doc.setLineWidth(1);

        // Draw donut segment using path
        const steps = 50;
        const outerPoints: [number, number][] = [];
        const innerPoints: [number, number][] = [];

        for (let i = 0; i <= steps; i++) {
            const angle = currentAngle + ((endAngle - currentAngle) * i / steps);
            outerPoints.push([
                centerX + outerRadius * Math.cos(angle),
                centerY + outerRadius * Math.sin(angle)
            ]);
            innerPoints.push([
                centerX + innerRadius * Math.cos(angle),
                centerY + innerRadius * Math.sin(angle)
            ]);
        }

        // Create path for donut segment
        doc.moveTo(outerPoints[0][0], outerPoints[0][1]);
        outerPoints.forEach(([x, y]) => doc.lineTo(x, y));
        innerPoints.reverse().forEach(([x, y]) => doc.lineTo(x, y));
        doc.lineTo(outerPoints[0][0], outerPoints[0][1]);
        doc.fillStroke();

        // Add percentage label if segment is large enough
        if (percentage > 0.05) {
            const midAngle = (currentAngle + endAngle) / 2;
            const labelRadius = (outerRadius + innerRadius) / 2;
            const labelX = centerX + labelRadius * Math.cos(midAngle);
            const labelY = centerY + labelRadius * Math.sin(midAngle);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${(percentage * 100).toFixed(1)}%`, labelX, labelY, { align: 'center' });
        }

        currentAngle = endAngle;
    });

    // Draw center circle
    doc.setFillColor(...COLORS.background);
    doc.circle(centerX, centerY, innerRadius, 'F');

    // Add center text
    doc.setTextColor(...COLORS.lightText);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Volume', centerX, centerY - 5, { align: 'center' });

    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totalVolume}kg`, centerX, centerY + 5, { align: 'center' });
};

/**
 * Draw legend using vector graphics
 */
const drawVectorLegend = (
    doc: jsPDF,
    startX: number,
    startY: number,
    report: WeeklyReport
) => {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Muscle Groups', startX, startY);

    let y = startY + 10;
    const itemHeight = 8;

    report.muscleDistribution.forEach((muscle) => {
        const color = MUSCLE_COLORS[muscle.muscle] || [150, 150, 150];
        const percentage = ((muscle.totalWeight / report.stats.totalVolume) * 100).toFixed(1);

        // Color box
        doc.setFillColor(...color);
        doc.rect(startX, y - 3, 5, 5, 'F');

        // Muscle name
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(muscle.muscle, startX + 8, y);

        // Weight and percentage
        doc.setTextColor(...COLORS.lightText);
        doc.setFontSize(9);
        const valueText = `${Math.round(muscle.totalWeight)}kg (${percentage}%)`;
        doc.text(valueText, startX + 80, y);

        y += itemHeight;
    });
};

/**
 * Draw statistics cards using vector graphics
 */
const drawVectorStatsCards = (
    doc: jsPDF,
    startX: number,
    startY: number,
    report: WeeklyReport
) => {
    const stats = [
        { label: 'Exercises', value: report.stats.totalExercises.toString() },
        { label: 'Sets', value: report.stats.totalSets.toString() },
        { label: 'Reps', value: report.stats.totalReps.toString() },
        { label: 'Volume', value: `${report.stats.totalVolume}kg` },
        { label: 'Duration', value: `${report.stats.totalDuration}min` },
        { label: 'Calories', value: `${report.stats.totalCalories}kcal` }
    ];

    const cardWidth = 50;
    const cardHeight = 25;
    const gap = 5;

    stats.forEach((stat, index) => {
        const x = startX + (index % 3) * (cardWidth + gap);
        const y = startY + Math.floor(index / 3) * (cardHeight + gap);

        // Card background
        doc.setFillColor(...COLORS.cardBg);
        doc.setDrawColor(...COLORS.border);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

        // Label
        doc.setTextColor(...COLORS.lightText);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(stat.label, x + cardWidth / 2, y + 8, { align: 'center' });

        // Value
        doc.setTextColor(...COLORS.accent);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value, x + cardWidth / 2, y + 18, { align: 'center' });
    });
};

/**
 * Draw progress indicators
 */
const drawProgressIndicators = (
    doc: jsPDF,
    startX: number,
    startY: number,
    report: WeeklyReport
) => {
    if (!report.weeklyProgress) return;

    doc.setTextColor(...COLORS.text);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Weekly Progress', startX, startY);

    const progress = [
        { label: 'Volume Change', value: report.weeklyProgress.volumeChange },
        { label: 'Sets Change', value: report.weeklyProgress.setsChange },
        { label: 'Reps Change', value: report.weeklyProgress.repsChange }
    ];

    let y = startY + 10;

    progress.forEach((item) => {
        // Label
        doc.setTextColor(...COLORS.lightText);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, startX, y);

        // Value with color coding
        const isPositive = item.value > 0;
        const isNegative = item.value < 0;

        if (isPositive) {
            doc.setTextColor(34, 197, 94); // Green
            doc.text(`+${item.value.toFixed(1)}%`, startX + 60, y);
        } else if (isNegative) {
            doc.setTextColor(239, 68, 68); // Red
            doc.text(`${item.value.toFixed(1)}%`, startX + 60, y);
        } else {
            doc.setTextColor(...COLORS.lightText);
            doc.text('0%', startX + 60, y);
        }

        y += 8;
    });
};

/**
 * Generate vector-based weekly report PDF
 */
export const generateVectorWeeklyReportPDF = async (report: WeeklyReport): Promise<void> => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // Background
        doc.setFillColor(...COLORS.background);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Header
        doc.setFillColor(...COLORS.cardBg);
        doc.rect(0, 0, pageWidth, 50, 'F');

        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ZenFit Weekly Report', pageWidth / 2, 20, { align: 'center' });

        doc.setTextColor(...COLORS.lightText);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Week ${report.weekNumber}, ${report.year} | ${report.dateRange.start} to ${report.dateRange.end}`,
            pageWidth / 2,
            35,
            { align: 'center' }
        );

        // Donut Chart
        const chartCenterX = 70;
        const chartCenterY = 100;
        const outerRadius = 35;
        const innerRadius = 20;

        drawVectorDonutChart(doc, chartCenterX, chartCenterY, outerRadius, innerRadius, report);

        // Legend
        drawVectorLegend(doc, 120, 70, report);

        // Statistics Cards
        drawVectorStatsCards(doc, margin, 160, report);

        // Progress Indicators (if available)
        if (report.weeklyProgress) {
            drawProgressIndicators(doc, margin, 220, report);
        }

        // Muscle Distribution Table
        let tableY = report.weeklyProgress ? 280 : 220;

        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Muscle Distribution Details', margin, tableY);

        tableY += 10;

        // Table header
        doc.setFillColor(...COLORS.cardBg);
        doc.setDrawColor(...COLORS.border);
        doc.rect(margin, tableY, pageWidth - 2 * margin, 8, 'FD');

        doc.setTextColor(...COLORS.accent);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        const headers = ['Muscle Group', 'Sets', 'Volume (kg)', 'Percentage'];
        const colWidths = [60, 20, 30, 30];
        let x = margin + 2;

        headers.forEach((header, i) => {
            doc.text(header, x, tableY + 5);
            x += colWidths[i];
        });

        tableY += 8;

        // Table rows
        doc.setFont('helvetica', 'normal');
        report.muscleDistribution.forEach((muscle, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(30, 41, 59); // Alternate row color
                doc.rect(margin, tableY, pageWidth - 2 * margin, 6, 'F');
            }

            doc.setDrawColor(...COLORS.border);
            doc.rect(margin, tableY, pageWidth - 2 * margin, 6, 'S');

            doc.setTextColor(...COLORS.text);
            doc.setFontSize(9);

            x = margin + 2;
            const percentage = ((muscle.totalWeight / report.stats.totalVolume) * 100).toFixed(1);

            doc.text(muscle.muscle, x, tableY + 4);
            x += colWidths[0];

            doc.text(muscle.sets.toString(), x, tableY + 4);
            x += colWidths[1];

            doc.text(Math.round(muscle.totalWeight).toString(), x, tableY + 4);
            x += colWidths[2];

            doc.text(`${percentage}%`, x, tableY + 4);

            tableY += 6;
        });

        // Footer
        doc.setTextColor(...COLORS.lightText);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Generated by ZenFit Pro | ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );

        // Save PDF
        const filename = `ZenFit_Vector_Report_Week_${report.weekNumber}_${report.year}.pdf`;

        try {
            // Try File System Access API
            // @ts-ignore
            if (window.showSaveFilePicker) {
                // @ts-ignore
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PDF Document',
                        accept: { 'application/pdf': ['.pdf'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(doc.output('blob'));
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
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (error) {
        console.error('Vector PDF generation error:', error);
        throw new Error('Failed to generate vector PDF. Please try again.');
    }
};