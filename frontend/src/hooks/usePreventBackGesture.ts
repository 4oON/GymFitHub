import { useEffect, useCallback } from 'react';

/**
 * Hook to prevent browser back navigation gestures (swipe back on mobile)
 * This prevents accidental logout/data loss when user swipes from left edge
 */
export function usePreventBackGesture(enabled: boolean = true) {
  const preventTouchStart = useCallback((e: TouchEvent) => {
    // Get the touch position
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    // If touch starts within 30px from left edge, it's likely a back gesture
    if (touchX < 30) {
      // Check if the touch is on a scrollable element
      const target = e.target as HTMLElement;
      const scrollableParent = findScrollableParent(target);
      
      // If there's no scrollable parent or we're at the leftmost scroll position,
      // prevent the default to stop back navigation
      if (!scrollableParent || scrollableParent.scrollLeft <= 0) {
        e.preventDefault();
      }
    }
  }, []);

  const preventMouseDown = useCallback((e: MouseEvent) => {
    // Same logic for mouse events (testing on desktop)
    if (e.clientX < 30) {
      const target = e.target as HTMLElement;
      const scrollableParent = findScrollableParent(target);
      
      if (!scrollableParent || scrollableParent.scrollLeft <= 0) {
        e.preventDefault();
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners with passive: false to allow preventDefault
    document.addEventListener('touchstart', preventTouchStart, { passive: false });
    document.addEventListener('mousedown', preventMouseDown);

    return () => {
      document.removeEventListener('touchstart', preventTouchStart);
      document.removeEventListener('mousedown', preventMouseDown);
    };
  }, [enabled, preventTouchStart, preventMouseDown]);
}

/**
 * Find the nearest scrollable parent element
 */
function findScrollableParent(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null;
  
  const style = window.getComputedStyle(element);
  const overflowX = style.overflowX;
  const overflow = style.overflow;
  
  const isScrollable = overflowX === 'auto' || 
                       overflowX === 'scroll' || 
                       overflow === 'auto' || 
                       overflow === 'scroll';
  
  if (isScrollable && element.scrollWidth > element.clientWidth) {
    return element;
  }
  
  return findScrollableParent(element.parentElement);
}
