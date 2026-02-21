# Controls

## Overview

The `Controls` component renders the entire control bar at the bottom of the player — progress bar, playback buttons, volume, time display, settings, and fullscreen. It also handles two cross-cutting concerns: **auto-hide on playback** and **keyboard shortcuts**.

---

## Files

| File | Role |
|---|---|
| `src/components/Controls.tsx` | Control bar container + auto-hide + keyboard shortcuts |
| `src/components/control-elements/control-buttons.tsx` | Play, Pause, Fullscreen, PiP, Theater, GoLive buttons |
| `src/components/control-elements/progress-bar.tsx` | Scrub bar with thumbnail preview |
| `src/components/control-elements/volume-control.tsx` | Volume slider with mute button |
| `src/components/control-elements/settings-menu.tsx` | Speed and quality selection |
| `src/components/control-elements/time-display.tsx` | Current time / duration label |
| `src/components/control-elements/index.ts` | Re-exports all control elements |

---

## Control Bar Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ [─────────────── ProgressBar ──────────────────────────────────── ]│
│ [▶] [🔊────] [0:00 / 10:00]          [LIVE] [⚙] [□] [⊡] [⛶] [⊞] │
└────────────────────────────────────────────────────────────────────┘
  ▶/⏸  Volume  TimeDisplay    Spacer   GoLive Settings PiP Theater Full
```

The internal DOM structure:

```tsx
<div className="controls">
  <ProgressBar … />
  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
    {isPlaying ? <PauseButton /> : <PlayButton />}
    <VolumeControl />
    <TimeDisplay />

    <div style={{ flex: 1 }} />   {/* flex spacer: pushes right-side buttons to the edge */}

    {isLive && <GoLiveButton />}
    <SettingsMenu />
    {controlBarItems?.map((item) => (
      <button key={item.key} onClick={item.onClick}>{item.icon}</button>
    ))}
    <PiPButton />
    <TheaterButton />
    <FullscreenButton />
  </div>
</div>
```

---

## Auto-Hide Behavior

Controls are hidden 3 seconds after the last user interaction while the video is playing. They always remain visible when paused, when hovering over the control bar itself, or when the settings menu is open.

```ts
const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [showControls, setShowControls] = useState(true);

useEffect(() => {
  const el = playerContainerRef.current;
  if (!el) return;

  if (!isPlaying) {
    // Always show controls when paused
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    return;
  }

  const reset = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  el.addEventListener("mousemove", reset);
  el.addEventListener("touchstart", reset, { passive: true });
  reset(); // Start the timer immediately on play

  return () => {
    el.removeEventListener("mousemove", reset);
    el.removeEventListener("touchstart", reset);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  };
}, [isPlaying, playerContainerRef]);
```

The control bar opacity/transform is driven by the `showControls` boolean:

```tsx
<div
  className="controls"
  style={{
    opacity: showControls ? 1 : 0,
    transform: showControls ? "translateY(0)" : "translateY(8px)",
    transition: "opacity 0.3s, transform 0.3s",
    pointerEvents: showControls ? "auto" : "none",
  }}
>
```

`pointerEvents: "none"` ensures hidden controls do not intercept clicks on the video.

---

## Keyboard Shortcuts

All keyboard shortcuts are registered on the player container element via a `keydown` listener inside `Controls`. Shortcuts are active when any element inside the player has focus.

```ts
useEffect(() => {
  const el = playerContainerRef.current;
  if (!el) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if focus is inside an input or textarea
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    switch (e.key) {
      case " ":
      case "k":
      case "K":
        e.preventDefault();
        isPlaying ? playerRef.current.pause() : playerRef.current.play();
        break;
      case "ArrowLeft":
        e.preventDefault();
        playerRef.current.seek(currentTimeRef.current - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        playerRef.current.seek(currentTimeRef.current + 5);
        break;
      case "ArrowUp":
        e.preventDefault();
        playerRef.current.setVolume(Math.min(1, volumeRef.current + 0.1));
        break;
      case "ArrowDown":
        e.preventDefault();
        playerRef.current.setVolume(Math.max(0, volumeRef.current - 0.1));
        break;
      case "m":
      case "M":
        playerRef.current.toggleMute();
        break;
      case "f":
      case "F":
        playerRef.current.toggleFullscreen();
        break;
      case "p":
      case "P":
        playerRef.current.togglePictureInPicture();
        break;
      case "t":
      case "T":
        playerRef.current.toggleTheaterMode();
        break;
      case "l":
      case "L":
        if (isLive) playerRef.current.seekToLive();
        break;
      case "0": case "1": case "2": case "3": case "4":
      case "5": case "6": case "7": case "8": case "9":
        // Seek to 0%, 10%, 20% … 90% of total duration
        playerRef.current.seek((parseInt(e.key) / 10) * durationRef.current);
        break;
    }
  };

  el.addEventListener("keydown", handleKeyDown);
  return () => el.removeEventListener("keydown", handleKeyDown);
}, [isPlaying, isLive, playerRef, playerContainerRef]);
```

**`currentTimeRef` and `durationRef`** are refs updated on each `timeupdate` / `durationchange` event so the keyboard handler always has fresh values without being in the dependency array.

### Shortcut Reference

| Key | Action |
|---|---|
| `Space` or `K` | Play / Pause toggle |
| `ArrowLeft` | Seek backward 5 seconds |
| `ArrowRight` | Seek forward 5 seconds |
| `ArrowUp` | Increase volume 10% |
| `ArrowDown` | Decrease volume 10% |
| `M` | Toggle mute |
| `F` | Toggle fullscreen |
| `P` | Toggle Picture-in-Picture |
| `T` | Toggle Theater Mode |
| `L` | Seek to live edge (live streams only) |
| `0` – `9` | Seek to 0%–90% of total duration |

---

## Progress Bar

**File:** `src/components/control-elements/progress-bar.tsx`

The progress bar is fully imperative — no React state is used for playhead position or hover tooltip position. It uses `requestAnimationFrame` internally to keep the playhead in sync with video time.

### Playhead Sync

```ts
useEffect(() => {
  const video = videoRef.current;
  if (!video) return;

  let rafId: number;
  const tick = () => {
    if (!barRef.current || !fillRef.current || !handleRef.current) {
      rafId = requestAnimationFrame(tick);
      return;
    }
    const dur = video.duration;
    const pct = isFinite(dur) && dur > 0
      ? (video.currentTime / dur) * 100
      : 0;
    fillRef.current.style.width = `${pct}%`;
    handleRef.current.style.left = `${pct}%`;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}, [videoRef]);
```

### Scrubbing

While the user drags the scrub handle, the video is paused internally and `seek` is called on `mouseup`:

```ts
const handleMouseDown = (e: React.MouseEvent) => {
  isDraggingRef.current = true;
  handleRef.current?.classList.add("dragging");
  scrubTo(e.clientX);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDraggingRef.current) return;
  scrubTo(e.clientX);
  updateTooltip(e.clientX);
};

