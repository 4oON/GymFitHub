import React, { useState, useEffect, type ReactNode } from 'react';

interface SwipeableCardProps {
    children: ReactNode;
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    onDragUpdate?: (dx: number, isActive: boolean) => void;
    className?: string;
    swipeThreshold?: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
    children,
    onSwipeRight,
    onSwipeLeft,
    onDragUpdate,
    className = '',
    swipeThreshold = 40
}) => {
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Global mouseup listener
    useEffect(() => {
        if (!isDragging) return;

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (!startPos) return;

            const dx = e.clientX - startPos.x;
            const dy = Math.abs(e.clientY - startPos.y);

            console.log('🟢 Global Mouse Up:', { dx, dy });
            handleSwipe(dx, dy);

            setStartPos(null);
            setIsDragging(false);
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging, startPos]);

    // Touch Events
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setStartPos({ x: touch.clientX, y: touch.clientY });
        console.log('🔵 Touch Start:', touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startPos) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startPos.x;
        if (onDragUpdate) onDragUpdate(dx, true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!startPos) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - startPos.x;
        const dy = Math.abs(touch.clientY - startPos.y);

        console.log('🟢 Touch End:', { dx, dy });
        handleSwipe(dx, dy);
        setStartPos(null);
    };

    // Mouse Events
    const handleMouseDown = (e: React.MouseEvent) => {
        setStartPos({ x: e.clientX, y: e.clientY });
        setIsDragging(true);
        console.log('🖱️ Mouse Down:', e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !startPos) return;
        const dx = e.clientX - startPos.x;

        if (onDragUpdate) onDragUpdate(dx, true);

        if (Math.abs(dx) > 10) {
            console.log('🟡 Dragging:', dx);
        }
    };

    // Common swipe detection logic
    const handleSwipe = (dx: number, dy: number) => {
        console.log('🎯 handleSwipe called:', { dx, dy, threshold: swipeThreshold });

        if (onDragUpdate) onDragUpdate(0, false);

        if (dy < 100) {
            if (dx > swipeThreshold) {
                console.log('✅ RIGHT SWIPE DETECTED! dx=' + dx);
                onSwipeRight?.();
            } else if (dx < -swipeThreshold) {
                console.log('✅ LEFT SWIPE DETECTED! dx=' + dx);
                onSwipeLeft?.();
            } else {
                console.log('⚪ Swipe too short:', dx, 'threshold:', swipeThreshold);
            }
        } else {
            console.log('⚪ Too much vertical movement:', dy);
        }
    };

    return (
        <div
            className={className}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
            {children}
        </div>
    );
};

export default SwipeableCard;