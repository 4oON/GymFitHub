import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import type { 
  Workout, 
  CreateWorkoutInput, 
  UpdateWorkoutInput,
  WorkoutStatus 
} from '../../types/workout';

const WorkoutTestPanel: React.FC = () => {
  // Workout state
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [statusFilter, setStatusFilter] = useState<WorkoutStatus | 'all'>('all');
  
  // Form state
  const [workoutForm, setWorkoutForm] = useState<CreateWorkoutInput>({
    name: 'Morning Workout',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    durationMin: 60,
    notes: 'Test workout session',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load workouts on mount if authenticated
  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      handleGetWorkouts();
    }
  }, []);

  const handleApiCall = async (
    apiCall: () => Promise<any>,
    successMessage: string
  ) => {
    setLoading(true);
    setError(null);
    setStatus('idle');
    try {
      const result = await apiCall();
      setResponse(result);
      setStatus('success');
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setStatus('error');
      setResponse({ error: errorMsg });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Workout handlers
  const handleCreateWorkout = async () => {
    if (!workoutForm.name) {
      setError('Workout name is required');
      setStatus('error');
      return;
    }
    
    // Convert date to ISO 8601 format if provided
    const requestBody: CreateWorkoutInput = {
      name: workoutForm.name,
      status: workoutForm.status,
      durationMin: workoutForm.durationMin,
      notes: workoutForm.notes,
    };
    
    // Convert YYYY-MM-DD to ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
    if (workoutForm.date) {
      requestBody.date = new Date(workoutForm.date + 'T00:00:00.000Z').toISOString();
    }
    
    // Debug: Log the request body
    console.log('🔍 CREATE Workout Request Body:', JSON.stringify(requestBody, null, 2));
    
    const result = await handleApiCall(
      () => apiClient.createWorkout(requestBody),
      'Workout created successfully'
    );
    setWorkouts([result.workout, ...workouts]);
    setSelectedWorkout(result.workout);
  };

  const handleGetWorkouts = async () => {
    const filter = statusFilter === 'all' ? undefined : statusFilter;
    const result = await handleApiCall(
      () => apiClient.getWorkouts(filter),
      'Workouts fetched successfully'
    );
    setWorkouts(result.workouts);
  };

  const handleGetWorkout = async (id: string) => {
    const result = await handleApiCall(
      () => apiClient.getWorkout(id),
      'Workout details fetched successfully'
    );
    setSelectedWorkout(result.workout);
  };

  const handleUpdateWorkout = async () => {
    if (!selectedWorkout) {
      setError('No workout selected');
      setStatus('error');
      return;
    }
    
    const updateData: UpdateWorkoutInput = {
      name: workoutForm.name,
      status: workoutForm.status,
      durationMin: workoutForm.durationMin,
      notes: workoutForm.notes,
    };
    
    // Convert date to ISO 8601 format if provided
    if (workoutForm.date) {
      updateData.date = new Date(workoutForm.date + 'T00:00:00.000Z').toISOString();
    }
    
    // Debug: Log the request body
    console.log('🔍 UPDATE Workout Request Body:', JSON.stringify(updateData, null, 2));

    const result = await handleApiCall(
      () => apiClient.updateWorkout(selectedWorkout.id, updateData),
      'Workout updated successfully'
    );
    
    setWorkouts(workouts.map(w => w.id === result.workout.id ? result.workout : w));
    setSelectedWorkout(result.workout);
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) {
      return;
    }
    
    await handleApiCall(
      () => apiClient.deleteWorkout(id),
      'Workout deleted successfully'
    );
    
    setWorkouts(workouts.filter(w => w.id !== id));
    if (selectedWorkout?.id === id) {
      setSelectedWorkout(null);
    }
  };

  const handleSelectWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setWorkoutForm({
      name: workout.name,
      date: new Date(workout.date).toISOString().split('T')[0],
      status: workout.status,
      durationMin: workout.durationMin,
      notes: workout.notes || '',
    });
  };

  const handleClearForm = () => {
    setWorkoutForm({
      name: 'Morning Workout',
      date: new Date().toISOString().split('T')[0],
      status: 'planned',
      durationMin: 60,
      notes: 'Test workout session',
    });
    setSelectedWorkout(null);
  };

  const getStatusBadgeColor = (status: WorkoutStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: WorkoutStatus) => {
    switch (status) {
      case 'completed':
        return '✓ Completed';
      case 'in_progress':
        return '▶ In Progress';
      case 'planned':
        return '○ Planned';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          💪 Workout API Tester
          <span className={`text-sm px-3 py-1 rounded-full ${
            status === 'success' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`}>
            {status === 'success' ? '✓ Success' :
             status === 'error' ? '✗ Error' :
             '○ Ready'}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Workout Form */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
            📝 Workout Form
          </h3>

          {selectedWorkout && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
              <span className="text-sm font-medium text-purple-800">
                ✏️ Editing: {selectedWorkout.name}
              </span>
              <span className="text-xs text-purple-600 ml-2">
                (ID: {selectedWorkout.id.substring(0, 8)}...)
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workout Name *
            </label>
            <input
              type="text"
              value={workoutForm.name}
              onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Morning Workout"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={workoutForm.date}
                onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={workoutForm.status}
                onChange={(e) => setWorkoutForm({ ...workoutForm, status: e.target.value as WorkoutStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={workoutForm.durationMin || ''}
              onChange={(e) => setWorkoutForm({ ...workoutForm, durationMin: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              placeholder="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={workoutForm.notes || ''}
              onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Add workout notes..."
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleCreateWorkout}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳' : '➕'} Create
            </button>
            <button
              onClick={handleUpdateWorkout}
              disabled={loading || !selectedWorkout}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳' : '✏️'} Update
            </button>
            <button
              onClick={handleClearForm}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              🧹 Clear
            </button>
          </div>
        </div>

        {/* Right Column - Workout List */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xl font-semibold text-gray-800">
              📋 Workouts ({workouts.length})
            </h3>
            <button
              onClick={handleGetWorkouts}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as WorkoutStatus | 'all')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {workouts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No workouts found. Create one to get started!
              </p>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => handleSelectWorkout(workout)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedWorkout?.id === workout.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{workout.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadgeColor(workout.status)}`}>
                      {getStatusLabel(workout.status)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>📅 {new Date(workout.date).toLocaleDateString()}</div>
                    {workout.durationMin && (
                      <div>⏱️ {workout.durationMin} min</div>
                    )}
                    <div>🏋️ {workout.exercises?.length || 0} exercises</div>
                    {workout.notes && (
                      <div className="text-xs text-gray-500 mt-2 italic">
                        "{workout.notes}"
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetWorkout(workout.id);
                      }}
                      className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(workout.id);
                      }}
                      className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Response Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
          📋 API Response
        </h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {!loading && response && (
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm border border-gray-200 max-h-96 overflow-y-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}

        {!loading && !response && !error && (
          <p className="text-gray-500 text-center py-4">
            No response yet. Try an API call above.
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkoutTestPanel;