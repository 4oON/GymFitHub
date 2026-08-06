import html2canvas from 'html2canvas';
import type { WeeklyReport } from '@/shared/types';
import { generateWeeklyReportSVG } from './SVGExportService';

/**
 * PNG Export Service
 * Generates PNG images for social media sharing
 * Uses html2canvas to convert SVG to high-quality PNG
 */

/**
 * Create a temporary DOM element with the SVG content
 */
const createSVGElement = (svgContent: string): HTMLElement => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '800px';
    container.style.height = '650px';
    container.style.backgroundColor = '#020617'; // Slate-950 background
    container.innerHTML = svgContent;

    document.body.appendChild(container);
    return container;
};

/**
 * Generate PNG from SVG content
 */
const svgToPNG = async (
    svgContent: string,
    width: number = 1600,
    height: number = 1300,
    quality: number = 1.0
): Promise<Blob> => {
    const container = createSVGElement(svgContent);

    try {
        const canvas = await html2canvas(container, {
            width: 800,
            height: 650,
            scale: 2, // High DPI for better quality
            backgroundColor: '#020617',
            useCORS: true,
            allowTaint: true,
            logging: false
        });

        // Create a new canvas with desired dimensions
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = width;
        outputCanvas.height = height;

        const ctx = outputCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Fill background
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        // Calculate scaling to fit the image while maintaining aspect ratio
        const sourceAspect = canvas.width / canvas.height;
        const targetAspect = width / height;

        let drawWidth, drawHeight, drawX, drawY;

        if (sourceAspect > targetAspect) {
            // Source is wider, fit to width
            drawWidth = width;
            drawHeight = width / sourceAspect;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
        } else {
            // Source is taller, fit to height
            drawHeight = height;
            drawWidth = height * sourceAspect;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
        }

        // Draw the canvas content
        ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);

        return new Promise((resolve, reject) => {
            outputCanvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create PNG blob'));
                }
            }, 'image/png', quality);
        });

    } finally {
        document.body.removeChild(container);
    }
};

/**
 * Generate social media optimized PNG
 */
export const generateSocialPNG = async (
    report: WeeklyReport,
    format: 'instagram' | 'twitter' | 'facebook' | 'custom' = 'instagram',
    customDimensions?: { width: number; height: number }
): Promise<Blob> => {
    const svgContent = generateWeeklyReportSVG(report);

    let width: number, height: number;

    switch (format) {
        case 'instagram':
            width = 1080;
            height = 1080; // Square format
            break;
        case 'twitter':
            width = 1200;
            height = 675; // 16:9 aspect ratio
            break;
        case 'facebook':
            width = 1200;
            height = 630; // Facebook recommended
            break;
        case 'custom':
            if (!customDimensions) {
                throw new Error('Custom dimensions required for custom format');
            }
            width = customDimensions.width;
            height = customDimensions.height;
            break;
        default:
            width = 1080;
            height = 1080;
    }

    return svgToPNG(svgContent, width, height, 0.95);
};

/**
 * Export PNG with social media optimization
 */
export const exportSocialPNG = async (
    report: WeeklyReport,
    format: 'instagram' | 'twitter' | 'facebook' | 'custom' = 'instagram',
    customDimensions?: { width: number; height: number }
): Promise<void> => {
    try {
        const blob = await generateSocialPNG(report, format, customDimensions);

        const formatNames = {
            instagram: 'Instagram',
            twitter: 'Twitter',
            facebook: 'Facebook',
            custom: 'Custom'
        };

        const filename = `ZenFit_Week_${report.weekNumber}_${report.year}_${formatNames[format]}.png`;

        try {
            // Try File System Access API
            // @ts-ignore
            if (window.showSaveFilePicker) {
                // @ts-ignore
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'PNG Image',
                        accept: { 'image/png': ['.png'] },
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

    } catch (error) {
        console.error('PNG export error:', error);
        throw new Error('Failed to export PNG. Please try again.');
    }
};

/**
 * Share PNG via Web Share API (if available)
 */
export const sharePNG = async (
    report: WeeklyReport,
    format: 'instagram' | 'twitter' | 'facebook' = 'instagram'
): Promise<void> => {
    try {
        const blob = await generateSocialPNG(report, format);

        const filename = `ZenFit_Week_${report.weekNumber}_${report.year}.png`;
        const file = new File([blob], filename, { type: 'image/png' });

        const shareText = `My ZenFit training report for Week ${report.weekNumber}, ${report.year}! 💪\n\n` +
            `📊 ${report.stats.totalExercises} exercises, ${report.stats.totalSets} sets\n` +
            `🏋️ ${report.stats.totalVolume}kg total volume\n` +
            `⏱️ ${report.stats.totalDuration} minutes of training\n\n` +
            `#ZenFit #Fitness #Training #WorkoutReport`;

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: `ZenFit Week ${report.weekNumber} Report`,
                text: shareText,
                files: [file]
            });
        } else {
            // Fallback: copy text to clipboard and download image
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(shareText);
                alert('Share text copied to clipboard! The image will be downloaded.');
            }

            // Download the image
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }

    } catch (error) {
        console.error('PNG share error:', error);
        throw new Error('Failed to share PNG. Please try again.');
    }
};

/**
 * Generate preview PNG for display
 */
export const generatePreviewPNG = async (report: WeeklyReport): Promise<string> => {
    try {
        const blob = await generateSocialPNG(report, 'instagram');
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Preview PNG generation error:', error);
        throw new Error('Failed to generate preview PNG.');
    }
};