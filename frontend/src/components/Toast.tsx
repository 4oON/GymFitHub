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

/* ============================================================
 * 命令式 Toast（非 React 上下文可用）
 * ============================================================
 * iOS WKWebView 会静默屏蔽 alert()/confirm()/prompt()。export service 等
 * 非组件代码无法调用 useToast()，因此提供全局命令式 showToast()。
 * 依赖同一个文件，避免被死代码分析误判为孤立文件。
 * ========================================================== */

type ImperativeToastType = 'success' | 'error' | 'info' | 'warning';

interface ImperativeToastOptions {
    /** 显示时长（毫秒），默认 3200 */
    duration?: number;
}

const IMP_COLORS: Record<ImperativeToastType, { border: string; icon: string; bg: string; text: string }> = {
    success: { border: 'rgba(52,211,153,0.35)', icon: '#34d399', bg: 'rgba(6,78,59,0.97)', text: '#d1fae5' },
    error:   { border: 'rgba(251,113,133,0.35)', icon: '#fb7185', bg: 'rgba(127,29,29,0.97)', text: '#ffe4e6' },
    info:    { border: 'rgba(96,165,250,0.35)',  icon: '#60a5fa', bg: 'rgba(30,58,138,0.97)', text: '#dbeafe' },
    warning: { border: 'rgba(251,191,36,0.35)',  icon: '#fbbf24', bg: 'rgba(120,53,15,0.97)', text: '#fef3c7' },
};

const IMP_ICONS: Record<ImperativeToastType, string> = {
    success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    error:   '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
};

let impContainer: HTMLDivElement | null = null;

function getImpContainer(): HTMLDivElement | null {
    if (typeof document === 'undefined') return null;
    if (impContainer && document.body.contains(impContainer)) return impContainer;
    impContainer = document.createElement('div');
    impContainer.id = 'zenfit-imp-toast-container';
    Object.assign(impContainer.style, {
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '99999',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        maxWidth: '420px',
        padding: '0 16px',
        pointerEvents: 'none',
        boxSizing: 'border-box',
    });
    document.body.appendChild(impContainer);
    return impContainer;
}

/**
 * 命令式显示全局 Toast。
 * 可在 React 组件、service 文件、事件回调等任意位置调用。
 */
export function showToast(
    message: string,
    type: ImperativeToastType = 'info',
    options: ImperativeToastOptions = {}
): void {
    const container = getImpContainer();
    if (!container) {
        console.log(`[showToast:${type}] ${message}`);
        return;
    }

    const { duration = 3200 } = options;
    const c = IMP_COLORS[type];

    const el = document.createElement('div');
    Object.assign(el.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '14px',
        padding: '12px 16px',
        color: c.text,
        fontSize: '14px',
        fontWeight: '500',
        lineHeight: '1.4',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        pointerEvents: 'auto',
        opacity: '0',
        transform: 'translateY(-8px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        boxSizing: 'border-box',
    });

    const icon = document.createElement('span');
    icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${c.icon}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${IMP_ICONS[type]}</svg>`;
    Object.assign(icon.style, { display: 'flex', flexShrink: '0' });

    const text = document.createElement('span');
    text.textContent = message;
    text.style.flex = '1';

    el.appendChild(icon);
    el.appendChild(text);
    container.appendChild(el);

    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });

    let t: ReturnType<typeof setTimeout> | undefined;
    function dismiss() {
        if (t) clearTimeout(t);
        el.style.opacity = '0';
        el.style.transform = 'translateY(-8px)';
        setTimeout(() => el.remove(), 250);
    }

    t = setTimeout(dismiss, duration);
    el.addEventListener('click', dismiss);
}

/**
 * 便捷方法。
 */
export const impToast = {
    success: (msg: string, opts?: ImperativeToastOptions) => showToast(msg, 'success', opts),
    error:   (msg: string, opts?: ImperativeToastOptions) => showToast(msg, 'error', opts),
    info:    (msg: string, opts?: ImperativeToastOptions) => showToast(msg, 'info', opts),
    warning: (msg: string, opts?: ImperativeToastOptions) => showToast(msg, 'warning', opts),
};
