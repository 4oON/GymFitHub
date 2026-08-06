import { useEffect, useCallback } from 'react';

/**
 * useBodyScrollLock Hook
 * 
 * Locks body scroll when modal is open - essential for iOS WebView
 * to prevent background scrolling while modal is active.
 * 
 * iOS specific issues fixed:
 * 1. Prevents body scroll when modal is open
 * 2. Preserves scroll position
 * 3. Handles iOS Safari bottom bar
 * 4. Restores scroll on unmount
 */
export function useBodyScrollLock(isLocked: boolean) {
  const lockScroll = useCallback(() => {
    const body = document.body;
    const html = document.documentElement;
    
    // Save current scroll position
    const scrollY = window.scrollY;
    
    // Apply lock styles
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    
    // iOS specific: prevent elastic scrolling
    html.style.overflow = 'hidden';
    html.style.touchAction = 'none';
    
    // Store scroll position for restoration
    body.dataset.scrollY = String(scrollY);
    
    return scrollY;
  }, []);

  const unlockScroll = useCallback((scrollY: number) => {
    const body = document.body;
    const html = document.documentElement;
    
    // Remove lock styles
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.overflow = '';
    body.style.touchAction = '';
    
    html.style.overflow = '';
    html.style.touchAction = '';
    
    // Restore scroll position
    window.scrollTo(0, scrollY);
    
    delete body.dataset.scrollY;
  }, []);

  useEffect(() => {
    if (isLocked) {
      const scrollY = lockScroll();
      
      return () => {
        unlockScroll(scrollY);
      };
    }
  }, [isLocked, lockScroll, unlockScroll]);
}

export default useBodyScrollLock;
