import jsPDF from 'jspdf';
import { showToast } from '@/components/Toast';
import { svg2pdf } from 'svg2pdf.js';
import type { WorkoutSession, UserProfile, ActiveExercise } from '@/shared/types';
import { MuscleGroup } from '@/shared/types';
import { MUSCLE_THEME, MUSCLE_COLORS_RGB, getMuscleColorRGB } from '../../anatomy/constants/muscleColors';
import { calculateAdvancedCalories } from '../../profile/services/CalorieCalculationService';
import { generateMuscleHighlights, generateMusclePathsSVG, generateMuscleGradients, MUSCLE_VIEW_MAPPING_ENHANCED } from '../../anatomy/services/MuscleHighlightService';
import { BODY_PATHS, MUSCLE_PATHS } from '../../anatomy/constants/musclePaths';
import {
    PDF_COLORS,
    PDF_FONTS,
    FONT_SIZES,
    LAYOUT,
    getContentWidth,
    BENTO_GRID,
    TABLE,
    SVG_CONFIG
} from '../constants/pdfStyles';
import type { PDFConfig } from '../types/PDFConfig';
import { DEFAULT_PDF_CONFIG } from '../types/PDFConfig';

/**
 * Load custom fonts for PDF (Oswald + Inter + NotoSansSC)
 * 三字体系统：
 * - Oswald: 数字显示
 * - Inter: 英文标签和单位
 * - NotoSansSC: 中文内容
 */
const loadFonts = async (doc: jsPDF): Promise<void> => {
    try {
        // Load NotoSansSC fonts (中文支持)
        const notoRegularResponse = await fetch('/fonts/NotoSansSC-Regular.ttf');
        const notoRegularBlob = await notoRegularResponse.blob();
        const notoRegularBase64 = await blobToBase64(notoRegularBlob);

        const notoBoldResponse = await fetch('/fonts/NotoSansSC-Bold.ttf');
        const notoBoldBlob = await notoBoldResponse.blob();
        const notoBoldBase64 = await blobToBase64(notoBoldBlob);

        // Load Inter fonts (英文标签)
        const interRegularResponse = await fetch('/fonts/Inter-Regular.ttf');
        const interRegularBlob = await interRegularResponse.blob();
        const interRegularBase64 = await blobToBase64(interRegularBlob);

        const interBoldResponse = await fetch('/fonts/Inter-Bold.ttf');
        const interBoldBlob = await interBoldResponse.blob();
        const interBoldBase64 = await blobToBase64(interBoldBlob);

        const interSemiBoldResponse = await fetch('/fonts/Inter-SemiBold.ttf');
        const interSemiBoldBlob = await interSemiBoldResponse.blob();
        const interSemiBoldBase64 = await blobToBase64(interSemiBoldBlob);

        // Load Oswald fonts (数字显示)
        const oswaldBoldResponse = await fetch('/fonts/Oswald-Bold.ttf');
        const oswaldBoldBlob = await oswaldBoldResponse.blob();
        const oswaldBoldBase64 = await blobToBase64(oswaldBoldBlob);

        const oswaldRegularResponse = await fetch('/fonts/Oswald-Regular.ttf');
        const oswaldRegularBlob = await oswaldRegularResponse.blob();
        const oswaldRegularBase64 = await blobToBase64(oswaldRegularBlob);

        // Add NotoSansSC fonts to jsPDF
        doc.addFileToVFS('NotoSansSC-Regular.ttf', notoRegularBase64.split(',')[1]);
        doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal');

        doc.addFileToVFS('NotoSansSC-Bold.ttf', notoBoldBase64.split(',')[1]);
        doc.addFont('NotoSansSC-Bold.ttf', 'NotoSansSC', 'bold');

        // Add Inter fonts to jsPDF
        doc.addFileToVFS('Inter-Regular.ttf', interRegularBase64.split(',')[1]);
        doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');

        doc.addFileToVFS('Inter-Bold.ttf', interBoldBase64.split(',')[1]);
        doc.addFont('Inter-Bold.ttf', 'Inter', 'bold');

        doc.addFileToVFS('Inter-SemiBold.ttf', interSemiBoldBase64.split(',')[1]);
        doc.addFont('Inter-SemiBold.ttf', 'Inter', 'semibold');

        // Add Oswald fonts to jsPDF
        doc.addFileToVFS('Oswald-Bold.ttf', oswaldBoldBase64.split(',')[1]);
        doc.addFont('Oswald-Bold.ttf', 'Oswald', 'bold');

        doc.addFileToVFS('Oswald-Regular.ttf', oswaldRegularBase64.split(',')[1]);
        doc.addFont('Oswald-Regular.ttf', 'Oswald', 'normal');

        console.log('✅ All fonts loaded successfully (Oswald + Inter + NotoSansSC)');
    } catch (error) {
        console.error('❌ Failed to load fonts:', error);
        throw new Error('Failed to load fonts. Please ensure font files are in /public/fonts/');
    }
};

/**
 * Convert Blob to Base64
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * PDF Export Service - Version 4.0
 * Modern Professional Design with A4 Optimization
 *
 * Key Features:
 * - Modern card-based layout
 * - Optimized for A4 paper (210x297mm)
 * - Professional typography hierarchy
 * - Improved space utilization
 * - Enhanced visual hierarchy
 * - Better content organization
 */

