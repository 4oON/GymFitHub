/**
 * AI Message Content Renderer
 *
 * Renders AI message content with:
 * - Markdown formatting (headings, lists, bold, tables, code blocks, blockquotes)
 * - Exercise cards embedded via {{EXERCISE:name|sets|reps|rest|tips}}
 * - Video/GIF preview for matched exercises
 * - Smart inline exercise highlighting in plain text (fallback when AI omits tags)
 * - "Add All to Workout" floating button
 */

import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Dumbbell,
  Clock,
  Target,
  CheckCircle2,
  Zap,
  Activity,
  ChevronRight,
  Play,
  ListChecks,
  AlertCircle,
  ListPlus,
  FolderPlus,
  List,
  X,
  Search,
  Undo2,
} from 'lucide-react';
import type { Exercise, Routine } from '@/shared/types';
import { fuzzyMatchExercise } from '@/features/exercise/utils/exerciseMatching';
import VideoPlayer from '@/features/exercise/components/VideoPlayer';

interface AIMessageContentProps {
  content: string;
  exerciseLibrary: Exercise[];
  onAddExerciseToWorkout?: (exercise: Exercise, sets?: number, reps?: string, restSeconds?: number) => void;
  activeWorkoutExerciseIds?: Set<string>;
  // User's existing routines ("My Routines") for the save-to-routine picker
  userRoutines?: Routine[];
  // Add AI-recommended exercises to an existing routine or a newly created one
  onAddExercisesToRoutine?: (exercises: Exercise[], routineId?: string) => Promise<string | undefined> | void;
  // Undo actions for AI-added exercises
  onRemoveExerciseFromWorkout?: (exerciseId: string) => void;
  onRemoveExerciseFromRoutine?: (exerciseId: string, routineId: string) => void;
}

interface ParsedExerciseTag {
  raw: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tips: string;
}

interface ParsedSegment {
  type: 'text' | 'exercise' | 'code' | 'table';
  content: string;
  exerciseData?: ParsedExerciseTag;
  tableData?: string[][];
}

function parseContent(content: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];

  // Extract code blocks first
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const codeBlocks: { start: number; end: number; code: string }[] = [];
  let m;
  while ((m = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({ start: m.index, end: m.index + m[0].length, code: m[1].trim() });
  }

  // Extract exercise tags
  const exerciseRegex = /\{\{EXERCISE:([^|]+)\|(\d+)\|([^|]+)\|(\d+)\|([^}]*)\}\}/g;
  const exercises: { start: number; end: number; data: ParsedExerciseTag }[] = [];
  while ((m = exerciseRegex.exec(content)) !== null) {
    exercises.push({
      start: m.index, end: m.index + m[0].length,
      data: { raw: m[0], name: m[1].trim(), sets: parseInt(m[2], 10) || 3, reps: m[3].trim(), restSeconds: parseInt(m[4], 10) || 90, tips: m[5].trim() },
    });
  }

  // Extract tables
  const tableRegex = /(?:^|\n)((?:\|[^\n]*\|(?:\r?\n|$))+)/g;
  const tables: { start: number; end: number; rows: string[][] }[] = [];
  while ((m = tableRegex.exec(content)) !== null) {
    const raw = m[1];
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
    if (lines.length >= 2) {
      const rows = lines
        .filter(l => !/^\|[-\s|]+\|$/.test(l.trim())) // skip separator line
        .map(l => l.trim().split('|').filter((c, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()));
      if (rows.length >= 1 && rows[0].length >= 2) {
        tables.push({ start: m.index, end: m.index + raw.length, rows });
      }
    }
  }

  // Merge all markers
  const allMarkers: Array<{ start: number; end: number; type: 'code' | 'exercise' | 'table'; data?: any }> = [
    ...codeBlocks.map(c => ({ start: c.start, end: c.end, type: 'code' as const, data: c.code })),
    ...exercises.map(e => ({ start: e.start, end: e.end, type: 'exercise' as const, data: e.data })),
    ...tables.map(t => ({ start: t.start, end: t.end, type: 'table' as const, data: t.rows })),
  ];
  allMarkers.sort((a, b) => a.start - b.start);

  let pos = 0;
  for (const marker of allMarkers) {
    if (marker.start > pos) {
      segments.push({ type: 'text', content: content.slice(pos, marker.start) });
    }
    if (marker.type === 'code') segments.push({ type: 'code', content: marker.data });
    else if (marker.type === 'table') segments.push({ type: 'table', content: '', tableData: marker.data });
    else segments.push({ type: 'exercise', content: '', exerciseData: marker.data });
    pos = marker.end;
  }
  if (pos < content.length) segments.push({ type: 'text', content: content.slice(pos) });
  if (segments.length === 0) segments.push({ type: 'text', content });
  return segments;
}

