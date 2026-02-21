# Architecture

## Overview

react-helios is structured as a single composable React component (`VideoPlayer`) backed by a monolithic custom hook (`useVideoPlayer`). The hook owns all player state and exposes an imperative API via `useImperativeHandle`. Components are pure presentational—they receive state as props and call callbacks; they do not reach into the hook directly.

---

## Component Tree

```
VideoPlayer (forwardRef)
│
│  [HTML5 <video> element]
│
├── Controls
│   ├── ProgressBar
│   │   ├── bufferedSegment(s)     ← rendered from buffered TimeRanges
│   │   ├── playhead fill          ← CSS width driven by currentTime
│   │   ├── scrubHandle            ← draggable knob
│   │   └── previewTooltip
│   │       ├── thumbnail div      ← background-image sprite via CSS
│   │       └── time label
│   │
│   ├── PlayButton | PauseButton
│   ├── VolumeControl
│   │   └── volumeSlider (shown on hover)
│   ├── TimeDisplay                ← "1:23 / 10:00"
│   ├── [spacer]
│   ├── GoLiveButton               ← only when isLive === true
│   ├── SettingsMenu               ← speed tabs + quality tabs
│   ├── controlBarItems[]          ← custom injected buttons
│   ├── PiPButton
│   ├── TheaterButton
│   └── FullscreenButton
│
├── ContextMenu                    ← rendered on right-click; portal-less, fixed-position
├── LIVE badge                     ← absolute top-left; only when isLive
├── Buffering spinner              ← absolute center; only when isBuffering
└── Error overlay                  ← absolute full-bleed; only when error !== null
```

---

## Data Flow

```
VideoPlayerProps (src, autoplay, hlsConfig, callbacks…)
        │
        ▼
  useVideoPlayer(videoRef, options)
        │
        ├── HLS.js (or native <video>.src)
        │
        ├── state: PlayerState      ─────────────────────────────┐
        │                                                         │
        └── ref: VideoPlayerRef     (play, pause, seek, …)       │
                                                                  │
                                              passed as props to  │
                                                                  ▼
                                              Controls, ContextMenu, overlays
```

**State flows downward; events/callbacks flow upward through user-supplied callbacks (`onPlay`, `onTimeUpdate`, `onError`, …) and the imperative ref.**

---

## VideoPlayer Component

**File:** `src/components/VideoPlayer.tsx`

`VideoPlayer` is a `forwardRef` component. Its responsibilities are:

1. Own the `<video>` element ref and pass it to `useVideoPlayer`.
2. Forward the imperative `VideoPlayerRef` to the consumer.
3. Render the container `div` with `data-theater` and `data-fullscreen` attributes that CSS transitions key off.
4. Mount/unmount the `Controls`, `ContextMenu`, and overlay layers.
5. Handle the right-click event and maintain `contextMenu` position in local state.

```tsx
const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { state, ref: playerRef, hlsRef, fullscreenContainerRef } =
    useVideoPlayer(videoRef, props);

  useImperativeHandle(ref, () => playerRef.current!, [playerRef]);

  // local UI-only state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  return (
    <div ref={fullscreenContainerRef} data-theater={state.isTheaterMode ? "true" : undefined}>
      <video ref={videoRef} />
      <Controls state={state} playerRef={playerRef} … />
      {contextMenu && <ContextMenu … onClose={() => setContextMenu(null)} />}
      {state.isBuffering && <BufferingSpinner />}
      {state.error && <ErrorOverlay error={state.error} />}
    </div>
  );
});
```

---

## useVideoPlayer Hook

**File:** `src/hooks/useVideoPlayer.ts`

The hook is ~650 lines and is the single source of truth for all player behaviour. It:

- Initializes and tears down HLS.js or native video on `src` change.
- Attaches all `<video>` element event listeners.
- Exposes an imperative API (`VideoPlayerRef`) via a memoized object.
- Manages the `fullscreenContainerRef` so that fullscreen requests target the outer container, not the bare `<video>`.

**Returned surface:**

```ts
{
  state: PlayerState;          // React state — causes re-renders on change
  ref: React.MutableRefObject<VideoPlayerRef>;  // imperative API
  hlsRef: React.MutableRefObject<HLS | null>;   // direct HLS.js access
  fullscreenContainerRef: React.MutableRefObject<HTMLElement | null>;
}
```

---

## Imperative API (VideoPlayerRef)

Consumers who capture the forwarded ref can call these methods programmatically:

| Method | Description |
|---|---|
| `play()` | Async play; swallows AbortError |
| `pause()` | Pause playback |
| `seek(time)` | Clamp and seek to `time` in seconds |
| `setVolume(v)` | Set volume 0–1; unmutes if muted |
| `toggleMute()` | Toggle mute; remembers last volume |
| `setPlaybackRate(r)` | Set speed (0.25× to 2×) |
| `setQualityLevel(id)` | Force HLS quality level (-1 = auto) |
| `seekToLive()` | Jump to live edge (`Infinity`) |
| `toggleFullscreen()` | Fullscreen API on container |
| `togglePictureInPicture()` | Browser PiP API on video element |
| `toggleTheaterMode()` | Toggle theater state + fire callback |
| `getState()` | Snapshot of current `PlayerState` |
| `getVideoElement()` | Raw `HTMLVideoElement` reference |

---

## TypeScript Interfaces

**File:** `src/lib/types.ts`

### PlayerState

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
  currentQualityLevel: number;   // -1 = auto ABR
}
```

### VideoPlayerProps

```ts
interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  enableHLS?: boolean;              // default true
  hlsConfig?: Partial<HlsConfig>;   // passed to HLS.js constructor
  thumbnailVtt?: string;            // URL to WebVTT sprite manifest
  controlBarItems?: ControlBarItem[];
  contextMenuItems?: ContextMenuItem[];
  // event callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onError?: (error: VideoError) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onTheaterModeChange?: (active: boolean) => void;
}
```

---

## Styling Architecture

The project uses a hybrid approach:

- **CSS files** — Reusable class-based styles for component internals (`controlButton`, `progressBar`, `contextMenu`, etc.).
- **Inline styles** — For container-level properties that are unique or computed (aspect ratio, absolute position offsets, dynamic widths).
- **`useMemo` for dynamic inline styles** — Volume slider gradient, buffered segment positions.
- **`data-*` attributes** — `data-theater` and `data-fullscreen` on the root container for consumer CSS.
- **CSS animations** — `@keyframes rvp-spin` injected inline for the buffering spinner to avoid a separate CSS file dependency.

**Color tokens (defined ad-hoc, not as CSS variables):**

| Usage | Value |
|---|---|
| Primary accent | `#3b82f6` |
| Lighter accent / fills | `#60a5fa` |
| Control background | `rgba(0,0,0,0.75)` |
| Text | `#fff` |
| Muted text | `rgba(255,255,255,0.6)` |

---

## Extension Points

react-helios is designed to be extended without forking:

| Extension Point | How |
|---|---|
| Custom control bar buttons | `controlBarItems` prop (`ControlBarItem[]`) |
| Custom right-click items | `contextMenuItems` prop (`ContextMenuItem[]`) |
| HLS.js configuration | `hlsConfig` prop (merged over defaults) |
| Thumbnail previews | `thumbnailVtt` prop (WebVTT sprite URL) |
| Theater mode UI | `onTheaterModeChange` callback + `data-theater` attribute |
| Direct HLS.js access | Capture `ref.current` and use `hlsRef` on `VideoPlayerRef` |
