# State Management

## Overview

react-helios manages all player state inside a single custom hook, `useVideoPlayer`. The hook deliberately avoids React Context — state is passed downward via props and callbacks flow upward via user-supplied event handlers. Internally, it uses a combination of `useState` (for state that controls rendering) and `useRef` (for state that must be readable without causing re-renders).

---

## Files

| File | Role |
|---|---|
| `src/hooks/useVideoPlayer.ts` | All player state, effects, and imperative methods |
| `src/lib/types.ts` | `PlayerState`, `VideoPlayerProps`, `VideoPlayerRef` interfaces |

---

## PlayerState Shape

```ts
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isTheaterMode: boolean;
  isBuffering: boolean;
  bufferedRanges: BufferedRange[];
  error: VideoError | null;
  isLive: boolean;
  qualityLevels: HLSQualityLevel[];
  currentQualityLevel: number;     // -1 = auto ABR
}
```

**Default values:**

```ts
const DEFAULT_STATE: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isFullscreen: false,
  isPictureInPicture: false,
  isTheaterMode: false,
  isBuffering: false,
  bufferedRanges: [],
  error: null,
  isLive: false,
  qualityLevels: [],
  currentQualityLevel: -1,
};
```

---

## Why Not Context?

React Context re-renders every component that calls `useContext` whenever the context value changes. A video player updates `currentTime` on every `timeupdate` event — up to 60 times per second. Putting `currentTime` in context would invalidate every consuming component on every frame.

Instead:

- **`currentTime`** is exposed only via the `onTimeUpdate` callback — it never enters React state at all.
- **`bufferedRanges`** are tracked inside `ProgressBar` as local state, not in the global hook.
- Everything else (`isPlaying`, `volume`, `isBuffering`, etc.) changes infrequently enough that normal React state is fine.

---

## The Stable Ref Pattern

The hook stores two parallel mirrors:

```ts
const [state, setState] = useState<PlayerState>(DEFAULT_STATE);
const stateRef = useRef(state);
stateRef.current = state;           // always in sync, but reads don't trigger effects
```

This allows imperative methods (e.g. `toggleMute`) to read the latest state without listing `state` in `useCallback` dependency arrays — which would recreate callbacks on every state change and cascade re-renders:

```ts
// Without stable ref (fragile):
const toggleMute = useCallback(() => {
  setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
}, [state]);   // recreated on EVERY state change

// With stable ref (correct):
const toggleMute = useCallback(() => {
  const video = videoRef.current;
  if (!video) return;
  video.muted = !video.muted;       // <-- reads video element, not state
  // setState fires from the "volumechange" event listener, not here
}, [videoRef]);
```

---

## Stable Options Ref

User-supplied callback props (e.g. `onPlay`, `onError`) change identity on every parent render. To avoid re-running effects when a callback is recreated:

```ts
const optionsRef = useRef(options);
optionsRef.current = options;    // updated on every render, no effect dependency
```

Effects read callbacks via `optionsRef.current.onPlay?.()` so they never list them in dependency arrays. This is a common React pattern for "stable event handler refs".

---

## State Update Paths

Each piece of state has a specific update path:

### Via React event listeners on `<video>`

All listeners are attached in the `videoRef`-change effect and call `setState`:

| Event | State updated |
|---|---|
| `play` | `isPlaying: true` |
| `pause` | `isPlaying: false` |
| `ended` | `isPlaying: false` |
| `volumechange` | `volume`, `isMuted` |
| `ratechange` | `playbackRate` |
| `durationchange` | `duration`, `isLive` |
| `waiting` | `isBuffering: true` |
| `canplay` / `playing` | `isBuffering: false` |
| `error` | `error` |
| `fullscreenchange` | `isFullscreen` |
| `enterpictureinpicture` / `leavepictureinpicture` | `isPictureInPicture` |

### Via HLS.js events

| HLS Event | State updated |
|---|---|
| `MANIFEST_PARSED` | `qualityLevels`, `currentQualityLevel: -1` |
| `LEVEL_SWITCHED` | `currentQualityLevel` |

### Via imperative methods

| Method | State updated directly |
|---|---|
| `toggleTheaterMode()` | `isTheaterMode` |
| `setQualityLevel(id)` | `currentQualityLevel` |

