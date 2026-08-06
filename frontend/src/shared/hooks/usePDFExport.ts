import { useState, useCallback } from 'react';
import { generateWorkoutPDF } from '@/features/export/services/PDFExportService';
import type { WorkoutSession, UserProfile } from '@/shared/types';

interface UsePDFExportReturn {
    isExporting: boolean;
    exportError: string | null;
    exportPDF: (session: WorkoutSession, userProfile: UserProfile) => Promise<void>;
}

/**
 * Custom hook to handle PDF export logic
 * Isolates state management and error handling for PDF generation
 */
export const usePDFExport = (): UsePDFExportReturn => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const exportPDF = useCallback(async (session: WorkoutSession, userProfile: UserProfile) => {
        setIsExporting(true);
        setExportError(null);

        try {
            await generateWorkoutPDF(session, userProfile);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to export PDF';
            setExportError(message);
            console.error('Export failed:', error);
            // Re-throw or handle UI notification here if needed
            // For now, we'll let the component decide if it wants to show an alert
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        isExporting,
        exportError,
        exportPDF
    };
};