const exerciseKeywordCache = new WeakMap<Exercise[], Map<string, Exercise[]>>();

/** Build a keyword index from exercise library for faster & looser matching */
function getExerciseKeywordIndex(library: Exercise[]): Map<string, Exercise[]> {
  if (exerciseKeywordCache.has(library)) return exerciseKeywordCache.get(library)!;

  const index = new Map<string, Exercise[]>();
  for (const ex of library) {
    const keywords = new Set<string>();

    // English words (length >= 3)
    ex.name.split(/\s+/).forEach(w => {
      if (w.length >= 3) keywords.add(w.toLowerCase());
    });

    // Full English name
    keywords.add(ex.name.toLowerCase());

    // Chinese: full name + 2/3/4-char substrings
    if (ex.nameZh) {
      keywords.add(ex.nameZh);
      for (let len = 2; len <= 4 && len <= ex.nameZh.length; len++) {
        for (let i = 0; i <= ex.nameZh.length - len; i++) {
          keywords.add(ex.nameZh.slice(i, i + len));
        }
      }
    }

    for (const kw of keywords) {
      if (!index.has(kw)) index.set(kw, []);
      index.get(kw)!.push(ex);
    }
  }

  exerciseKeywordCache.set(library, index);
  return index;
}

/** Detect exercise names inside plain text and return tokenized segments */
function detectExercisesInText(
  text: string,
  library: Exercise[]
): Array<{ type: 'text'; content: string } | { type: 'exercise'; exercise: Exercise; matchedText: string }> {
  const matches: Array<{ start: number; end: number; exercise: Exercise; priority: number }> = [];
  const seenIds = new Set<string>();

  // 1. Try exact / contains match with full names first (highest fidelity)
  const candidates = library
    .map(e => ({ ex: e, name: e.name, nameZh: e.nameZh }))
    .filter(c => c.name.length >= 4 || (c.nameZh && c.nameZh.length >= 2));

  candidates.sort((a, b) => {
    const aLen = Math.max(a.name.length, a.nameZh?.length || 0);
    const bLen = Math.max(b.name.length, b.nameZh?.length || 0);
    return bLen - aLen;
  });

  for (const c of candidates) {
    if (seenIds.has(c.ex.id)) continue;

    const idx = text.toLowerCase().indexOf(c.name.toLowerCase());
    if (idx !== -1 && !matches.some(m => idx < m.end && idx + c.name.length > m.start)) {
      matches.push({ start: idx, end: idx + c.name.length, exercise: c.ex, priority: 100 + c.name.length });
      seenIds.add(c.ex.id);
      continue;
    }

    if (c.nameZh) {
      const idxZh = text.indexOf(c.nameZh);
      if (idxZh !== -1 && !matches.some(m => idxZh < m.end && idxZh + c.nameZh.length > m.start)) {
        matches.push({ start: idxZh, end: idxZh + c.nameZh.length, exercise: c.ex, priority: 100 + c.nameZh.length });
        seenIds.add(c.ex.id);
      }
    }
  }

  // 2. Keyword fallback for Chinese / partial names
  const index = getExerciseKeywordIndex(library);
  for (const [keyword, exercises] of index) {
    if (keyword.length < 2) continue;
    let pos = 0;
    while (true) {
      const idx = text.toLowerCase().indexOf(keyword.toLowerCase(), pos);
      if (idx === -1) break;

      for (const ex of exercises) {
        if (seenIds.has(ex.id)) continue;
        const isOverlapping = matches.some(m => idx < m.end && idx + keyword.length > m.start);
        if (!isOverlapping) {
          matches.push({ start: idx, end: idx + keyword.length, exercise: ex, priority: keyword.length });
          seenIds.add(ex.id);
          break;
        }
      }
      pos = idx + 1;
    }
  }

  matches.sort((a, b) => a.start - b.start);

  // Remove overlaps keeping higher priority (longer / full-name matches win)
  const filtered: typeof matches = [];
  for (const m of matches) {
    if (!filtered.some(f => m.start < f.end && m.end > f.start)) {
      filtered.push(m);
    }
  }

  const tokens: Array<{ type: 'text'; content: string } | { type: 'exercise'; exercise: Exercise; matchedText: string }> = [];
  let pos = 0;
  for (const m of filtered) {
    if (m.start > pos) tokens.push({ type: 'text', content: text.slice(pos, m.start) });
    tokens.push({ type: 'exercise', exercise: m.exercise, matchedText: text.slice(m.start, m.end) });
    pos = m.end;
  }
  if (pos < text.length) tokens.push({ type: 'text', content: text.slice(pos) });

  return tokens;
}

