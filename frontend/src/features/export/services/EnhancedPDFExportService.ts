import type { WorkoutSession, UserProfile, WeeklyReport } from '@/shared/types';
import { generateDailyHTMLReport, generateWeeklyHTMLReport } from './HTMLTemplateService';

/**
 * Enhanced PDF Export Service with Muscle Highlighting
 * Uses the new HTML template system with accurate muscle highlighting
 * Supports both daily and weekly reports with dynamic muscle visualization
 */

/**
 * Generate enhanced PDF with muscle highlighting for daily workout
 */
export const generateEnhancedWorkoutPDF = async (
    session: WorkoutSession,
    userProfile: UserProfile
): Promise<void> => {
    if (!session.exercises || session.exercises.length === 0) {
        throw new Error('Cannot export empty workout. Session must contain exercises.');
    }

    try {
        // Generate HTML with muscle highlighting
        const htmlContent = await generateDailyHTMLReport(session, userProfile);

        // Create and download PDF
        await createPDFFromHTML(htmlContent, `ZenFit_Enhanced_${formatDate(session.date.toString())}.pdf`);

        console.log('✅ Enhanced PDF with muscle highlighting generated successfully');

    } catch (error) {
        console.error('Enhanced PDF generation error:', error);
        throw new Error('Failed to generate enhanced PDF with muscle highlighting');
    }
};

/**
 * Generate enhanced weekly PDF report with muscle highlighting
 */
export const generateEnhancedWeeklyPDF = async (
    weeklyReport: WeeklyReport,
    userProfile: UserProfile
): Promise<void> => {
    if (!weeklyReport.sessions || weeklyReport.sessions.length === 0) {
        throw new Error('Cannot export empty weekly report. Must contain workout sessions.');
    }

    try {
        // Generate HTML with muscle highlighting for weekly data
        const htmlContent = await generateWeeklyHTMLReport(weeklyReport.sessions, userProfile);

        // Create and download PDF
        const filename = `ZenFit_WeeklyReport_${weeklyReport.year}W${weeklyReport.weekNumber}.pdf`;
        await createPDFFromHTML(htmlContent, filename);

        console.log('✅ Enhanced weekly PDF with muscle highlighting generated successfully');

    } catch (error) {
        console.error('Enhanced weekly PDF generation error:', error);
        throw new Error('Failed to generate enhanced weekly PDF with muscle highlighting');
    }
};

/**
 * Create PDF from HTML content using browser's print functionality
 */
const createPDFFromHTML = async (htmlContent: string, filename: string): Promise<void> => {
    try {
        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('Unable to open print window. Please allow popups.');
        }

        // Write HTML content to the new window
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load
        await new Promise<void>((resolve) => {
            printWindow.onload = () => {
                // Small delay to ensure all content is rendered
                setTimeout(() => {
                    resolve();
                }, 1000);
            };

            // Fallback timeout
            setTimeout(() => {
                resolve();
            }, 2000);
        });

        // Trigger print dialog
        printWindow.print();

        // Close the window after a delay
        setTimeout(() => {
            printWindow.close();
        }, 1000);

    } catch (error) {
        console.error('PDF creation error:', error);
        throw new Error('Failed to create PDF from HTML template');
    }
};

/**
 * Alternative PDF generation using Puppeteer-like approach (for future implementation)
 */
export const generatePDFWithPuppeteer = async (
    htmlContent: string,
    filename: string
): Promise<void> => {
    // This would be implemented if we had access to Puppeteer or similar
    // For now, we use the browser's built-in print functionality
    console.log('Puppeteer PDF generation not implemented yet. Using browser print.');
    await createPDFFromHTML(htmlContent, filename);
};

/**
 * Generate PDF blob for programmatic use
 */
export const generatePDFBlob = async (
    session: WorkoutSession,
    userProfile: UserProfile
): Promise<Blob> => {
    try {
        // Generate HTML content
        const htmlContent = await generateDailyHTMLReport(session, userProfile);

        // For now, return a text blob with HTML content
        // In a full implementation, this would use a proper HTML-to-PDF library
        return new Blob([htmlContent], { type: 'text/html' });

    } catch (error) {
        console.error('PDF blob generation error:', error);
        throw new Error('Failed to generate PDF blob');
    }
};

