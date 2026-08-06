import React from 'react';
import { useAdaptiveHeight } from '@/shared/hooks/useAdaptiveHeight';

interface AdaptiveHeightContainerProps {
    /** Child components */
    children: React.ReactNode;
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
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: React.CSSProperties;
    /** Callback when animation starts */
    onAnimationStart?: () => void;
    /** Callback when animation ends */
    onAnimationEnd?: () => void;
}

/**
 * Container component with adaptive height animations
 * Automatically animates height changes when content changes
 */
const AdaptiveHeightContainer: React.FC<AdaptiveHeightContainerProps> = ({
    children,
    duration = 300,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight = 0,
    maxHeight = Infinity,
    animateOnMount = true,
    className = '',
    style = {},
    onAnimationStart,
    onAnimationEnd,
}) => {
    const {
        containerRef,
        height,
        isAnimating,
    } = useAdaptiveHeight({
        duration,
        easing,
        minHeight,
        maxHeight,
        animateOnMount,
        onAnimationStart,
        onAnimationEnd,
    });

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden transition-all ${isAnimating ? 'pointer-events-none' : ''} ${className}`}
            style={{
                height: `${height}px`,
                transition: `height ${duration}ms ${easing}`,
                ...style,
            }}
        >
            <div className="w-full">
                {children}
            </div>
        </div>
    );
};

export default AdaptiveHeightContainer;

/**
 * @example
 * // Basic usage
 * <AdaptiveHeightContainer>
 *   <div>Content that changes height</div>
 * </AdaptiveHeightContainer>
 *
 * @example
 * // With custom animation settings
 * <AdaptiveHeightContainer
 *   duration={500}
 *   easing="ease-in-out"
 *   minHeight={100}
 *   maxHeight={500}
 *   animateOnMount={false}
 *   onAnimationStart={() => console.log('Animation started')}
 *   onAnimationEnd={() => console.log('Animation ended')}
 * >
 *   <DynamicContent />
 * </AdaptiveHeightContainer>
 *
 * @example
 * // With custom styling
 * <AdaptiveHeightContainer
 *   className="bg-slate-900 rounded-xl border border-slate-700"
 *   style={{ padding: '1rem' }}
 * >
 *   <CollapsibleSection />
 * </AdaptiveHeightContainer>
 */