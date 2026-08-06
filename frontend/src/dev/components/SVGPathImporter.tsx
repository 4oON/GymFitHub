import React, { useState, useMemo } from 'react';
import { X, Copy, Download, CheckCircle, AlertCircle, FileImage } from 'lucide-react';

type MuscleId = 'chest' | 'shoulders' | 'biceps' | 'forearms' | 'abs' | 'obliques' | 'quads' |
    'traps' | 'lats' | 'triceps' | 'lower_back' | 'glutes' | 'hamstrings' | 'calves' |
    'shoulders_back' | 'forearms_back';

type BodyPartId = 'front_silhouette' | 'back_silhouette';

interface MusclePathData {
    muscle: MuscleId;
    displayName: string;
    view: 'front' | 'back';
    path: string;
    description: string;
}

interface BodyPathData {
    id: BodyPartId;
    displayName: string;
    view: 'front' | 'back';
    path: string;
    description: string;
}

interface SVGPathImporterProps {
    onClose: () => void;
}

const SVGPathImporter: React.FC<SVGPathImporterProps> = ({ onClose }) => {
    // Body silhouette paths
    const [bodyPaths, setBodyPaths] = useState<Record<BodyPartId, string>>({
        front_silhouette: '',
        back_silhouette: ''
    });

    // Muscle paths
    const [musclePaths, setMusclePaths] = useState<Record<MuscleId, string>>({
        // Front view
        chest: '',
        shoulders: '',
        biceps: '',
        forearms: '',
        abs: '',
        obliques: '',
        quads: '',
        // Back view
        traps: '',
        lats: '',
        triceps: '',
        lower_back: '',
        glutes: '',
        hamstrings: '',
        calves: '',
        shoulders_back: '',
        forearms_back: ''
    });

    const [exportFormat, setExportFormat] = useState<'typescript' | 'json'>('typescript');
    const [showPreview, setShowPreview] = useState(false);

    // Body parts configuration
    const bodyPartsConfig: BodyPathData[] = [
        {
            id: 'front_silhouette',
            displayName: 'Front Body Silhouette',
            view: 'front',
            path: '',
            description: 'Complete front view body outline'
        },
        {
            id: 'back_silhouette',
            displayName: 'Back Body Silhouette',
            view: 'back',
            path: '',
            description: 'Complete back view body outline'
        }
    ];

    // Muscle configuration
    const muscleConfig: MusclePathData[] = [
        // Front view muscles
        { muscle: 'chest', displayName: 'Chest (Pectorals)', view: 'front', path: '', description: 'Pectoralis major and minor' },
        { muscle: 'shoulders', displayName: 'Shoulders (Deltoids) - Front', view: 'front', path: '', description: 'Anterior deltoids' },
        { muscle: 'biceps', displayName: 'Biceps', view: 'front', path: '', description: 'Biceps brachii' },
        { muscle: 'forearms', displayName: 'Forearms - Front', view: 'front', path: '', description: 'Forearm flexors' },
        { muscle: 'abs', displayName: 'Abs (Rectus Abdominis)', view: 'front', path: '', description: 'Six-pack muscles' },
        { muscle: 'obliques', displayName: 'Obliques', view: 'front', path: '', description: 'External and internal obliques' },
        { muscle: 'quads', displayName: 'Quadriceps', view: 'front', path: '', description: 'Front thigh muscles' },

        // Back view muscles
        { muscle: 'traps', displayName: 'Trapezius', view: 'back', path: '', description: 'Upper back and neck' },
        { muscle: 'lats', displayName: 'Lats (Latissimus Dorsi)', view: 'back', path: '', description: 'Large back muscles' },
        { muscle: 'shoulders_back', displayName: 'Shoulders (Deltoids) - Back', view: 'back', path: '', description: 'Posterior deltoids' },
        { muscle: 'triceps', displayName: 'Triceps', view: 'back', path: '', description: 'Back of upper arm' },
        { muscle: 'forearms_back', displayName: 'Forearms - Back', view: 'back', path: '', description: 'Forearm extensors' },
        { muscle: 'lower_back', displayName: 'Lower Back (Erector Spinae)', view: 'back', path: '', description: 'Lower back muscles' },
        { muscle: 'glutes', displayName: 'Glutes', view: 'back', path: '', description: 'Gluteus maximus' },
        { muscle: 'hamstrings', displayName: 'Hamstrings', view: 'back', path: '', description: 'Back thigh muscles' },
        { muscle: 'calves', displayName: 'Calves (Gastrocnemius)', view: 'back', path: '', description: 'Calf muscles' }
    ];

    // Validate SVG path format
    const isValidPath = (path: string): boolean => {
        if (!path || path.trim() === '') return false;
        const trimmed = path.trim();
        return trimmed.startsWith('M') || trimmed.startsWith('m');
    };

    // Handle body path change
    const handleBodyPathChange = (id: BodyPartId, value: string) => {
        setBodyPaths(prev => ({ ...prev, [id]: value }));
    };

    // Handle muscle path change
    const handleMusclePathChange = (muscle: MuscleId, value: string) => {
        setMusclePaths(prev => ({ ...prev, [muscle]: value }));
    };

    // Calculate progress
    const progress = useMemo(() => {
        const bodyCount = Object.values(bodyPaths).filter((p): p is string => isValidPath(p as string)).length;
        const muscleCount = Object.values(musclePaths).filter((p): p is string => isValidPath(p as string)).length;
        const total = bodyPartsConfig.length + muscleConfig.length;
        const completed = bodyCount + muscleCount;
        return { completed, total, percentage: Math.round((completed / total) * 100) };
    }, [bodyPaths, musclePaths]);

    // Generate TypeScript export
    const generateTypeScriptExport = (): string => {
        let code = `// Auto-generated muscle anatomy paths\n`;
        code += `// Generated at: ${new Date().toISOString()}\n\n`;

        // Body paths
        code += `export const BODY_PATHS = {\n`;
        code += `    front: {\n`;
        code += `        baseSilhouette: "${bodyPaths.front_silhouette || 'MISSING'}"\n`;
        code += `    },\n`;
        code += `    back: {\n`;
        code += `        baseSilhouette: "${bodyPaths.back_silhouette || 'MISSING'}"\n`;
        code += `    }\n`;
        code += `};\n\n`;

        // Muscle paths - combine front and back shoulders/forearms
        code += `export const MUSCLE_PATHS = {\n`;
        const exportedMuscles: Record<string, string[]> = {};

        muscleConfig.forEach((config) => {
            const path = musclePaths[config.muscle] || 'MISSING';

            // Handle shoulders and forearms - combine front and back
            if (config.muscle === 'shoulders' || config.muscle === 'shoulders_back') {
                if (!exportedMuscles['shoulders']) exportedMuscles['shoulders'] = [];
                exportedMuscles['shoulders'].push(path);
            } else if (config.muscle === 'forearms' || config.muscle === 'forearms_back') {
                if (!exportedMuscles['forearms']) exportedMuscles['forearms'] = [];
                exportedMuscles['forearms'].push(path);
            } else {
                exportedMuscles[config.muscle] = [path];
            }
        });

        // Output combined paths
        const muscleKeys = Object.keys(exportedMuscles);
        muscleKeys.forEach((key, index) => {
            const paths = exportedMuscles[key];
            if (paths.length > 1) {
                // Combine multiple paths with newline
                code += `    ${key}: "${paths.join('\\n')}"`;
            } else {
                code += `    ${key}: "${paths[0]}"`;
            }
            if (index < muscleKeys.length - 1) code += ',';

            // Add comment
            const displayName = muscleConfig.find(m =>
                m.muscle === key || m.muscle === `${key}_back`
            )?.displayName || key;
            code += `  // ${displayName}\n`;
        });
        code += `};\n`;

        return code;
    };

    // Generate JSON export
    const generateJSONExport = (): string => {
        const data = {
            metadata: {
                generated: new Date().toISOString(),
                version: '1.0',
                totalPaths: progress.total,
                completedPaths: progress.completed
            },
            bodyPaths: {
                front: {
                    baseSilhouette: bodyPaths.front_silhouette || null
                },
                back: {
                    baseSilhouette: bodyPaths.back_silhouette || null
                }
            },
            musclePaths: muscleConfig.reduce((acc, config) => {
                acc[config.muscle] = {
                    path: musclePaths[config.muscle] || null,
                    displayName: config.displayName,
                    view: config.view,
                    description: config.description
                };
                return acc;
            }, {} as Record<string, any>)
        };

        return JSON.stringify(data, null, 2);
    };

    // Copy to clipboard
    const handleCopy = () => {
        const content = exportFormat === 'typescript'
            ? generateTypeScriptExport()
            : generateJSONExport();
        navigator.clipboard.writeText(content);
        alert('已复制到剪贴板！');
    };

    // Download file
    const handleDownload = () => {
        const content = exportFormat === 'typescript'
            ? generateTypeScriptExport()
            : generateJSONExport();
        const extension = exportFormat === 'typescript' ? 'ts' : 'json';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `muscle-paths.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const frontBodyParts = bodyPartsConfig.filter(b => b.view === 'front');
    const backBodyParts = bodyPartsConfig.filter(b => b.view === 'back');
    const frontMuscles = muscleConfig.filter(m => m.view === 'front');
    const backMuscles = muscleConfig.filter(m => m.view === 'back');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileImage size={28} className="text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">SVG路径导入工具</h2>
                            <p className="text-emerald-100 text-sm mt-1">
                                粘贴完整的SVG路径数据（包括全身图轮廓和所有肌肉组 - 共{progress.total}个路径）
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-800 p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 text-sm font-medium">
                            完成进度: {progress.completed} / {progress.total} ({progress.percentage}%)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setExportFormat('typescript')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${exportFormat === 'typescript'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                TypeScript
                            </button>
                            <button
                                onClick={() => setExportFormat('json')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${exportFormat === 'json'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                JSON
                            </button>
                        </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Front View Column */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                    正面视图 (Front View)
                                </h3>

                                {/* Front Body Silhouette */}
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-blue-400 mb-3">🎨 全身轮廓</h4>
                                    {frontBodyParts.map((bodyPart) => (
                                        <div key={bodyPart.id} className="mb-4">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                {bodyPart.displayName}
                                                {isValidPath(bodyPaths[bodyPart.id]) && (
                                                    <CheckCircle size={16} className="inline ml-2 text-green-500" />
                                                )}
                                                {bodyPaths[bodyPart.id] && !isValidPath(bodyPaths[bodyPart.id]) && (
                                                    <AlertCircle size={16} className="inline ml-2 text-red-500" />
                                                )}
                                            </label>
                                            <p className="text-xs text-slate-500 mb-2">{bodyPart.description}</p>
                                            <textarea
                                                value={bodyPaths[bodyPart.id]}
                                                onChange={(e) => handleBodyPathChange(bodyPart.id, e.target.value)}
                                                placeholder="粘贴SVG路径 (必须以M或m开头)..."
                                                className={`w-full h-24 bg-slate-900 border rounded-lg p-3 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 transition-all ${isValidPath(bodyPaths[bodyPart.id])
                                                    ? 'border-green-500 focus:ring-green-500'
                                                    : bodyPaths[bodyPart.id]
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : 'border-slate-600 focus:ring-emerald-500'
                                                    }`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Front Muscles */}
                                <h4 className="text-md font-semibold text-emerald-400 mb-3">💪 肌肉组</h4>
                                {frontMuscles.map((muscle) => (
                                    <div key={muscle.muscle} className="mb-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {muscle.displayName}
                                            {isValidPath(musclePaths[muscle.muscle]) && (
                                                <CheckCircle size={16} className="inline ml-2 text-green-500" />
                                            )}
                                            {musclePaths[muscle.muscle] && !isValidPath(musclePaths[muscle.muscle]) && (
                                                <AlertCircle size={16} className="inline ml-2 text-red-500" />
                                            )}
                                        </label>
                                        <p className="text-xs text-slate-500 mb-2">{muscle.description}</p>
                                        <textarea
                                            value={musclePaths[muscle.muscle]}
                                            onChange={(e) => handleMusclePathChange(muscle.muscle, e.target.value)}
                                            placeholder="粘贴SVG路径 (必须以M或m开头)..."
                                            className={`w-full h-20 bg-slate-900 border rounded-lg p-3 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 transition-all ${isValidPath(musclePaths[muscle.muscle])
                                                ? 'border-green-500 focus:ring-green-500'
                                                : musclePaths[muscle.muscle]
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-slate-600 focus:ring-emerald-500'
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Back View Column */}
                        <div className="space-y-6">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    背面视图 (Back View)
                                </h3>

                                {/* Back Body Silhouette */}
                                <div className="mb-6">
                                    <h4 className="text-md font-semibold text-blue-400 mb-3">🎨 全身轮廓</h4>
                                    {backBodyParts.map((bodyPart) => (
                                        <div key={bodyPart.id} className="mb-4">
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                {bodyPart.displayName}
                                                {isValidPath(bodyPaths[bodyPart.id]) && (
                                                    <CheckCircle size={16} className="inline ml-2 text-green-500" />
                                                )}
                                                {bodyPaths[bodyPart.id] && !isValidPath(bodyPaths[bodyPart.id]) && (
                                                    <AlertCircle size={16} className="inline ml-2 text-red-500" />
                                                )}
                                            </label>
                                            <p className="text-xs text-slate-500 mb-2">{bodyPart.description}</p>
                                            <textarea
                                                value={bodyPaths[bodyPart.id]}
                                                onChange={(e) => handleBodyPathChange(bodyPart.id, e.target.value)}
                                                placeholder="粘贴SVG路径 (必须以M或m开头)..."
                                                className={`w-full h-24 bg-slate-900 border rounded-lg p-3 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 transition-all ${isValidPath(bodyPaths[bodyPart.id])
                                                    ? 'border-green-500 focus:ring-green-500'
                                                    : bodyPaths[bodyPart.id]
                                                        ? 'border-red-500 focus:ring-red-500'
                                                        : 'border-slate-600 focus:ring-emerald-500'
                                                    }`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Back Muscles */}
                                <h4 className="text-md font-semibold text-blue-400 mb-3">💪 肌肉组</h4>
                                {backMuscles.map((muscle) => (
                                    <div key={muscle.muscle} className="mb-4">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            {muscle.displayName}
                                            {isValidPath(musclePaths[muscle.muscle]) && (
                                                <CheckCircle size={16} className="inline ml-2 text-green-500" />
                                            )}
                                            {musclePaths[muscle.muscle] && !isValidPath(musclePaths[muscle.muscle]) && (
                                                <AlertCircle size={16} className="inline ml-2 text-red-500" />
                                            )}
                                        </label>
                                        <p className="text-xs text-slate-500 mb-2">{muscle.description}</p>
                                        <textarea
                                            value={musclePaths[muscle.muscle]}
                                            onChange={(e) => handleMusclePathChange(muscle.muscle, e.target.value)}
                                            placeholder="粘贴SVG路径 (必须以M或m开头)..."
                                            className={`w-full h-20 bg-slate-900 border rounded-lg p-3 text-slate-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 transition-all ${isValidPath(musclePaths[muscle.muscle])
                                                ? 'border-green-500 focus:ring-green-500'
                                                : musclePaths[muscle.muscle]
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-slate-600 focus:ring-emerald-500'
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    {showPreview && (
                        <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-3">代码预览</h3>
                            <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-xs text-slate-300 font-mono max-h-96 overflow-y-auto">
                                {exportFormat === 'typescript' ? generateTypeScriptExport() : generateJSONExport()}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-800 p-4 border-t border-slate-700 flex items-center justify-between">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                        {showPreview ? '隐藏预览' : '显示预览'}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={progress.completed === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Copy size={16} />
                            复制到剪贴板
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={progress.completed === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Download size={16} />
                            下载文件
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SVGPathImporter;