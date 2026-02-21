# Thumbnail Preview

## Overview

react-helios shows a thumbnail image above the progress bar when the user hovers over or scrubs the scrub handle. Thumbnails are sourced from a **WebVTT sprite-sheet manifest** — a `.vtt` file that maps time ranges to rectangular regions of one or more image sprites.

The entire system is designed to be **zero re-render** during hover: all DOM mutations happen imperatively via refs, bypassing React's reconciler entirely.

---

## Files

| File | Role |
|---|---|
| `src/lib/vtt.ts` | WebVTT parser and binary search lookup |
| `src/components/control-elements/progress-bar.tsx` | Fetches, caches, and renders thumbnails |

---

## WebVTT Sprite Format

The consumer provides a `.vtt` file via the `thumbnailVtt` prop:

```webvtt
WEBVTT

00:00:00.000 --> 00:00:05.000
https://cdn.example.com/sprites/storyboard0.jpg#xywh=0,0,160,90

00:00:05.000 --> 00:00:10.000
https://cdn.example.com/sprites/storyboard0.jpg#xywh=160,0,160,90

00:00:10.000 --> 00:00:15.000
https://cdn.example.com/sprites/storyboard0.jpg#xywh=320,0,160,90

00:00:15.000 --> 00:00:20.000
https://cdn.example.com/sprites/storyboard1.jpg#xywh=0,0,160,90
```

Each cue entry contains:
- A time range (`start --> end` in `HH:MM:SS.mmm` format).
- An image URL with an `#xywh=x,y,w,h` fragment identifying the sprite rectangle.

The fragment coordinates use CSS `background-position` semantics: `x` and `y` are pixel offsets from the top-left of the image.

---

## VTT Parsing

**File:** `src/lib/vtt.ts`

### Data Structures

```ts
interface ThumbnailCue {
  start: number;  // seconds
  end: number;    // seconds
  url: string;    // absolute image URL (fragment stripped)
  x: number;      // sprite x offset in px
  y: number;      // sprite y offset in px
  w: number;      // sprite width in px
  h: number;      // sprite height in px
}
```

### `parseThumbnailVtt(text, baseUrl)`

```ts
export function parseThumbnailVtt(text: string, baseUrl: string): ThumbnailCue[] {
  const cues: ThumbnailCue[] = [];
  // Split on blank lines to separate cue blocks
  const blocks = text.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    // Find the "-->" timing line
    const timingIdx = lines.findIndex((l) => l.includes("-->"));
    if (timingIdx === -1) continue;

    const [startStr, endStr] = lines[timingIdx].split("-->").map((s) => s.trim());
    const start = parseVttTime(startStr);
    const end = parseVttTime(endStr);
    if (isNaN(start) || isNaN(end)) continue;

    // The cue payload follows the timing line
    const payload = lines.slice(timingIdx + 1).join(" ").trim();
    if (!payload) continue;

    // Resolve relative URLs against the VTT file's base
    const resolved = new URL(payload.split("#")[0], baseUrl).href;
    const fragment = payload.includes("#xywh=")
      ? payload.split("#xywh=")[1]
      : null;

    let x = 0, y = 0, w = 160, h = 90;
    if (fragment) {
      const parts = fragment.split(",").map(Number);
      [x, y, w, h] = parts;
    }

    cues.push({ start, end, url: resolved, x, y, w, h });
  }

  return cues;
}
```

**`parseVttTime`** converts `HH:MM:SS.mmm` (or `MM:SS.mmm`) to seconds:

```ts
function parseVttTime(s: string): number {
  const parts = s.trim().split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return NaN;
}
```

---

## Binary Search Lookup

**File:** `src/lib/vtt.ts`

Given a `time` in seconds, find the matching cue in O(log n):

```ts
export function findThumbnailCue(
  cues: ThumbnailCue[],
  time: number,
): ThumbnailCue | null {
  if (!cues.length) return null;
  let lo = 0;
  let hi = cues.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].end <= time)  lo = mid + 1;
    else if (cues[mid].start > time) hi = mid - 1;
    else return cues[mid];   // cues[mid].start <= time < cues[mid].end
  }
  return null;
}
```

The cues array is assumed to be sorted by `start` time (as produced by the parser). A gap between cues (no matching cue) returns `null` — the tooltip hides the thumbnail in that case.

For a typical 2-hour video with 5-second thumbnail intervals (1440 cues), binary search takes at most **11 comparisons** per `mousemove`.

---

## Loading the VTT File

**File:** `src/components/control-elements/progress-bar.tsx`

Thumbnails are fetched once per `thumbnailVtt` URL change via a `useEffect`. The parsed cues are stored in a **ref** (not state) so that updates never trigger a re-render:

