import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MuscleGroup } from '@/shared/types';
import type { Exercise } from '@/shared/types';
import { Search, Filter, Grid, List, SortAsc, SortDesc, Star, Heart } from 'lucide-react';
import HeroExerciseCard from './HeroExerciseCard';
import MuscleAnatomyViewer from '@/features/anatomy/components/MuscleAnatomyViewer';

const INITIAL_DISPLAY_LIMIT = 30;
const DISPLAY_LIMIT_INCREMENT = 20;

interface ExerciseLibraryViewProps {
    /** Array of all exercises */
    exercises: Exercise[];
    /** Currently selected exercises */
    selectedExercises: string[];
    /** Callback when exercise selection changes */
    onExerciseToggle: (exerciseId: string) => void;
    /** Callback when adding exercise to workout */
    onAddToWorkout?: (exercise: Exercise) => void;
    /** Callback when removing exercise from workout */
    onRemoveFromWorkout?: (exerciseId: string) => void;
    /** Callback when adding exercise to routine */
    onAddToRoutine?: (exercise: Exercise) => void;
    /** Whether to show the muscle anatomy viewer */
    showAnatomyViewer?: boolean;
    /** Custom class name */
    className?: string;
    /** Layout mode */
    layout?: 'grid' | 'list';
    /** Card size for exercises */
    cardSize?: 'sm' | 'md' | 'lg';
    /** Whether to enable search */
    enableSearch?: boolean;
    /** Whether to enable filtering */
    enableFiltering?: boolean;
    /** Whether to enable sorting */
    enableSorting?: boolean;
    /** Whether to show favorites filter */
    showFavoritesFilter?: boolean;
}

type SortOption = 'name' | 'muscle' | 'difficulty' | 'mechanic';
type SortDirection = 'asc' | 'desc';

/**
 * Comprehensive exercise library view component
 * Provides search, filtering, sorting, and multiple display modes
 */