/**
 * Preview HTML report in new tab (for testing and preview)
 */
export const previewHTMLReport = async (
    session: WorkoutSession,
    userProfile: UserProfile
): Promise<void> => {
    try {
        // Generate HTML content
        const htmlContent = await generateDailyHTMLReport(session, userProfile);

        // Open in new tab
        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            throw new Error('Unable to open preview window. Please allow popups.');
        }

        previewWindow.document.write(htmlContent);
        previewWindow.document.close();

        console.log('✅ HTML report preview opened in new tab');

    } catch (error) {
        console.error('HTML preview error:', error);
        throw new Error('Failed to preview HTML report');
    }
};

/**
 * Preview weekly HTML report in new tab
 */
export const previewWeeklyHTMLReport = async (
    weeklyReport: WeeklyReport,
    userProfile: UserProfile
): Promise<void> => {
    try {
        // Generate HTML content
        const htmlContent = await generateWeeklyHTMLReport(weeklyReport.sessions, userProfile);

        // Open in new tab
        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            throw new Error('Unable to open preview window. Please allow popups.');
        }

        previewWindow.document.write(htmlContent);
        previewWindow.document.close();

        console.log('✅ Weekly HTML report preview opened in new tab');

    } catch (error) {
        console.error('Weekly HTML preview error:', error);
        throw new Error('Failed to preview weekly HTML report');
    }
};

/**
 * Export options for enhanced PDF
 */
export interface EnhancedPDFOptions {
    includeMuscleHighlighting?: boolean;
    includeDetailedAnalysis?: boolean;
    includeProgressComparison?: boolean;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
}

/**
 * Generate enhanced PDF with custom options
 */
export const generateCustomEnhancedPDF = async (
    session: WorkoutSession,
    userProfile: UserProfile,
    options: EnhancedPDFOptions = {}
): Promise<void> => {
    const defaultOptions: EnhancedPDFOptions = {
        includeMuscleHighlighting: true,
        includeDetailedAnalysis: true,
        includeProgressComparison: false,
        format: 'A4',
        orientation: 'portrait'
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
        // Generate HTML with custom options
        const htmlContent = await generateDailyHTMLReport(session, userProfile);

        // Apply custom styling based on options
        let customizedHTML = htmlContent;

        if (!finalOptions.includeMuscleHighlighting) {
            // Remove muscle highlighting if disabled
            customizedHTML = customizedHTML.replace(
                /<g class="muscle-group"[^>]*>[\s\S]*?<\/g>/g,
                ''
            );
        }

        // Create filename with options
        const optionsStr = Object.entries(finalOptions)
            .filter(([_, value]) => value === true)
            .map(([key]) => key.replace(/^include/, '').replace(/([A-Z])/g, '_$1').toLowerCase())
            .join('_');

        const filename = `ZenFit_Enhanced_${formatDate(session.date.toString())}${optionsStr ? '_' + optionsStr : ''}.pdf`;

        await createPDFFromHTML(customizedHTML, filename);

        console.log('✅ Custom enhanced PDF generated successfully');

    } catch (error) {
        console.error('Custom enhanced PDF generation error:', error);
        throw new Error('Failed to generate custom enhanced PDF');
    }
};

/**
 * Utility function to format date for filename
 */
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

/**
 * Validate session data before PDF generation
 */
const validateSessionData = (session: WorkoutSession): void => {
    if (!session) {
        throw new Error('Session data is required');
    }

    if (!session.exercises || session.exercises.length === 0) {
        throw new Error('Session must contain at least one exercise');
    }

    const hasCompletedSets = session.exercises.some(ex =>
        ex.sets.some(set => set.completed)
    );

    if (!hasCompletedSets) {
        throw new Error('Session must contain at least one completed set');
    }
};

/**
 * Enhanced PDF export with validation
 */
export const generateValidatedEnhancedPDF = async (
    session: WorkoutSession,
    userProfile: UserProfile
): Promise<void> => {
    // Validate data first
    validateSessionData(session);

    if (!userProfile || !userProfile.weight) {
        throw new Error('Valid user profile with weight is required');
    }

    // Generate PDF
    await generateEnhancedWorkoutPDF(session, userProfile);
};