```ts
const thumbnailCuesRef = useRef<ThumbnailCue[]>([]);

useEffect(() => {
  if (!thumbnailVtt) {
    thumbnailCuesRef.current = [];
    return;
  }
  let cancelled = false;

  fetch(thumbnailVtt)
    .then((r) => r.text())
    .then((text) => {
      if (!cancelled)
        thumbnailCuesRef.current = parseThumbnailVtt(text, thumbnailVtt);
    })
    .catch(() => {
      if (!cancelled) thumbnailCuesRef.current = [];
    });

  return () => { cancelled = true; };
}, [thumbnailVtt]);
```

The `cancelled` flag prevents a stale fetch from writing to `thumbnailCuesRef` if `thumbnailVtt` changes before the previous fetch completes.

---

## Imperative Thumbnail Rendering

**File:** `src/components/control-elements/progress-bar.tsx`

The thumbnail `<div>` element is referenced via `thumbRef`. When the user moves the mouse over the progress bar, `applyThumbnail` mutates the element's inline styles directly:

```ts
const thumbRef = useRef<HTMLDivElement>(null);
const lastCueRef = useRef<ThumbnailCue | null>(null);

const applyThumbnail = useCallback((time: number) => {
  if (!thumbRef.current || !thumbnailCuesRef.current.length) return;

  const cue = findThumbnailCue(thumbnailCuesRef.current, time);
  lastCueRef.current = cue;

  if (!cue) return;

  const el = thumbRef.current;
  el.style.backgroundImage = `url(${cue.url})`;
  el.style.backgroundPosition = `-${cue.x}px -${cue.y}px`;
  el.style.width = `${cue.w}px`;
  el.style.height = `${cue.h}px`;
}, []);
```

No `setState` is called. React never re-renders due to thumbnail activity.

---

## Preview Tooltip Layout

The tooltip contains two layers stacked vertically:

```
┌─────────────────────────┐
│                         │
│   [thumbnail div]       │  ← background-image sprite
│                         │
│   [time label]          │  ← "1:23"
└─────────────────────────┘
```

The tooltip is absolutely positioned above the cursor on the progress bar. Its horizontal position is clamped to the progress bar edges so it never overflows the player:

```ts
const clampedX = Math.max(halfW, Math.min(barWidth - halfW, hoverX));
tooltipEl.style.left = `${clampedX}px`;
```

The time label is also updated imperatively via a separate ref (`timeLabelRef.current.textContent = formatTime(time)`).

---

## Performance Characteristics

| Operation | Approach | Re-renders triggered |
|---|---|---|
| VTT fetch | `useEffect` on URL change | 0 (result stored in ref) |
| Cue lookup | Binary search in `mousemove` handler | 0 |
| Thumbnail paint | Inline style mutation via ref | 0 |
| Time label update | `textContent` mutation via ref | 0 |
| Tooltip show/hide | CSS `visibility`/`opacity` toggle via ref | 0 |

Every frame of scrubbing activity produces **zero React re-renders**. This is critical for keeping the progress bar smooth at 60 fps.

---

## VTT Generation (Consumer Responsibility)

react-helios only consumes the VTT file — generating it is the responsibility of the video pipeline. Common approaches:

- **FFmpeg** — Extract frames at regular intervals and stitch into a sprite sheet. Use a script to produce the matching VTT file.
- **Mux / Cloudflare Stream / Bunny CDN** — Some video CDNs generate storyboard VTT files automatically.
- **Custom workers** — Generate on-demand for large libraries.

A typical sprite for a 1-hour video at 5 s intervals:
- 720 frames at 160×90 → ~28 frames per sprite sheet (4480×90 or 28-column grid)
- ~26 JPEG files + 1 VTT file

---

## Full Data Flow

```
thumbnailVtt prop changes
        │
        ▼
useEffect: fetch(thumbnailVtt)
        │
        ▼
parseThumbnailVtt(text, thumbnailVtt)
  → ThumbnailCue[]   (sorted by start time)
        │
        ▼
thumbnailCuesRef.current = cues
        │
        │  (no re-render)
        │
        ▼  user hovers over progress bar
onMouseMove(e)
        │
        ▼
hoverTime = (offsetX / barWidth) * duration
        │
        ▼
findThumbnailCue(thumbnailCuesRef.current, hoverTime)
  → ThumbnailCue | null
        │
        ▼
thumbRef.current.style.backgroundImage = `url(${cue.url})`
thumbRef.current.style.backgroundPosition = `-${cue.x}px -${cue.y}px`
thumbRef.current.style.width = `${cue.w}px`
thumbRef.current.style.height = `${cue.h}px`
timeLabelRef.current.textContent = formatTime(hoverTime)
        │
        ▼
  Browser paints thumbnail — React untouched
```
