import React, { useState, useCallback } from 'react';
import { MuscleGroup } from '@/shared/types';
import { MUSCLE_PATHS, MUSCLE_VIEW_MAPPING, getMusclesForView, getMuscleDisplayName, ALL_MUSCLE_GROUPS } from '../constants/musclePaths';
import MuscleAnatomyViewer from './MuscleAnatomyViewer';
import { Play, Pause, RotateCcw, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface TestResult {
    muscle: MuscleGroup;
    view: 'front' | 'back';
    status: 'pass' | 'fail' | 'pending';
    error?: string;
}

/**
 * MuscleAnatomyTester Component
 * 
 * Interactive testing component for validating muscle anatomy functionality
 * Tests muscle highlighting, path rendering, and interaction for all 15 muscle groups
 * 
 * Features:
 * - Automated testing of all muscle groups
 * - Manual muscle selection testing
 * - Visual validation of muscle paths
 * - Front/back view testing
 * - Test result reporting
 */
const MuscleAnatomyTester: React.FC = () => {
    const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
    const [bodyFacing, setBodyFacing] = useState<'front' | 'back'>('front');
    const [isAutoTesting, setIsAutoTesting] = useState(false);
    const [currentTestMuscle, setCurrentTestMuscle] = useState<MuscleGroup | null>(null);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Handle muscle selection
    const handleMuscleSelect = useCallback((muscle: MuscleGroup) => {
        setSelectedMuscles(prev => {
            const isSelected = prev.includes(muscle);
            if (isSelected) {
                return prev.filter(m => m !== muscle);
            } else {
                return [...prev, muscle];
            }
        });

        // Record test result
        const view = getMusclesForView('front').includes(muscle as any) ? 'front' : 'back';
        const muscleKey = muscle.toLowerCase().replace(/_/g, '_') as keyof typeof MUSCLE_PATHS;
        const hasPath = MUSCLE_PATHS[muscleKey];

        setTestResults(prev => {
            const existing = prev.find(r => r.muscle === muscle && r.view === view);
            const result: TestResult = {
                muscle,
                view,
                status: hasPath ? 'pass' : 'fail',
                error: hasPath ? undefined : 'Missing muscle path'
            };

            if (existing) {
                return prev.map(r => r.muscle === muscle && r.view === view ? result : r);
            } else {
                return [...prev, result];
            }
        });
    }, []);

    // Auto-test all muscles
    const runAutoTest = useCallback(async () => {
        setIsAutoTesting(true);
        setTestResults([]);
        setSelectedMuscles([]);

        const testSequence = [
            // Front view muscles
            ...getMusclesForView('front').map(m => ({ muscle: m as MuscleGroup, view: 'front' as const })),
            // Back view muscles  
            ...getMusclesForView('back').map(m => ({ muscle: m as MuscleGroup, view: 'back' as const }))
        ];

        for (const { muscle, view } of testSequence) {
            setBodyFacing(view);
            setCurrentTestMuscle(muscle);

            // Simulate muscle selection
            await new Promise(resolve => setTimeout(resolve, 800));

            const muscleKey = muscle.toLowerCase().replace(/_/g, '_') as keyof typeof MUSCLE_PATHS;
            const hasPath = MUSCLE_PATHS[muscleKey];
            const result: TestResult = {
                muscle,
                view,
                status: hasPath ? 'pass' : 'fail',
                error: hasPath ? undefined : 'Missing muscle path'
            };

            setTestResults(prev => [...prev, result]);
            setSelectedMuscles([muscle]);

            await new Promise(resolve => setTimeout(resolve, 400));
        }

        setCurrentTestMuscle(null);
        setIsAutoTesting(false);
        setSelectedMuscles([]);
        setShowResults(true);
    }, []);

    // Reset test state
    const resetTest = useCallback(() => {
        setSelectedMuscles([]);
        setTestResults([]);
        setCurrentTestMuscle(null);
        setIsAutoTesting(false);
        setShowResults(false);
        setBodyFacing('front');
    }, []);

    // Get test statistics
    const testStats = {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'pass').length,
        failed: testResults.filter(r => r.status === 'fail').length,
        coverage: testResults.length > 0 ? (testResults.filter(r => r.status === 'pass').length / ALL_MUSCLE_GROUPS.length) * 100 : 0
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 bg-slate-900 min-h-screen">
            {/* Left Panel - Controls and Results */}
            <div className="lg:w-1/3 space-y-6">
                {/* Test Controls */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <TestTube className="text-emerald-400" size={20} />
                        <h2 className="text-xl font-bold text-white">Muscle Anatomy Tester</h2>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={runAutoTest}
                            disabled={isAutoTesting}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                            {isAutoTesting ? (
                                <>
                                    <Pause size={16} />
                                    Testing... {currentTestMuscle ? getMuscleDisplayName(currentTestMuscle) : ''}
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    Run Auto Test
                                </>
                            )}
                        </button>

                        <button
                            onClick={resetTest}
                            className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        >
                            <RotateCcw size={16} />
                            Reset Test
                        </button>
                    </div>

                    {/* Test Statistics */}
                    {testResults.length > 0 && (
                        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                            <h3 className="text-sm font-medium text-slate-300 mb-3">Test Statistics</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-400">Total Tests</div>
                                    <div className="text-white font-medium">{testStats.total}</div>
                                </div>
                                <div>
                                    <div className="text-slate-400">Coverage</div>
                                    <div className="text-white font-medium">{testStats.coverage.toFixed(1)}%</div>
                                </div>
                                <div>
                                    <div className="text-emerald-400">Passed</div>
                                    <div className="text-emerald-400 font-medium">{testStats.passed}</div>
                                </div>
                                <div>
                                    <div className="text-red-400">Failed</div>
                                    <div className="text-red-400 font-medium">{testStats.failed}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Test Results */}
                {showResults && testResults.length > 0 && (
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">Test Results</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {testResults.map((result, index) => (
                                <div
                                    key={`${result.muscle}-${result.view}-${index}`}
                                    className={`flex items-center justify-between p-3 rounded-lg ${result.status === 'pass'
                                        ? 'bg-emerald-900/30 border border-emerald-700/50'
                                        : 'bg-red-900/30 border border-red-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {result.status === 'pass' ? (
                                            <CheckCircle className="text-emerald-400" size={16} />
                                        ) : (
                                            <AlertCircle className="text-red-400" size={16} />
                                        )}
                                        <div>
                                            <div className="text-white font-medium">
                                                {getMuscleDisplayName(result.muscle)}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {result.view} view
                                            </div>
                                        </div>
                                    </div>
                                    {result.error && (
                                        <div className="text-xs text-red-400">{result.error}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Testing Instructions */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">Manual Testing</h3>
                    <div className="text-sm text-slate-300 space-y-2">
                        <p>â€?Click on muscle groups in the anatomy viewer</p>
                        <p>â€?Switch between front and back views</p>
                        <p>â€?Verify muscle highlighting and selection</p>
                        <p>â€?Check muscle labels and interactions</p>
                    </div>

                    {selectedMuscles.length > 0 && (
                        <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                            <div className="text-xs text-slate-400 mb-2">Selected Muscles:</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedMuscles.map(muscle => (
                                    <span
                                        key={muscle}
                                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full"
                                    >
                                        {getMuscleDisplayName(muscle)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Muscle Anatomy Viewer */}
            <div className="lg:w-2/3">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Muscle Anatomy Viewer</h3>
                        <div className="text-sm text-slate-400">
                            {bodyFacing === 'front' ? 'Anterior View' : 'Posterior View'}
                        </div>
                    </div>

                    <MuscleAnatomyViewer
                        onMuscleSelect={handleMuscleSelect}
                        bodyFacing={bodyFacing}
                        onBodyFacingChange={setBodyFacing}
                        selectedMuscles={selectedMuscles}
                        showCardioButton={true}
                        showLabels={true}
                        size="lg"
                        className="h-full"
                        selectedMuscleStyle={{
                            fill: '#10b981',
                            fillOpacity: 0.7,
                            stroke: '#34d399',
                            strokeWidth: '2.5'
                        }}
                        hoveredMuscleStyle={{
                            fill: '#10b981',
                            fillOpacity: 0.4,
                            stroke: '#34d399',
                            strokeWidth: '2'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default MuscleAnatomyTester;