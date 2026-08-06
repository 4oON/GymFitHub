import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Save, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Move, RefreshCw, Copy, Check } from 'lucide-react';
import {
  BODY_PATHS,
  MUSCLE_PATHS,
  MUSCLE_DISPLAY_NAMES,
  MUSCLE_METADATA,
  getMusclesForView,
  getMusclesForViewFromMetadata
} from '../../features/anatomy/constants/musclePaths';

type MuscleId = keyof typeof MUSCLE_PATHS;
type BodyView = 'front' | 'back';
type EditorMode = 'muscle' | 'outline';

interface SVGPathEditorProps {
  onClose: () => void;
}

interface SelectedMuscle {
  id: MuscleId;
  path: string;
  displayName: string;
  view: BodyView;
}

interface SelectedOutline {
  view: BodyView;
  pathKey: string;
  path: string;
  displayName: string;
}

const SVGPathEditor: React.FC<SVGPathEditorProps> = ({ onClose }) => {
  const [bodyView, setBodyView] = useState<BodyView>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<SelectedMuscle | null>(null);
  const [editedPath, setEditedPath] = useState<string>('');
  const [editedView, setEditedView] = useState<BodyView>('front');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [muscleViewOverrides, setMuscleViewOverrides] = useState<Record<string, BodyView>>({});
  const [editorMode, setEditorMode] = useState<EditorMode>('muscle');
  const [selectedOutline, setSelectedOutline] = useState<SelectedOutline | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG viewport dimensions
  const viewBox = { width: 400, height: 600, x: 0, y: 0 };

  // Get muscles for current view (with overrides)
  const musclesInView = getMusclesForViewFromMetadata(bodyView).filter(muscleId => {
    const override = muscleViewOverrides[muscleId];
    return override ? override === bodyView : MUSCLE_METADATA[muscleId]?.view === bodyView;
  }) as MuscleId[];

  // Get outline paths for a specific view
  const getOutlinePathsForView = (view: BodyView) => {
    const paths = BODY_PATHS[view];
    return Object.entries(paths).map(([key, path]) => ({
      key,
      path,
      displayName: key === 'baseSilhouette'
        ? `${view === 'front' ? '正面' : '背面'}主轮廓`
        : `${view === 'front' ? '正面' : '背面'}细节 ${key}`
    }));
  };

  // Handle outline selection
  const handleOutlineSelect = (view: BodyView, pathKey: string) => {
    const path = BODY_PATHS[view][pathKey as keyof typeof BODY_PATHS.front];
    const displayName = pathKey === 'baseSilhouette'
      ? `${view === 'front' ? '正面' : '背面'}主轮廓`
      : `${view === 'front' ? '正面' : '背面'}细节 ${pathKey}`;
    
    setSelectedOutline({ view, pathKey, path, displayName });
    setEditedPath(path);
    setSelectedMuscle(null);
  };

  // Copy path to clipboard
  const handleCopyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle muscle selection
  const handleMuscleClick = (muscleId: MuscleId) => {
    if (editorMode !== 'muscle') return;
    const path = MUSCLE_PATHS[muscleId];
    const displayName = MUSCLE_DISPLAY_NAMES[muscleId] || muscleId;
    const currentView = muscleViewOverrides[muscleId] || MUSCLE_METADATA[muscleId]?.view || 'front';
    
    setSelectedMuscle({
      id: muscleId,
      path,
      displayName,
      view: currentView
    });
    setEditedPath(path);
    setEditedView(currentView);
    setSelectedOutline(null);
  };

  // Handle view type change
  const handleViewChange = (newView: BodyView) => {
    if (!selectedMuscle) return;
    
    setEditedView(newView);
    setMuscleViewOverrides(prev => ({
      ...prev,
      [selectedMuscle.id]: newView
    }));
    
    // Update selected muscle
    setSelectedMuscle({
      ...selectedMuscle,
      view: newView
    });
  };

  // Handle path edit
  const handlePathChange = (newPath: string) => {
    setEditedPath(newPath);
  };

  // Reset to original path
  const handleReset = () => {
    if (selectedMuscle) {
      setEditedPath(selectedMuscle.path);
      const originalView = MUSCLE_METADATA[selectedMuscle.id]?.view || 'front';
      setEditedView(originalView);
      setMuscleViewOverrides(prev => {
        const newOverrides = { ...prev };
        delete newOverrides[selectedMuscle.id];
        return newOverrides;
      });
    } else if (selectedOutline) {
      setEditedPath(selectedOutline.path);
    }
  };

  // Export muscle configuration
  const exportMuscleConfig = () => {
    if (!selectedMuscle) return;

    const originalView = MUSCLE_METADATA[selectedMuscle.id]?.view || 'front';
    const viewChanged = editedView !== originalView;
    const pathChanged = editedPath !== selectedMuscle.path;

    const exportData = {
      muscleId: selectedMuscle.id,
      displayName: selectedMuscle.displayName,
      originalPath: selectedMuscle.path,
      editedPath: editedPath,
      originalView: originalView,
      editedView: editedView,
      viewChanged: viewChanged,
      pathChanged: pathChanged,
      timestamp: new Date().toISOString()
    };

    // Create TypeScript code
    let tsCode = `// Updated muscle configuration for ${selectedMuscle.displayName}
// Generated at: ${exportData.timestamp}
// Changes: ${pathChanged ? '✓ Path' : '✗ Path'} | ${viewChanged ? '✓ View' : '✗ View'}

`;

    if (pathChanged) {
      tsCode += `// 1. Update MUSCLE_PATHS
export const UPDATED_${selectedMuscle.id.toUpperCase()}_PATH = "${editedPath}";

// Apply to musclePaths.ts:
// ${selectedMuscle.id}: "${editedPath}"

`;
    }

    if (viewChanged) {
      tsCode += `// 2. Update MUSCLE_METADATA
// Change view from '${originalView}' to '${editedView}'
// In musclePaths.ts, update:
// ${selectedMuscle.id}: { view: '${editedView}', displayName: '${selectedMuscle.displayName}', category: '${MUSCLE_METADATA[selectedMuscle.id]?.category || 'upper_body'}' }

`;
    }

    tsCode += `
// Full configuration:
/*
MUSCLE_PATHS: {
  ${selectedMuscle.id}: "${editedPath}"
}

MUSCLE_METADATA: {
  ${selectedMuscle.id}: {
    view: '${editedView}',
    displayName: '${selectedMuscle.displayName}',
    category: '${MUSCLE_METADATA[selectedMuscle.id]?.category || 'upper_body'}'
  }
}
*/
`;

    // Download as .ts file
    const blob = new Blob([tsCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMuscle.id}_updated_${Date.now()}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export outline configuration
  const exportOutlineConfig = () => {
    if (!selectedOutline) return;

    const pathChanged = editedPath !== selectedOutline.path;

    const tsCode = `// Updated body outline configuration
// Generated at: ${new Date().toISOString()}
// View: ${selectedOutline.view}
// Path Key: ${selectedOutline.pathKey}
// Changes: ${pathChanged ? '✓ Path Modified' : '✗ No Changes'}

export const UPDATED_BODY_PATH_${selectedOutline.view.toUpperCase()}_${selectedOutline.pathKey.toUpperCase()} = "${editedPath}";

// Apply to musclePaths.ts:
/*
export const BODY_PATHS = {
  ${selectedOutline.view}: {
    ${selectedOutline.pathKey}: "${editedPath}"${selectedOutline.view === 'front' && selectedOutline.pathKey === 'baseSilhouette' ? ',\\n    detail1: "..."' : ''}
  }${selectedOutline.view === 'front' ? ',\\n  back: { ... }' : ''}
};
*/

// Path length: ${editedPath.length} characters
// Original length: ${selectedOutline.path.length} characters
// Difference: ${editedPath.length - selectedOutline.path.length > 0 ? '+' : ''}${editedPath.length - selectedOutline.path.length} characters
`;

    const blob = new Blob([tsCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `body_paths_${selectedOutline.view}_${selectedOutline.pathKey}_updated_${Date.now()}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export handler
  const handleExport = () => {
    if (editorMode === 'muscle' && selectedMuscle) {
      exportMuscleConfig();
    } else if (editorMode === 'outline' && selectedOutline) {
      exportOutlineConfig();
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.shiftKey) { // Left click + Shift for panning
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Validate SVG path
  const isValidPath = (path: string): boolean => {
    if (!path || path.trim() === '') return false;
    const trimmed = path.trim();
    return /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.-]+$/.test(trimmed);
  };

  const pathIsValid = isValidPath(editedPath);
  const pathHasChanged = (selectedMuscle && editedPath !== selectedMuscle.path) ||
                         (selectedOutline && editedPath !== selectedOutline.path);
  const viewHasChanged = selectedMuscle && editedView !== (MUSCLE_METADATA[selectedMuscle.id]?.view || 'front');
  const hasAnyChanges = pathHasChanged || viewHasChanged;

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Eye size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SVG Path Editor</h2>
            <p className="text-purple-100 text-sm">可视化编辑肌肉路径</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - SVG Canvas */}
        <div className="flex-1 bg-slate-900 relative overflow-hidden">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 flex gap-2 border border-slate-700">
            <button
              onClick={() => setBodyView('front')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bodyView === 'front'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              正面
            </button>
            <button
              onClick={() => setBodyView('back')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bodyView === 'back'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              背面
            </button>
            <div className="w-px bg-slate-600 mx-1"></div>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title={showGrid ? '隐藏网格' : '显示网格'}
            >
              {showGrid ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-xl p-2 flex flex-col gap-2 border border-slate-700">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="放大"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="缩小"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={handleResetView}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="重置视图"
            >
              <RotateCcw size={18} />
            </button>
            <div className="text-xs text-slate-400 text-center mt-1">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Pan Hint */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Move size={14} />
              <span>按住 Shift + 拖拽 来平移视图</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div
            className="w-full h-full flex items-center justify-center cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              className="max-w-full max-h-full"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              {/* Grid */}
              {showGrid && (
                <g opacity="0.1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <React.Fragment key={i}>
                      <line
                        x1={i * 20}
                        y1={0}
                        x2={i * 20}
                        y2={viewBox.height}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      <line
                        x1={0}
                        y1={i * 30}
                        x2={viewBox.width}
                        y2={i * 30}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    </React.Fragment>
                  ))}
                </g>
              )}

              {/* Body Silhouette */}
              <path
                d={bodyView === 'front' ? BODY_PATHS.front.baseSilhouette : BODY_PATHS.back.baseSilhouette}
                fill="none"
                stroke="#475569"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Muscle Paths - Only show in muscle mode */}
              {editorMode === 'muscle' && musclesInView.map((muscleId) => {
                const isSelected = selectedMuscle?.id === muscleId;
                const path = isSelected && editedPath ? editedPath : MUSCLE_PATHS[muscleId];
                
                return (
                  <path
                    key={muscleId}
                    d={path}
                    fill={isSelected ? '#8b5cf6' : '#3b82f6'}
                    fillOpacity={isSelected ? 0.6 : 0.3}
                    stroke={isSelected ? '#a78bfa' : '#60a5fa'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="cursor-pointer transition-all hover:fill-opacity-50"
                    onClick={() => handleMuscleClick(muscleId)}
                  />
                );
              })}

              {/* Edited Muscle Path Preview (if different from original) */}
              {editorMode === 'muscle' && selectedMuscle && pathHasChanged && pathIsValid && (
                <path
                  d={editedPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.8"
                />
              )}

              {/* Outline Path Preview - Show in outline mode */}
              {editorMode === 'outline' && selectedOutline && (
                <>
                  {/* Original outline path (dimmed) */}
                  <path
                    d={selectedOutline.path}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                  
                  {/* Edited outline path (highlighted) */}
                  {pathIsValid && (
                    <path
                      d={editedPath}
                      fill="none"
                      stroke={pathHasChanged ? "#10b981" : "#8b5cf6"}
                      strokeWidth="3"
                      strokeDasharray={pathHasChanged ? "4 2" : "none"}
                      opacity="0.9"
                    />
                  )}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Right Panel - Editor */}
        <div className="w-96 bg-slate-800 border-l border-slate-700 flex flex-col overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => { setEditorMode('muscle'); setSelectedOutline(null); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                editorMode === 'muscle'
                  ? 'bg-slate-700 text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              肌肉路径
            </button>
            <button
              onClick={() => { setEditorMode('outline'); setSelectedMuscle(null); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                editorMode === 'outline'
                  ? 'bg-slate-700 text-white border-b-2 border-purple-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              外轮廓路径
            </button>
          </div>

          {/* Muscle Mode Content */}
          {editorMode === 'muscle' && selectedMuscle && (
            <>
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white mb-1">
                  {selectedMuscle.displayName}
                </h3>
                <p className="text-xs text-slate-400">ID: {selectedMuscle.id}</p>
                
                {/* Change indicators */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {pathHasChanged && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                      <span>路径已修改</span>
                    </div>
                  )}
                  {viewHasChanged && (
                    <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                      <RefreshCw size={12} className="animate-spin" />
                      <span>视图已更改</span>
                    </div>
                  )}
                </div>
              </div>

              {/* View Type Selector */}
              <div className="px-4 pt-4 pb-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  视图类型 (View Type)
                </label>
                <select
                  value={editedView}
                  onChange={(e) => handleViewChange(e.target.value as BodyView)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  <option value="front">正面 (Front)</option>
                  <option value="back">背面 (Back)</option>
                </select>
                {viewHasChanged && (
                  <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <RefreshCw size={10} />
                    原始视图: {MUSCLE_METADATA[selectedMuscle.id]?.view === 'front' ? '正面' : '背面'}
                  </p>
                )}
              </div>

              {/* Path Editor */}
              <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SVG Path Data
                </label>
                <textarea
                  value={editedPath}
                  onChange={(e) => handlePathChange(e.target.value)}
                  className={`flex-1 bg-slate-900 border rounded-lg p-3 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:ring-2 transition-all ${
                    pathIsValid
                      ? 'border-slate-600 focus:ring-purple-500'
                      : 'border-red-500 focus:ring-red-500'
                  }`}
                  placeholder="输入 SVG path 数据..."
                  spellCheck={false}
                />
                
                {!pathIsValid && editedPath && (
                  <p className="text-xs text-red-400 mt-2">
                    ⚠️ 无效的 SVG path 格式
                  </p>
                )}

                {/* Path Stats */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 rounded-lg p-2">
                    <div className="text-slate-500">长度</div>
                    <div className="text-white font-bold">{editedPath.length} 字符</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-2">
                    <div className="text-slate-500">状态</div>
                    <div className={`font-bold ${pathIsValid ? 'text-green-400' : 'text-red-400'}`}>
                      {pathIsValid ? '✓ 有效' : '✗ 无效'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-700 space-y-2">
                <button
                  onClick={handleReset}
                  disabled={!hasAnyChanges}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <RotateCcw size={16} />
                  重置所有修改
                </button>
                <button
                  onClick={handleExport}
                  disabled={!pathIsValid || !hasAnyChanges}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  导出配置文件
                </button>
                
                {/* Export info */}
                {hasAnyChanges && (
                  <div className="text-xs text-slate-400 text-center pt-1">
                    将导出: {pathHasChanged ? '路径' : ''}{pathHasChanged && viewHasChanged ? ' + ' : ''}{viewHasChanged ? '视图类型' : ''}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Muscle Mode - No Selection */}
          {editorMode === 'muscle' && !selectedMuscle && (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <div className="bg-slate-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye size={32} className="text-slate-500" />
                </div>
                <h3 className="text-white font-bold mb-2">选择一个肌肉</h3>
                <p className="text-slate-400 text-sm">
                  点击左侧的肌肉区域开始编辑
                </p>
              </div>
            </div>
          )}

          {/* Outline Mode Content */}
          {editorMode === 'outline' && (
            <>
              {selectedOutline ? (
                <>
                  {/* Selected Outline - Show Editor */}
                  <div className="p-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-1">{selectedOutline.displayName}</h3>
                    <p className="text-xs text-slate-400">
                      视图: {selectedOutline.view === 'front' ? '正面' : '背面'} | Key: {selectedOutline.pathKey}
                    </p>
                    
                    {pathHasChanged && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                        <span>路径已修改</span>
                      </div>
                    )}
                  </div>

                  {/* Path Editor */}
                  <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">SVG Path Data</label>
                    <textarea
                      value={editedPath}
                      onChange={(e) => handlePathChange(e.target.value)}
                      className={`flex-1 bg-slate-900 border rounded-lg p-3 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:ring-2 transition-all ${
                        pathIsValid ? 'border-slate-600 focus:ring-purple-500' : 'border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="输入 SVG path 数据..."
                      spellCheck={false}
                    />
                    
                    {!pathIsValid && editedPath && (
                      <p className="text-xs text-red-400 mt-2">⚠️ 无效的 SVG path 格式</p>
                    )}

                    {/* Path Stats */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-900 rounded-lg p-2">
                        <div className="text-slate-500">长度</div>
                        <div className="text-white font-bold">{editedPath.length}</div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2">
                        <div className="text-slate-500">原始</div>
                        <div className="text-white font-bold">{selectedOutline.path.length}</div>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-2">
                        <div className="text-slate-500">差异</div>
                        <div className={`font-bold ${
                          editedPath.length > selectedOutline.path.length ? 'text-amber-400' :
                          editedPath.length < selectedOutline.path.length ? 'text-blue-400' : 'text-slate-400'
                        }`}>
                          {editedPath.length - selectedOutline.path.length > 0 ? '+' : ''}{editedPath.length - selectedOutline.path.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-slate-700 space-y-2">
                    <button
                      onClick={handleReset}
                      disabled={!pathHasChanged}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <RotateCcw size={16} />
                      重置修改
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={!pathIsValid || !pathHasChanged}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download size={16} />
                      导出配置文件
                    </button>
                    
                    {pathHasChanged && (
                      <div className="text-xs text-slate-400 text-center pt-1">
                        将导出外轮廓配置
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* No Selection - Show List */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-slate-300 mb-3">选择要编辑的外轮廓</h3>
                      
                      {/* Front View Outlines */}
                      <div className="mb-4">
                        <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">正面视图</div>
                        <div className="space-y-2">
                          {getOutlinePathsForView('front').map(({ key, path, displayName }) => (
                            <div key={`front-${key}`} className="bg-slate-900 rounded-lg p-3 border border-slate-700 hover:border-purple-500 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-white">{displayName}</div>
                                <button
                                  onClick={() => handleCopyPath(path)}
                                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                                  title="复制路径"
                                >
                                  {copiedPath === path ? (
                                    <Check size={14} className="text-green-400" />
                                  ) : (
                                    <Copy size={14} className="text-slate-400" />
                                  )}
                                </button>
                              </div>
                              <div className="text-xs text-slate-500 mb-2">长度: {path.length} 字符</div>
                              <button
                                onClick={() => handleOutlineSelect('front', key)}
                                className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                              >
                                编辑此路径
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Back View Outlines */}
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">背面视图</div>
                        <div className="space-y-2">
                          {getOutlinePathsForView('back').map(({ key, path, displayName }) => (
                            <div key={`back-${key}`} className="bg-slate-900 rounded-lg p-3 border border-slate-700 hover:border-purple-500 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-white">{displayName}</div>
                                <button
                                  onClick={() => handleCopyPath(path)}
                                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                                  title="复制路径"
                                >
                                  {copiedPath === path ? (
                                    <Check size={14} className="text-green-400" />
                                  ) : (
                                    <Copy size={14} className="text-slate-400" />
                                  )}
                                </button>
                              </div>
                              <div className="text-xs text-slate-500 mb-2">长度: {path.length} 字符</div>
                              <button
                                onClick={() => handleOutlineSelect('back', key)}
                                className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                              >
                                编辑此路径
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div>
          当前视图: <span className="text-white font-medium">{bodyView === 'front' ? '正面' : '背面'}</span>
          {' | '}
          模式: <span className="text-white font-medium">{editorMode === 'muscle' ? '肌肉路径' : '外轮廓路径'}</span>
          {editorMode === 'muscle' && (
            <>
              {' | '}
              肌肉数量: <span className="text-white font-medium">{musclesInView.length}</span>
            </>
          )}
        </div>
        <div>
          Phase 0.1.6 - SVG Path Editor v1.1 (with Outline Editing)
        </div>
      </div>
    </div>
  );
};

export default SVGPathEditor;