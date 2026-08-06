import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useScrollState } from './useScrollState';
import { useSharedIntersectionObserver } from './useSharedIntersectionObserver';

// Module-level concurrency limiter — caps how many videos can be playing at once.
const MAX_CONCURRENT_PLAYS = 3;
let activePlayCount = 0;
const pendingQueue: Array<{ video: HTMLVideoElement; play: () => void }> = [];

function requestPlay(video: HTMLVideoElement, playFn: () => void) {
    if (activePlayCount < MAX_CONCURRENT_PLAYS) {
        activePlayCount++;
        playFn();
    } else {
        pendingQueue.push({ video, play: playFn });
    }
}

function releasePlay(video: HTMLVideoElement) {
    // Remove this video from pending queue if it's waiting
    const idx = pendingQueue.findIndex(p => p.video === video);
    if (idx !== -1) {
        pendingQueue.splice(idx, 1);
        return;
    }
    activePlayCount = Math.max(0, activePlayCount - 1);
    // Wake next in queue
    const next = pendingQueue.shift();
    if (next) {
        activePlayCount++;
        next.play();
    }
}

interface VideoPlayerProps {
    videoUrl: string;
    className?: string;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    /** Enable lazy loading for scrollable lists. Videos only load when visible and scroll has stopped. */
    lazy?: boolean;
    /** Preload strategy. 'metadata' loads the first frame without full download. */
    preload?: 'none' | 'metadata' | 'auto';
    /** Show native video controls (for manual-play scenarios like WorkoutLogger). */
    controls?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    className = '',
    autoPlay = true,
    loop = true,
    muted = true,
    lazy = true,
    preload,
    controls = false,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(!lazy);
    const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resolvedPreload = preload ?? (lazy ? 'metadata' : 'metadata');
    const { isScrollingRef } = useScrollState();

    const tryPlay = useCallback(() => {
        const video = videoRef.current;
        if (!video || !autoPlay || video.ended) return;
        if (video.readyState >= 2) {
            // HAVE_CURRENT_DATA or higher — enough to show a frame and play
            requestPlay(video, () => {
                video.play().catch(() => {});
            });
        } else if (video.readyState === 0) {
            // HAVE_NOTHING — trigger load (iOS workaround for deferred src)
            video.load();
        }
        // If readyState === 1 (HAVE_METADATA), wait for 'canplay' to call tryPlay again
    }, [autoPlay]);

    // Shared intersection observer callback
    const handleIntersection = useCallback((entry: IntersectionObserverEntry) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
            if (!isScrollingRef.current) {
                // Scroll stopped — load and play
                setShouldLoad(true);
                // Small debounce to avoid rapid-fire during micro-adjustments
                if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
                loadTimerRef.current = setTimeout(() => {
                    tryPlay();
                }, 100);
            } else {
                // Still scrolling — pause if playing, but keep src loaded
                if (!video.paused) {
                    video.pause();
                }
            }
        } else {
            // Left viewport entirely — pause to save resources
            if (!video.paused) {
                video.pause();
                releasePlay(video);
            }
            // Cancel any pending load timer
            if (loadTimerRef.current) {
                clearTimeout(loadTimerRef.current);
                loadTimerRef.current = null;
            }
        }
    }, [isScrollingRef, tryPlay]);

    const observeRef = useSharedIntersectionObserver(
        lazy ? handleIntersection : (() => {})
    );

    // Wire up the shared observer and event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // iOS / WeChat inline playback attributes
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('x5-playsinline', 'true');
        video.setAttribute('x5-video-player-type', 'h5');
        video.setAttribute('x5-video-player-fullscreen', 'false');
        video.setAttribute('x5-video-orientation', 'portrait');
        video.muted = true;
        video.defaultMuted = true;
        if (autoPlay) video.setAttribute('autoplay', 'true');
        video.disablePictureInPicture = true;

        const handleError = () => setError(true);
        const handleReady = () => tryPlay();

        video.addEventListener('error', handleError);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('loadedmetadata', handleReady);

        // In case the video is already ready (cached), try to play immediately.
        if (!lazy || shouldLoad) {
            tryPlay();
        }

        if (lazy) {
            observeRef(video);
        }

        return () => {
            video.removeEventListener('error', handleError);
            video.removeEventListener('canplay', handleReady);
            video.removeEventListener('loadedmetadata', handleReady);
            releasePlay(video);
            if (loadTimerRef.current) {
                clearTimeout(loadTimerRef.current);
            }
            if (lazy) {
                observeRef(null);
            }
        };
    }, [autoPlay, lazy, videoUrl, tryPlay, observeRef, shouldLoad]);

    const handleVideoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            if (video.paused) {
                requestPlay(video, () => {
                    video.play().catch(() => {});
                });
            } else {
                video.pause();
                releasePlay(video);
            }
        }
    };

    if (error || !videoUrl) {
        return (
            <div className={`bg-slate-800 rounded-lg flex items-center justify-center ${className}`}>
                <p className="text-slate-500 text-sm">Video unavailable</p>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full ${className}`} style={{ position: 'relative', overflow: 'hidden' }}>
            <video
                ref={videoRef}
                src={shouldLoad ? videoUrl : undefined}
                autoPlay={autoPlay}
                loop={loop}
                muted={muted}
                playsInline
                controls={controls}
                preload={resolvedPreload}
                className="w-full h-full object-cover"
                onClick={handleVideoClick}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    backgroundColor: '#0f172a',
                }}
            />
        </div>
    );
};

export default VideoPlayer;
