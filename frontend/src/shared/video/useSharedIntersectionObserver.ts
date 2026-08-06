import { useCallback, useEffect, useRef } from 'react';

type ObserverCallback = (entry: IntersectionObserverEntry) => void;

// Module-level singleton
const observerMap = new Map<Element, ObserverCallback>();
let sharedObserver: IntersectionObserver | null = null;

const DEFAULT_OPTIONS: IntersectionObserverInit = {
    threshold: 0.1,
    // 150px rootMargin means videos start loading slightly before
    // they enter the viewport, improving perceived performance.
    rootMargin: '150px',
};

function getObserver(): IntersectionObserver {
    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const cb = observerMap.get(entry.target);
                    if (cb) cb(entry);
                }
            },
            DEFAULT_OPTIONS
        );
    }
    return sharedObserver;
}

function register(element: Element, callback: ObserverCallback): void {
    observerMap.set(element, callback);
    getObserver().observe(element);
}

function unregister(element: Element): void {
    observerMap.delete(element);
    getObserver().unobserve(element);
    // Clean up the shared observer if nothing is observing
    if (observerMap.size === 0 && sharedObserver) {
        sharedObserver.disconnect();
        sharedObserver = null;
    }
}

/**
 * Shared IntersectionObserver hook.
 *
 * Instead of each component creating its own observer, all components
 * share a single observer instance via a module-level singleton.
 *
 * @param callback - Called whenever the observed element's intersection changes.
 *   Receives the full IntersectionObserverEntry.
 * @returns A callback ref to attach to the element you want to observe.
 *
 * Usage:
 * ```tsx
 * const observeRef = useSharedIntersectionObserver((entry) => {
 *   if (entry.isIntersecting) doSomething();
 * });
 * return <div ref={observeRef}>...</div>;
 * ```
 */
export function useSharedIntersectionObserver(
    callback: ObserverCallback
): (node: Element | null) => void {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    // Track the currently observed element so we can unregister on cleanup
    const observedRef = useRef<Element | null>(null);

    useEffect(() => {
        return () => {
            if (observedRef.current) {
                unregister(observedRef.current);
                observedRef.current = null;
            }
        };
    }, []);

    const refCallback = useCallback((node: Element | null) => {
        // Unregister previous element if any
        if (observedRef.current) {
            unregister(observedRef.current);
            observedRef.current = null;
        }

        if (node) {
            const wrappedCallback: ObserverCallback = (entry) => {
                callbackRef.current(entry);
            };
            register(node, wrappedCallback);
            observedRef.current = node;
        }
    }, []);

    return refCallback;
}
