import React, { useState, useEffect, useRef, type ReactNode } from 'react';

interface SwipeableCardProps {
    children: ReactNode;
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    onDragUpdate?: (dx: number, isActive: boolean) => void;
    className?: string;
    swipeThreshold?: number;
}

/**
 * Gesture exclusion zones: any descendant with `data-swipe-ignore`
 * (horizontal scrollers, number inputs, etc.) opts out of card swipe,
 * so inner controls never fight the card's open/close gesture.
 */
const isIgnoredTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement && target.closest('[data-swipe-ignore]') !== null;

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
    const ignoreGesture = useRef(false);

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
        if (isIgnoredTarget(e.target)) {
            ignoreGesture.current = true;
            return;
        }
        ignoreGesture.current = false;
        const touch = e.touches[0];
        setStartPos({ x: touch.clientX, y: touch.clientY });
        console.log('🔵 Touch Start:', touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (ignoreGesture.current || !startPos) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startPos.x;
        if (onDragUpdate) onDragUpdate(dx, true);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (ignoreGesture.current) {
            ignoreGesture.current = false;
            return;
        }
        if (!startPos) return;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - startPos.x;
        const dy = Math.abs(touch.clientY - startPos.y);

        console.log('🟢 Touch End:', { dx, dy });
        handleSwipe(dx, dy);
        setStartPos(null);
    };

    // iOS takes over the gesture for inner scrolling and fires touchcancel;
    // without this the card could stay stuck mid-drag or mis-fire on the next tap.
    const handleTouchCancel = () => {
        ignoreGesture.current = false;
        setStartPos(null);
        if (onDragUpdate) onDragUpdate(0, false);
    };

    // Mouse Events
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isIgnoredTarget(e.target)) {
            ignoreGesture.current = true;
            return;
        }
        ignoreGesture.current = false;
        setStartPos({ x: e.clientX, y: e.clientY });
        setIsDragging(true);
        console.log('🖱️ Mouse Down:', e.clientX, e.clientY);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (ignoreGesture.current || !isDragging || !startPos) return;
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
            onTouchCancel={handleTouchCancel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
            {children}
        </div>
    );
};

export default SwipeableCard;