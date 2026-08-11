import React, { useState } from 'react';
import { BODY_PATHS, MUSCLE_PATHS } from '../../features/anatomy/constants/musclePaths';

/**
 * PDF SVG Path Tester - 用于审查 PDF 中显示的所有 SVG 路径
 * 
 * 功能：
 * 1. 显示基础轮廓路径（baseSilhouette）
 * 2. 显示装饰路径（detail1, detail2 等）
 * 3. 显示所有肌肉路径
 * 4. 允许单独切换每个路径的显示/隐藏
 * 5. 生成最终应该使用的路径列表
 */

interface PathItem {
    id: string;
    name: string;
    path: string;
    type: 'base' | 'detail' | 'muscle';
    view: 'front' | 'back';
}

const PDFSVGPathTester: React.FC = () => {
    const [view, setView] = useState<'front' | 'back'>('front');
    const [visiblePaths, setVisiblePaths] = useState<Set<string>>(new Set());
    const [highlightedPath, setHighlightedPath] = useState<string | null>(null);

    // 收集所有路径
    const getAllPaths = (selectedView: 'front' | 'back'): PathItem[] => {
        const paths: PathItem[] = [];
        const bodyPaths = selectedView === 'front' ? BODY_PATHS.front : BODY_PATHS.back;

        // 1. 基础轮廓
        paths.push({
            id: `${selectedView}_base`,
            name: `基础轮廓 (Base Silhouette)`,
            path: bodyPaths.baseSilhouette,
            type: 'base',
            view: selectedView
        });

        // 2. 装饰路径（如果存在）
        const bodyPathsAny = bodyPaths as any;
        Object.keys(bodyPathsAny).forEach(key => {
            if (key.startsWith('detail')) {
                paths.push({
                    id: `${selectedView}_${key}`,
                    name: `装饰路径 (${key})`,
                    path: bodyPathsAny[key],
                    type: 'detail',
                    view: selectedView
                });
            }
        });

        // 3. 肌肉路径
        Object.entries(MUSCLE_PATHS).forEach(([muscleKey, musclePath]) => {
            // 根据肌肉名称判断属于哪个视图
            const isFrontMuscle = [
                'chest', 'biceps', 'triceps', 'forearms', 'shoulders', 
                'abs', 'obliques', 'quads', 'traps_front', 'calves_front'
            ].includes(muscleKey);
            
            const isBackMuscle = [
                'traps', 'obliques_back', 'back_shoulders', 'back_triceps', 
                'back_forearms', 'lats', 'lower_back', 'glutes', 'hamstrings', 'calves'
            ].includes(muscleKey);

            if ((selectedView === 'front' && isFrontMuscle) || 
                (selectedView === 'back' && isBackMuscle)) {
                paths.push({
                    id: `${selectedView}_muscle_${muscleKey}`,
                    name: `肌肉: ${muscleKey}`,
                    path: musclePath,
                    type: 'muscle',
                    view: selectedView
                });
            }
        });

        return paths;
    };

    const allPaths = getAllPaths(view);

    // 切换路径可见性
    const togglePath = (pathId: string) => {
        const newVisible = new Set(visiblePaths);
        if (newVisible.has(pathId)) {
            newVisible.delete(pathId);
        } else {
            newVisible.add(pathId);
        }
        setVisiblePaths(newVisible);
    };

    // 全选/全不选
    const toggleAll = (show: boolean) => {
        if (show) {
            setVisiblePaths(new Set(allPaths.map(p => p.id)));
        } else {
            setVisiblePaths(new Set());
        }
    };

    // 生成 SVG
    const generateSVG = () => {
        const visiblePathItems = allPaths.filter(p => visiblePaths.has(p.id));
        
        let svgContent = `<svg viewBox="-30 0 400 700" xmlns="http://www.w3.org/2000/svg">\n`;
        
        visiblePathItems.forEach(item => {
            let fill = '#f1f5f9';
            let stroke = '#cbd5e1';
            let strokeWidth = '1.5';
            let opacity = '1';

            if (item.type === 'detail') {
                fill = '#e2e8f0';
                stroke = '#94a3b8';
                strokeWidth = '1';
                opacity = '0.9';
            } else if (item.type === 'muscle') {
                fill = '#3b82f6';
                stroke = '#2563eb';
                strokeWidth = '1.5';
                opacity = '0.6';
            }

            const highlight = highlightedPath === item.id ? 'filter: drop-shadow(0 0 8px red);' : '';
            
            svgContent += `    <!-- ${item.name} -->\n`;
            svgContent += `    <path\n`;
            svgContent += `        d="${item.path}"\n`;
            svgContent += `        fill="${fill}"\n`;
            svgContent += `        fill-opacity="${opacity}"\n`;
            svgContent += `        stroke="${stroke}"\n`;
            svgContent += `        stroke-width="${strokeWidth}"\n`;
            svgContent += `        style="${highlight}"\n`;
            svgContent += `    />\n`;
        });
        
        svgContent += `</svg>`;
        
        return svgContent;
    };

    // 导出配置
    const exportConfig = () => {
        const visiblePathItems = allPaths.filter(p => visiblePaths.has(p.id));
        const config = {
            view,
            paths: visiblePathItems.map(p => ({
                id: p.id,
                name: p.name,
                type: p.type
            }))
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pdf-svg-paths-${view}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        PDF SVG 路径测试工具
                    </h1>
                    <p className="text-gray-600">
                        审查并选择应该在 PDF 中显示的 SVG 路径
                    </p>
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
                                            setVisiblePaths(new Set());
                                            setHighlightedPath(null);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            view === 'front'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        正面 (Front)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setView('back');
                                            setVisiblePaths(new Set());
                                            setHighlightedPath(null);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            view === 'back'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        背面 (Back)
                                    </button>
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
                                        onClick={exportConfig}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                        导出配置
                                    </button>
                                </div>
                            </div>

                            {/* 路径列表 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    路径列表 ({visiblePaths.size}/{allPaths.length} 已选择)
                                </label>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-4">
                                    {/* 基础路径 */}
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">基础路径</h3>
                                        {allPaths.filter(p => p.type === 'base').map(path => (
                                            <div
                                                key={path.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                    highlightedPath === path.id
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                                onMouseEnter={() => setHighlightedPath(path.id)}
                                                onMouseLeave={() => setHighlightedPath(null)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={visiblePaths.has(path.id)}
                                                        onChange={() => togglePath(path.id)}
                                                        className="w-5 h-5 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {path.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {path.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 装饰路径 */}
                                    {allPaths.filter(p => p.type === 'detail').length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="font-semibold text-gray-900 mb-2">装饰路径</h3>
                                            {allPaths.filter(p => p.type === 'detail').map(path => (
                                                <div
                                                    key={path.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                        highlightedPath === path.id
                                                            ? 'border-red-500 bg-red-50'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                    onMouseEnter={() => setHighlightedPath(path.id)}
                                                    onMouseLeave={() => setHighlightedPath(null)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={visiblePaths.has(path.id)}
                                                            onChange={() => togglePath(path.id)}
                                                            className="w-5 h-5 text-blue-600 rounded"
                                                        />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {path.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                                                        {path.type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 肌肉路径 */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">肌肉路径</h3>
                                        {allPaths.filter(p => p.type === 'muscle').map(path => (
                                            <div
                                                key={path.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                    highlightedPath === path.id
                                                        ? 'border-red-500 bg-red-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                                onMouseEnter={() => setHighlightedPath(path.id)}
                                                onMouseLeave={() => setHighlightedPath(null)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={visiblePaths.has(path.id)}
                                                        onChange={() => togglePath(path.id)}
                                                        className="w-5 h-5 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {path.name}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                                                    {path.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧：SVG 预览 */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            SVG 预览
                        </h2>
                        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div 
                                className="flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: generateSVG() }}
                            />
                        </div>
                        
                        {/* SVG 代码 */}
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                                生成的 SVG 代码
                            </h3>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-[400px] overflow-y-auto">
                                {generateSVG()}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* 说明 */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        使用说明
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                        <li>选择正面或背面视图</li>
                        <li>勾选需要在 PDF 中显示的路径</li>
                        <li>鼠标悬停在路径名称上，右侧预览会高亮显示该路径</li>
                        <li>使用"全选"/"全不选"快速操作</li>
                        <li>点击"导出配置"保存选择的路径配置</li>
                        <li>查看生成的 SVG 代码，确认最终效果</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PDFSVGPathTester;