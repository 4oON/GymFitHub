import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateWorkoutPDF } from '../services/PDFExportService';
import type { PDFConfig } from '../types/PDFConfig';
import { DEFAULT_PDF_CONFIG, SUGGESTED_PDF_CONFIG } from '../types/PDFConfig';
import type { WorkoutSession, UserProfile } from '@/shared/types';
import { showToast } from '@/components/Toast';

/**
 * 简单的 debounce 函数实现
 */
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): T & { cancel: () => void } {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = function (this: any, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    } as T & { cancel: () => void };

    debounced.cancel = () => {
        if (timeout) clearTimeout(timeout);
    };

    return debounced;
}

interface PDFDebuggerProps {
    session: WorkoutSession;
    userProfile: UserProfile;
}

/**
 * PDF 布局调试器组件
 * 提供实时调整 PDF 布局参数的界面
 */
export const PDFDebugger: React.FC<PDFDebuggerProps> = ({ session, userProfile }) => {
    const [config, setConfig] = useState<PDFConfig>(DEFAULT_PDF_CONFIG);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string>('');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 生成 PDF 预览
    const generatePreview = useCallback(async (currentConfig: PDFConfig) => {
        setIsGenerating(true);
        setError('');

        try {
            // 使用当前配置生成 PDF blob
            const blobUrl = await generateWorkoutPDF(session, userProfile, currentConfig, true);

            if (typeof blobUrl === 'string') {
                // 清理旧的 URL
                setPdfUrl(prevUrl => {
                    if (prevUrl) {
                        URL.revokeObjectURL(prevUrl);
                    }
                    return blobUrl;
                });
            } else {
                setError('生成 PDF 预览失败：未返回有效的 blob URL');
            }

        } catch (err) {
            console.error('PDF 生成错误:', err);
            setError(err instanceof Error ? err.message : '生成 PDF 时出错');
        } finally {
            setIsGenerating(false);
        }
    }, [session, userProfile]);

    // 防抖的预览生成函数 - 使用 useRef 避免重新创建
    const debouncedGenerateRef = useRef(
        debounce((currentConfig: PDFConfig) => {
            generatePreview(currentConfig);
        }, 500)
    );

    // 更新 debounce 函数的引用
    useEffect(() => {
        debouncedGenerateRef.current = debounce((currentConfig: PDFConfig) => {
            generatePreview(currentConfig);
        }, 500);
    }, [generatePreview]);

    // 配置变化时触发预览更新
    useEffect(() => {
        debouncedGenerateRef.current(config);
        return () => {
            debouncedGenerateRef.current.cancel();
        };
    }, [config]);

    // 更新配置的辅助函数
    const updateConfig = (path: string[], value: number) => {
        setConfig(prev => {
            const newConfig = { ...prev };
            let current: any = newConfig;

            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }

            current[path[path.length - 1]] = value;
            return newConfig;
        });
    };

    // 重置为默认配置
    const resetToDefault = () => {
        setConfig(DEFAULT_PDF_CONFIG);
    };

    // 应用建议配置
    const applySuggested = () => {
        setConfig(SUGGESTED_PDF_CONFIG);
    };

    // 复制当前配置到剪贴板
    const copyConfig = () => {
        const configText = JSON.stringify(config, null, 2);
        navigator.clipboard.writeText(configText).then(() => {
            showToast('✅ 配置已复制到剪贴板！你可以将配置发送给我，我会帮你更新代码。');
        }).catch(err => {
            console.error('复制失败:', err);
            // 如果剪贴板 API 失败，显示配置让用户手动复制
            const textarea = document.createElement('textarea');
            textarea.value = configText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('✅ 配置已复制到剪贴板！');
        });
    };

    // 下载当前配置的 PDF
    const downloadPDF = async () => {
        setIsGenerating(true);
        try {
            await generateWorkoutPDF(session, userProfile, config, false);
        } catch (err) {
            setError(err instanceof Error ? err.message : '下载 PDF 时出错');
        } finally {
            setIsGenerating(false);
        }
    };

    // 组件卸载时清理 blob URL
    useEffect(() => {
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, []);

    return (
        <div className="flex h-full bg-gray-50">
            {/* 左侧控制面板 */}
            <div className="w-96 bg-white shadow-lg overflow-y-auto p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">PDF 布局调试器</h1>
                    <p className="text-sm text-gray-600">实时调整 PDF 布局参数</p>
                </div>

                {/* 快捷操作按钮 */}
                <div className="mb-6 space-y-2">
                    <button
                        onClick={resetToDefault}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        重置为默认值
                    </button>
                    <button
                        onClick={applySuggested}
                        className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                        应用建议配置
                    </button>
                    <button
                        onClick={copyConfig}
                        className="w-full px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-semibold"
                    >
                        📋 复制当前配置
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={isGenerating}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? '生成中...' : '下载 PDF'}
                    </button>
                </div>

                {/* Hero Metrics 配置 */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero Metrics 区域</h2>

                    <div className="space-y-4">
                        <SliderControl
                            label="标签到数字间距 (labelToValueGap)"
                            value={config.heroMetrics.labelToValueGap}
                            min={18}
                            max={30}
                            step={0.5}
                            unit="mm"
                            onChange={(val) => updateConfig(['heroMetrics', 'labelToValueGap'], val)}
                        />

                        <SliderControl
                            label="标签字间距 (charSpacing)"
                            value={config.heroMetrics.charSpacing}
                            min={0.5}
                            max={3}
                            step={0.1}
                            unit="mm"
                            onChange={(val) => updateConfig(['heroMetrics', 'charSpacing'], val)}
                        />

                        <SliderControl
                            label="分割线位置 (dividerX)"
                            value={config.heroMetrics.dividerX}
                            min={80}
                            max={110}
                            step={1}
                            unit="mm"
                            onChange={(val) => updateConfig(['heroMetrics', 'dividerX'], val)}
                        />

                        <SliderControl
                            label="大数字字号 (heroFontSize)"
                            value={config.heroMetrics.heroFontSize}
                            min={60}
                            max={84}
                            step={2}
                            unit="pt"
                            onChange={(val) => updateConfig(['heroMetrics', 'heroFontSize'], val)}
                        />

                        <SliderControl
                            label="顶部起始偏移 (rowTopY)"
                            value={config.heroMetrics.rowTopY}
                            min={0}
                            max={10}
                            step={0.5}
                            unit="mm"
                            onChange={(val) => updateConfig(['heroMetrics', 'rowTopY'], val)}
                        />

                        <SliderControl
                            label="右侧指标右边距 (rightPaddingRight)"
                            value={config.heroMetrics.rightPaddingRight}
                            min={0}
                            max={8}
                            step={0.5}
                            unit="mm"
                            onChange={(val) => updateConfig(['heroMetrics', 'rightPaddingRight'], val)}
                        />
                    </div>
                </div>

                {/* 右侧指标标签位置微调 */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">右侧指标标签位置微调</h2>

                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-900 mb-3">DURATION 标签</h3>
                            <div className="space-y-3">
                                <SliderControl
                                    label="水平偏移 (标签+数字+单位一起移动)"
                                    value={config.heroMetrics.durationLabelOffsetX}
                                    min={-50}
                                    max={50}
                                    step={1}
                                    unit="mm"
                                    onChange={(val) => updateConfig(['heroMetrics', 'durationLabelOffsetX'], val)}
                                />
                                <SliderControl
                                    label="垂直偏移 (仅标签移动)"
                                    value={config.heroMetrics.durationLabelOffsetY}
                                    min={-20}
                                    max={20}
                                    step={0.5}
                                    unit="mm"
                                    onChange={(val) => updateConfig(['heroMetrics', 'durationLabelOffsetY'], val)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-green-900 mb-3">CALORIES 标签</h3>
                            <div className="space-y-3">
                                <SliderControl
                                    label="水平偏移 (标签+数字+单位一起移动)"
                                    value={config.heroMetrics.caloriesLabelOffsetX}
                                    min={-50}
                                    max={50}
                                    step={1}
                                    unit="mm"
                                    onChange={(val) => updateConfig(['heroMetrics', 'caloriesLabelOffsetX'], val)}
                                />
                                <SliderControl
                                    label="垂直偏移 (仅标签移动)"
                                    value={config.heroMetrics.caloriesLabelOffsetY}
                                    min={-20}
                                    max={20}
                                    step={0.5}
                                    unit="mm"
                                    onChange={(val) => updateConfig(['heroMetrics', 'caloriesLabelOffsetY'], val)}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-purple-900 mb-3">SETS 标签</h3>
                            <div className="space-y-3">
                                <SliderControl
                                    label="水平偏移 (标签+数字一起移动)"
                                    value={config.heroMetrics.setsLabelOffsetX}
                                    min={-50}
                                    max={50}
                                    step={1}
                                    unit="mm"
                                    onChange={(val) => updateConfig(['heroMetrics', 'setsLabelOffsetX'], val)}
                                />
                                <SliderControl
                                    label="垂直偏移 (仅标签移动)"
                                    value={config.heroMetrics.setsLabelOffsetY}
                                    min={-20}
                                    max={20}
                                    step={0.5}
                                    unit="mm"
                                    onChange={(val) => updateConfig(['heroMetrics', 'setsLabelOffsetY'], val)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table 配置 */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">表格区域</h2>

                    <div className="space-y-4">
                        <SliderControl
                            label="标题与横线间距 (titleGap)"
                            value={config.table.titleGap}
                            min={4}
                            max={12}
                            step={0.5}
                            unit="mm"
                            onChange={(val) => updateConfig(['table', 'titleGap'], val)}
                        />

                        <SliderControl
                            label="表头字号 (headerFontSize)"
                            value={config.table.headerFontSize}
                            min={6}
                            max={10}
                            step={0.5}
                            unit="pt"
                            onChange={(val) => updateConfig(['table', 'headerFontSize'], val)}
                        />

                        <SliderControl
                            label="表头字间距 (headerCharSpacing)"
                            value={config.table.headerCharSpacing}
                            min={0.3}
                            max={1.5}
                            step={0.1}
                            unit="mm"
                            onChange={(val) => updateConfig(['table', 'headerCharSpacing'], val)}
                        />

                        <SliderControl
                            label="行高 (rowHeight)"
                            value={config.table.rowHeight}
                            min={7}
                            max={12}
                            step={0.5}
                            unit="mm"
                            onChange={(val) => updateConfig(['table', 'rowHeight'], val)}
                        />
                    </div>
                </div>

                {/* 全局配置 */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">全局配置</h2>

                    <div className="space-y-4">
                        <SliderControl
                            label="页面边距 (margin)"
                            value={config.global.margin}
                            min={15}
                            max={25}
                            step={1}
                            unit="mm"
                            onChange={(val) => updateConfig(['global', 'margin'], val)}
                        />

                        <SliderControl
                            label="线条宽度 (lineWidth)"
                            value={config.global.lineWidth}
                            min={0.1}
                            max={0.5}
                            step={0.05}
                            unit="mm"
                            onChange={(val) => updateConfig(['global', 'lineWidth'], val)}
                        />
                    </div>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}
            </div>

            {/* 右侧预览区域 */}
            <div className="flex-1 p-6">
                <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="h-full flex items-center justify-center bg-gray-100">
                        {isGenerating ? (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">正在生成预览...</p>
                            </div>
                        ) : pdfUrl ? (
                            <iframe
                                ref={iframeRef}
                                src={pdfUrl}
                                className="w-full h-full"
                                title="PDF 预览"
                            />
                        ) : (
                            <div className="text-center text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>调整参数后将自动生成预览</p>
                                <p className="text-sm mt-2">或点击"下载 PDF"直接生成文件</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 滑动条控制组件
 */
interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
    label,
    value,
    min,
    max,
    step,
    unit,
    onChange
}) => {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <span className="text-sm font-mono text-blue-600">
                    {value.toFixed(step < 1 ? 1 : 0)} {unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
                <span>{min} {unit}</span>
                <span>{max} {unit}</span>
            </div>
        </div>
    );
};

export default PDFDebugger;