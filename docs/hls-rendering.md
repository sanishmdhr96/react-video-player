# HLS Rendering

## Overview

react-helios supports HTTP Live Streaming (HLS) via two paths:

1. **Native HLS** — Safari and iOS WebKit have built-in HLS support via `HTMLVideoElement`. When detected, HLS.js is not loaded at all.
2. **HLS.js** — All other browsers (Chrome, Firefox, Edge) use the HLS.js library loaded from the consumer's bundle.

The decision happens at runtime on every `src` change inside the `useVideoPlayer` hook.

---

## Files

| File | Role |
|---|---|
| `src/lib/hls.ts` | URL detection + quality level builder utilities |
| `src/lib/format.ts` | `isHLSUrl` helper |
| `src/hooks/useVideoPlayer.ts` | Initialization, event wiring, error recovery |
| `src/components/control-elements/settings-menu.tsx` | Quality level UI |

---

## Step 1 — URL Detection

**File:** `src/lib/format.ts`

Before touching HLS.js, the hook checks whether the supplied `src` is an HLS manifest:

```ts
export function isHLSUrl(url: string): boolean {
  try {
    const pathname = new URL(url, "https://x").pathname.toLowerCase();
    return (
      pathname.endsWith(".m3u8") ||
      /\/hls\//i.test(url) ||
      /\/stream\.m3u8/i.test(url)
    );
  } catch {
    return url.toLowerCase().includes(".m3u8");
  }
}
```

Detection logic (in priority order):

1. Parse the URL and check if the pathname ends with `.m3u8`.
2. Check if the path segment `/hls/` appears anywhere (common CDN pattern).
3. Check for `/stream.m3u8` (common origin server pattern).
4. Fallback: simple `.m3u8` substring check (handles malformed URLs).

If `enableHLS` is explicitly set to `false` in props, the check is skipped entirely and the URL is assigned directly to `<video>.src`.

---

## Step 2 — Browser Capability Check

```ts
if (video.canPlayType("application/vnd.apple.mpegurl")) {
  // Path A: Native HLS (Safari / iOS WebKit)
  video.src = src;
  video.load();
  if (opts.autoplay) video.play().catch(() => {});
} else if (HLS.isSupported()) {
  // Path B: HLS.js
  // ...
}
```

`canPlayType("application/vnd.apple.mpegurl")` returns `"probably"` or `"maybe"` on Safari, which truthy-evaluates. `HLS.isSupported()` checks for `MediaSource` API availability.

---

## Step 3 — HLS.js Initialization

**File:** `src/hooks/useVideoPlayer.ts` (inside the `src`-change effect)

```ts
const hls = new HLS({
  autoStartLoad: true,
  startLevel: -1,                     // -1 = let ABR choose initial level
  capLevelToPlayerSize: true,         // don't load resolution > player pixel size
  capLevelOnFPSDrop: true,            // drop quality on frame-rate issues
  enableWorker: true,                 // use Web Worker for demux
  maxBufferLength: 30,                // 30 s forward buffer target
  maxMaxBufferLength: 600,            // 10 min upper ceiling
  maxBufferSize: 60 * 1000 * 1000,    // 60 MB buffer cap
  liveBackBufferLength: 30,           // keep 30 s of back-buffer for live
  liveSyncDurationCount: 3,           // sync point: 3 segments from live edge
  ...opts.hlsConfig,                  // consumer overrides (merged last)
});

hls.attachMedia(video);
hls.loadSource(src);
```

`attachMedia` must be called before `loadSource` — HLS.js requires a bound `HTMLMediaElement` before it can start demuxing.

The HLS.js instance is stored in `hlsRef.current` so that:
- Quality level changes can be applied later from the settings menu.
- The instance can be destroyed on `src` change or unmount.

---

## Step 4 — Manifest Parsed

```ts
hls.on(Events.MANIFEST_PARSED, (_, data) => {
  const levels: HLSQualityLevel[] = buildQualityLevels(data.levels);
  setState((prev) => ({
    ...prev,
    qualityLevels: levels,
    currentQualityLevel: -1,   // reset to auto on new source
  }));
  if (optionsRef.current.autoplay) video.play().catch(() => {});
});
```

`data.levels` is the raw HLS.js level array. `buildQualityLevels` maps it to the public interface:

```ts
// src/lib/hls.ts
export function buildQualityLevels(levels: HLS["levels"]): HLSQualityLevel[] {
  return levels.map((l, i) => ({
    id: i,
    height: l.height ?? 0,
    width: l.width ?? 0,
    bitrate: l.bitrate ?? 0,
    name: l.height ? `${l.height}p` : `Level ${i + 1}`,
  }));
}
```

The resulting `qualityLevels` array is passed to `SettingsMenu` for display as quality options.

---

## Step 5 — Adaptive Bitrate (ABR) Level Tracking

```ts
hls.on(Events.LEVEL_SWITCHED, (_, data) => {
  setState((prev) => ({ ...prev, currentQualityLevel: data.level }));
});
```

`LEVEL_SWITCHED` fires whenever HLS.js's ABR controller switches to a different rendition. `data.level` is the zero-based index into the quality levels array. This keeps the UI in sync with what ABR is actually downloading.

When the player is in auto mode (`currentQualityLevel === -1`), the settings menu shows "Auto" but still reflects the currently active level in parentheses.

---

## Step 6 — Manual Quality Selection

**File:** `src/hooks/useVideoPlayer.ts` (`setQualityLevel` method)