// Modern Professional Color Palette
const MODERN_COLORS = {
    // Primary brand colors
    primary: [37, 99, 235] as [number, number, number],        // #2563eb (Blue-600)
    primaryLight: [59, 130, 246] as [number, number, number],  // #3b82f6 (Blue-500)
    primaryDark: [29, 78, 216] as [number, number, number],    // #1d4ed8 (Blue-700)

    // Neutral colors for professional look
    neutral900: [15, 23, 42] as [number, number, number],      // #0f172a (Slate-900)
    neutral800: [30, 41, 59] as [number, number, number],      // #1e293b (Slate-800)
    neutral700: [51, 65, 85] as [number, number, number],      // #334155 (Slate-700)
    neutral600: [71, 85, 105] as [number, number, number],     // #475569 (Slate-600)
    neutral500: [100, 116, 139] as [number, number, number],   // #64748b (Slate-500)
    neutral400: [148, 163, 184] as [number, number, number],   // #94a3b8 (Slate-400)
    neutral300: [203, 213, 225] as [number, number, number],   // #cbd5e1 (Slate-300)
    neutral200: [226, 232, 240] as [number, number, number],   // #e2e8f0 (Slate-200)
    neutral100: [241, 245, 249] as [number, number, number],   // #f1f5f9 (Slate-100)
    neutral50: [248, 250, 252] as [number, number, number],    // #f8fafc (Slate-50)

    // Background colors
    white: [255, 255, 255] as [number, number, number],        // #ffffff
    background: [249, 250, 251] as [number, number, number],   // #f9fafb (Gray-50)

    // Accent colors
    success: [34, 197, 94] as [number, number, number],        // #22c55e (Green-500)
    warning: [245, 158, 11] as [number, number, number],       // #f59e0b (Amber-500)
    info: [59, 130, 246] as [number, number, number],          // #3b82f6 (Blue-500)
};

interface MuscleGroupData {
    muscle: MuscleGroup;
    totalSets: number;
    totalWeight: number;
    exerciseCount: number;
    exercises: string[];
}

/**
 * Group exercises by primary muscle group
 */
