import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { TimerState } from '@/shared/types';
import { Check, Plus, GripVertical } from 'lucide-react';

interface ActiveTimerData {
    targetTime: number;
    startTime: number;
    duration: number;
    exerciseName: string;
}

interface GlobalTimerProps {
    activeTimers: TimerState;
    onToggleTimer: (exerciseId: string, duration: number, forceStart?: boolean, exerciseName?: string) => void;
    onFinishTimer: (exerciseId: string) => void;
}

const TIMER_COLORS = [
    { bg: 'bg-emerald-500', text: 'text-emerald-400', rgb: '16,185,129' },
    { bg: 'bg-blue-500', text: 'text-blue-400', rgb: '59,130,246' },
    { bg: 'bg-purple-500', text: 'text-purple-400', rgb: '168,85,247' },
    { bg: 'bg-rose-500', text: 'text-rose-400', rgb: '244,63,94' },
    { bg: 'bg-amber-500', text: 'text-amber-400', rgb: '245,158,11' },
];

const GlobalTimer: React.FC<GlobalTimerProps> = ({
    activeTimers,
    onToggleTimer,
    onFinishTimer
}) => {
    const [now, setNow] = useState(Date.now());
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState<'left' | 'right'>('right');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
    const dragStartTime = useRef<number>(0);

    // 所有 hooks 必须在条件判断之前调用
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const timersList = useMemo(() => {
        return Object.entries(activeTimers).map(([id, value], index) => {
            const data = value as ActiveTimerData;
            const remaining = Math.max(0, Math.ceil((data.targetTime - now) / 1000));
            const elapsed = Math.max(0, now - data.startTime);
            const totalDuration = data.duration * 1000;
            const progress = Math.min(1, elapsed / totalDuration);
            return {
                id,
                ...data,
                remaining,
                progress,
                color: TIMER_COLORS[index % TIMER_COLORS.length]
            };
        }).filter(t => t.remaining > 0).sort((a, b) => a.remaining - b.remaining);
    }, [activeTimers, now]);

    const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        dragStartTime.current = Date.now();
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
        setDragCurrent({ x: clientX, y: clientY });
    }, []);

    const handleDragMove = useCallback((e: TouchEvent | MouseEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragCurrent({ x: clientX, y: clientY });
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        const dragDuration = Date.now() - dragStartTime.current;
        const deltaX = dragCurrent.x - dragStart.x;
        const distance = Math.abs(deltaX);
        
        setIsDragging(false);
        
        if (dragDuration < 200 && distance < 10) {
            setIsMinimized(prev => !prev);
            return;
        }
        
        if (distance > 30) {
            setPosition(deltaX > 0 ? 'right' : 'left');
        }
    }, [isDragging, dragCurrent, dragStart]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: true });
            window.addEventListener('touchend', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                window.removeEventListener('touchmove', handleDragMove);
                window.removeEventListener('touchend', handleDragEnd);
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // 🆕 所有 hooks 调用完成后，才进行条件渲染
    if (timersList.length === 0) return null;

    const mainTimer = timersList[0];
    const otherTimers = timersList.slice(1);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div
            className={`fixed bottom-24 ${position}-2 z-[9999] transition-transform duration-200 ${
                isDragging ? 'scale-105' : ''
            }`}
            style={{
                transform: isDragging ? `translate(${dragCurrent.x - dragStart.x}px, 0)` : 'translate(0, 0)',
            }}
        >
            <div 
                className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden"
                style={{ width: isMinimized ? '100px' : '180px' }}
            >
                {/* 沙漏式进度条 - 从底部向上填充 */}
                <div 
                    className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-linear"
                    style={{
                        height: `${mainTimer.progress * 100}%`,
                        backgroundColor: `rgba(${mainTimer.color.rgb}, 0.2)`,
                    }}
                >
                    {/* 进度条顶部的发光边缘 */}
                    <div 
                        className="absolute top-0 left-0 right-0 h-0.5"
                        style={{
                            backgroundColor: `rgb(${mainTimer.color.rgb})`,
                            boxShadow: `0 0 8px 2px rgba(${mainTimer.color.rgb}, 0.6)`,
                        }}
                    />
                </div>

                {/* 其他计时器的进度标记 */}
                {otherTimers.map((timer) => (
                    <div
                        key={timer.id}
                        className="absolute left-0 right-0 h-0.5"
                        style={{
                            bottom: `${timer.progress * 100}%`,
                            backgroundColor: `rgb(${timer.color.rgb})`,
                            opacity: 0.6,
                            zIndex: 5,
                        }}
                    />
                ))}

                {/* 内容层 */}
                <div className="relative z-10">
                    {isMinimized ? (
                        <div 
                            className="flex items-center justify-center gap-1 py-2 px-2 cursor-pointer"
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        >
                            <GripVertical size={12} className="text-slate-500" />
                            <span className={`text-lg font-black font-mono ${
                                mainTimer.remaining <= 5 ? 'text-rose-400 animate-pulse' : 'text-white'
                            }`}>
                                {formatTime(mainTimer.remaining)}
                            </span>
                        </div>
                    ) : (
                        <div className="p-2.5">
                            {/* 头部：拖拽手柄 + 时间 + 最小化按钮 */}
                            <div className="flex items-center justify-between mb-1.5">
                                <div 
                                    className="flex items-center gap-1 cursor-grab active:cursor-grabbing"
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                >
                                    <GripVertical size={12} className="text-slate-500" />
                                    <span className={`text-xl font-black font-mono ${
                                        mainTimer.remaining <= 5 ? 'text-rose-400 animate-pulse' : 'text-white'
                                    }`}>
                                        {formatTime(mainTimer.remaining)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="text-slate-500 hover:text-slate-300 text-xs px-1"
                                >
                                    −
                                </button>
                            </div>

                            {/* 动作名 */}
                            <div className="text-xs font-medium text-slate-300 mb-2 truncate">
                                {mainTimer.exerciseName}
                            </div>

                            {/* 其他计时器 */}
                            {otherTimers.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {otherTimers.slice(0, 3).map((timer) => (
                                        <div 
                                            key={timer.id} 
                                            className="flex items-center gap-1 text-[10px] bg-slate-800/60 px-1.5 py-0.5 rounded"
                                        >
                                            <div 
                                                className="w-1 h-1 rounded-full"
                                                style={{ backgroundColor: `rgb(${timer.color.rgb})` }}
                                            />
                                            <span className={`font-mono font-bold ${timer.color.text}`}>
                                                {formatTime(timer.remaining)}
                                            </span>
                                        </div>
                                    ))}
                                    {otherTimers.length > 3 && (
                                        <span className="text-[10px] text-slate-500">+{otherTimers.length - 3}</span>
                                    )}
                                </div>
                            )}

                            {/* 按钮 */}
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => onToggleTimer(mainTimer.id, mainTimer.duration + 30, true, mainTimer.exerciseName)}
                                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95"
                                >
                                    <Plus size={10} /> 30s
                                </button>
                                <button
                                    onClick={() => onFinishTimer(mainTimer.id)}
                                    className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95"
                                >
                                    <Check size={10} strokeWidth={3} />
                                    DONE
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalTimer;
