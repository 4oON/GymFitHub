import React, { useState } from 'react';
import { BODY_PATHS } from '../../features/anatomy/constants/musclePaths';

/**
 * Detail1 Path Analyzer - 分析和拆分 detail1 路径中的各个子路径
 * 
 * detail1 包含多个独立的 SVG 路径片段（用 M 命令分隔）
 * 这个工具可以让你单独查看和选择每个片段
 */

interface PathSegment {
    id: number;
    path: string;
    description: string;
}

const Detail1PathAnalyzer: React.FC = () => {
    const [view, setView] = useState<'front' | 'back'>('front');
    const [selectedSegments, setSelectedSegments] = useState<Set<number>>(new Set());
    const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);

    // 解析 detail1 路径，拆分成独立的子路径
    const parseDetail1Path = (detailPath: string): PathSegment[] => {
        if (!detailPath) return [];

        // 按 M 命令分割路径（M 表示 moveTo，开始新的子路径）
        const segments = detailPath.split(/(?=M)/).filter(s => s.trim());

        return segments.map((segment, index) => ({
            id: index,
            path: segment.trim(),
            description: `子路径 ${index + 1}`
        }));
    };

    const bodyPaths = view === 'front' ? BODY_PATHS.front : BODY_PATHS.back;
    const detail1Path = (bodyPaths as any).detail1 || '';
    const segments = parseDetail1Path(detail1Path);

    // 切换片段选择
    const toggleSegment = (id: number) => {
        const newSelected = new Set(selectedSegments);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedSegments(newSelected);
    };

    // 全选/全不选
    const toggleAll = (select: boolean) => {
        if (select) {
            setSelectedSegments(new Set(segments.map(s => s.id)));
        } else {
            setSelectedSegments(new Set());
        }
    };

    // 生成 SVG
    const generateSVG = () => {
        const basePath = bodyPaths.baseSilhouette;
        const selectedPaths = segments
            .filter(s => selectedSegments.has(s.id))
            .map(s => s.path)
            .join(' ');

        return `<svg viewBox="-30 0 400 700" xmlns="http://www.w3.org/2000/svg">
    <!-- 基础轮廓 -->
    <path d="${basePath}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
    
    <!-- 选中的 detail1 子路径 -->
    ${selectedPaths ? `<path d="${selectedPaths}" fill="#e2e8f0" fill-opacity="0.9" stroke="#94a3b8" stroke-width="1"/>` : ''}
    
    <!-- 高亮的子路径（如果有） -->
    ${highlightedSegment !== null && segments[highlightedSegment] ?
                `<path d="${segments[highlightedSegment].path}" fill="#ff0000" fill-opacity="0.5" stroke="#ff0000" stroke-width="2"/>`
                : ''}
</svg>`;
    };

    // 导出选中的路径
    const exportSelectedPaths = () => {
        const selectedPaths = segments
            .filter(s => selectedSegments.has(s.id))
            .map(s => s.path)
            .join(' ');

        const config = {
            view,
            selectedSegments: Array.from(selectedSegments),
            combinedPath: selectedPaths,
            segments: segments.filter(s => selectedSegments.has(s.id)).map(s => ({
                id: s.id,
                description: s.description,
                path: s.path
            }))
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `detail1-selected-${view}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Detail1 路径分析工具
                    </h1>
                    <p className="text-gray-600">
                        分析 detail1 中的各个子路径片段，选择需要保留的部分
                    </p>
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>问题：</strong> detail1 是一个"大杂烩"路径，包含多个不相关的装饰元素混在一起。
                            <br />
                            <strong>解决：</strong> 这个工具可以让你单独查看每个子路径，只保留需要的部分（如头部轮廓），移除不需要的部分（如胸部小三角形）。
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左侧：控制面板 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="space-y-6">
                            {/* 视图切换 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    选择视图
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setView('front');
                                            setSelectedSegments(new Set());
                                            setHighlightedSegment(null);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'front'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        正面 (Front)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setView('back');
                                            setSelectedSegments(new Set());
                                            setHighlightedSegment(null);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'back'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                    >
                                        背面 (Back)
                                    </button>
                                </div>
                            </div>

                            {/* 统计信息 */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="font-semibold text-blue-900 mb-2">路径统计</h3>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p>总共 {segments.length} 个子路径片段</p>
                                    <p>已选择 {selectedSegments.size} 个</p>
                                    <p>未选择 {segments.length - selectedSegments.size} 个</p>
                                </div>
                            </div>

                            {/* 批量操作 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    批量操作
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleAll(true)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        全选
                                    </button>
                                    <button
                                        onClick={() => toggleAll(false)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        全不选
                                    </button>
                                    <button
                                        onClick={exportSelectedPaths}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                        disabled={selectedSegments.size === 0}
                                    >
                                        导出选中
                                    </button>
                                </div>
                            </div>

                            {/* 子路径列表 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Detail1 子路径列表
                                </label>
                                {segments.length === 0 ? (
                                    <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                                        {view === 'back' ? '背面视图没有 detail1 路径' : '没有找到 detail1 路径'}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-4">
                                        {segments.map((segment) => (
                                            <div
                                                key={segment.id}
                                                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${highlightedSegment === segment.id
                                                        ? 'border-red-500 bg-red-50'
                                                        : selectedSegments.has(segment.id)
                                                            ? 'border-green-500 bg-green-50'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                onMouseEnter={() => setHighlightedSegment(segment.id)}
                                                onMouseLeave={() => setHighlightedSegment(null)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSegments.has(segment.id)}
                                                            onChange={() => toggleSegment(segment.id)}
                                                            className="w-5 h-5 text-blue-600 rounded mt-1"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900 mb-1">
                                                                {segment.description}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded overflow-x-auto">
                                                                {segment.path.substring(0, 100)}...
                                                            </div>
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                长度: {segment.path.length} 字符
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded ${selectedSegments.has(segment.id)
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        #{segment.id + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧：SVG 预览 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            SVG 预览
                        </h2>
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
                            <div
                                className="flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: generateSVG() }}
                            />
                        </div>

                        {/* 说明 */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                                <span>基础轮廓（浅灰色）</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-300 border border-gray-500 rounded"></div>
                                <span>选中的 detail1 子路径（浅灰色）</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-300 border-2 border-red-600 rounded"></div>
                                <span>鼠标悬停的子路径（红色高亮）</span>
                            </div>
                        </div>

                        {/* 组合路径代码 */}
                        {selectedSegments.size > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    组合后的 detail1 路径
                                </h3>
                                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-[200px] overflow-y-auto">
                                    {segments
                                        .filter(s => selectedSegments.has(s.id))
                                        .map(s => s.path)
                                        .join(' ')}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* 使用说明 */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        使用说明
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>选择正面或背面视图</li>
                        <li>查看 detail1 被拆分成的各个子路径片段</li>
                        <li>鼠标悬停在片段上，右侧预览会用红色高亮显示该片段的位置</li>
                        <li>勾选需要保留的片段（如头部轮廓）</li>
                        <li>取消不需要的片段（如胸部小三角形）</li>
                        <li>点击"导出选中"保存组合后的路径</li>
                        <li>将导出的路径发送给我，我会更新代码</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Detail1PathAnalyzer;