const groupByMuscle = (exercises: ActiveExercise[]): MuscleGroupData[] => {
    const grouped = new Map<MuscleGroup, MuscleGroupData>();

    exercises.forEach(ex => {
        const completedSets = ex.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        const totalWeight = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

        if (!grouped.has(ex.muscleGroup)) {
            grouped.set(ex.muscleGroup, {
                muscle: ex.muscleGroup,
                totalSets: 0,
                totalWeight: 0,
                exerciseCount: 0,
                exercises: []
            });
        }

        const data = grouped.get(ex.muscleGroup)!;
        data.totalSets += completedSets.length;
        data.totalWeight += totalWeight;
        data.exerciseCount += 1;
        data.exercises.push(ex.exerciseName);
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalWeight - a.totalWeight);
};

/**
 * Convert SVG string to Base64 for PDF embedding
 */
const convertSvgToBase64 = (svgString: string): string => {
    try {
        // Encode SVG string to Base64 (handle Unicode characters properly)
        const base64 = btoa(unescape(encodeURIComponent(svgString)));
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        console.error('SVG to Base64 conversion error:', error);
        return '';
    }
};

/**
 * Generate muscle highlight SVG from workout session - Swiss Style (工程图纸感)
 */
const getMuscleHighlightSvg = (session: WorkoutSession, view: 'front' | 'back' = 'front'): string => {
    try {
        // Generate muscle highlights from session data
        const highlights = generateMuscleHighlights([session], 'daily');
        const highlightMap = new Map(highlights.map(h => [h.muscle, h]));

        // Get base body silhouette and detail paths
        const paths = view === 'front' ? BODY_PATHS.front : BODY_PATHS.back;
        const basePath = paths.baseSilhouette;
        const detailPath = (paths as any).detail1 || '';

        // Get all muscles for this view
        const viewMapping = MUSCLE_VIEW_MAPPING_ENHANCED[view];

        // Generate ALL muscle paths (both highlighted and non-highlighted)
        let allMusclePaths = '';

        Object.entries(viewMapping).forEach(([muscleGroup, pathKey]) => {
            const muscle = muscleGroup as MuscleGroup;
            const path = MUSCLE_PATHS[pathKey as keyof typeof MUSCLE_PATHS];

            if (!path) return;

            const highlight = highlightMap.get(muscle);

            if (highlight) {
                // Highlighted muscle - 使用带透明度的颜色 (工程图纸感)
                const { color, opacity } = highlight;
                allMusclePaths += `
                    <path
                        d="${path}"
                        fill="rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity * 0.6})"
                        stroke="rgba(${color[0]}, ${color[1]}, ${color[2]}, 1)"
                        stroke-width="1"
                    />`;
            } else {
                // Non-highlighted muscle - 极浅的灰色，几乎透明
                allMusclePaths += `
                    <path
                        d="${path}"
                        fill="none"
                        stroke="#cbd5e1"
                        stroke-width="0.3"
                        stroke-opacity="0.5"
                    />`;
            }
        });

        // Construct complete SVG - 工程图纸风格
        const svgContent = `
            <svg viewBox="-30 0 400 700" xmlns="http://www.w3.org/2000/svg">
                <!-- Base silhouette - 透明填充，只保留边框 -->
                <path d="${basePath}" fill="none" stroke="#94a3b8" stroke-width="0.5"/>
                <!-- Detail layer - 仅正面视图 -->
                ${detailPath ? `<path d="${detailPath}" fill="none" stroke="#94a3b8" stroke-width="0.3"/>` : ''}
                <!-- All muscle regions -->
                ${allMusclePaths}
            </svg>
        `;

        return svgContent.trim();
    } catch (error) {
        console.error('Muscle highlight SVG generation error:', error);
        return '';
    }
};

/**
 * Draw Compact Minimal Table - 视觉精修版
 *
 * 修复清单：
 * 1. ✅ 表格标题缩小至7pt并应用字间距
 */
const drawMinimalTable = (
    doc: jsPDF,
    exercises: ActiveExercise[],
    startY: number,
    config: PDFConfig = DEFAULT_PDF_CONFIG
): number => {
    const margin = config.global.margin;
    const contentWidth = getContentWidth();

    // 表头
    const headers = ['EXERCISE', 'SETS', 'REPS', 'WEIGHT (KG)', 'VOL'];

    // 计算列宽（基于内容宽度的百分比）
    const colWidths = [
        contentWidth * TABLE.COL_EXERCISE,
        contentWidth * TABLE.COL_SETS,
        contentWidth * TABLE.COL_REPS,
        contentWidth * TABLE.COL_WEIGHT,
        contentWidth * TABLE.COL_VOLUME
    ];

    let y = startY;

    // 【终极修复4】移除表头上方的多余线条，只在标题下方绘制
    y += 2; // 表头上方2mm空白

    // FIX: 表头字号缩小至7pt并应用字间距 (Inter Bold)
    doc.setFont('Inter', 'bold');
    doc.setFontSize(config.table.headerFontSize);
    doc.setTextColor(...PDF_COLORS.TEXT_LIGHT);

    let colX = margin;
    headers.forEach((h, i) => {
        const align = i > 0 ? 'right' : 'left';
        const textX = i > 0 ? colX + colWidths[i] : colX;

        // FIX: 应用字间距
        if (i === 0) {
            // 第一列左对齐
            drawSpacedText(doc, h, textX, y, config.table.headerCharSpacing);
        } else {
            // 其他列右对齐
            drawSpacedText(doc, h, textX, y, config.table.headerCharSpacing, { align: 'right' });
        }

        colX += colWidths[i];
    });

    y += TABLE.HEADER_HEIGHT;

    // 绘制内容行 (紧凑版)
    exercises.forEach((ex) => {
        const completedSets = ex.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        // 动作名称 (NotoSansSC Bold - 支持中文)
        doc.setFont('NotoSansSC', 'bold');
        doc.setFontSize(FONT_SIZES.BODY_SMALL);
        doc.setTextColor(...PDF_COLORS.TEXT_MAIN);

        // 截断过长的名称
        const maxNameLength = 30;
        const name = ex.exerciseName.length > maxNameLength
            ? ex.exerciseName.substring(0, 27) + '...'
            : ex.exerciseName;
        doc.text(name, margin, y);

        // 辅助信息 (肌肉群) - 减小间距
        doc.setFontSize(FONT_SIZES.CAPTION);
        doc.setTextColor(...PDF_COLORS.TEXT_LIGHT);
        doc.text(ex.muscleGroup, margin, y + 3);

        // 数据列 - 强制使用 Oswald Bold
        doc.setFont('Oswald', 'bold');
        doc.setFontSize(FONT_SIZES.BODY_MEDIUM);
        doc.setTextColor(...PDF_COLORS.TEXT_MAIN);

        colX = margin + colWidths[0];

        // Sets - Oswald Bold
        doc.text(completedSets.length.toString(), colX + colWidths[1], y + 1.5, { align: 'right' });
        colX += colWidths[1];

        // Reps - Oswald Bold
        const reps = completedSets.map(s => s.reps).join(',');
        const repsDisplay = reps.length > 15 ? reps.substring(0, 12) + '...' : reps;
        doc.text(repsDisplay, colX + colWidths[2], y + 1.5, { align: 'right' });
        colX += colWidths[2];

        // Weight - Oswald Bold
        const weights = completedSets.map(s => s.weight).join(',');
        const weightsDisplay = weights.length > 15 ? weights.substring(0, 12) + '...' : weights;
        doc.text(weightsDisplay, colX + colWidths[3], y + 1.5, { align: 'right' });
        colX += colWidths[3];

        // Volume - Oswald Bold (加粗)
        const volume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
        doc.text(Math.round(volume).toString(), colX + colWidths[4], y + 1.5, { align: 'right' });

        // 【修复】删除表格行之间的分割线
        // doc.setDrawColor(241, 245, 249); // #f1f5f9
        // doc.setLineWidth(config.global.lineWidth);
        // doc.line(margin, y + 5.5, margin + contentWidth, y + 5.5);

        y += config.table.rowHeight;
    });

    return y + LAYOUT.SPACING_S; // 紧凑间距
};

/**
 * Check if content will overflow page and add new page if needed
 */
const checkPageBreak = (doc: jsPDF, currentY: number, contentHeight: number, maxPageHeight: number = 297): number => {
    const bottomMargin = 19; // 修改为19mm底部边距 (0.75英寸)

    if (currentY + contentHeight > maxPageHeight - bottomMargin) {
        doc.addPage();
        return 19; // 重置到新页面顶部（19mm顶部边距）
    }

    return currentY;
};

/**
 * Draw Compact Swiss Style Header - 紧凑版瑞士平面设计风格标题
 */
const drawSwissHeader = (
    doc: jsPDF,
    session: WorkoutSession,
    userProfile: UserProfile,
    startY: number
): number => {
    const pageWidth = LAYOUT.PAGE_WIDTH;
    const margin = LAYOUT.MARGIN;
    let y = startY;

    // 左侧：紧凑的 WORKOUT REPORT (Oswald Bold)
    doc.setFont('Oswald', 'bold');
    doc.setFontSize(FONT_SIZES.TITLE_LARGE);
    doc.setTextColor(...PDF_COLORS.TEXT_MAIN);
    doc.text('WORKOUT', margin, y);

    // 换行，加强调色 - 减小行距
    y += 14;
    doc.setTextColor(...PDF_COLORS.ACCENT);
    doc.text('REPORT', margin, y);

    // 右侧：日期和体重 (右对齐)
    const sessionDate = new Date(session.date);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[sessionDate.getMonth()];
    const day = sessionDate.getDate();
    const year = sessionDate.getFullYear();
    const dateStr = `${month} ${day}, ${year}`;

    // DATE 标签 (Inter Bold, 灰色)
    doc.setFont('Inter', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // #94a3b8 灰色
    doc.text('DATE', pageWidth - margin, startY, { align: 'right' });

    // 日期 (Inter Bold, 黑色)
    doc.setFont('Inter', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // #0f172a 黑色
    doc.text(dateStr, pageWidth - margin, startY + 6, { align: 'right' });

    // 体重 (Inter Regular, 灰色)
    doc.setFont('Inter', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // #94a3b8 灰色
    doc.text(`${userProfile.weight.toFixed(1)} KG BW`, pageWidth - margin, startY + 12, { align: 'right' });

    // 底部粗分割线 - 减小间距
    y += 6;
    doc.setDrawColor(...PDF_COLORS.LINE_BOLD);
    doc.setLineWidth(LAYOUT.LINE_BOLD);
    doc.line(margin, y, pageWidth - margin, y);

    return y + LAYOUT.SPACING_M; // 紧凑间距
};

/**
 * 辅助函数：绘制带字间距的文本
 * @param doc jsPDF实例
 * @param text 要绘制的文本
 * @param x 起始X坐标
 * @param y Y坐标
 * @param spacing 字符间距（mm）
 * @param options 对齐选项
 * @returns 文本总宽度
 */
const drawSpacedText = (
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    spacing: number,
    options?: { align?: 'left' | 'center' | 'right' }
): number => {
    // 【High-Fashion修复】强制修正逻辑：预计算所有字符加间距的总宽度
    const chars = text.split('');
    let totalW = chars.reduce((acc, char) => acc + doc.getTextWidth(char), 0) + (chars.length - 1) * spacing;

    let currentX = x;

    // 根据对齐方式调整起始X坐标
    if (options?.align === 'center') {
        currentX = x - totalW / 2;
    } else if (options?.align === 'right') {
        currentX = x - totalW;
    }

    // 绘制每个字符，严格控制步进
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        doc.text(char, currentX, y);
        currentX += doc.getTextWidth(char) + spacing;
    }

    return totalW;
};

/**
 * Draw Hero Metrics - 双基准线系统版（最终修正）
 *
 * 核心原则：
 * 1. 基准线A (rowTopY): 所有标签的顶部起始位置
 * 2. 基准线B (baseLineY): 所有大数字的底端基线位置
 * 3. labelToValueGap: 标签顶部到数字底部的绝对垂直距离（固定18mm）
 */
const drawHeroMetrics = (
    doc: jsPDF,
    session: WorkoutSession,
    userProfile: UserProfile,
    startY: number,
    config: PDFConfig = DEFAULT_PDF_CONFIG
): number => {
    // ========================================
    // 1. 定义全局垂直参数（强制性）
    // ========================================
    const margin = config.global.margin;
    const rowTopY = startY + config.heroMetrics.rowTopY;  // 基准线A：所有标签的顶部起始位置
    const labelToValueGap = config.heroMetrics.labelToValueGap;
    const baseLineY = rowTopY + labelToValueGap; // 基准线B：所有大数字的底端（Baseline）位置

    // 颜色定义
    const COLOR_BLACK = [15, 23, 42] as [number, number, number];
    const COLOR_GREY = [148, 163, 184] as [number, number, number];

    // 计算数据
    const advancedCalories = (() => {
        try {
            return calculateAdvancedCalories(session, userProfile);
        } catch (error) {
            return Math.round((session.durationMinutes || 0) / 60 * 5 * userProfile.weight);
        }
    })();

    const totalSets = session.exercises.reduce((sum, ex) =>
        sum + ex.sets.filter(s => s.completed).length, 0
    );

    // ========================================
    // 2. 左侧：TOTAL VOLUME
    // ========================================
    // 标签层级：使用基准线A (rowTopY)
    doc.setFont('Inter', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_GREY);
    drawSpacedText(doc, 'TOTAL VOLUME', margin, rowTopY, config.heroMetrics.charSpacing);

    // 数值层级：使用基准线B (baseLineY) - Oswald Bold
    doc.setFont('Oswald', 'bold');
    doc.setFontSize(config.heroMetrics.heroFontSize);
    doc.setTextColor(...COLOR_BLACK);
    const volumeStr = session.volumeLoad.toLocaleString();
    doc.text(volumeStr, margin - 1, baseLineY); // 微调X坐标

    // KG单位 - 与数字底部基线对齐
    const volWidth = doc.getTextWidth(volumeStr);
    doc.setFont('Inter', 'normal');
    doc.setFontSize(18);
    doc.setTextColor(...COLOR_GREY);
    doc.text('KG', margin + volWidth + 5, baseLineY); // 与数字使用相同的基线

    // ========================================
    // 3. 垂直分割线 - 动态避让机制
    // ========================================
    const dividerX = Math.max(config.heroMetrics.dividerX, margin + volWidth + 25);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(config.global.lineWidth);
    doc.line(dividerX, rowTopY - 2, dividerX, baseLineY + 2);

    // ========================================
    // 4. 右侧：三个指标横向排布（动态定位）
    // ========================================
    // 【修复】右侧指标重排：SETS 强制右对齐，与顶部横线对齐
    const pageWidth = LAYOUT.PAGE_WIDTH;

    // 重新排列顺序：DURATION → CALORIES → SETS
    // CALORIES 需要在 DURATION 和 SETS 之间视觉居中
    const durationX = dividerX + 8;
    const setsX = pageWidth - margin;
    const caloriesX = (durationX + setsX) / 2; // 计算中点位置

    const metrics = [
        { label: 'DURATION', val: session.durationMinutes || 0, unit: 'MIN', x: durationX },
        { label: 'CALORIES', val: advancedCalories, unit: 'KCAL', x: caloriesX },
        { label: 'SETS', val: totalSets, unit: '', x: setsX } // 与页面右边距对齐
    ];

    metrics.forEach((m, index) => {
        // 计算数值宽度用于标签居中 (Oswald Bold 32pt)
        doc.setFont('Oswald', 'bold');
        doc.setFontSize(32);
        const valStr = m.val.toString();
        const valWidth = doc.getTextWidth(valStr);

        // 【修复】SETS 强制右对齐，数字右边缘与页面右边距对齐
        let drawX: number;
        let centerX: number;

        if (index === 2) {
            // SETS: 右对齐，数字右边缘距离页面右边距 rightPaddingRight
            drawX = pageWidth - margin - valWidth - config.heroMetrics.rightPaddingRight;
            centerX = drawX + (valWidth / 2);
        } else {
            // 其他指标：使用预设的 x 坐标
            drawX = m.x;
            centerX = drawX + (valWidth / 2);
        }

        // 标签层级：使用基准线A (rowTopY) - Inter Bold 8pt + 独立偏移
        doc.setFont('Inter', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_GREY);

        // 获取当前指标的偏移量
        let labelOffsetX = 0;
        let labelOffsetY = 0;

        if (index === 0) {
            // DURATION
            labelOffsetX = config.heroMetrics.durationLabelOffsetX;
            labelOffsetY = config.heroMetrics.durationLabelOffsetY;
        } else if (index === 1) {
            // CALORIES
            labelOffsetX = config.heroMetrics.caloriesLabelOffsetX;
            labelOffsetY = config.heroMetrics.caloriesLabelOffsetY;
        } else if (index === 2) {
            // SETS
            labelOffsetX = config.heroMetrics.setsLabelOffsetX;
            labelOffsetY = config.heroMetrics.setsLabelOffsetY;
        }

        // 标签对齐方式：所有标签都左对齐
        const labelX = drawX + labelOffsetX;
        const labelY = rowTopY + labelOffsetY;
        drawSpacedText(doc, m.label, labelX, labelY, config.heroMetrics.charSpacing * 0.67, { align: 'left' });

        // 数值层级：使用基准线B (baseLineY) - Oswald Bold 32pt
        // 【关键修复】所有数字必须使用相同的 baseLineY，不应用垂直偏移
        doc.setFont('Oswald', 'bold');
        doc.setFontSize(32);
        doc.setTextColor(...COLOR_BLACK);
        doc.text(valStr, drawX + labelOffsetX, baseLineY); // 只应用水平偏移，Y坐标固定为baseLineY

        // 单位 (Right of Value) - Inter Regular，基线对齐
        // 【关键修复】单位也必须使用相同的 baseLineY
        if (m.unit) {
            doc.setFont('Inter', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...COLOR_GREY);
            doc.text(m.unit, drawX + valWidth + 1 + labelOffsetX, baseLineY); // Y坐标固定为baseLineY
        }
    });

    return baseLineY + 15; // 增加返回间距
};

/**
 * Draw modern card container (保留用于图表等)
 */
const drawCard = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string
) => {
    // Card shadow (subtle)
    doc.setFillColor(0, 0, 0, 0.05);
    doc.roundedRect(x + 1, y + 1, width, height, 4, 4, 'F');

    // Card background
    doc.setFillColor(...MODERN_COLORS.white);
    doc.setDrawColor(...MODERN_COLORS.neutral200);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, width, height, 4, 4, 'FD');

    // Card title if provided
    if (title) {
        doc.setFillColor(...MODERN_COLORS.primary);
        doc.roundedRect(x, y, width, 12, 4, 4, 'F');
        doc.roundedRect(x, y + 8, width, 4, 0, 0, 'F');

        doc.setTextColor(...MODERN_COLORS.white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 6, y + 8);
    }
};

/**
 * 精确修复版：解决对齐偏差、文字碰撞与重心不稳
 */
const drawVerticalStackedBar = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    muscleData: MuscleGroupData[]
): number => {
    // 【修复】检查 muscleData 是否为空
    if (!muscleData || muscleData.length === 0) {
        console.warn('⚠️ No muscle data available for chart');
        return y; // 返回当前Y坐标，跳过绘制
    }

    const total = muscleData.reduce((sum, d) => sum + d.totalWeight, 0);

    // 【修复】检查 total 是否为0
    if (total === 0) {
        console.warn('⚠️ Total weight is 0, skipping chart');
        return y;
    }

    const centerX = x + width / 2; // 【关键】建立统一的绝对中心轴线
    let currentY = y;

    const primaryMuscle = muscleData[0];
    const primaryPercentage = ((primaryMuscle.totalWeight / total) * 100).toFixed(0);

    // 1. 顶部标签：PRIMARY TARGET (Inter Bold 8pt)
    doc.setFont('Inter', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    // 使用手动步进法拉开字间距，并确保绝对中心对齐
    drawSpacedText(doc, 'PRIMARY TARGET', centerX, currentY, 0.8, { align: 'center' });

    // 2. 增加间距 (8mm)，彻底消除碰撞
    currentY += 8;

    // 3. 核心标题：ABS 82% (Oswald Bold)
    doc.setFont('Oswald', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    // 强制使用统一中心 X 坐标
    doc.text(`${primaryMuscle.muscle.toUpperCase()} ${primaryPercentage}%`, centerX, currentY, { align: 'center' });

    // 4. 下移 (10mm)，为比例条顶端留出"呼吸感"
    currentY += 10;

    // 5. 比例条参数调整：收窄宽度，增加高度
    const barWidth = 14; // 从16mm进一步收窄，增加精密感
    const barHeight = 45; // 固定高度，防止向下挤压
    // 【像素级修复4】确保centerX严格等于barX + barWidth/2
    const barX = centerX - (barWidth / 2); // 严格居中计算，确保对齐精度
    const barStartY = currentY;

    // 绘制堆叠色块
    let stackY = barStartY;
    muscleData.forEach((data) => {
        const percentage = (data.totalWeight / total) * 100;
        const segmentHeight = (barHeight * percentage) / 100;

        let rgb = MUSCLE_THEME[data.muscle]?.rgb || [148, 163, 184] as [number, number, number];
        if (data.muscle === 'Abs') rgb = [37, 99, 235] as [number, number, number]; // 强制同步品牌蓝

        doc.setFillColor(...rgb);
        doc.rect(barX, stackY, barWidth, segmentHeight, 'F');

        // 分隔线
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.2);
        doc.line(barX, stackY, barX + barWidth, stackY);

        stackY += segmentHeight;
    });

    // 绘制外边框
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(barX, barStartY, barWidth, barHeight, 'S');

    // 6. 刻度线 (0-100%) - 使用更淡的颜色
    const scaleX = barX + barWidth + 2;
    doc.setFont('Oswald', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    [0, 25, 50, 75, 100].forEach(p => {
        const tickY = barStartY + barHeight * (1 - p / 100);
        doc.line(barX + barWidth, tickY, scaleX, tickY);
        doc.text(`${p}%`, scaleX + 1, tickY + 1);
    });

    // 7. 底部列表：向中心收拢 (Legend)
    currentY = barStartY + barHeight + 8;
    const secondaryMuscles = muscleData.slice(1, 4);

    secondaryMuscles.forEach((data) => {
        const percentage = ((data.totalWeight / total) * 100).toFixed(0).padStart(2, '0');
        const legendX = centerX - 18; // 统一向中心轴靠拢

        let rgb = MUSCLE_THEME[data.muscle]?.rgb || [148, 163, 184] as [number, number, number];
        doc.setFillColor(...rgb);
        doc.rect(legendX, currentY - 2, 2, 2, 'F');

        doc.setFont('Inter', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`${data.muscle.toUpperCase()} FOCUS ${percentage}%`, legendX + 4, currentY);
        currentY += 3.5;
    });

    return currentY;
};

// drawMuscleLegend函数已被整合到drawVerticalStackedBar中，不再需要单独的图例函数

/**
 * Generate Compact Single-Page Workout PDF - 紧凑单页版
 * @param session 训练会话数据
 * @param userProfile 用户资料
 * @param config PDF 配置参数
 * @param returnBlob 是否返回 blob 而不是下载（用于预览）
 * @returns 如果 returnBlob 为 true，返回 PDF blob URL
 */
export const generateWorkoutPDF = async (
    session: WorkoutSession,
    userProfile: UserProfile,
    config: PDFConfig = DEFAULT_PDF_CONFIG,
    returnBlob: boolean = false
): Promise<{ blob: Blob; fileName: string } | void> => {
    if (!session.exercises || session.exercises.length === 0) {
        throw new Error('Cannot export empty workout. Session must contain exercises.');
    }

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 加载并设置字体 (Oswald + Inter + NotoSansSC)
        await loadFonts(doc);
        doc.setFont('NotoSansSC', 'normal');

        const pageWidth = LAYOUT.PAGE_WIDTH;
        const pageHeight = LAYOUT.PAGE_HEIGHT;
        const margin = LAYOUT.MARGIN;
        const contentWidth = getContentWidth();
        let currentY = margin;

        // Clean white background (瑞士风格 - 纯白背景)
        doc.setFillColor(...PDF_COLORS.BG);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // 预先计算肌肉数据（用于Bento Grid中的Donut Chart）
        const muscleData = groupByMuscle(session.exercises);

        // === 1. COMPACT SWISS STYLE HEADER (Y: 15 -> ~35mm) ===
        currentY = drawSwissHeader(doc, session, userProfile, currentY);
        console.log(`📍 After Header: Y = ${currentY}mm`);

        // === 2. HERO METRICS (3080 Sample Style) (Y: ~35 -> ~80mm) ===
        currentY = drawHeroMetrics(doc, session, userProfile, currentY, config);
        console.log(`📍 After Hero Metrics: Y = ${currentY}mm`);

        // === 3. HIERARCHICAL BENTO GRID: 三栏式肌肉激活分析 ===
        // 增加间距
        currentY += 11;

        // 标题 (Oswald Bold) - 删除上方的多余分隔线
        doc.setFont('Oswald', 'bold');
        doc.setFontSize(FONT_SIZES.TITLE_SMALL);
        doc.setTextColor(...PDF_COLORS.TEXT_MAIN);
        doc.text('MUSCLE ACTIVATION ANALYSIS', margin, currentY);

        currentY += 6;

        // 固定解剖图高度至80mm（单页布局约束）
        const anatomyHeight = 80;
        const anatomyStartY = currentY;

        // FIX: 调整三栏布局宽度至 [30% | 40% | 30%]
        const totalWidth = contentWidth;
        const frontViewWidth = totalWidth * 0.30; // 30%
        const barWidth = totalWidth * 0.40; // 40%
        const backViewWidth = totalWidth * 0.30; // 30%

        // FIX: 收紧间距至2mm
        const columnGap = 2;

        // Generate muscle highlight SVG
        const frontSvg = getMuscleHighlightSvg(session, 'front');
        const backSvg = getMuscleHighlightSvg(session, 'back');

        // === 左栏：正面视图 (30%) ===
        if (frontSvg) {
            const frontX = margin;
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(frontSvg, 'image/svg+xml');
                const svgElement = svgDoc.documentElement as unknown as SVGElement;

                await svg2pdf(svgElement, doc, {
                    x: frontX,
                    y: anatomyStartY,
                    width: frontViewWidth,
                    height: anatomyHeight
                });

                // FIX: 标注紧贴解剖图脚部（2mm以内） (Inter Regular 7pt - 纯英文)
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184); // #94a3b8
                doc.setFont('Inter', 'normal');
                doc.text('FRONT VIEW', frontX + frontViewWidth / 2, anatomyStartY + anatomyHeight + 2, { align: 'center' });
            } catch (error) {
                console.error('Failed to add front muscle SVG:', error);
            }
        }

        // === 中栏：纵向堆叠比例条 (40%) ===
        const barX = margin + frontViewWidth + columnGap;
        const barY = anatomyStartY + 5; // 从顶部留5mm空间

        // 新的drawVerticalStackedBar已包含标题、比例条、刻度线和底部列表
        drawVerticalStackedBar(doc, barX, barY, barWidth - columnGap * 2, 55, muscleData);

        // === 右栏：背面视图 (30%) ===
        if (backSvg) {
            const backX = margin + frontViewWidth + barWidth + columnGap;
            try {
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(backSvg, 'image/svg+xml');
                const svgElement = svgDoc.documentElement as unknown as SVGElement;

                await svg2pdf(svgElement, doc, {
                    x: backX,
                    y: anatomyStartY,
                    width: backViewWidth,
                    height: anatomyHeight
                });

                // FIX: 标注紧贴解剖图脚部（2mm以内） (Inter Regular 7pt - 纯英文)
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184); // #94a3b8
                doc.setFont('Inter', 'normal');
                doc.text('BACK VIEW', backX + backViewWidth / 2, anatomyStartY + anatomyHeight + 2, { align: 'center' });
            } catch (error) {
                console.error('Failed to add back muscle SVG:', error);
            }
        }

        // 更新currentY（解剖图区域 + label空间）
        currentY = anatomyStartY + anatomyHeight + 8;

        console.log(`📍 After Anatomy: Y = ${currentY}mm`);

        // FINAL FIX: 表格安全检查 - 更严格的阈值（280mm）
        const footerSafeZone = 280;
        if (currentY > footerSafeZone) {
            console.warn(`⚠️ Content approaching page limit at Y=${currentY}mm, adding new page`);
            doc.addPage();
            currentY = 20; // 重置到新页面顶部
        }

        // === 4. COMPACT EXERCISE DETAILS TABLE ===
        // 【终极修复2】重构标题区：严格按照"先字后线"顺序，大幅增加间距

        currentY += 15; // 标题上方留15mm充足呼吸感

        // 1. 绘制标题 (Oswald Bold)
        doc.setFont('Oswald', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('EXERCISE DETAILS', margin, currentY);

        // 2. 【终极修复2】必须下移后再画线
        currentY += config.table.titleGap;

        // 3. 【终极修复2】标题下方的装饰线
        doc.setDrawColor(203, 213, 225); // neutral300
        doc.setLineWidth(config.global.lineWidth);
        doc.line(margin, currentY, margin + contentWidth, currentY);

        // 4. 线条下方留白
        currentY += 4;

        // 使用紧凑版极简表格
        currentY = drawMinimalTable(doc, session.exercises, currentY, config);

        console.log(`📍 After Table: Y = ${currentY}mm`);

        // === SINGLE PAGE CHECK ===
        const maxAllowedY = pageHeight - 15;
        if (currentY > maxAllowedY) {
            console.warn(`⚠️ Content overflow detected! Current Y: ${currentY}mm, Max: ${maxAllowedY}mm`);
            console.warn(`⚠️ Overflow: ${(currentY - maxAllowedY).toFixed(1)}mm beyond page limit`);
        } else {
            console.log(`✅ Single page layout successful! Final Y: ${currentY}mm (${(maxAllowedY - currentY).toFixed(1)}mm remaining)`);
        }

        // FIX 3: FOOTER - 固定在页面绝对底部
        const footerY = pageHeight - 10; // 距离底部10mm
        doc.setTextColor(...MODERN_COLORS.neutral400);
        doc.setFontSize(7);
        doc.setFont('Inter', 'normal');
        const footerDate = new Date();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const hours = footerDate.getHours().toString().padStart(2, '0');
        const minutes = footerDate.getMinutes().toString().padStart(2, '0');
        const day = footerDate.getDate().toString().padStart(2, '0');
        const month = monthNames[footerDate.getMonth()];
        const year = footerDate.getFullYear();
        const footerText = `GENERATED BY ZENFIT PRO  •  ${hours}:${minutes} ${day}/${month}/${year}`;
        drawSpacedText(doc, footerText, pageWidth / 2, footerY, 0.2, { align: 'center' });

        // === SAVE PDF (新版：返回 blob 和文件名) ===
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `ZenFit_训练报告_${dateStr}.pdf`;

        const blob = doc.output('blob');

        // 如果需要返回 blob 和文件名（用于新的导出流程）
        if (returnBlob) {
            console.log(`✅ PDF blob 生成成功: ${filename}`);
            return { blob, fileName: filename };
        }

        // 兼容旧的直接下载方式（桌面端）
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // 清理资源
        setTimeout(() => {
            URL.revokeObjectURL(url);
            console.log(`✅ PDF 下载成功: ${filename}`);
        }, 100);

    } catch (error) {
        console.error('Compact PDF generation error:', error);
        throw new Error('Failed to generate compact PDF. Please try again.');
    }
};

