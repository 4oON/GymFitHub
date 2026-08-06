import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import WorkoutSyncService from '../services/WorkoutSyncService';
import type { Profile, CreateProfileInput } from '../types/api';
import type { HealthData } from '../types/health';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateProfileInput>({
    age: undefined,
    gender: undefined,
    weight: undefined,
    height: undefined,
    fitnessGoal: undefined,
    fitnessLevel: undefined,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProfile();
      console.log('📥 ProfilePage - fetched profile:', data);
      setProfile(data);
      setFormData({
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        fitnessGoal: data.fitnessGoal,
        fitnessLevel: data.fitnessLevel,
      });

      // 尝试获取健康数据
      try {
        const healthResponse = await apiClient.getLatestHealthData();
        setHealthData(healthResponse.data);
      } catch (healthErr: any) {
        // 如果没有健康数据，不显示错误
        if (!healthErr.message.includes('404')) {
          console.error('Failed to fetch health data:', healthErr);
        }
      }
    } catch (err: any) {
      if (err.message.includes('404')) {
        setIsEditing(true);
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Ensure weight is a number
      const dataToSend = {
        ...formData,
        weight: formData.weight ? Number(formData.weight) : undefined,
      };
      console.log('📤 Saving profile data:', dataToSend);

      if (profile) {
        const updated = await apiClient.updateProfile(dataToSend);
        console.log('📥 Profile updated response:', updated);
        setProfile(updated);
        setSuccess('Profile updated successfully!');
      } else {
        const created = await apiClient.createProfile(dataToSend);
        console.log('📥 Profile created response:', created);
        setProfile(created);
        setSuccess('Profile created successfully!');
      }
      setIsEditing(false);

      // 重新获取数据以确保显示最新信息
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBatchSync = async () => {
    try {
      setSyncing(true);
      setError('');
      setSuccess('');

      const result = await WorkoutSyncService.batchSyncLocalWorkouts();

      if (result.success) {
        setSuccess(result.message);
        console.log('✅ Batch sync stats:', result.stats);
      } else {
        setError(result.message || '同步失败');
      }
    } catch (err: any) {
      setError(err.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header - 优化布局 */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">ZenFit <span className="text-emerald-400">Profile</span></h1>
          <div className="flex items-center gap-2">
            {/* 同步数据按钮 - 图标+文字 */}
            <button
              onClick={handleBatchSync}
              disabled={syncing}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all font-medium flex items-center gap-1.5 border border-blue-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="同步本地训练数据"
            >
              {syncing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">同步中...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">同步</span>
                </>
              )}
            </button>

            {/* 健康数据按钮 - 图标+文字 */}
            <button
              onClick={() => navigate('/health-settings')}
              className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all font-medium flex items-center gap-1.5 border border-emerald-500/30 text-sm"
              title="健康数据同步"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">健康</span>
            </button>

            {/* Edit按钮 - 仅图标 */}
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-all border border-indigo-500/30"
              title="编辑资料"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* 主页按钮 - 仅图标 */}
            <button
              onClick={() => navigate('/app')}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all border border-slate-600"
              title="返回主页"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>

            {/* Logout按钮 - 仅图标 */}
            <button
              onClick={handleLogout}
              className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg border border-rose-500/30 transition-all"
              title="退出登录"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Bento Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-2xl mb-6 backdrop-blur-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl mb-6 backdrop-blur-sm">
            {success}
          </div>
        )}

        {/* Bento Grid Layout - Restored from original UI */}
        <div className="grid grid-cols-4 gap-3 auto-rows-auto">

          {/* Weight Card - Prominent, 2x2 (Green) */}
          <div className="col-span-2 row-span-2 bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-2xl border border-emerald-700/50 hover:border-emerald-500 transition-all flex flex-col justify-between hover:scale-105 hover:shadow-2xl hover:shadow-emerald-900/20 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <svg className="text-emerald-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Weight</span>
            </div>
            <div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-black text-white">{profile?.weight || '--'}</div>
                <div className="text-xl font-bold text-emerald-400 mb-1">kg</div>
              </div>
            </div>
          </div>

          {/* Age Card - Small, 1x1 (Blue/Indigo) */}
          <div className="col-span-1 bg-gradient-to-br from-indigo-900/30 to-slate-900 p-3 rounded-xl border border-indigo-700/50 hover:border-indigo-500 transition-all hover:scale-110 hover:shadow-xl hover:shadow-indigo-900/20 cursor-pointer">
            <div className="flex items-center gap-1 mb-1">
              <svg className="text-indigo-400" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-400 text-[9px] font-medium uppercase tracking-wide">Age</span>
            </div>
            <div className="text-2xl font-black text-white">{profile?.age || '--'}</div>
          </div>

          {/* Gender Card - Small, 1x1 (Purple) */}
          <div className="col-span-1 bg-gradient-to-br from-purple-900/30 to-slate-900 p-3 rounded-xl border border-purple-700/50 hover:border-purple-500 transition-all hover:scale-110 hover:shadow-xl hover:shadow-purple-900/20 cursor-pointer">
            <div className="flex items-center gap-1 mb-1">
              <svg className="text-purple-400" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-slate-400 text-[9px] font-medium uppercase tracking-wide">Gender</span>
            </div>
            <div className="text-xl font-black text-white capitalize">{profile?.gender || 'Not set'}</div>
          </div>

          {/* Body Fat % Card - Medium horizontal, 2x1 (Amber/Orange) - 点击跳转到健康设置 */}
          <div
            onClick={() => navigate('/health-settings')}
            className="col-span-2 bg-gradient-to-br from-amber-900/30 to-slate-900 p-3 rounded-xl border border-amber-700/50 hover:border-amber-500 transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-900/20 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="text-amber-400" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Body Fat</span>
              </div>
              {healthData && (
                <svg className="text-emerald-400" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex items-end gap-1">
              <div className="text-3xl font-black text-white">{healthData?.bodyFatPercent || '--'}</div>
              <div className="text-lg font-bold text-amber-400 mb-1">%</div>
            </div>
            {!healthData && (
              <div className="text-[9px] text-slate-500 mt-1">点击设置健康数据同步</div>
            )}
          </div>

          {/* Weekly Training - Small vertical, 1x1 (Slate/Emerald accent) */}
          <div className="col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all hover:scale-110 hover:shadow-xl hover:shadow-emerald-900/10 cursor-pointer">
            <div className="flex items-center gap-1 mb-1">
              <svg className="text-emerald-400" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-400 text-[9px] font-medium uppercase tracking-wide">Weekly</span>
            </div>
            <div className="text-2xl font-black text-white">3</div>
            <div className="text-[9px] text-slate-500">days</div>
          </div>

          {/* Experience Level - Wide, 3x1 (Blue) */}
          <div className="col-span-3 bg-gradient-to-br from-blue-900/30 to-slate-900 p-3 rounded-xl border border-blue-700/50 hover:border-blue-500 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-900/20 cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <svg className="text-blue-400" width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Experience Level</span>
            </div>
            <div className="text-xl font-black text-white capitalize">{profile?.fitnessLevel || 'Not set'}</div>
          </div>

          {/* Training Goal - Full width, 4x1 (Rose/Red) */}
          <div className="col-span-4 bg-gradient-to-br from-rose-900/30 to-slate-900 p-4 rounded-xl border border-rose-700/50 hover:border-rose-500 transition-all hover:scale-105 hover:shadow-xl hover:shadow-rose-900/20 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <svg className="text-rose-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">Primary Goal</span>
            </div>
            <div className="text-2xl font-black text-white capitalize">
              {profile?.fitnessGoal?.replace('_', ' ') || 'Hypertrophy'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Your main training focus</div>
          </div>

          {/* Edit Button - Integrated into header instead */}
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-xl transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Gender</label>
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="70.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="175"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Fitness Goal</label>
                  <select
                    value={formData.fitnessGoal || ''}
                    onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="maintain">Maintain</option>
                    <option value="improve_endurance">Improve Endurance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Fitness Level</label>
                  <select
                    value={formData.fitnessLevel || ''}
                    onChange={(e) => setFormData({ ...formData, fitnessLevel: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/50"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                  {profile && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          age: profile.age,
                          gender: profile.gender,
                          weight: profile.weight,
                          height: profile.height,
                          fitnessGoal: profile.fitnessGoal,
                          fitnessLevel: profile.fitnessLevel,
                        });
                      }}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl transition-all font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;