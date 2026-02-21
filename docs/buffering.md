# Buffering & Loading States

## Overview

react-helios tracks three distinct loading concepts:

1. **Buffering** — The video is playing but has stalled waiting for data (`isBuffering` state).
2. **Buffered ranges** — The portions of the timeline that have already been downloaded (displayed on the progress bar).
3. **Errors** — Fatal failures that prevent playback (separate from buffering).

All three are managed differently to minimize unnecessary re-renders.

---

## Files

| File | Role |
|---|---|
| `src/hooks/useVideoPlayer.ts` | `isBuffering` state via `waiting`/`canplay`/`playing` events |
| `src/components/VideoPlayer.tsx` | Buffering spinner + error overlay rendering |
| `src/components/control-elements/progress-bar.tsx` | Buffered range tracking + progress bar visualization |

---

## 1. Buffering Detection

**File:** `src/hooks/useVideoPlayer.ts`

Three native `HTMLVideoElement` events control the `isBuffering` flag:

```ts
const handleWaiting = () => {
  setState((prev) => ({ ...prev, isBuffering: true }));
  optionsRef.current.onBuffering?.(true);
};

const handleCanPlay = () => {
  setState((prev) => ({ ...prev, isBuffering: false }));
  optionsRef.current.onBuffering?.(false);
};

const handlePlaying = () => {
  setState((prev) => ({ ...prev, isBuffering: false }));
};

video.addEventListener("waiting", handleWaiting);
video.addEventListener("canplay", handleCanPlay);
video.addEventListener("playing", handlePlaying);
```

### Event Semantics

| Event | When it fires | `isBuffering` transition |
|---|---|---|
| `waiting` | Playback stalled — video needs more data | `false` → `true` |
| `canplay` | Enough data buffered to start playing | `true` → `false` |
| `playing` | Playback actually resumed (after a stall) | `true` → `false` |

Both `canplay` and `playing` set `isBuffering: false` because either can fire when buffering resolves — depending on browser and whether the video is currently paused.

---

## 2. Buffering Spinner

**File:** `src/components/VideoPlayer.tsx`

When `isBuffering` is `true` and there is no active error, a CSS spinner overlays the center of the player:

```tsx
{state.isBuffering && !state.error && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      color: "#fff",
      pointerEvents: "none",   // does not intercept clicks
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        border: "4px solid rgba(255,255,255,0.25)",
        borderTop: "4px solid #fff",
        borderRadius: "50%",
        animation: "rvp-spin 0.8s linear infinite",
      }}
    />
    <style>{`@keyframes rvp-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)}
```

Key design choices:
- `pointerEvents: "none"` — The spinner is purely decorative and must not block user interaction with the player.
- The `@keyframes` rule is injected inline to avoid a separate CSS file dependency. The `rvp-` prefix namespaces the animation to prevent conflicts.
- Spinner does not appear when `error` is set — the error overlay takes precedence.

---

## 3. Error Overlay

**File:** `src/components/VideoPlayer.tsx`

When `state.error` is non-null, a full-bleed overlay replaces the video content:

```tsx
{state.error && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      flexDirection: "column",
      gap: 8,
    }}
  >
    <span style={{ fontSize: 32 }}>⚠</span>
    <span style={{ fontSize: 14, opacity: 0.8 }}>{state.error.message}</span>
  </div>
)}
```

The `VideoError` type:

```ts
interface VideoError {
  code: string;    // e.g. "HLS_NETWORK_ERROR", "MEDIA_ERROR"
  message: string; // human-readable description
}
```

Error sources:
- `<video>` element's `error` event → `{ code: "MEDIA_ERROR", message: … }`
- HLS.js fatal network error after `MAX_RETRIES` → `{ code: "HLS_NETWORK_ERROR", … }`
- HLS.js other fatal errors → `{ code: "HLS_ERROR", message: data.details }`

---

## 4. Buffered Ranges

Unlike `isBuffering`, the buffered ranges are **not stored in the global `PlayerState`**. They are local state inside `ProgressBar`, because only the progress bar needs them.

**File:** `src/components/control-elements/progress-bar.tsx`

```ts
const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([]);

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  const updateBuffered = () => {
    const ranges: BufferedRange[] = [];
    for (let i = 0; i < video.buffered.length; i++) {
      ranges.push({
        start: video.buffered.start(i),
        end: video.buffered.end(i),
      });
    }
    setBufferedRanges(ranges);
  };

  video.addEventListener("progress", updateBuffered);
  return () => video.removeEventListener("progress", updateBuffered);
}, [videoRef]);
```

`video.buffered` is a `TimeRanges` object — a list of `(start, end)` pairs in seconds. There is typically one range for continuous downloads, but multiple ranges can exist after seeking.

The `progress` event fires approximately every 200–500 ms during active download, keeping the visualization current without excessive re-renders.

---

## 5. Buffered Range Visualization

Each buffered range is rendered as a semi-transparent bar layered behind the playhead on the progress bar:

```tsx
const bufferedSegments = useMemo(() => {
  const video = videoRef.current;
  const dur = video && isFinite(video.duration) ? video.duration : 0;
  if (dur <= 0 || !bufferedRanges.length) return null;

  return bufferedRanges.map((range, i) => {
    const startPct = (range.start / dur) * 100;
    const widthPct = ((range.end - range.start) / dur) * 100;
    return (
      <div
        key={i}
        className="bufferedSegment"
        style={{ left: `${startPct}%`, width: `${widthPct}%` }}
      />
    );
  });
}, [bufferedRanges, videoRef]);
```

**CSS:**

```css
.bufferedSegment {
  position: absolute;
  top: 0;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.45);
  border-radius: 2px;
}
```

The progress bar track has three visual layers (bottom to top):

```
Layer 1 (bottom): track background — rgba(255,255,255,0.2) — full width
Layer 2:          buffered segments — rgba(255,255,255,0.45)
Layer 3 (top):    playhead fill — #3b82f6 — from 0 to currentTime
```

---

## 6. `onBuffering` Callback

Consumer code can react to buffering state changes:

```tsx
<VideoPlayer
  src="…"
  onBuffering={(isBuffering) => {
    if (isBuffering) showLoadingIndicator();
    else hideLoadingIndicator();
  }}
/>
```

This fires alongside the internal `setState` so external UIs can display their own loading treatment.

---

## Buffering State vs. Initial Load

There is no separate "initial load" state. When `autoplay` is set, `play()` is called after `MANIFEST_PARSED` (HLS) or `video.load()` (native/regular). If the browser needs to buffer before playing, the standard `waiting` event fires — which is handled the same way as mid-playback buffering.

The player always starts with `isBuffering: false` in the default state. The `waiting` event is the first signal that buffering has begun.

---

## Summary

```
video.waiting  ──────────────────► isBuffering: true  ──► Spinner visible
                                                │
video.canplay  ─────────────────────────────────┤
video.playing  ─────────────────────────────────► isBuffering: false ──► Spinner hidden

video.progress ──► video.buffered ──► setBufferedRanges ──► Gray bars on progress bar

video.error / HLS fatal ──► setState({ error }) ──► Error overlay (replaces spinner)
```
