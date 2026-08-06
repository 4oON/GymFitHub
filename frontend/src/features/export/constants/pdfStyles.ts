/**
 * PDF样式常量 - 瑞士平面设计风格
 * Swiss Style & Editorial Design
 */

// 色板定义 (基于 Tailwind Slate & Blue)
export const PDF_COLORS = {
    // 背景色
    BG: [255, 255, 255] as [number, number, number],        // White

    // 文字颜色
    TEXT_MAIN: [15, 23, 42] as [number, number, number],    // Slate-900 (标题)
    TEXT_SEC: [100, 116, 139] as [number, number, number],  // Slate-500 (标签)
    TEXT_LIGHT: [148, 163, 184] as [number, number, number],// Slate-400 (辅助线)

    // 强调色
    ACCENT: [37, 99, 235] as [number, number, number],      // Blue-600 (克莱因蓝/高亮)
    ACCENT_LIGHT: [59, 130, 246] as [number, number, number], // Blue-500

    // 线条颜色
    LINE: [226, 232, 240] as [number, number, number],      // Slate-200 (极细分割线)
    LINE_BOLD: [15, 23, 42] as [number, number, number],    // Slate-900 (粗线条)
};

// 字体配置
export const PDF_FONTS = {
    // 中文字体
    CHINESE_REGULAR: 'NotoSansSC',
    CHINESE_BOLD: 'NotoSansSC',

    // 英文/数字字体 (Oswald - 具有冲击力)
    DISPLAY: 'Oswald',
};

// 字体大小 (单位: pt) - 3080 Sample匹配版
export const FONT_SIZES = {
    // 超大标题 (Hero) - 保持80pt以匹配3080 Sample
    HERO: 80,

    // 大标题
    TITLE_LARGE: 48,

    // Sub-Metrics (Duration/Calories/Sets) - 增大至28pt
    METRICS_NUMBER: 28,
    METRICS_UNIT: 10,

    TITLE_MEDIUM: 24,
    TITLE_SMALL: 14,

    // 正文
    BODY_LARGE: 10,
    BODY_MEDIUM: 9,
    BODY_SMALL: 8,

    // 标签/辅助文字
    LABEL: 8,
    CAPTION: 7,

    // Energy Ring
    RING_PERCENTAGE: 14,
    RING_LABEL: 7,
};

// 布局常量 (单位: mm) - 标准化边距版
export const LAYOUT = {
    // 页面尺寸 (A4)
    PAGE_WIDTH: 210,
    PAGE_HEIGHT: 297,

    // 边距 - 统一为20mm（标准化）
    MARGIN: 20,

    // 间距 - 优化版
    SPACING_XL: 15,
    SPACING_L: 10,
    SPACING_M: 8,
    SPACING_S: 5,
    SPACING_XS: 3,

    // 线条宽度
    LINE_THIN: 0.1,
    LINE_REGULAR: 0.5,
    LINE_BOLD: 1.0,
    LINE_HEAVY: 2.0,
};

// 计算内容宽度
export const getContentWidth = (): number => {
    return LAYOUT.PAGE_WIDTH - (LAYOUT.MARGIN * 2);
};

// 计算内容高度
export const getContentHeight = (): number => {
    return LAYOUT.PAGE_HEIGHT - (LAYOUT.MARGIN * 2);
};

// Bento Grid 布局配置 - 紧凑优化版
export const BENTO_GRID = {
    // 左侧大卡片 (Hero Metric) - 压缩高度
    HERO_WIDTH: 90,
    HERO_HEIGHT: 45,

    // 右侧小卡片
    SMALL_CARD_WIDTH: 60,
    SMALL_CARD_HEIGHT: 14,
    SMALL_CARD_SPACING: 1,
};

// 表格配置 - 紧凑优化版
export const TABLE = {
    // 列宽配置 (相对于内容宽度的百分比)
    COL_EXERCISE: 0.40,  // 40% - 动作名称
    COL_SETS: 0.12,      // 12% - 组数
    COL_REPS: 0.12,      // 12% - 次数
    COL_WEIGHT: 0.18,    // 18% - 重量
    COL_VOLUME: 0.18,    // 18% - 容量

    // 行高 - 大幅压缩
    ROW_HEIGHT: 10,
    HEADER_HEIGHT: 8,
};

// SVG配置 - 紧凑优化版
export const SVG_CONFIG = {
    // 通栏显示 - 压缩高度
    WIDTH: 180,  // 增加宽度 (210 - 15*2)
    HEIGHT: 80,  // 大幅压缩高度

    // 视图间距
    VIEW_SPACING: 8,
};

// 工具函数：将RGB数组转换为jsPDF颜色格式
export const rgbToJsPDF = (rgb: [number, number, number]): [number, number, number] => {
    return rgb;
};

// 工具函数：将RGB数组转换为CSS rgba字符串
export const rgbToRGBA = (rgb: [number, number, number], alpha: number = 1): string => {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
};

// 工具函数：将RGB数组转换为十六进制颜色
export const rgbToHex = (rgb: [number, number, number]): string => {
    return '#' + rgb.map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};