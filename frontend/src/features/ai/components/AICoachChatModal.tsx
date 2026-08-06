/**
 * AI Coach Chat Modal
 *
 * AI教练对话弹窗组件
 * - 支持对话历史浏览
 * - 发送消息与AI教练对话
 * - 生成客制化训练计划
 * - Markdown格式消息渲染
 * - 动作卡片可直接添加到Active Workout
 * - iOS兼容设计
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageSquare,
  Plus,
  Dumbbell,
  ChevronLeft,
  Clock,
  Target,
  Sparkles,
  Trash2,
  Save,
  Loader2,
  Bot,
  User,
  RefreshCw,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';
import AICoachService, {
  type AICoachConversation,
  type AICoachMessage,
  type AICustomRoutine,
} from '../services/AICoachService';
import { aiConfigBackendService, type AIProviderConfig } from '../services/AIConfigBackendService';
import AICustomRoutineCard from './AICustomRoutineCard';
import AIMessageContent from './AIMessageContent';
import type { Exercise, Routine } from '@/shared/types';

interface AICoachChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
  userProfile?: any;
  recentWorkouts?: any[];
  muscleRecovery?: any[];
  targetMuscles?: string[];
  onRoutineSelect?: (routine: AICustomRoutine) => void;
  // Exercise library for matching AI-recommended exercises
  exerciseLibrary?: Exercise[];
  // Callback to add an exercise to active workout
  onAddExerciseToWorkout?: (exercise: Exercise, sets?: number, reps?: string, restSeconds?: number) => void;
  // Currently active workout exercise IDs (to show added state)
  activeWorkoutExerciseIds?: Set<string>;
  // Legacy prop for backward compatibility
  exercises?: Exercise[];
  activeWorkout?: Array<{ exerciseId: string }>;
  // User's existing routines ("My Routines") for the save-to-routine picker
  userRoutines?: Routine[];
  // Add AI-recommended exercises to an existing routine or a newly created one
  onAddExercisesToRoutine?: (exercises: Exercise[], routineId?: string) => Promise<string | undefined> | void;
  // Undo actions for AI-added exercises
  onRemoveExerciseFromWorkout?: (exerciseId: string) => void;
  onRemoveExerciseFromRoutine?: (exerciseId: string, routineId: string) => void;
}

type ViewMode = 'list' | 'chat' | 'loading';

// iOS Safe localStorage wrapper
const safeStorage = {
  getItem: (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): boolean => {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  },
};

export const AICoachChatModal: React.FC<AICoachChatModalProps> = ({
  isOpen,
  onClose,
  initialConversationId,
  userProfile,
  recentWorkouts,
  muscleRecovery,
  targetMuscles,
  onRoutineSelect,
  exerciseLibrary = [],
  onAddExerciseToWorkout,
  activeWorkoutExerciseIds = new Set(),
  exercises: legacyExercises,
  activeWorkout: legacyActiveWorkout,
  userRoutines = [],
  onAddExercisesToRoutine,
  onRemoveExerciseFromWorkout,
  onRemoveExerciseFromRoutine,
}) => {
  // Merge legacy and current exercise library props so neither path is empty.
  const effectiveExerciseLibrary = useMemo(() => {
    const all = [...(legacyExercises || []), ...(exerciseLibrary || [])];
    const map = new Map(all.map(e => [e.id, e]));
    return Array.from(map.values());
  }, [legacyExercises, exerciseLibrary]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [conversations, setConversations] = useState<AICoachConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AICoachConversation | null>(null);
  const [messages, setMessages] = useState<AICoachMessage[]>([]);
  const [routines, setRoutines] = useState<AICustomRoutine[]>([]);

  // Input state
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  // Streaming state — holds the assistant reply being typed out live
  const [streamingContent, setStreamingContent] = useState('');
  const [hasReceivedFirstDelta, setHasReceivedFirstDelta] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  // Handle initial conversation ID
  useEffect(() => {
    if (isOpen && initialConversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === initialConversationId);
      if (conv) {
        openConversation(conv);
      }
    }
  }, [isOpen, initialConversationId, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when entering chat view
  useEffect(() => {
    if (viewMode === 'chat' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [viewMode]);

  const loadConversations = async () => {
    try {
      setViewMode('loading');
      const data = await AICoachService.getConversations();
      setConversations(data);
      setViewMode('list');
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
      setViewMode('list');
    }
  };

  const openConversation = async (conversation: AICoachConversation) => {
    try {
      setViewMode('loading');
      const detail = await AICoachService.getConversation(conversation.id);
      setCurrentConversation(detail);
      setMessages(detail.messages);
      setRoutines(detail.routines);
      setViewMode('chat');
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
      setViewMode('list');
    }
  };

  const createNewConversation = async () => {
    try {
      setViewMode('loading');
      const newConv = await AICoachService.createConversation();
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      setRoutines([]);
      setViewMode('chat');
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
      setViewMode('list');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isSending) return;

    const content = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);
    setError(null);
    setStreamingContent('');
    setHasReceivedFirstDelta(false);

    // Optimistically add user message
    const tempUserMessage: AICoachMessage = {
      id: 'temp-user',
      role: 'user',
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    const contextData = {
      recentWorkouts,
      muscleRecovery,
      userProfile,
      exerciseLibrary: effectiveExerciseLibrary.map(e => ({
        id: e.id,
        name: e.name,
        nameZh: e.nameZh,
      })),
    };

    AICoachService.sendMessageStream(
      currentConversation.id,
      { content, contextData },
      // onDelta: append live text
      (delta) => {
        setHasReceivedFirstDelta(true);
        setStreamingContent(prev => prev + delta);
      },
      // onDone: replace streaming bubble with final message
      (result) => {
        const finalMessage: AICoachMessage = {
          id: result.messageId,
          role: 'assistant',
          content: result.content,
          type: 'text',
          metadata: {
            model: result.model,
            provider: result.provider,
            durationMs: result.durationMs,
          },
          createdAt: result.createdAt,
        };

        setMessages(prev => [
          ...prev.filter(m => m.id !== 'temp-user'),
          { id: 'user-msg', role: 'user', content, type: 'text', createdAt: new Date().toISOString() },
          finalMessage,
        ]);
        setStreamingContent('');
        setHasReceivedFirstDelta(false);
        setIsSending(false);

        // Auto-update conversation title from generatedTitle
        if (result.generatedTitle) {
          const newTitle = result.generatedTitle;
          setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
          setConversations(prev => prev.map(c =>
            c.id === currentConversation.id ? { ...c, title: newTitle } : c
          ));
        }
      },
      // onError: show error, remove temp bubble
      (err) => {
        setError(err.message || 'Failed to send message');
        setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
        setStreamingContent('');
        setHasReceivedFirstDelta(false);
        setIsSending(false);
      }
    );
  };

  const handleGenerateRoutine = async (type: AICustomRoutine['routineType']) => {
    if (!currentConversation || isGeneratingRoutine) return;

    setIsGeneratingRoutine(true);
    setError(null);

    try {
      const muscles = targetMuscles && targetMuscles.length > 0
        ? targetMuscles
        : ['Chest', 'Back'];

      const routine = await AICoachService.generateRoutine(
        currentConversation.id,
        {
          focusMuscles: muscles,
          routineType: type,
          difficulty: userProfile?.experienceLevel?.toLowerCase() || 'intermediate',
          preferences: `User profile: ${userProfile?.fitnessGoal || 'general fitness'}`,
        }
      );

      setRoutines(prev => [routine, ...prev]);

      // Add system message about the routine
      const systemMessage: AICoachMessage = {
        id: `routine-${routine.id}`,
        role: 'assistant',
        content: `I've created a custom "${routine.name}" for you! Check it out below.`,
        type: 'routine_suggestion',
        metadata: { routineId: routine.id },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate routine');
    } finally {
      setIsGeneratingRoutine(false);
    }
  };

  // Delete confirmation state (iOS compatible, no confirm())
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string }>({ show: false, id: '' });
  // Model selector state
  const [aiConfigs, setAiConfigs] = useState<AIProviderConfig[]>([]);
  const [preferredConfigId, setPreferredConfigId] = useState<string | undefined>(undefined);
  const [isChangingModel, setIsChangingModel] = useState(false);

  // Load AI configs on open
  useEffect(() => { if (!isOpen) return; const load = async () => { try { setAiConfigs(await aiConfigBackendService.getConfigs()); } catch {} }; load(); }, [isOpen]);
  // Derive preferred config from current conversation context
  useEffect(() => { const ctx = currentConversation?.context as Record<string, any> | undefined; setPreferredConfigId(ctx?.preferredConfigId); }, [currentConversation]);

  const handleSelectModel = async (configId: string) => {
    if (!currentConversation || isChangingModel) return;
    setIsChangingModel(true);
    try {
      await AICoachService.setConversationModel(currentConversation.id, configId);
      setPreferredConfigId(configId);
      setCurrentConversation(prev => prev ? { ...prev, context: { ...prev.context, preferredConfigId: configId } } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to update model');
    } finally {
      setIsChangingModel(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: '' });
    try {
      await AICoachService.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
        setRoutines([]);
        setViewMode('list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick suggestion chips
  const quickSuggestions = [
    { label: '帮我设计胸肌训练', icon: Dumbbell },
    { label: '如何提高背部宽度？', icon: Target },
    { label: '制定腿部训练计划', icon: Dumbbell },
    { label: '复合动作推荐', icon: Sparkles },
    { label: '分析我的训练频率', icon: Activity },
    { label: '帮我安排恢复计划', icon: Flame },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-4 bottom-24
                       md:left-1/2 md:-translate-x-1/2 md:top-8 md:bottom-8
                       md:w-full md:max-w-2xl md:h-auto md:max-h-[85vh]
                       bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl z-50
                       flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
              <div className="flex items-center gap-3">
                {viewMode === 'chat' && (
                  <button
                    onClick={() => setViewMode('list')}
                    className="p-2 -ml-2 hover:bg-slate-800 rounded-xl transition-colors"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ChevronLeft size={20} className="text-slate-400" />
                  </button>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600
                                  flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">
                      {viewMode === 'chat' && currentConversation
                        ? currentConversation.title
                        : 'AI 健身教练'}
                    </h2>
                    {viewMode === 'chat' && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={20} className="text-slate-400" />
              </button>

              {/* Model Selector (in header when in chat view) */}
              {viewMode === 'chat' && aiConfigs.length > 0 && (
                <div className="hidden sm:block">
                  <select
                    value={preferredConfigId || ''}
                    onChange={(e) => handleSelectModel(e.target.value)}
                    disabled={isChangingModel}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 max-w-[160px]"
                    title="Select AI model for this conversation"
                  >
                    <option value="">Default model</option>
                    {aiConfigs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.name} ({config.modelId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20"
                >
                  <p className="text-xs text-rose-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'loading' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-xs text-slate-500">Loading...</p>
                  </div>
                </div>
              )}

              {viewMode === 'list' && (
                <div className="h-full overflow-y-auto p-4 space-y-3">
                  {/* New Chat Button */}
                  <button
                    onClick={createNewConversation}
                    className="w-full p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10
                             border border-cyan-500/20 rounded-2xl
                             flex items-center justify-center gap-2
                             hover:border-cyan-500/40 hover:from-cyan-500/15 hover:to-blue-500/15
                             transition-all active:scale-[0.98]"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Plus size={18} className="text-cyan-400" />
                    </div>
                    <span className="font-semibold text-cyan-400">开始新对话</span>
                  </button>

                  {/* Conversations List */}
                  {conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <MessageSquare size={28} className="text-slate-700" />
                      </div>
                      <p className="text-slate-500 text-sm">还没有对话</p>
                      <p className="text-xs text-slate-600 mt-1">
                        点击上方按钮开始和你的AI教练对话吧！
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1">
                        历史对话 ({conversations.length})
                      </p>
                      {conversations.map(conv => (
                        <motion.div
                          key={conv.id}
                          onClick={() => openConversation(conv)}
                          whileTap={{ scale: 0.98 }}
                          className="group p-4 bg-slate-900/50 border border-slate-800 rounded-2xl
                                   hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white truncate text-sm">{conv.title}</h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[11px] text-slate-500">
                                  {new Date(conv.lastMessageAt).toLocaleDateString('zh-CN', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <span className="text-slate-700">•</span>
                                <span className="text-[11px] text-slate-500">
                                  {conv._count?.messages || 0} 条消息
                                </span>
                              </div>
                            </div>
                            <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ show: true, id: conv.id }); }}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10
                                       rounded-xl transition-all"
                              style={{ touchAction: 'manipulation' }}
                            >
                              <Trash2 size={16} className="text-rose-400" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto px-4 py-4 space-y-5"
                  >
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10
                                      flex items-center justify-center mx-auto mb-4 border border-cyan-500/10">
                          <Bot size={36} className="text-cyan-400" />
                        </div>
                        <p className="text-white font-semibold mb-1">你好！我是你的AI健身教练</p>
                        <p className="text-sm text-slate-500 mb-2">
                          我可以帮你设计训练计划、解答健身问题、分析动作技巧
                        </p>
                        <p className="text-xs text-slate-600">
                          在对话中我会直接展示动作卡片，你可以一键添加到训练中
                        </p>

                        {/* Quick Suggestions */}
                        <div className="grid grid-cols-2 gap-2 mt-6 px-2">
                          {quickSuggestions.map((suggestion, idx) => (
                            <motion.button
                              key={idx}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setInputMessage(suggestion.label);
                                inputRef.current?.focus();
                              }}
                              className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl
                                       text-left hover:border-slate-700 hover:bg-slate-900 transition-all"
                              style={{ touchAction: 'manipulation' }}
                            >
                              <suggestion.icon size={16} className="text-cyan-400 mb-2" />
                              <span className="text-xs text-slate-300">{suggestion.label}</span>
                            </motion.button>
                          ))}
                        </div>

                        {/* Quick Routine Generation */}
                        {targetMuscles && targetMuscles.length > 0 && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10
                                        border border-indigo-500/20 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={14} className="text-indigo-400" />
                              <p className="text-sm text-indigo-400 font-medium">
                                快速生成 {targetMuscles.join(' + ')} 训练计划
                              </p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => handleGenerateRoutine('compound_focus')}
                                disabled={isGeneratingRoutine}
                                className="py-2 bg-amber-500/10 text-amber-400
                                         rounded-xl text-xs font-medium border border-amber-500/20
                                         hover:bg-amber-500/20 disabled:opacity-50 transition-all"
                                style={{ touchAction: 'manipulation' }}
                              >
                                <Zap size={12} className="mx-auto mb-1" />
                                复合为主
                              </button>
                              <button
                                onClick={() => handleGenerateRoutine('balanced')}
                                disabled={isGeneratingRoutine}
                                className="py-2 bg-emerald-500/10 text-emerald-400
                                         rounded-xl text-xs font-medium border border-emerald-500/20
                                         hover:bg-emerald-500/20 disabled:opacity-50 transition-all"
                                style={{ touchAction: 'manipulation' }}
                              >
                                <Target size={12} className="mx-auto mb-1" />
                                均衡搭配
                              </button>
                              <button
                                onClick={() => handleGenerateRoutine('isolation_focus')}
                                disabled={isGeneratingRoutine}
                                className="py-2 bg-purple-500/10 text-purple-400
                                         rounded-xl text-xs font-medium border border-purple-500/20
                                         hover:bg-purple-500/20 disabled:opacity-50 transition-all"
                                style={{ touchAction: 'manipulation' }}
                              >
                                <Activity size={12} className="mx-auto mb-1" />
                                孤立为主
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <motion.div
                          key={msg.id || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          className={`flex gap-3 ${
                            msg.role === 'user' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                            ${msg.role === 'user'
                              ? 'bg-slate-800 border border-slate-700'
                              : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20'}`}>
                            {msg.role === 'user'
                              ? <User size={15} className="text-slate-400" />
                              : <Bot size={15} className="text-white" />
                            }
                          </div>

                          {/* Message Content */}
                          <div className={`max-w-[85%] min-w-0 ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}>
                            {/* Bubble */}
                            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed
                              ${msg.role === 'user'
                                ? 'bg-cyan-600 text-white rounded-tr-sm'
                                : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800'
                              }`}>
                              {msg.role === 'user' ? (
                                <p className="text-sm">{msg.content}</p>
                              ) : (
                                <AIMessageContent
                                  content={msg.content}
                                  exerciseLibrary={effectiveExerciseLibrary}
                                  onAddExerciseToWorkout={onAddExerciseToWorkout}
                                  activeWorkoutExerciseIds={activeWorkoutExerciseIds}
                                  userRoutines={userRoutines}
                                  onAddExercisesToRoutine={onAddExercisesToRoutine}
                                  onRemoveExerciseFromWorkout={onRemoveExerciseFromWorkout}
                                  onRemoveExerciseFromRoutine={onRemoveExerciseFromRoutine}
                                />
                              )}
                            </div>

                            {/* Timestamp + model/duration (assistant only) */}
                            <span className="text-[10px] text-slate-600 mt-1 px-1 flex items-center gap-1.5 flex-wrap">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {msg.role === 'assistant' && msg.metadata?.model && (
                                <span className="text-slate-500">
                                  · {msg.metadata.model}
                                  {typeof msg.metadata?.durationMs === 'number' && (
                                    <span className="text-slate-600">
                                      {' '}({(msg.metadata.durationMs / 1000).toFixed(1)}s)
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    )}

                    {/* Generated Routines */}
                    {routines.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 px-1">
                          <Sparkles size={12} className="text-purple-400" />
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            AI 生成的训练计划
                          </p>
                        </div>
                        {routines.map(routine => (
                          <AICustomRoutineCard
                            key={routine.id}
                            routine={routine}
                            onSelect={onRoutineSelect}
                            exerciseLibrary={effectiveExerciseLibrary}
                          />
                        ))}
                      </div>
                    )}

                    {/* Streaming / thinking indicator */}
                    {isSending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600
                                        flex items-center justify-center flex-shrink-0">
                          <Bot size={15} className="text-white" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm
                                      px-4 py-3 min-w-0">
                          {!hasReceivedFirstDelta ? (
                            // Thinking phase — before first token arrives
                            <div className="flex items-center gap-2.5">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
                              />
                              <span className="text-sm text-slate-300 flex items-center gap-1">
                                <motion.span
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  Thinking
                                </motion.span>
                                <motion.span
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  …
                                </motion.span>
                              </span>
                            </div>
                          ) : streamingContent ? (
                            // Streaming phase — live text with cursor
                            <div className="relative">
                              <AIMessageContent
                                content={streamingContent}
                                exerciseLibrary={effectiveExerciseLibrary}
                                onAddExerciseToWorkout={onAddExerciseToWorkout}
                                activeWorkoutExerciseIds={activeWorkoutExerciseIds}
                                userRoutines={userRoutines}
                                onAddExercisesToRoutine={onAddExercisesToRoutine}
                                onRemoveExerciseFromWorkout={onRemoveExerciseFromWorkout}
                                onRemoveExerciseFromRoutine={onRemoveExerciseFromRoutine}
                              />
                              <motion.span
                                className="inline-block w-[3px] h-4 bg-cyan-400 ml-0.5 align-middle"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.7, repeat: Infinity }}
                                style={{ position: 'relative', top: 2 }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div
                    className="p-4 border-t border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950"
                    style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
                  >
                    <div className="flex gap-2 items-end">
                      <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="问健身问题，或让AI推荐动作..."
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3
                                 text-sm text-white placeholder-slate-600
                                 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20
                                 resize-none transition-all"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isSending}
                        className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium
                                 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed
                                 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/10"
                        style={{ touchAction: 'manipulation' }}
                      >
                        {isSending ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Send size={20} />
                        )}
                      </motion.button>
                    </div>
                    <p className="text-[10px] text-slate-700 mt-2 text-center">
                      Enter 发送 · Shift+Enter 换行
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AnimatePresence>
            {deleteConfirm.show && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                onClick={() => setDeleteConfirm({ show: false, id: '' })}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-500/20 rounded-full"><Trash2 className="text-rose-400" size={24} /></div>
                    <h3 className="text-lg font-bold text-white">Delete Conversation</h3>
                  </div>
                  <p className="text-slate-400 mb-6">Are you sure you want to delete this conversation? This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteConfirm({ show: false, id: '' })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-rose-500 hover:bg-rose-400 text-white font-medium rounded-xl transition-colors">Delete</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default AICoachChatModal;
