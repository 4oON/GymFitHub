# Video Lazy Loading Strategy — Reusable Skill Backup

> This is a git-committed backup of the `video-lazy-loading` skill.
> The live/editable copy lives in `.claude/skills/video-lazy-loading/SKILL.md` (local only).
> If that file is lost, restore it from here.

## When to Use

Building exercise/video card lists with autoplay previews — or porting this pattern to
another tech stack (iOS/Swift, Flutter). Solves iOS WebView videos never loading, too many
concurrent loads, and off-screen video waste.

## The 4 Pillars

1. **Deferred `src`** — don't set `video.src` until the element intersects viewport.
   `src={shouldLoad ? videoUrl : undefined}`. Zero bytes before that. Sidesteps the iOS
   `preload="none"` bug entirely (no src yet, so preload never blocks).
2. **Scroll-aware pause** — global `isScrolling` boolean (module singleton, 150ms debounce).
   While scrolling: pause everything. Scroll stops: play only visible.
3. **One shared observer** — module singleton `IntersectionObserver` + `Map<Element, callback>`.
   `threshold: 0.1, rootMargin: '150px'`. Never one observer per card.
4. **Concurrency limit** — module-level play queue capped at 3. Release slot when video
   leaves viewport.

## Reference Implementation

Complete working code in `frontend/src/shared/video/`:
- `useScrollState.ts` — global `isScrolling` singleton, returns `MutableRefObject<boolean>`
- `useSharedIntersectionObserver.ts` — shared observer singleton, returns callback ref
- `VideoPlayer.tsx` — deferred src + scroll-aware + concurrency queue
- `README.md` — full architecture doc

## Component Props

| Prop | Default | Use |
|------|---------|-----|
| `lazy` | `true` | scrollable lists |
| `controls` | `false` | manual-play scenarios (logger) |
| `autoPlay` | `true` | set `false` for manual contexts |

## Porting Matrix

| Principle | Web (React) | iOS/Swift | Flutter |
|-----------|-------------|-----------|---------|
| No source until visible | deferred `src` | don't set `AVPlayerItem` until scroll stop + onAppear | `ListView.builder` + `VisibilityDetector` |
| Pause during scroll | `isScrollingRef` | `scrollViewDidScroll` → pause, `scrollViewDidEndDecelerating` → resume | `ScrollController` listener |
| Shared observer | singleton `IntersectionObserver` | shared `AVPlayer` pool / prefetch | one `ScrollController` |
| Concurrency cap | module queue (3) | `AVPlayer` reuse pool | `VideoPlayerController` pool |

## Do's and Don'ts

- DO read `isScrolling` via a ref, not React state (observer callbacks are DOM callbacks, no re-render).
- DO keep the concurrency queue module-level (all players share it).
- DO NOT use `preload="none"` on iOS expecting lazy load — it blocks all downloads.
- DO NOT create one `IntersectionObserver` per card.
- If videos move to local/bundled assets later: concurrency limit matters MORE (local files flood the decoder), preload can be `auto`, rootMargin can shrink.