/**
 * Enhanced PDF generation with options
 */
export const generateEnhancedPDF = async (
    session: WorkoutSession,
    userProfile: UserProfile,
    options?: {
        includeCharts?: boolean;
        includeExerciseImages?: boolean;
        includeNotes?: boolean;
        config?: PDFConfig;
    }
): Promise<void> => {
    await generateWorkoutPDF(session, userProfile, options?.config, false);
};

/**
 * 检测是否在移动App环境中
 * 检测条件：
 * 1. User Agent 包含特定标识（ZenFit, WebView, wv）
 * 2. Display Mode 为 standalone（PWA模式）
 * 3. iOS standalone 模式
 *
 * @param forceMobile 强制返回移动模式（用于桌面测试）
 */
export const isMobileApp = (forceMobile: boolean = false): boolean => {
    // 如果强制移动模式，直接返回true（用于桌面测试）
    if (forceMobile) {
        console.log('🧪 强制移动模式已启用（测试模式）');
        return true;
    }

    // 检查 User Agent
    const ua = navigator.userAgent;
    const hasAppUA = /ZenFit|WebView|wv/i.test(ua);

    // 检查 Display Mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // 检查 iOS standalone
    const isIOSStandalone = (window.navigator as any).standalone === true;

    // 检查是否为移动设备
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    return (hasAppUA || isStandalone || isIOSStandalone) && isMobile;
};

/**
 * 在浏览器中打开PDF
 * 使用 window.open() 在新标签页中打开PDF
 *
 * @param blob PDF Blob对象
 * @returns 成功返回true，失败返回false
 */
export const openPDFInBrowser = (blob: Blob): boolean => {
    try {
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
            console.error('❌ 浏览器阻止了弹出窗口');
            return false;
        }

        // 延迟清理资源，确保PDF已加载
        setTimeout(() => {
            URL.revokeObjectURL(url);
            console.log('✅ PDF 在浏览器中打开成功');
        }, 3000);

        return true;
    } catch (error) {
        console.error('❌ 在浏览器中打开PDF失败:', error);
        return false;
    }
};

/**
 * 保存PDF到设备 - iOS原生保存优化版
 * 优先使用iOS原生保存对话框，支持保存到文件、相册等
 *
 * @param blob PDF Blob对象
 * @param fileName 文件名
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export const savePDFToDevice = async (blob: Blob, fileName: string): Promise<boolean> => {
    try {
        console.log(`📥 开始保存PDF到设备: ${fileName}`);

        // 检测iOS设备
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        // iOS设备：优先使用原生分享对话框（可以保存到文件）
        if (isIOS && navigator.share) {
            console.log('📱 检测到iOS设备，使用原生分享对话框...');
            try {
                const file = new File([blob], fileName, { type: 'application/pdf' });

                await navigator.share({
                    files: [file],
                    title: 'ZenFit 训练报告',
                    text: '保存您的训练报告'
                });

                console.log('✅ iOS原生保存对话框已打开');
                return true;
            } catch (error: any) {
                // 用户取消分享不算错误
                if (error.name === 'AbortError') {
                    console.log('ℹ️ 用户取消了保存操作');
                    return false;
                }
                console.warn('⚠️ iOS原生分享失败，尝试备用方案:', error);
                // 继续尝试其他方法
            }
        }

        // Android或其他移动设备：使用Web Share API
        if (navigator.share && isMobileApp()) {
            console.log('📱 使用Web Share API...');
            try {
                const file = new File([blob], fileName, { type: 'application/pdf' });

                await navigator.share({
                    files: [file],
                    title: 'ZenFit 训练报告'
                });

                console.log('✅ 分享成功');
                return true;
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('ℹ️ 用户取消了分享');
                    return false;
                }
                console.warn('⚠️ Web Share API失败，尝试备用方案:', error);
            }
        }

        // 备用方案：标准下载方法
        return fallbackDownload(blob, fileName);

    } catch (error) {
        console.error('❌ 保存PDF到设备失败:', error);
        return false;
    }
};

/**
 * 用其他应用打开PDF - 专用分享功能
 * 打开系统分享菜单，让用户选择应用
 *
 * @param blob PDF Blob对象
 * @param fileName 文件名
 * @returns Promise<boolean> 成功返回true，失败返回false
 */
