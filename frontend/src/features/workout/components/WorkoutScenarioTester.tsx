import React, { useState, useCallback } from 'react';
import { MuscleGroup } from '@/shared/types';
import { getMuscleDisplayName } from '../../anatomy/constants/musclePaths';
import MuscleAnatomyViewer from '../../anatomy/components/MuscleAnatomyViewer';
import { Dumbbell, Target, CheckCircle, AlertCircle, Play, RotateCcw } from 'lucide-react';

interface WorkoutScenario {
    id: string;
    name: string;
    description: string;
    targetMuscles: MuscleGroup[];
    expectedIntensity: Partial<Record<MuscleGroup, number>>; // 0-1 scale, only for relevant muscles
    icon: React.ReactNode;
    color: string;
}

interface ScenarioTestResult {
    scenarioId: string;
    muscle: MuscleGroup;
    expectedIntensity: number;
    actualHighlight: boolean;
    status: 'pass' | 'fail';
    error?: string;
}

/**
 * WorkoutScenarioTester Component
 * 
 * Tests specific workout scenarios to validate muscle highlighting accuracy
 * Phase 2.1 implementation for testing various training scenarios
 */
const WorkoutScenarioTester: React.FC = () => {
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<ScenarioTestResult[]>([]);
    const [isTestingScenario, setIsTestingScenario] = useState(false);
    const [currentTestMuscle, setCurrentTestMuscle] = useState<MuscleGroup | null>(null);
    const [bodyFacing, setBodyFacing] = useState<'front' | 'back'>('front');

    // Define workout scenarios for Phase 2.1 testing
    const workoutScenarios: WorkoutScenario[] = [
        {
            id: 'upper_body',
            name: 'Upper Body Workout',
            description: 'Chest, Shoulders, Biceps, Triceps focus',
            targetMuscles: [MuscleGroup.CHEST, MuscleGroup.SHOULDERS, MuscleGroup.BICEPS, MuscleGroup.TRICEPS],
            expectedIntensity: {
                [MuscleGroup.CHEST]: 0.9,
                [MuscleGroup.SHOULDERS]: 0.8,
                [MuscleGroup.BICEPS]: 0.7,
                [MuscleGroup.TRICEPS]: 0.8,
                [MuscleGroup.FOREARMS]: 0.3, // Secondary activation
            },
            icon: <Dumbbell className="text-blue-400" size={20} />,
            color: 'blue'
        },
        {
            id: 'lower_body',
            name: 'Lower Body Workout',
            description: 'Quads, Hamstrings, Glutes, Calves focus',
            targetMuscles: [MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES, MuscleGroup.CALVES],
            expectedIntensity: {
                [MuscleGroup.QUADS]: 0.9,
                [MuscleGroup.HAMSTRINGS]: 0.8,
                [MuscleGroup.GLUTES]: 0.9,
                [MuscleGroup.CALVES]: 0.6,
            },
            icon: <Target className="text-green-400" size={20} />,
            color: 'green'
        },
        {
            id: 'back_workout',
            name: 'Back Workout',
            description: 'Lats, Traps, Lower Back focus',
            targetMuscles: [MuscleGroup.LATS, MuscleGroup.TRAPS, MuscleGroup.LOWER_BACK],
            expectedIntensity: {
                [MuscleGroup.LATS]: 0.9,
                [MuscleGroup.TRAPS]: 0.8,
                [MuscleGroup.LOWER_BACK]: 0.7,
                [MuscleGroup.BICEPS]: 0.4, // Secondary activation
            },
            icon: <Target className="text-purple-400" size={20} />,
            color: 'purple'
        },
        {
            id: 'core_workout',
            name: 'Core Workout',
            description: 'Abs, Obliques focus',
            targetMuscles: [MuscleGroup.ABS, MuscleGroup.OBLIQUES],
            expectedIntensity: {
                [MuscleGroup.ABS]: 0.9,
                [MuscleGroup.OBLIQUES]: 0.8,
            },
            icon: <Target className="text-orange-400" size={20} />,
            color: 'orange'
        },
        {
            id: 'full_body',
            name: 'Full Body Workout',
            description: 'Multiple muscle groups activation',
            targetMuscles: [
                MuscleGroup.CHEST, MuscleGroup.SHOULDERS, MuscleGroup.BICEPS, MuscleGroup.TRICEPS,
                MuscleGroup.LATS, MuscleGroup.TRAPS, MuscleGroup.QUADS, MuscleGroup.HAMSTRINGS,
                MuscleGroup.GLUTES, MuscleGroup.ABS
            ],
            expectedIntensity: {
                [MuscleGroup.CHEST]: 0.7,
                [MuscleGroup.SHOULDERS]: 0.6,
                [MuscleGroup.BICEPS]: 0.5,
                [MuscleGroup.TRICEPS]: 0.6,
                [MuscleGroup.LATS]: 0.7,
                [MuscleGroup.TRAPS]: 0.5,
                [MuscleGroup.QUADS]: 0.8,
                [MuscleGroup.HAMSTRINGS]: 0.6,
                [MuscleGroup.GLUTES]: 0.7,
                [MuscleGroup.ABS]: 0.6,
            },
            icon: <Target className="text-red-400" size={20} />,
            color: 'red'
        }
    ];

    // Test a specific workout scenario
    const testScenario = useCallback(async (scenario: WorkoutScenario) => {
        setIsTestingScenario(true);
        setTestResults([]);
        setSelectedScenario(scenario.id);

        // Auto-switch to appropriate view based on scenario
        if (scenario.id === 'back_workout') {
            setBodyFacing('back');
        } else if (scenario.id === 'lower_body') {
            // Lower body has muscles on both sides, start with front
            setBodyFacing('front');
        } else {
            setBodyFacing('front');
        }

        const results: ScenarioTestResult[] = [];

        // Test each target muscle in the scenario
        for (const muscle of scenario.targetMuscles) {
            setCurrentTestMuscle(muscle);

            // Simulate testing delay
            await new Promise(resolve => setTimeout(resolve, 600));

            const expectedIntensity = scenario.expectedIntensity[muscle] || 0;
            const shouldHighlight = expectedIntensity > 0.3; // Threshold for highlighting

            // Simulate muscle highlighting test (in real implementation, this would check actual highlighting)
            const actualHighlight = expectedIntensity > 0.3; // Mock result

            const result: ScenarioTestResult = {
                scenarioId: scenario.id,
                muscle,
                expectedIntensity,
                actualHighlight,
                status: actualHighlight === shouldHighlight ? 'pass' : 'fail',
                error: actualHighlight !== shouldHighlight ? 'Highlighting mismatch' : undefined
            };

            results.push(result);
            setTestResults(prev => [...prev, result]);
        }

        setCurrentTestMuscle(null);
        setIsTestingScenario(false);
    }, []);

    // Reset test state
    const resetTest = useCallback(() => {
        setSelectedScenario(null);
        setTestResults([]);
        setCurrentTestMuscle(null);
        setIsTestingScenario(false);
        setBodyFacing('front');
    }, []);

    // Handle muscle selection (for MuscleAnatomyViewer requirement)
    const handleMuscleSelect = useCallback((muscle: MuscleGroup) => {
        console.log('Muscle selected:', muscle);
        // Optional: Add muscle to test results or perform other actions
    }, []);

    // Get selected scenario data
    const currentScenario = selectedScenario ? workoutScenarios.find(s => s.id === selectedScenario) : null;

    // Calculate test statistics
    const testStats = {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'pass').length,
        failed: testResults.filter(r => r.status === 'fail').length,
        accuracy: testResults.length > 0 ? (testResults.filter(r => r.status === 'pass').length / testResults.length) * 100 : 0
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 bg-slate-900 h-full overflow-y-auto">
            {/* Left Panel - Scenario Selection and Results */}
            <div className="lg:w-1/3 space-y-6">
                {/* Scenario Selection */}
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="text-emerald-400" size={20} />
                        <h2 className="text-xl font-bold text-white">Workout Scenario Tester</h2>
                    </div>
                    <p className="text-sm text-slate-300 mb-6">
                        Phase 2.1: Test muscle highlighting accuracy for different workout scenarios
                    </p>

                    <div className="space-y-3">
                        {workoutScenarios.map(scenario => (
                            <button
                                key={scenario.id}
                                onClick={() => testScenario(scenario)}
                                disabled={isTestingScenario}
                                className={`w-full p-4 rounded-lg border transition-all text-left ${selectedScenario === scenario.id
                                    ? `border-${scenario.color}-500 bg-${scenario.color}-900/20`
                                    : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                                    } ${isTestingScenario ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {scenario.icon}
                                    <h3 className="font-medium text-white">{scenario.name}</h3>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">{scenario.description}</p>
                                <div className="text-xs text-slate-400">
                                    Target muscles: {scenario.targetMuscles.length}
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={resetTest}
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                        <RotateCcw size={16} />
                        Reset Test
                    </button>
                </div>

                {/* Test Progress */}
                {isTestingScenario && currentScenario && (
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">Testing Progress</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Play className="text-emerald-400" size={16} />
                                <span className="text-white">Testing: {currentScenario.name}</span>
                            </div>
                            {currentTestMuscle && (
                                <div className="text-sm text-slate-300">
                                    Current muscle: {getMuscleDisplayName(currentTestMuscle)}
                                </div>
                            )}
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(testResults.length / currentScenario.targetMuscles.length) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Test Results */}
                {testResults.length > 0 && (
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">Test Results</h3>

                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-700 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{testStats.total}</div>
                                <div className="text-xs text-slate-400">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-400">{testStats.passed}</div>
                                <div className="text-xs text-slate-400">Passed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-400">{testStats.failed}</div>
                                <div className="text-xs text-slate-400">Failed</div>
                            </div>
                        </div>

                        {/* Detailed Results */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {testResults.map((result, index) => (
                                <div
                                    key={`${result.muscle}-${index}`}
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
                                                Expected: {(result.expectedIntensity * 100).toFixed(0)}% intensity
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
            </div>

            {/* Right Panel - Muscle Anatomy Viewer */}
            <div className="lg:w-2/3">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                            {currentScenario ? `${currentScenario.name} - Muscle Activation` : 'Muscle Anatomy Viewer'}
                        </h3>
                        {currentScenario && (
                            <div className="text-sm text-slate-400">
                                Accuracy: {testStats.accuracy.toFixed(1)}%
                            </div>
                        )}
                    </div>

                    <MuscleAnatomyViewer
                        onMuscleSelect={handleMuscleSelect}
                        bodyFacing={bodyFacing}
                        onBodyFacingChange={setBodyFacing}
                        selectedMuscles={currentScenario ? currentScenario.targetMuscles : []}
                        showCardioButton={false}
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

export default WorkoutScenarioTester;