Theater mode has no `<video>` element event to listen to (it's a UI state), so it is set directly in the imperative method. Quality level is also set directly because HLS.js's `LEVEL_SWITCHED` fires asynchronously and the UI should respond immediately.

### Via `onTimeUpdate` callback (not state)

`currentTime` is intentionally **not** in `PlayerState`. Storing it in state would cause the entire component tree to re-render on every `timeupdate`:

```ts
const handleTimeUpdate = () => {
  optionsRef.current.onTimeUpdate?.(video.currentTime);
  // No setState — consumer updates their own state if they need it
};
```

The progress bar reads `currentTime` directly from `videoRef.current.currentTime` on each `requestAnimationFrame` tick via its own internal loop, bypassing React entirely.

---

## Memoized Imperative Ref

All control methods are defined as `useCallback` instances and collected into a single memoized object that is assigned to a `useRef`:

```ts
const playerRef = useRef<VideoPlayerRef>({} as VideoPlayerRef);

const memoizedRef = useMemo<VideoPlayerRef>(
  () => ({
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setQualityLevel,
    seekToLive,
    toggleFullscreen,
    togglePictureInPicture,
    toggleTheaterMode,
    getState: () => stateRef.current,
    getVideoElement: () => videoRef.current,
  }),
  [play, pause, seek, /* … all callbacks */],
);

useEffect(() => { playerRef.current = memoizedRef; }, [memoizedRef]);
```

Consumers access the imperative API via the forwarded `ref`:

```tsx
const playerRef = useRef<VideoPlayerRef>(null);
<VideoPlayer ref={playerRef} src="…" />
playerRef.current?.play();
```

---

## Last Volume Memory

When the user mutes, the previous volume is saved so that unmuting restores it:

```ts
const lastVolumeRef = useRef<number>(1);

const toggleMute = useCallback(() => {
  const video = videoRef.current;
  if (!video) return;
  if (video.muted) {
    video.muted = false;
    video.volume = lastVolumeRef.current || 0.5;
  } else {
    lastVolumeRef.current = video.volume;
    video.muted = true;
  }
}, [videoRef]);
```

This is a ref rather than state because it is never rendered — it is purely internal memory.

---

## Network Retry Counter

The HLS network retry counter is also a ref:

```ts
const networkRetriesRef = useRef<number>(0);
```

It increments on each retry and is reset to `0` on every `src` change (effect cleanup). It does not need to trigger a re-render — the error UI only appears after `MAX_RETRIES` is exhausted and `setState({ error })` is called.

---

## State Diagram

```
                    ┌──────────────────────────┐
                    │        IDLE              │
                    │  isPlaying: false        │
                    │  isBuffering: false      │
                    └──────────┬───────────────┘
                               │ play() called
                               ▼
                    ┌──────────────────────────┐
                    │       BUFFERING          │◄──────── "waiting" event
                    │  isPlaying: true         │
                    │  isBuffering: true       │
                    └──────────┬───────────────┘
                               │ "canplay" / "playing" event
                               ▼
                    ┌──────────────────────────┐
                    │       PLAYING            │
                    │  isPlaying: true         │──── "waiting" ──► BUFFERING
                    │  isBuffering: false      │
                    └──────────┬───────────────┘
                               │ pause() / "pause" event
                               ▼
                    ┌──────────────────────────┐
                    │        PAUSED            │
                    │  isPlaying: false        │
                    │  isBuffering: false      │
                    └──────────────────────────┘

   At any point:
   "error" event / HLS fatal error → error: VideoError → ERROR overlay
```

---

## Summary Table

| State field | Change frequency | Storage | Updated by |
|---|---|---|---|
| `isPlaying` | Low | `useState` | `play`/`pause`/`ended` events |
| `currentTime` | Very high (60/s) | Not stored | `onTimeUpdate` callback only |
| `duration` | Once | `useState` | `durationchange` event |
| `volume` | Low | `useState` | `volumechange` event |
| `isMuted` | Low | `useState` | `volumechange` event |
| `playbackRate` | Low | `useState` | `ratechange` event |
| `isFullscreen` | Low | `useState` | `fullscreenchange` event |
| `isPictureInPicture` | Low | `useState` | PiP events |
| `isTheaterMode` | Low | `useState` | `toggleTheaterMode()` |
| `isBuffering` | Medium | `useState` | `waiting`/`canplay`/`playing` events |
| `bufferedRanges` | Medium | Local state in ProgressBar | `progress` event |
| `error` | Rare | `useState` | `error` event / HLS fatal |
| `isLive` | Once | `useState` | `durationchange` event |
| `qualityLevels` | Once per src | `useState` | `MANIFEST_PARSED` HLS event |
| `currentQualityLevel` | Low | `useState` | `LEVEL_SWITCHED` / `setQualityLevel()` |
| `lastVolumeRef` | Low | `useRef` | `toggleMute()` |
| `networkRetriesRef` | Rare | `useRef` | HLS error handler |
| `thumbnailCuesRef` | Once per VTT | `useRef` (in ProgressBar) | VTT fetch |