const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
    exercises,
    selectedExercises,
    onExerciseToggle,
    onAddToWorkout,
    onRemoveFromWorkout,
    onAddToRoutine,
    showAnatomyViewer = true,
    className = '',
    layout = 'list',
    cardSize = 'md',
    enableSearch = true,
    enableFiltering = true,
    enableSorting = true,
    showFavoritesFilter = true,
}) => {
    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroup[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
    const [selectedMechanic, setSelectedMechanic] = useState<string[]>([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [bodyFacing, setBodyFacing] = useState<'front' | 'back'>('front');
    const [showFilters, setShowFilters] = useState(false);
    const [currentLayout, setCurrentLayout] = useState<'grid' | 'list'>(layout);
    const [displayLimit, setDisplayLimit] = useState(INITIAL_DISPLAY_LIMIT);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Reset display limit when filters/search/layout change
    useEffect(() => {
        setDisplayLimit(INITIAL_DISPLAY_LIMIT);
    }, [searchQuery, selectedMuscleGroups, selectedEquipment, selectedDifficulty, selectedMechanic, showFavoritesOnly, sortBy, sortDirection, currentLayout]);

    // Get unique values for filters
    const filterOptions = useMemo(() => {
        const equipment = [...new Set(exercises.map(e => e.equipment).filter(Boolean))];
        const difficulties = [...new Set(exercises.map(e => e.difficulty).filter(Boolean))];
        const mechanics = [...new Set(exercises.map(e => e.mechanic).filter(Boolean))];

        return {
            equipment: equipment.sort(),
            difficulties: difficulties.sort(),
            mechanics: mechanics.sort(),
        };
    }, [exercises]);

    // Filtered and sorted exercises
    const filteredExercises = useMemo(() => {
        let filtered = exercises;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(exercise =>
                exercise.name.toLowerCase().includes(query) ||
                exercise.nameZh?.toLowerCase().includes(query) ||
                exercise.muscleGroup.toLowerCase().includes(query) ||
                exercise.muscle_ids?.some(id => id.toLowerCase().includes(query)) ||
                exercise.equipment?.toLowerCase().includes(query)
            );
        }

        // Muscle group filter
        if (selectedMuscleGroups.length > 0) {
            filtered = filtered.filter(exercise =>
                selectedMuscleGroups.includes(exercise.muscleGroup) ||
                exercise.secondaryMuscles?.some(muscle => selectedMuscleGroups.includes(muscle))
            );
        }

        // Equipment filter
        if (selectedEquipment.length > 0) {
            filtered = filtered.filter(exercise =>
                exercise.equipment && selectedEquipment.includes(exercise.equipment)
            );
        }

        // Difficulty filter
        if (selectedDifficulty.length > 0) {
            filtered = filtered.filter(exercise =>
                exercise.difficulty && selectedDifficulty.includes(exercise.difficulty)
            );
        }

        // Mechanic filter
        if (selectedMechanic.length > 0) {
            filtered = filtered.filter(exercise =>
                exercise.mechanic && selectedMechanic.includes(exercise.mechanic)
            );
        }

        // Favorites filter
        if (showFavoritesOnly) {
            filtered = filtered.filter(exercise => exercise.isFavorite);
        }

        // Sorting
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'muscle':
                    comparison = a.muscleGroup.localeCompare(b.muscleGroup);
                    break;
                case 'difficulty':
                    const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                    const aDiff = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
                    const bDiff = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;
                    comparison = aDiff - bDiff;
                    break;
                case 'mechanic':
                    comparison = (a.mechanic || '').localeCompare(b.mechanic || '');
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [
        exercises,
        searchQuery,
        selectedMuscleGroups,
        selectedEquipment,
        selectedDifficulty,
        selectedMechanic,
        showFavoritesOnly,
        sortBy,
        sortDirection,
    ]);

    // Infinite scroll observer
    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayLimit(prev => Math.min(prev + DISPLAY_LIMIT_INCREMENT, filteredExercises.length));
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [filteredExercises.length]);

    // Event handlers
    const handleMuscleSelect = useCallback((muscle: MuscleGroup) => {
        setSelectedMuscleGroups(prev => {
            if (prev.includes(muscle)) {
                return prev.filter(m => m !== muscle);
            } else {
                return [...prev, muscle];
            }
        });
    }, []);

    const handleSortChange = useCallback((newSortBy: SortOption) => {
        if (sortBy === newSortBy) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortDirection('asc');
        }
    }, [sortBy]);

    const clearAllFilters = useCallback(() => {
        setSearchQuery('');
        setSelectedMuscleGroups([]);
        setSelectedEquipment([]);
        setSelectedDifficulty([]);
        setSelectedMechanic([]);
        setShowFavoritesOnly(false);
    }, []);

    const toggleArrayFilter = useCallback((value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => {
            if (prev.includes(value)) {
                return prev.filter(item => item !== value);
            } else {
                return [...prev, value];
            }
        });
    }, []);

    return (
        <div className={`flex flex-col h-full bg-slate-950 ${className}`}>
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Exercise Library</h2>
                    <div className="flex items-center gap-2">
                        {/* Layout Toggle */}
                        <div className="flex bg-slate-900 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentLayout('list')}
                                className={`p-2 rounded ${currentLayout === 'list' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setCurrentLayout('grid')}
                                className={`p-2 rounded ${currentLayout === 'grid' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Grid size={16} />
                            </button>
                        </div>

                        {/* Filter Toggle */}
                        {enableFiltering && (
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg ${showFilters ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                            >
                                <Filter size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                {enableSearch && (
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search exercises..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                    </div>
                )}

                {/* Sorting Controls */}
                {enableSorting && (
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-slate-400">Sort by:</span>
                        {(['name', 'muscle', 'difficulty', 'mechanic'] as SortOption[]).map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSortChange(option)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${sortBy === option
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-900 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                                {sortBy === option && (
                                    sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Quick Filters */}
                <div className="flex items-center gap-2">
                    {showFavoritesFilter && (
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${showFavoritesOnly
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                                }`}
                        >
                            <Star size={12} />
                            Favorites
                        </button>
                    )}

                    {/* Active Filters Count */}
                    {(selectedMuscleGroups.length > 0 || selectedEquipment.length > 0 || selectedDifficulty.length > 0 || selectedMechanic.length > 0) && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                                {selectedMuscleGroups.length + selectedEquipment.length + selectedDifficulty.length + selectedMechanic.length} filters active
                            </span>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Anatomy Viewer Sidebar */}
                {showAnatomyViewer && (
                    <div className="w-80 flex-shrink-0 border-r border-slate-800 p-4">
                        <MuscleAnatomyViewer
                            onMuscleSelect={handleMuscleSelect}
                            bodyFacing={bodyFacing}
                            onBodyFacingChange={setBodyFacing}
                            selectedMuscles={selectedMuscleGroups}
                            size="sm"
                            showLabels={true}
                        />
                    </div>
                )}

                {/* Exercise List */}
                <div className="flex-1 overflow-auto">
                    {/* Filters Panel */}
                    {showFilters && enableFiltering && (
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Equipment Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Equipment</label>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {filterOptions.equipment.map((equipment) => (
                                            <label key={equipment} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEquipment.includes(equipment)}
                                                    onChange={() => toggleArrayFilter(equipment, setSelectedEquipment)}
                                                    className="mr-2 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-300">{equipment}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                                    <div className="space-y-1">
                                        {filterOptions.difficulties.map((difficulty) => (
                                            <label key={difficulty} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDifficulty.includes(difficulty)}
                                                    onChange={() => toggleArrayFilter(difficulty, setSelectedDifficulty)}
                                                    className="mr-2 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-300">{difficulty}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Mechanic Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Mechanic</label>
                                    <div className="space-y-1">
                                        {filterOptions.mechanics.map((mechanic) => (
                                            <label key={mechanic} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMechanic.includes(mechanic)}
                                                    onChange={() => toggleArrayFilter(mechanic, setSelectedMechanic)}
                                                    className="mr-2 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm text-slate-300">{mechanic}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Exercise Cards */}
                    <div className="p-4">
                        {filteredExercises.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-slate-400 mb-2">No exercises found</div>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-emerald-400 hover:text-emerald-300 text-sm"
                                >
                                    Clear filters to see all exercises
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={
                                    currentLayout === 'grid'
                                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                                        : 'space-y-4'
                                }>
                                    {filteredExercises.slice(0, displayLimit).map((exercise) => (
                                        <HeroExerciseCard
                                            key={exercise.id}
                                            exercise={exercise}
                                            isSelected={selectedExercises.includes(exercise.id)}
                                            onToggle={() => onExerciseToggle(exercise.id)}
                                            onAddToWorkout={() => onAddToWorkout?.(exercise)}
                                            onRemoveFromWorkout={() => onRemoveFromWorkout?.(exercise.id)}
                                            onAddToRoutine={() => onAddToRoutine?.(exercise)}
                                            size={cardSize}
                                            layout={currentLayout === 'grid' ? 'vertical' : 'horizontal'}
                                            showActionButtons={true}
                                            enableSwipe={true}
                                            showVideo={true}
                                        />
                                    ))}
                                </div>
                                {filteredExercises.length > displayLimit && (
                                    <div ref={observerTarget} className="h-20 flex items-center justify-center w-full">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export types for external use
export type { ExerciseLibraryViewProps };

/**
 * @example
 * // Basic usage
 * <ExerciseLibraryView
 *   exercises={exercises}
 *   selectedExercises={selectedExerciseIds}
 *   onExerciseToggle={(id) => toggleExercise(id)}
 *   onAddToWorkout={(exercise) => addToWorkout(exercise)}
 * />
 * 
 * @example
 * // With all features
 * <ExerciseLibraryView
 *   exercises={exercises}
 *   selectedExercises={selectedExerciseIds}
 *   onExerciseToggle={toggleExercise}
 *   onAddToWorkout={addToWorkout}
 *   onRemoveFromWorkout={removeFromWorkout}
 *   onAddToRoutine={addToRoutine}
 *   showAnatomyViewer={true}
 *   layout="grid"
 *   cardSize="lg"
 *   enableSearch={true}
 *   enableFiltering={true}
 *   enableSorting={true}
 *   showFavoritesFilter={true}
 * />
 */
export default ExerciseLibraryView;