const handleMouseUp = () => {
  if (!isDraggingRef.current) return;
  isDraggingRef.current = false;
  handleRef.current?.classList.remove("dragging");
  playerRef.current.seek(scrubTimeRef.current);
};
```

### Buffered Ranges Display

```ts
const [bufferedRanges, setBufferedRanges] = useState<BufferedRange[]>([]);

useEffect(() => {
  const video = videoRef.current;
  if (!video) return;
  const update = () => {
    const ranges: BufferedRange[] = [];
    for (let i = 0; i < video.buffered.length; i++) {
      ranges.push({ start: video.buffered.start(i), end: video.buffered.end(i) });
    }
    setBufferedRanges(ranges);
  };
  video.addEventListener("progress", update);
  return () => video.removeEventListener("progress", update);
}, [videoRef]);
```

`bufferedRanges` is the only piece of React state in `ProgressBar`. It changes on the `progress` event, which fires infrequently (every ~250ms while downloading), so the re-render cost is acceptable.

---

## Volume Control

**File:** `src/components/control-elements/volume-control.tsx`

The volume slider appears on hover via CSS (`opacity: 0` → `opacity: 1` with transition). The slider is a styled `<input type="range">` with a dynamic gradient background:

```ts
const sliderBackground = useMemo(
  () =>
    `linear-gradient(to right, #60a5fa 0%, #60a5fa ${percentage}%, rgba(255,255,255,0.3) ${percentage}%, rgba(255,255,255,0.3) 100%)`,
  [percentage],
);
```

`percentage` is derived from `volume * 100`. The gradient fills left-to-right proportionally to the current volume level.

---

## Settings Menu

**File:** `src/components/control-elements/settings-menu.tsx`

The settings menu is a dropdown overlay with two tabs:

```
┌─────────────────┐
│ Speed | Quality │  ← tabs
│─────────────────│
│ 0.25×           │
│ 0.5×            │
│ 0.75×           │
│ ► 1×   (active) │
│ 1.25×           │
│ 1.5×            │
│ 2×              │
└─────────────────┘
```

- **Speed tab**: Fixed set of rates `[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]`.
- **Quality tab**: Dynamic list from `qualityLevels` state + an "Auto" option at top.

The menu closes on outside click via a `mousedown` listener on `document`:

```ts
useEffect(() => {
  if (!isOpen) return;
  const close = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node))
      setIsOpen(false);
  };
  document.addEventListener("mousedown", close);
  return () => document.removeEventListener("mousedown", close);
}, [isOpen]);
```

---

## Custom Control Bar Items

Consumer code can inject additional buttons between the system buttons:

```ts
interface ControlBarItem {
  key: string;      // React key
  icon: ReactNode;  // SVG or any element
  onClick: () => void;
}
```

```tsx
<VideoPlayer
  src="…"
  controlBarItems={[{
    key: "download",
    icon: <DownloadIcon />,
    onClick: () => downloadVideo(),
  }]}
/>
```

Items are rendered between the settings menu and the PiP button:

```tsx
{controlBarItems?.map((item) => (
  <button key={item.key} className="controlButton" onClick={item.onClick}>
    {item.icon}
  </button>
))}
```

---

## Theater and Fullscreen Buttons

Both buttons use toggle icons to communicate the current state:

**Theater Button** — narrow/wide rectangle SVG paths:
- Normal mode: wide rectangle icon (click = enter theater)
- Theater mode: narrow rectangle icon (click = exit theater)

**Fullscreen Button** — expand/compress arrow SVG paths:
- Normal: expand icon
- Fullscreen: compress icon

Both are implemented as `React.memo` components with a boolean prop:

```tsx
export const TheaterButton = memo<{ onClick: () => void; isTheater?: boolean }>(
  ({ onClick, isTheater = false }) => (
    <button onClick={onClick} className="controlButton" title={isTheater ? "Exit theater" : "Theater mode"}>
      <svg>…</svg>
    </button>
  ),
);
```

`memo` prevents re-renders when unrelated state (e.g. `isPlaying`) changes in the parent.
