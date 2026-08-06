import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose: () => void;
    exerciseName?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Toast Notification Component
 * 显示临时通知消息，支持不同类型和自动关闭
 */
const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    onClose,
    exerciseName,
    action
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // 入场动画
        setTimeout(() => setIsVisible(true), 10);

        // 自动关闭
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle2 size={20} className="text-emerald-400" />;
            case 'error':
                return <AlertCircle size={20} className="text-rose-400" />;
            case 'warning':
                return <AlertCircle size={20} className="text-amber-400" />;
            case 'info':
                return <Info size={20} className="text-blue-400" />;
            default:
                return <CheckCircle2 size={20} className="text-emerald-400" />;
        }
    };

    const getColorClasses = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100';
            case 'error':
                return 'bg-rose-500/10 border-rose-500/30 text-rose-100';
            case 'warning':
                return 'bg-amber-500/10 border-amber-500/30 text-amber-100';
            case 'info':
                return 'bg-blue-500/10 border-blue-500/30 text-blue-100';
            default:
                return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100';
        }
    };

    return (
        <div
            className={`absolute top-20 left-1/2 -translate-x-1/2 transition-all duration-300 ${isVisible && !isExiting
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-4'
                }`}
            style={{ maxWidth: '90vw', width: '400px' }}
        >
            <div
                className={`${getColorClasses()} backdrop-blur-xl border rounded-2xl shadow-2xl p-4 flex items-start gap-3`}
            >
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{message}</p>
                    {exerciseName && (
                        <p className="text-xs opacity-80 mt-1 truncate">{exerciseName}</p>
                    )}
                    {action && (
                        <button
                            onClick={() => {
                                action.onClick();
                                handleClose();
                            }}
                            className="text-xs font-bold mt-2 underline hover:no-underline opacity-90 hover:opacity-100 transition-opacity"
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

/**
 * Toast Container Component
 * 管理多个Toast通知的容器
 */
export interface ToastMessage extends Omit<ToastProps, 'onClose'> {
    id: string;
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onRemoveToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onRemoveToast
}) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto"
                    style={{
                        transform: `translateY(${index * 80}px)`
                    }}
                >
                    <Toast {...toast} onClose={() => onRemoveToast(toast.id)} />
                </div>
            ))}
        </div>
    );
};

export default Toast;