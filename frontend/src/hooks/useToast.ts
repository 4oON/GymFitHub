import { useState, useCallback } from 'react';
import type { ToastMessage } from '@/components/Toast';

/**
 * Custom Hook for managing Toast notifications
 * 管理Toast通知的自定义Hook
 */
export const useToast = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback(
        (
            message: string,
            options?: {
                type?: 'success' | 'error' | 'info' | 'warning';
                duration?: number;
                exerciseName?: string;
                action?: {
                    label: string;
                    onClick: () => void;
                };
            }
        ) => {
            const id = `toast-${Date.now()}-${Math.random()}`;
            const newToast: ToastMessage = {
                id,
                message,
                type: options?.type || 'success',
                duration: options?.duration || 3000,
                exerciseName: options?.exerciseName,
                action: options?.action
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto-remove after duration
            setTimeout(() => {
                removeToast(id);
            }, (options?.duration || 3000) + 500); // Add extra time for exit animation
        },
        []
    );

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showSuccess = useCallback(
        (message: string, exerciseName?: string, action?: { label: string; onClick: () => void }) => {
            showToast(message, { type: 'success', exerciseName, action });
        },
        [showToast]
    );

    const showError = useCallback(
        (message: string) => {
            showToast(message, { type: 'error' });
        },
        [showToast]
    );

    const showInfo = useCallback(
        (message: string) => {
            showToast(message, { type: 'info' });
        },
        [showToast]
    );

    const showWarning = useCallback(
        (message: string) => {
            showToast(message, { type: 'warning' });
        },
        [showToast]
    );

    return {
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast
    };
};

export default useToast;