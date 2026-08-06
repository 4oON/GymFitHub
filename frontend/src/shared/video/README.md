# Video Lazy Loading Strategy — Kilo ZenFit

## Problem Statement

A fitness app with scrollable exercise lists where each card has an autoplay video preview. On iOS WebView, `preload="none"` prevents any data download, and existing per-instance `IntersectionObserver` setups cause:

1. **iOS videos never load** unless user taps — `preload="none"` → `readyState === 0` → `tryPlay()` guard skips
2. **N observers for N cards** — each `VideoPlayer` creates its own `IntersectionObserver`, wasting resources
3. **Scroll doesn't stop loading** — flinging past 30 cards triggers 30 concurrent video loads/plays
4. **Off-screen videos keep playing** — bandwidth and CPU wasted on invisible videos

## Architecture

Three self-contained modules in `frontend/src/shared/video/`. They are framework-coupled (React) but the **strategy** is platform-agnostic.

```
shared/video/
├── useScrollState.ts              # Global scroll detection (singleton)
├── useSharedIntersectionObserver.ts  # Single shared observer (singleton)
├── VideoPlayer.tsx                # The player component
└── README.md                      # This file
```

### 1. `useScrollState` — Scroll Detection Singleton

**Design decision: module-level singleton, not Context.**

A React Context would re-render every consumer on every scroll event — unacceptable when 50+ video cards are mounted. Instead:

- Module-level `let isScrolling: boolean` + `Set<() => void>` for subscribers
- One `window.addEventListener('scroll', ..., { passive: true })` for the entire app
- 150ms debounce: `isScrolling` stays `true` during rapid scroll, flips to `false` after the user stops
- Returns `MutableRefObject<boolean>` — observer callbacks read `.current` without triggering React renders

**Key insight:** The ref is the perf trick. Observer callbacks are DOM callbacks, not React render cycles — they only need the value, not a re-render.

### 2. `useSharedIntersectionObserver` — Single Observer

**Design decision: module-level singleton Map<Element, callback>.**

Instead of N observers, one shared `IntersectionObserver` with:
- `threshold: 0.1` — fires when 10% of element is visible
- `rootMargin: '150px'` — expands observed area by 150px in all directions, so videos begin loading *before* they scroll into view

Returns a callback ref (`(node: Element | null) => void`) — standard React pattern for when a component needs to both hold a ref AND notify external systems when the element mounts/unmounts.

### 3. `VideoPlayer` — The Consuming Component

Four integrated behaviors:

#### 3a. Deferred `src` (fixes iOS)
- `shouldLoad` state starts `false` for lazy mode
- Observer fires → `isIntersecting && !isScrolling` → `setShouldLoad(true)` → `<video src={videoUrl}>`
- Before this point: `<video src={undefined}>` — browser downloads zero bytes
- This sidesteps the iOS `preload="none"` issue entirely: we don't use `preload="none"`, we use "no src at all"

#### 3b. Scroll-aware play/pause
- Observer callback checks `isScrollingRef.current`:
  - **Scroll stopped + visible** → `setShouldLoad(true)` + 100ms debounce → `tryPlay()`
  - **Scrolling + visible** → pause video, keep `src` loaded
  - **Not visible** → `video.pause()` + `releasePlay()`

#### 3c. Concurrency limit (max 3)
- Module-level `requestPlay(video, fn)` / `releasePlay(video)` queue
- If 3 videos already playing, new `tryPlay` goes into pending queue
- When a video pauses or leaves viewport, `releasePlay` dequeues the next one
- Prevents bandwidth/CPU saturation in grid layouts

#### 3d. Props for different contexts
| Prop | Default | Use case |
|------|---------|----------|
| `lazy={true}` | default | Scrollable exercise lists |
| `lazy={false}` | — | Expanded info panel, modal |
| `controls={true}` | `false` | WorkoutLogger (manual play) |
| `autoPlay={false}` | `true` | Manual-control scenarios |

## Why This Strategy Is Platform-Agnostic

The principles apply to Swift/SwiftUI, Flutter, Kotlin, or any framework:

| Principle | Web (this impl) | iOS/Swift | Flutter |
|-----------|----------------|-----------|---------|
| Don't set source until visible | Deferred `src` via state | Don't set `AVPlayerItem` until `onAppear` + scroll stop | `ListView.builder` + `VisibilityDetector` |
| Pause during scroll | `isScrollingRef` check | `scrollViewDidScroll` → pause all, `scrollViewDidEndDecelerating` → resume visible | `ScrollController.addListener` |
| Shared observer | Singleton `IntersectionObserver` | One `CADisplayLink` or shared `UITableView` prefetch | One `ScrollController` |
| Limit concurrent plays | Module-level queue (max 3) | `AVPlayer` pool with reuse | `VideoPlayerController` pool |

## Future: Local/Bundled Videos

If videos move from remote URLs to local/bundled assets:
- The deferred `src` and scroll-aware logic still applies
- Concurrency limit becomes **more** important (local files load instantly — even easier to flood the decoder)
- Preload can switch to `preload="auto"` since there's no bandwidth concern
- The observer's `rootMargin` can shrink since local loading is instant

## Files That Consume VideoPlayer

- `HeroExerciseCard.tsx` — primary exercise cards (lazy)
- `RecommendedExerciseCard.tsx` — coach recommendation cards (lazy)
- `RoutineBuilder.tsx` — routine thumbnails (lazy)
- `AICustomRoutineCard.tsx` — AI routine exercise rows (lazy)
- `AIMessageContent.tsx` — chat exercise embeds (lazy)
- `AIMessageContent.tsx` — chat modal video preview (non-lazy)
- `InProgressWorkout.tsx` — expanded workout info (non-lazy)
- `WorkoutLogger.tsx` — manual play with controls (non-lazy, controls)