function renderMarkdownText(text: string, exerciseLibrary: Exercise[]): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={`list-${i}`} className="space-y-2 my-2.5 ml-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
              <span className="text-cyan-400 mt-1.5 flex-shrink-0 text-[10px]">●</span>
              <span className="leading-relaxed">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { flushList(); nodes.push(<div key={`br-${i}`} className="h-2" />); i++; continue; }

    if (/^---+\s*$/.test(trimmed)) {
      flushList();
      nodes.push(<div key={`hr-${i}`} className="my-4 h-px bg-slate-800" />);
      i++; continue;
    }

    if (/^[-*]\s+/.test(trimmed)) { listItems.push(trimmed.replace(/^[-*]\s+/, '')); i++; continue; }

    // Numbered list
    const numListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numListMatch) {
      flushList();
      const detected = detectExercisesInText(numListMatch[2], exerciseLibrary);
      const exerciseTokens = detected.filter((t): t is { type: 'exercise'; exercise: Exercise; matchedText: string } => t.type === 'exercise');

      if (exerciseTokens.length > 0) {
        const ex = exerciseTokens[0].exercise;
        const hasMedia = ex?.gifUrl || ex?.videoUrl;
        nodes.push(
          <div key={`num-${i}`} className="flex items-start gap-3 my-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
            {hasMedia ? (
              <div className="w-14 h-14 flex-shrink-0 bg-slate-950 rounded-xl overflow-hidden border border-slate-700/50">
                {ex.gifUrl ? (
                  <img src={ex.gifUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <VideoPlayer
                    videoUrl={ex.videoUrl}
                    lazy={true}
                  />
                )}
              </div>
            ) : (
              <div className="w-14 h-14 flex-shrink-0 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700/50">
                <Dumbbell size={20} className="text-slate-500" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 text-xs font-bold">{numListMatch[1]}.</span>
                <span className="text-sm text-white font-medium">{renderInlineMarkdown(numListMatch[2])}</span>
              </div>
              {ex?.muscleGroup && (
                <p className="text-[11px] text-slate-400 mt-1">{ex.muscleGroup}{ex.equipment ? ` • ${ex.equipment}` : ''}</p>
              )}
            </div>
          </div>
        );
      } else {
        nodes.push(
          <div key={`num-${i}`} className="flex items-start gap-2.5 my-2">
            <span className="text-cyan-400 text-xs font-bold mt-0.5 flex-shrink-0 w-4">{numListMatch[1]}.</span>
            <span className="text-sm text-slate-200 leading-relaxed">{renderInlineMarkdown(numListMatch[2])}</span>
          </div>
        );
      }
      i++; continue;
    }

    flushList();

    if (/^>\s+/.test(trimmed)) {
      nodes.push(
        <div key={`quote-${i}`} className="my-3 pl-3 border-l-2 border-cyan-500/40 bg-cyan-500/5 rounded-r-lg py-2.5 px-3">
          <p className="text-sm text-slate-300 italic leading-relaxed">{renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}</p>
        </div>
      );
      i++; continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes = ['text-[15px] font-bold', 'text-sm font-bold', 'text-sm font-semibold'];
      const colors = ['text-white', 'text-slate-200', 'text-slate-300'];
      const margins = ['mt-5 mb-2.5', 'mt-4 mb-2', 'mt-3 mb-1.5'];
      nodes.push(
        <h4 key={`h${level}-${i}`} className={`${sizes[level - 1]} ${colors[level - 1]} ${margins[level - 1]}`}>
          {renderInlineMarkdown(headingMatch[2])}
        </h4>
      );
      i++; continue;
    }

    nodes.push(
      <p key={`p-${i}`} className="text-sm text-slate-200 leading-relaxed my-2">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
    i++;
  }

  flushList();
  return nodes;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let pos = 0;
  const regex = /(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > pos) parts.push(text.slice(pos, match.index));
    const token = match[1];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*') && !token.startsWith('**')) {
      parts.push(<em key={match.index} className="text-slate-300 italic">{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 bg-slate-800 rounded text-xs text-cyan-300 font-mono">{token.slice(1, -1)}</code>);
    } else if (/^\[[^\]]+\]\([^)]+\)$/.test(token)) {
      const lm = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) parts.push(<a key={match.index} href={lm[2]} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">{lm[1]}</a>);
    }
    pos = match.index + match[0].length;
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts.length > 0 ? <>{parts}</> : text;
}

/** Smart inline markdown that highlights exercise names with colored badges (no tiny media) */
function renderSmartInlineMarkdown(text: string, exerciseLibrary: Exercise[]): React.ReactNode {
  const hasTrainingKeyword = /(?:组|次|sets|reps|rest|休息|动作|exercise|training|workout|训练|Tip|tip|tips|muscle|肌肉|compound|isolation)/i.test(text);
  const hasDigit = /\d/.test(text);
  const isExerciseContext = hasTrainingKeyword && hasDigit;
  if (!isExerciseContext || exerciseLibrary.length === 0) {
    return renderInlineMarkdown(text);
  }

  const tokens = detectExercisesInText(text, exerciseLibrary);
  if (tokens.length === 1 && tokens[0].type === 'text') {
    return renderInlineMarkdown(text);
  }

  const parts: React.ReactNode[] = [];
  tokens.forEach((token, i) => {
    if (token.type === 'text') {
      parts.push(<span key={i}>{renderInlineMarkdown(token.content)}</span>);
    } else {
      const ex = token.exercise;
      const isCompound = ex.mechanic === 'Compound';
      const colorClass = isCompound
        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

      parts.push(
        <span
          key={i}
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold mx-0.5 align-middle border ${colorClass}`}
          title={`${ex.nameZh || ex.name}${ex.muscleGroup ? ` • ${ex.muscleGroup}` : ''}`}
        >
          {token.matchedText}
        </span>
      );
    }
  });

  return <>{parts}</>;
}

/** Table renderer */
const TableBlock: React.FC<{ rows: string[][] }> = ({ rows }) => {
  if (rows.length === 0) return null;
  const headers = rows[0];
  const dataRows = rows.slice(1);
  return (
    <div className="my-3 overflow-x-auto -mx-1">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((h, i) => (
              <th key={i} className="text-left py-2 px-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`py-2 px-2 ${ci === 0 ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Routine picker bottom-sheet: choose an existing routine or create a new one. iOS-friendly (no confirm/prompt). */
const RoutinePickerModal: React.FC<{
  open: boolean;
  exerciseCount: number;
  routines: Routine[];
  onSelect: (routineId?: string) => void; // undefined -> create new
  onClose: () => void;
}> = ({ open, exerciseCount, routines, onSelect, onClose }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          {/* Bottom sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed left-4 right-4 bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md
                       bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl z-[90]
                       flex flex-col overflow-hidden max-h-[70vh]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <ListPlus size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">存为 Routine</h3>
                  <p className="text-[10px] text-slate-500">{exerciseCount} 个动作</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Options */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Create new routine */}
              <button
                onClick={() => onSelect(undefined)}
                className="w-full p-3.5 flex items-center gap-3 rounded-xl
                           bg-gradient-to-r from-indigo-500/15 to-purple-500/15
                           border border-indigo-500/30 hover:border-indigo-500/50
                           transition-all active:scale-[0.98] text-left"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <FolderPlus size={18} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-300">新建 Routine</p>
                  <p className="text-[10px] text-slate-500">自动命名，无需输入</p>
                </div>
                <ChevronRight size={16} className="text-indigo-400 flex-shrink-0" />
              </button>

              {/* Existing routines */}
              {routines.length > 0 && (
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider px-1 pt-2">
                  或加入现有 Routine
                </p>
              )}
              {routines.map(r => (
                <button
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className="w-full p-3.5 flex items-center gap-3 rounded-xl
                             bg-slate-800/50 border border-slate-700/50
                             hover:border-cyan-500/40 hover:bg-slate-800
                             transition-all active:scale-[0.98] text-left"
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <List size={18} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                    <p className="text-[10px] text-slate-500">{r.exercises.length} 个动作</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Exercise picker bottom-sheet: manually pick an exercise when fuzzy match fails. */
const ExercisePickerModal: React.FC<{
  open: boolean;
  exercises: Exercise[];
  title: string;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}> = ({ open, exercises, title, onSelect, onClose }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return exercises.slice(0, 50);
    return exercises.filter(e =>
      e.name.toLowerCase().includes(normalized) ||
      e.nameZh?.toLowerCase().includes(normalized) ||
      e.muscleGroup.toLowerCase().includes(normalized) ||
      e.equipment?.toLowerCase().includes(normalized)
    ).slice(0, 50);
  }, [exercises, query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed left-4 right-4 bottom-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md
                       bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl z-[90]
                       flex flex-col overflow-hidden max-h-[70vh]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex-1 min-w-0 pr-3">
                <h3 className="text-sm font-bold text-white truncate">{title}</h3>
                <p className="text-[10px] text-slate-500">从动作库中手动选择</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索动作名、肌群或器械..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5
                           text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">未找到匹配动作</p>
              ) : (
                filtered.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => onSelect(ex)}
                    className="w-full p-3 flex items-center gap-3 rounded-xl
                               bg-slate-800/50 border border-slate-700/50
                               hover:border-cyan-500/40 hover:bg-slate-800
                               transition-all active:scale-[0.98] text-left"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Dumbbell size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ex.nameZh || ex.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {ex.muscleGroup}
                        {ex.equipment && <span className="text-slate-600"> • </span>}
                        {ex.equipment}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/** Exercise Card with video preview */
const ExerciseCard: React.FC<{
  data: ParsedExerciseTag;
  exercise: Exercise | null;
  exerciseLibrary: Exercise[];
  userRoutines: Routine[];
  onAdd?: (exercise: Exercise, sets?: number, reps?: string, restSeconds?: number) => void;
  isAdded?: boolean;
  onAddToRoutine?: (exercise: Exercise, routineId?: string) => Promise<string | undefined> | void;
  onRemoveFromWorkout?: (exerciseId: string) => void;
  onRemoveFromRoutine?: (exerciseId: string, routineId: string) => void;
}> = ({ data, exercise, exerciseLibrary, userRoutines, onAdd, isAdded, onAddToRoutine, onRemoveFromWorkout, onRemoveFromRoutine }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'add' | 'routine'>('add');
  const [routinePickerOpen, setRoutinePickerOpen] = useState(false);
  const [addedToRoutineId, setAddedToRoutineId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    if (exercise && onAdd && !isAdded) onAdd(exercise, data.sets, data.reps, data.restSeconds);
  }, [exercise, onAdd, isAdded, data]);

  const openRoutinePicker = useCallback(() => {
    if (onAddToRoutine) setRoutinePickerOpen(true);
  }, [onAddToRoutine]);

  const handleRoutinePickerSelect = useCallback(async (routineId?: string) => {
    setRoutinePickerOpen(false);
    if (exercise && onAddToRoutine) {
      const id = await onAddToRoutine(exercise, routineId);
      if (id) setAddedToRoutineId(id);
    }
  }, [exercise, onAddToRoutine]);

  const handleSaveToRoutine = useCallback(() => {
    if (exercise) openRoutinePicker();
  }, [exercise, openRoutinePicker]);

  const handleUndoAdd = useCallback(() => {
    if (exercise && isAdded && onRemoveFromWorkout) onRemoveFromWorkout(exercise.id);
  }, [exercise, isAdded, onRemoveFromWorkout]);

  const handleUndoRoutine = useCallback(() => {
    if (exercise && addedToRoutineId && onRemoveFromRoutine) {
      onRemoveFromRoutine(exercise.id, addedToRoutineId);
      setAddedToRoutineId(null);
    }
  }, [exercise, addedToRoutineId, onRemoveFromRoutine]);

  const openManualPicker = useCallback((mode: 'add' | 'routine') => {
    if (exerciseLibrary.length === 0) return;
    setPickerMode(mode);
    setPickerOpen(true);
  }, [exerciseLibrary.length]);

  const handleManualSelect = useCallback(async (selected: Exercise) => {
    setPickerOpen(false);
    if (pickerMode === 'add' && onAdd && !isAdded) {
      onAdd(selected, data.sets, data.reps, data.restSeconds);
    } else if (pickerMode === 'routine' && onAddToRoutine) {
      const id = await onAddToRoutine(selected);
      if (id) setAddedToRoutineId(id);
    }
  }, [pickerMode, onAdd, onAddToRoutine, isAdded, data]);

  const hasVideo = exercise?.videoUrl || exercise?.gifUrl;
  const mechanicColor = exercise?.mechanic === 'Compound'
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : exercise?.mechanic === 'Isolation'
    ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`my-3 rounded-2xl border overflow-hidden ${
        isAdded ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-800'
      } transition-all`}
    >
      {/* Video Preview */}
      {hasVideo && (
        <div className="relative w-full h-36 bg-slate-950 overflow-hidden">
          {exercise?.gifUrl ? (
            <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-full object-cover" />
          ) : exercise?.videoUrl ? (
            <VideoPlayer videoUrl={exercise.videoUrl} className="w-full h-full" lazy={false} preload="metadata" />
          ) : null}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
          {/* Mechanic badge */}
          {exercise?.mechanic && (
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${mechanicColor}`}>
                {exercise.mechanic}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        {/* Title row */}
        <div className="flex items-start gap-3">
          {!hasVideo && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              exercise?.mechanic === 'Compound' ? 'bg-amber-500/10' : exercise?.mechanic === 'Isolation' ? 'bg-purple-500/10' : 'bg-cyan-500/10'
            }`}>
              {isAdded ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Dumbbell size={20} className={
                exercise?.mechanic === 'Compound' ? 'text-amber-400' : exercise?.mechanic === 'Isolation' ? 'text-purple-400' : 'text-cyan-400'
              } />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white">
              {exercise?.nameZh || exercise?.name || data.name}
            </h4>
            {exercise?.muscleGroup && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <Activity size={10} className="text-emerald-400" />
                {exercise.muscleGroup}
                {exercise.equipment && <span className="text-slate-600">•</span>}
                {exercise.equipment && <span className="text-slate-500">{exercise.equipment}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
            <Zap size={10} className="text-amber-400" />
            {data.sets} 组
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
            <Target size={10} className="text-cyan-400" />
            {data.reps} 次
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
            <Clock size={10} className="text-emerald-400" />
            {data.restSeconds}s
          </span>
        </div>

        {data.tips && (
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed bg-slate-950/50 rounded-lg p-2">
            <span className="text-amber-400/80 font-medium">Tip: </span>
            {data.tips}
          </p>
        )}

        {/* Add Button */}
        {onAdd && (
          <button
            onClick={isAdded ? handleUndoAdd : exercise ? handleAdd : () => openManualPicker('add')}
            disabled={!isAdded && !exercise && exerciseLibrary.length === 0}
            className={`w-full mt-3 py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all ${
              isAdded
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]'
                : !exercise
                ? exerciseLibrary.length === 0
                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-[0.98]'
                : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 active:scale-[0.98]'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            {isAdded ? (
              <><Undo2 size={14} /> 已添加到训练 · 撤回</>
            ) : !exercise ? (
              exerciseLibrary.length === 0 ? (
                <><AlertCircle size={14} /> 动作库加载中...</>
              ) : (
                <><AlertCircle size={14} /> 未找到，手动选择动作</>
              )
            ) : (
              <><Plus size={14} /> 添加到 Active Workout <ChevronRight size={12} /></>
            )}
          </button>
        )}

        {/* Save to Routine Button */}
        {onAddToRoutine && (
          <button
            onClick={addedToRoutineId ? handleUndoRoutine : exercise ? handleSaveToRoutine : () => {
              setPickerMode('routine');
              setPickerOpen(true);
            }}
            disabled={!addedToRoutineId && !exercise && exerciseLibrary.length === 0}
            className={`w-full mt-2 py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all border ${
              addedToRoutineId
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 active:scale-[0.98]'
                : !exercise
                ? exerciseLibrary.length === 0
                  ? 'bg-slate-800/50 text-slate-500 border-transparent cursor-not-allowed'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-[0.98]'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 active:scale-[0.98]'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <ListPlus size={14} /> {
              addedToRoutineId
                ? '已加入 Routine · 撤回'
                : exercise
                ? '加入 Routine'
                : exerciseLibrary.length === 0
                ? '动作库加载中...'
                : '未找到，手动选择动作'
            }
          </button>
        )}
      </div>

      <ExercisePickerModal
        open={pickerOpen}
        exercises={exerciseLibrary}
        title={pickerMode === 'add' ? '选择要添加的动作' : '选择要加入 Routine 的动作'}
        onSelect={handleManualSelect}
        onClose={() => setPickerOpen(false)}
      />

      <RoutinePickerModal
        open={routinePickerOpen}
        exerciseCount={1}
        routines={userRoutines}
        onSelect={handleRoutinePickerSelect}
        onClose={() => setRoutinePickerOpen(false)}
      />
    </motion.div>
  );
};

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <div className="my-3 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-800 bg-slate-900/50">
      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
    </div>
    <pre className="p-3 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{code}</pre>
  </div>
);

export const AIMessageContent: React.FC<AIMessageContentProps> = ({
  content,
  exerciseLibrary,
  onAddExerciseToWorkout,
  activeWorkoutExerciseIds,
  userRoutines = [],
  onAddExercisesToRoutine,
  onRemoveExerciseFromWorkout,
  onRemoveExerciseFromRoutine,
}) => {
  const segments = useMemo(() => parseContent(content), [content]);

  // Routine picker state: holds the exercises to save while the picker is open
  const [pickerExercises, setPickerExercises] = useState<Exercise[] | null>(null);

  // Collect all exercises in this message for "Add All" functionality
  const allExercises = useMemo(() => {
    const items: { exercise: Exercise | null; data: ParsedExerciseTag }[] = [];
    for (const seg of segments) {
      if (seg.type === 'exercise' && seg.exerciseData) {
        const ex = fuzzyMatchExercise(seg.exerciseData.name, exerciseLibrary);
        items.push({ exercise: ex, data: seg.exerciseData });
      }
    }
    return items;
  }, [segments, exerciseLibrary]);

  // Exercises that matched the library (exercise !== null)
  const matchedExercises = allExercises.filter(e => e.exercise);
  // Matched but not yet in the active workout -> still addable
  const addableExercises = matchedExercises.filter(e => !activeWorkoutExerciseIds?.has(e.exercise!.id));
  // Only claim "all added" when there is at least one matched exercise AND none left to add.
  // (If nothing matched the library, matchedExercises is empty -> we must NOT show this.)
  const allAdded = matchedExercises.length > 0 && addableExercises.length === 0;

  const handleAddAll = useCallback(() => {
    for (const item of addableExercises) {
      if (item.exercise && onAddExerciseToWorkout) {
        onAddExerciseToWorkout(item.exercise, item.data.sets, item.data.reps, item.data.restSeconds);
      }
    }
  }, [addableExercises, onAddExerciseToWorkout]);

  const handleAddOneToRoutine = useCallback(async (exercise: Exercise, routineId?: string): Promise<string | undefined> => {
    if (onAddExercisesToRoutine) {
      const result = await onAddExercisesToRoutine([exercise], routineId);
      return result || undefined;
    }
    return undefined;
  }, [onAddExercisesToRoutine]);

  // Open the routine picker for all matched exercises in this message (deduped by id)
  const openPickerForAll = useCallback(() => {
    const seen = new Set<string>();
    const list: Exercise[] = [];
    for (const item of matchedExercises) {
      if (item.exercise && !seen.has(item.exercise.id)) {
        seen.add(item.exercise.id);
        list.push(item.exercise);
      }
    }
    if (list.length > 0) setPickerExercises(list);
  }, [matchedExercises]);

  // Picker selection: routineId undefined -> create new routine
  const handlePickerSelect = useCallback((routineId?: string) => {
    if (pickerExercises && onAddExercisesToRoutine) {
      onAddExercisesToRoutine(pickerExercises, routineId);
    }
    setPickerExercises(null);
  }, [pickerExercises, onAddExercisesToRoutine]);

  return (
    <div className="space-y-1">
      {segments.map((segment, idx) => {
        if (segment.type === 'code') return <CodeBlock key={idx} code={segment.content} />;
        if (segment.type === 'table' && segment.tableData) return <TableBlock key={idx} rows={segment.tableData} />;
        if (segment.type === 'exercise' && segment.exerciseData) {
          const exercise = fuzzyMatchExercise(segment.exerciseData.name, exerciseLibrary);
          const isAdded = exercise ? activeWorkoutExerciseIds?.has(exercise.id) : false;
          return (
            <ExerciseCard
              key={idx}
              data={segment.exerciseData}
              exercise={exercise}
              exerciseLibrary={exerciseLibrary}
              userRoutines={userRoutines}
              onAdd={onAddExerciseToWorkout}
              isAdded={isAdded}
              onAddToRoutine={handleAddOneToRoutine}
              onRemoveFromWorkout={onRemoveExerciseFromWorkout}
              onRemoveFromRoutine={onRemoveExerciseFromRoutine}
            />
          );
        }
        return <div key={idx}>{renderMarkdownText(segment.content, exerciseLibrary)}</div>;
      })}

      {/* Add All floating bar */}
      {(addableExercises.length > 0 && onAddExerciseToWorkout) || (matchedExercises.length > 0 && onAddExercisesToRoutine) ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-2 mt-4 mx-1 flex gap-2"
        >
          {addableExercises.length > 0 && onAddExerciseToWorkout && (
            <button
              onClick={handleAddAll}
              className="flex-1 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600
                       text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 text-xs
                       hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              <ListChecks size={16} />
              一键添加全部 {addableExercises.length} 个动作到训练
              <ChevronRight size={14} />
            </button>
          )}
          {matchedExercises.length > 0 && onAddExercisesToRoutine && (
            <button
              onClick={openPickerForAll}
              className="flex-1 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600
                       text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 text-xs
                       hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              <ListPlus size={16} />
              全部存为 Routine
            </button>
          )}
        </motion.div>
      ) : null}

      {allAdded && allExercises.length > 0 && (
        <div className="mt-3 py-2 flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
          <CheckCircle2 size={14} />
          所有推荐动作已添加到训练
        </div>
      )}

      {/* Routine picker */}
      <RoutinePickerModal
        open={pickerExercises !== null}
        exerciseCount={pickerExercises?.length ?? 0}
        routines={userRoutines}
        onSelect={handlePickerSelect}
        onClose={() => setPickerExercises(null)}
      />
    </div>
  );
};

export default AIMessageContent;
