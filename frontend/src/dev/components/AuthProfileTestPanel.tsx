import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import type { User, Profile, CreateProfileInput } from '../../types/api';

const AuthProfileTestPanel: React.FC = () => {
  // Auth state
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('TestPass123');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState<CreateProfileInput>({
    age: 25,
    gender: 'male',
    weight: 70.5,
    height: 175,
    fitnessGoal: 'build_muscle',
    fitnessLevel: 'intermediate',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load token and auto-fetch user on mount
  useEffect(() => {
    const savedToken = apiClient.getToken();
    if (savedToken) {
      setToken(savedToken);
      handleGetMe();
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

  // Auth handlers
  const handleRegister = async () => {
    if (!email || !password || password.length < 6) {
      setError('Email required and password must be at least 6 characters');
      setStatus('error');
      return;
    }
    const result = await handleApiCall(
      () => apiClient.register(email, password),
      'Registered successfully'
    );
    setUser(result.user);
    setToken(result.token);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password required');
      setStatus('error');
      return;
    }
    const result = await handleApiCall(
      () => apiClient.login(email, password),
      'Logged in successfully'
    );
    setUser(result.user);
    setToken(result.token);
  };

  const handleGetMe = async () => {
    const result = await handleApiCall(
      () => apiClient.getMe(),
      'User fetched successfully'
    );
    setUser(result);
  };

  const handleLogout = () => {
    const result = apiClient.logout();
    setUser(null);
    setToken(null);
    setProfile(null);
    setResponse(result);
    setStatus('success');
  };

  const handleClearAuth = () => {
    setEmail('test@example.com');
    setPassword('TestPass123');
    setError(null);
    setResponse(null);
    setStatus('idle');
  };

  // Profile handlers
  const handleCreateProfile = async () => {
    await handleApiCall(
      () => apiClient.createProfile(profileForm),
      'Profile created successfully'
    );
  };

  const handleGetProfile = async () => {
    const result = await handleApiCall(
      () => apiClient.getProfile(),
      'Profile fetched successfully'
    );
    setProfile(result);
    setProfileForm({
      age: result.age,
      gender: result.gender,
      weight: result.weight,
      height: result.height,
      fitnessGoal: result.fitnessGoal,
      fitnessLevel: result.fitnessLevel,
    });
  };

  const handleUpdateProfile = async () => {
    const result = await handleApiCall(
      () => apiClient.updateProfile(profileForm),
      'Profile updated successfully'
    );
    setProfile(result);
  };

  const handleDeleteProfile = async () => {
    await handleApiCall(
      () => apiClient.deleteProfile(),
      'Profile deleted successfully'
    );
    setProfile(null);
  };

  const handleClearProfile = () => {
    setProfileForm({
      age: 25,
      gender: 'male',
      weight: 70.5,
      height: 175,
      fitnessGoal: 'build_muscle',
      fitnessLevel: 'intermediate',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🔐 Auth & Profile Tester
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

      {/* Auth Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
          Authentication
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Password (min 6 chars)"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRegister}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳' : '📝'} Register
          </button>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳' : '🔑'} Login
          </button>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🚪 Logout
          </button>
          <button
            onClick={handleClearAuth}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🧹 Clear
          </button>
        </div>

        {/* Current User Display */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-700">👤 Current User: </span>
              <span className="text-gray-900">
                {loading ? 'Loading...' : user ? user.email : 'Not logged in'}
              </span>
              {token && (
                <span className="ml-2 text-xs text-green-600">
                  🔒 Token: {token.substring(0, 20)}...
                </span>
              )}
            </div>
            <button
              onClick={handleGetMe}
              disabled={loading || !token}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              🔄 Get Me
            </button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
          📊 Profile Management
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={profileForm.age || ''}
              onChange={(e) => setProfileForm({ ...profileForm, age: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={profileForm.gender || 'male'}
              onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={profileForm.weight || ''}
              onChange={(e) => setProfileForm({ ...profileForm, weight: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="70.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              value={profileForm.height || ''}
              onChange={(e) => setProfileForm({ ...profileForm, height: parseInt(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="175"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fitness Goal
            </label>
            <select
              value={profileForm.fitnessGoal || 'build_muscle'}
              onChange={(e) => setProfileForm({ ...profileForm, fitnessGoal: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="lose_weight">Lose Weight</option>
              <option value="build_muscle">Build Muscle</option>
              <option value="maintain">Maintain</option>
              <option value="improve_endurance">Improve Endurance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fitness Level
            </label>
            <select
              value={profileForm.fitnessLevel || 'intermediate'}
              onChange={(e) => setProfileForm({ ...profileForm, fitnessLevel: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCreateProfile}
            disabled={loading || !token}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳' : '➕'} Create
          </button>
          <button
            onClick={handleGetProfile}
            disabled={loading || !token}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳' : '📥'} Get
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={loading || !token}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳' : '✏️'} Update
          </button>
          <button
            onClick={handleDeleteProfile}
            disabled={loading || !token}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳' : '🗑️'} Delete
          </button>
          <button
            onClick={handleClearProfile}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🧹 Clear
          </button>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {!loading && response && (
          <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm border border-gray-200">
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

export default AuthProfileTestPanel;