export const shareToOtherApps = async (blob: Blob, fileName: string): Promise<boolean> => {
    try {
        console.log(`📤 分享PDF到其他应用: ${fileName}`);

        // 检查是否支持Web Share API
        if (!navigator.share) {
            console.warn('⚠️ 当前浏览器不支持分享功能');
            showToast('您的浏览器不支持分享功能，请使用"保存到设备"选项');
            return false;
        }

        // 检查是否支持文件分享
        if (!navigator.canShare) {
            console.warn('⚠️ 浏览器不支持文件分享');
        }

        const file = new File([blob], fileName, { type: 'application/pdf' });

        // 检查是否可以分享此文件
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            console.warn('⚠️ 无法分享PDF文件');
            showToast('无法分享PDF文件，请使用"保存到设备"选项');
            return false;
        }

        await navigator.share({
            files: [file],
            title: 'ZenFit 训练报告',
            text: '分享训练报告'
        });

        console.log('✅ 分享成功');
        return true;

    } catch (error: any) {
        // 用户取消分享不算错误
        if (error.name === 'AbortError') {
            console.log('ℹ️ 用户取消了分享');
            return false;
        }

        console.error('❌ 分享失败:', error);
        showToast('分享失败，请重试');
        return false;
    }
};

/**
 * 备用下载方法
 * 使用传统的 <a> 标签下载方式
 */
const fallbackDownload = (blob: Blob, fileName: string): boolean => {
    try {
        console.log('📥 使用标准下载方法...');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;

        // 添加到DOM并触发点击
        link.style.display = 'none';
        document.body.appendChild(link);

        // 使用 setTimeout 确保链接已添加到DOM
        setTimeout(() => {
            link.click();
            console.log('✅ 下载已触发');

            // 延迟清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log(`✅ PDF 保存成功: ${fileName}`);
            }, 100);
        }, 0);

        return true;
    } catch (error) {
        console.error('❌ 备用下载方法失败:', error);
        return false;
    }
};