```ts
const setQualityLevel = useCallback((level: number) => {
  const hls = hlsRef.current;
  if (!hls) return;
  hls.currentLevel = level;          // -1 restores ABR
  setState((prev) => ({ ...prev, currentQualityLevel: level }));
}, []);
```

Setting `hls.currentLevel = -1` hands control back to the ABR algorithm. Any non-negative integer locks the stream to that rendition.

**Settings Menu UI** (`src/components/control-elements/settings-menu.tsx`):

```tsx
{qualityLevels.map((q) => (
  <button
    key={q.id}
    onClick={() => onSetQuality(q.id)}
    className={currentQualityLevel === q.id ? "active" : ""}
  >
    {q.name}
    {currentQualityLevel === q.id && <span className="check">✓</span>}
  </button>
))}
<button onClick={() => onSetQuality(-1)}>
  Auto {currentQualityLevel === -1 && <span className="check">✓</span>}
</button>
```

---

## Error Handling and Retry Logic

HLS.js emits errors as either **fatal** (playback cannot continue) or **non-fatal** (HLS.js will self-recover). react-helios handles both:

```ts
const MAX_RETRIES = 3;

hls.on(Events.ERROR, (_, data) => {
  if (!data.fatal) {
    // Non-fatal: HLS.js recovers automatically. Log only.
    console.warn("[hls] non-fatal:", data.details);
    return;
  }

  switch (data.type) {
    case HLS.ErrorTypes.NETWORK_ERROR:
      if (networkRetriesRef.current < MAX_RETRIES) {
        networkRetriesRef.current += 1;
        // Exponential-style backoff: 1s, 2s, 3s
        const delay = 1000 * networkRetriesRef.current;
        setTimeout(() => {
          if (hlsRef.current === hls) hls.startLoad();
        }, delay);
      } else {
        const err: VideoError = {
          code: "HLS_NETWORK_ERROR",
          message: "Failed to load stream after multiple retries.",
        };
        setState((prev) => ({ ...prev, error: err }));
        optionsRef.current.onError?.(err);
      }
      break;

    case HLS.ErrorTypes.MEDIA_ERROR:
      // Media decode failure — HLS.js provides a recovery path
      console.warn("[hls] media error – recovering");
      hls.recoverMediaError();
      break;

    default:
      const err: VideoError = { code: "HLS_ERROR", message: data.details };
      setState((prev) => ({ ...prev, error: err }));
      optionsRef.current.onError?.(err);
  }
});
```

**Retry counter** (`networkRetriesRef`) is reset to `0` whenever a new `src` is loaded (effect cleanup + re-init).

---

## Live Stream Detection

Live streams have an infinite `duration`. The `durationchange` event fires when the video element first knows its duration:

```ts
const handleDurationChange = () => {
  const dur = video.duration;
  const live = !Number.isFinite(dur);
  setState((prev) => ({ ...prev, duration: live ? 0 : dur, isLive: live }));
};
video.addEventListener("durationchange", handleDurationChange);
```

When `isLive` is `true`:

- The progress bar hides the time scrubber (no seek possible on live).
- A **LIVE** badge renders in the top-left corner.
- A **Go Live** button appears in the control bar.
- The keyboard shortcut **L** calls `seekToLive()`.

**Seeking to live edge:**

```ts
const seekToLive = useCallback(() => {
  const video = videoRef.current;
  if (!video) return;
  video.currentTime = Infinity;   // browser clamps to live edge
}, [videoRef]);
```

---

## Teardown

On `src` change or component unmount, the cleanup function of the `src` effect destroys the HLS.js instance:

```ts
return () => {
  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }
  networkRetriesRef.current = 0;
};
```

`hls.destroy()` detaches the media element, aborts all network requests, and terminates the Web Worker. This prevents memory leaks and dangling event listeners between `src` swaps.

---

## Quality Level Data Model

```ts
interface HLSQualityLevel {
  id: number;       // Zero-based index matching HLS.js level index
  height: number;   // Vertical resolution (e.g. 1080)
  width: number;    // Horizontal resolution (e.g. 1920)
  bitrate: number;  // Bits per second
  name: string;     // Display label: "1080p", "720p", or "Level N"
}
```

`id: -1` is a sentinel for "auto ABR" — it is never a real level in the `qualityLevels` array but is the valid value for `currentQualityLevel` when ABR is active.

---

## Flow Diagram

```
Consumer passes src="https://cdn.example.com/stream.m3u8"
        │
        ▼
isHLSUrl(src) === true
        │
        ├─ video.canPlayType("application/vnd.apple.mpegurl")
        │         │
        │    true (Safari)       false (Chrome/Firefox/Edge)
        │         │                       │
        │   video.src = src          HLS.isSupported()?
        │   video.load()                  │
        │                           true  │  false
        │                           │     └─ video.src = src (fallback)
        │                           ▼
        │                     new HLS({ ...defaults, ...hlsConfig })
        │                     hls.attachMedia(video)
        │                     hls.loadSource(src)
        │                           │
        │                    MANIFEST_PARSED
        │                           │
        │                    setState({ qualityLevels, currentQualityLevel: -1 })
        │                           │
        │                    LEVEL_SWITCHED (ABR fires)
        │                           │
        │                    setState({ currentQualityLevel: data.level })
        │
        ▼
  User selects quality in SettingsMenu
        │
        ▼
  hls.currentLevel = selectedId   (or -1 for auto)
```
