/**
 * PDF Layout Configuration Interface
 * 用于调试和微调 PDF 布局的配置参数
 */
export interface PDFConfig {
    // Hero Metrics 区域配置
    heroMetrics: {
        labelToValueGap: number;      // 标签到数字的垂直间距 (mm)
        charSpacing: number;           // Inter 标签的字间距 (mm)
        dividerX: number;              // 左侧数据与右侧指标的水平分割线位置 (mm)
        heroFontSize: number;          // 大数字的字号 (pt)
        rowTopY: number;               // 顶部标签起始高度偏移 (mm)
        rightPaddingRight: number;     // SETS 等右侧指标的右边距 (mm)

        // 右侧三个指标的独立位置控制
        durationLabelOffsetX: number;  // DURATION 标签水平偏移 (mm)
        durationLabelOffsetY: number;  // DURATION 标签垂直偏移 (mm)
        caloriesLabelOffsetX: number;  // CALORIES 标签水平偏移 (mm)
        caloriesLabelOffsetY: number;  // CALORIES 标签垂直偏移 (mm)
        setsLabelOffsetX: number;      // SETS 标签水平偏移 (mm)
        setsLabelOffsetY: number;      // SETS 标签垂直偏移 (mm)
    };

    // Table 区域配置
    table: {
        titleGap: number;              // EXERCISE DETAILS 标题与横线的间距 (mm)
        headerFontSize: number;        // 表头字号 (pt)
        headerCharSpacing: number;     // 表头字间距 (mm)
        rowHeight: number;             // 行高 (mm)
    };

    // 全局配置
    global: {
        margin: number;                // 页面边距 (mm)
        lineWidth: number;             // 辅助线宽度 (mm)
    };
}

/**
 * 默认 PDF 配置
 * 基于当前代码中的硬编码值
 */
export const DEFAULT_PDF_CONFIG: PDFConfig = {
    heroMetrics: {
        labelToValueGap: 22.5,         // 用户优化值：22.5mm
        charSpacing: 0.8,              // 用户优化值：0.8mm
        dividerX: 80,                  // 用户优化值：80mm
        heroFontSize: 62,              // 用户优化值：62pt
        rowTopY: 7,                    // 用户优化值：7mm
        rightPaddingRight: 0,          // 用户优化值：0mm

        // 右侧指标标签位置（用户优化值）
        durationLabelOffsetX: 0,
        durationLabelOffsetY: 9,
        caloriesLabelOffsetX: -7,
        caloriesLabelOffsetY: 9,
        setsLabelOffsetX: 0,
        setsLabelOffsetY: 9,
    },
    table: {
        titleGap: 4,                   // 用户优化值：4mm
        headerFontSize: 10,            // 用户优化值：10pt
        headerCharSpacing: 0.3,        // 用户优化值：0.3mm
        rowHeight: 7,                  // 用户优化值：7mm
    },
    global: {
        margin: 20,                    // 保持不变
        lineWidth: 0.1,                // 用户优化值：0.1mm
    },
};

/**
 * 建议的优化配置
 * 基于用户提供的参数建议
 */
export const SUGGESTED_PDF_CONFIG: PDFConfig = {
    heroMetrics: {
        labelToValueGap: 22.5,         // 用户优化值：22.5mm
        charSpacing: 0.8,              // 用户优化值：0.8mm
        dividerX: 80,                  // 用户优化值：80mm
        heroFontSize: 62,              // 用户优化值：62pt
        rowTopY: 7,                    // 用户优化值：7mm
        rightPaddingRight: 0,          // 用户优化值：0mm

        // 右侧指标标签位置微调（用户优化值）
        durationLabelOffsetX: 0,
        durationLabelOffsetY: 9,
        caloriesLabelOffsetX: -7,
        caloriesLabelOffsetY: 9,
        setsLabelOffsetX: 0,
        setsLabelOffsetY: 9,
    },
    table: {
        titleGap: 4,                   // 用户优化值：4mm
        headerFontSize: 10,            // 用户优化值：10pt
        headerCharSpacing: 0.3,        // 用户优化值：0.3mm
        rowHeight: 7,                  // 用户优化值：7mm
    },
    global: {
        margin: 20,                    // 保持不变
        lineWidth: 0.1,                // 用户优化值：0.1mm
    },
};