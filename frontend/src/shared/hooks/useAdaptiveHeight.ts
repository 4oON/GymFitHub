import React, { useState, useEffect, useRef, useCallback } from 'react';

interface UseAdaptiveHeightOptions {
    /** Animation duration in milliseconds */
    duration?: number;
    /** Animation easing function */
    easing?: string;
    /** Minimum height in pixels */
    minHeight?: number;
    /** Maximum height in pixels */
    maxHeight?: number;
    /** Whether to animate on mount */
    animateOnMount?: boolean;
    /** Callback when animation starts */
    onAnimationStart?: () => void;
    /** Callback when animation ends */
    onAnimationEnd?: () => void;
}

interface UseAdaptiveHeightReturn {
    /** Ref to attach to the container element */
    containerRef: React.RefObject<HTMLDivElement>;
    /** Current animated height */
    height: number;
    /** Whether animation is currently running */
    isAnimating: boolean;
    /** Manually trigger height recalculation */
    recalculateHeight: () => void;
    /** Set a specific height */
    setTargetHeight: (height: number) => void;
    /** Reset to auto height */
    resetToAuto: () => void;
}

/**
 * Custom hook for adaptive height animations
 * Automatically animates height changes when content changes
 */
export const useAdaptiveHeight = (options: UseAdaptiveHeightOptions = {}): UseAdaptiveHeightReturn => {
    const {
        duration = 300,
        easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight = 0,
        maxHeight = Infinity,
        animateOnMount = true,
        onAnimationStart,
        onAnimationEnd,
    } = options;

    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number>(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [targetHeight, setTargetHeightState] = useState<number | null>(null);
    const animationRef = useRef<number>();
    const resizeObserverRef = useRef<ResizeObserver>();

    // Calculate the natural height of the content
    const calculateNaturalHeight = useCallback((): number => {
        if (!containerRef.current) return 0;

        // Temporarily set height to auto to measure natural height
        const originalHeight = containerRef.current.style.height;
        const originalOverflow = containerRef.current.style.overflow;

        containerRef.current.style.height = 'auto';
        containerRef.current.style.overflow = 'visible';

        const naturalHeight = containerRef.current.scrollHeight;

        // Restore original styles
        containerRef.current.style.height = originalHeight;
        containerRef.current.style.overflow = originalOverflow;

        // Apply min/max constraints
        return Math.max(minHeight, Math.min(maxHeight, naturalHeight));
    }, [minHeight, maxHeight]);

    // Animate to a specific height
    const animateToHeight = useCallback((newHeight: number) => {
        if (!containerRef.current || height === newHeight) return;

        // Cancel any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        setIsAnimating(true);
        onAnimationStart?.();

        const startHeight = height;
        const heightDiff = newHeight - startHeight;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Apply easing function (simplified cubic-bezier)
            const easedProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            const currentHeight = startHeight + (heightDiff * easedProgress);
            setHeight(currentHeight);

            if (containerRef.current) {
                containerRef.current.style.height = `${currentHeight}px`;
            }

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
                onAnimationEnd?.();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [height, duration, onAnimationStart, onAnimationEnd]);

    // Recalculate and animate to new height
    const recalculateHeight = useCallback(() => {
        const newHeight = targetHeight ?? calculateNaturalHeight();
        animateToHeight(newHeight);
    }, [calculateNaturalHeight, animateToHeight, targetHeight]);

    // Set a specific target height
    const setTargetHeight = useCallback((newTargetHeight: number) => {
        const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newTargetHeight));
        setTargetHeightState(constrainedHeight);
        animateToHeight(constrainedHeight);
    }, [animateToHeight, minHeight, maxHeight]);

    // Reset to auto height (natural content height)
    const resetToAuto = useCallback(() => {
        setTargetHeightState(null);
        recalculateHeight();
    }, [recalculateHeight]);

    // Set up ResizeObserver to watch for content changes
    useEffect(() => {
        if (!containerRef.current) return;

        resizeObserverRef.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Only recalculate if we're not manually controlling height
                if (targetHeight === null) {
                    const newHeight = calculateNaturalHeight();
                    if (Math.abs(newHeight - height) > 1) { // Avoid micro-adjustments
                        animateToHeight(newHeight);
                    }
                }
            }
        });

        // Observe the container's children for size changes
        const children = Array.from(containerRef.current.children);
        children.forEach(child => {
            if (child instanceof HTMLElement) {
                resizeObserverRef.current?.observe(child);
            }
        });

        return () => {
            resizeObserverRef.current?.disconnect();
        };
    }, [calculateNaturalHeight, animateToHeight, height, targetHeight]);

    // Initialize height on mount
    useEffect(() => {
        if (!containerRef.current) return;

        const initialHeight = calculateNaturalHeight();

        if (animateOnMount) {
            setHeight(0);
            setTimeout(() => animateToHeight(initialHeight), 50);
        } else {
            setHeight(initialHeight);
            containerRef.current.style.height = `${initialHeight}px`;
        }
    }, [calculateNaturalHeight, animateToHeight, animateOnMount]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            resizeObserverRef.current?.disconnect();
        };
    }, []);

    return {
        containerRef,
        height,
        isAnimating,
        recalculateHeight,
        setTargetHeight,
        resetToAuto,
    };
};

export default useAdaptiveHeight;