import { useEffect, useRef } from 'react';

// Module-level singleton state
let isScrolling = false;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach(fn => fn());
}

function handleScroll() {
    if (!isScrolling) {
        isScrolling = true;
        notify();
    }
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
        isScrolling = false;
        scrollTimer = null;
        notify();
    }, 150);
}

/**
 * Returns a ref that tracks whether the user is actively scrolling.
 *
 * The ref is updated synchronously on scroll/stop so observer callbacks
 * can read it without triggering React re-renders.
 *
 * Uses a module-level singleton — only one scroll listener is added
 * regardless of how many components subscribe.
 */
export function useScrollState(): { isScrollingRef: React.MutableRefObject<boolean> } {
    const isScrollingRef = useRef(isScrolling);

    useEffect(() => {
        // Sync the ref to the module-level value whenever the listener fires
        const callback = () => {
            isScrollingRef.current = isScrolling;
        };
        listeners.add(callback);

        if (listeners.size === 1) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            listeners.delete(callback);
            if (listeners.size === 0) {
                window.removeEventListener('scroll', handleScroll);
                if (scrollTimer) {
                    clearTimeout(scrollTimer);
                    scrollTimer = null;
                }
            }
        };
    }, []);

    return { isScrollingRef };
}
