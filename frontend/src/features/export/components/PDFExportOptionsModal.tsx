import React from 'react';
import { Globe, Download, X, Share2 } from 'lucide-react';

interface PDFExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenInBrowser: () => void;
    onSaveToDevice: () => void;
    onShareToApp?: () => void;
    isLoading?: boolean;
    error?: string | null;
}

/**
 * PDF导出选项Modal组件
 * 为移动端用户提供两种PDF导出方式：
 * 1. 在浏览器中打开 - 使用window.open()在新标签页打开PDF
 * 2. 保存到设备 - 使用HTML5 download属性触发下载
 */
export const PDFExportOptionsModal: React.FC<PDFExportOptionsModalProps> = ({
    isOpen,
    onClose,
    onOpenInBrowser,
    onSaveToDevice,
    onShareToApp,
    isLoading = false,
    error = null,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white">导出训练报告</h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="关闭"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Option 1: Open in Browser */}
                    <button
                        onClick={onOpenInBrowser}
                        disabled={isLoading}
                        className="w-full flex items-center gap-4 p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <Globe className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-base font-semibold text-white mb-1">
                                在浏览器中打开
                            </h3>
                            <p className="text-sm text-slate-400">
                                在新标签页中预览PDF
                            </p>
                        </div>
                    </button>

                    {/* Option 2: Save to Device */}
                    <button
                        onClick={onSaveToDevice}
                        disabled={isLoading}
                        className="w-full flex items-center gap-4 p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                            <Download className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-base font-semibold text-white mb-1">
                                保存到设备
                            </h3>
                            <p className="text-sm text-slate-400">
                                保存到文件或相册
                            </p>
                        </div>
                    </button>

                    {/* Option 3: Share to Other Apps */}
                    {onShareToApp && (
                        <button
                            onClick={onShareToApp}
                            disabled={isLoading}
                            className="w-full flex items-center gap-4 p-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                <Share2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="text-base font-semibold text-white mb-1">
                                    用其他应用打开
                                </h3>
                                <p className="text-sm text-slate-400">
                                    分享到其他应用程序
                                </p>
                            </div>
                        </button>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-400">正在生成PDF...</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <p className="text-xs text-slate-500 text-center">
                        PDF将根据您的训练数据实时生成
                    </p>
                </div>
            </div>
        </div>
    );
};