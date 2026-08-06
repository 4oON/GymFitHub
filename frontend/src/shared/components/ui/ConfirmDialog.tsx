import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

/**
 * 移动端友好的确认对话框组件
 * 替代原生的 confirm() 对话框，在移动端 APP 中更可靠
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = '确认 / Confirm',
    cancelText = '取消 / Cancel',
    onConfirm,
    onCancel,
    variant = 'warning'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-rose-500',
            iconBg: 'bg-rose-500/10',
            iconBorder: 'border-rose-500/20',
            confirmBtn: 'bg-rose-500 hover:bg-rose-400 shadow-rose-900/20'
        },
        warning: {
            icon: 'text-amber-500',
            iconBg: 'bg-amber-500/10',
            iconBorder: 'border-amber-500/20',
            confirmBtn: 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/20'
        },
        info: {
            icon: 'text-blue-500',
            iconBg: 'bg-blue-500/10',
            iconBorder: 'border-blue-500/20',
            confirmBtn: 'bg-blue-500 hover:bg-blue-400 shadow-blue-900/20'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl transform animate-slide-up">
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-start gap-4">
                        <div className={`${styles.iconBg} ${styles.iconBorder} p-3 rounded-2xl border flex-shrink-0`}>
                            <AlertTriangle className={styles.icon} size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-white mb-2 break-words">
                                {title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed break-words whitespace-pre-line">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] shadow-lg ${styles.confirmBtn}`}
                    >
                        {confirmText}
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full py-4 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all active:scale-[0.98]"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;