# react-helios

Production-grade React video player with HLS streaming, adaptive quality selection, live stream support, subtitle tracks, VTT sprite sheet thumbnail preview, Picture-in-Picture, and full keyboard control.

## Installation

```bash
npm install react-helios
```

**Peer dependencies** — install if not already in your project:

```bash
npm install react react-dom
```

## Quick Start

```tsx
import { VideoPlayer } from "react-helios";
import "react-helios/styles";

export default function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      controls
      autoplay={false}
    />
  );
}
```

> **Next.js** — import the styles in your root `layout.tsx` and mark the component as `"use client"` or wrap it in a client component.

## HLS Streaming

Pass any `.m3u8` URL — HLS.js is initialised automatically:

```tsx
<VideoPlayer
  src="https://example.com/stream.m3u8"
  controls
  enableHLS        // default: true
/>
```

On Safari the browser's native HLS engine is used. A **LIVE** badge and **GO LIVE** button appear automatically for live streams.

## Thumbnail Preview

Hover over the progress bar to see a time tooltip. For rich sprite-sheet thumbnails, pass a `thumbnailVtt` URL pointing to a [WebVTT thumbnail file](https://developer.bitmovin.com/playback/docs/webvtt-based-thumbnails).

```tsx
<VideoPlayer
  src="https://example.com/video.mp4"
  thumbnailVtt="https://example.com/thumbs/storyboard.vtt"
/>
```

### VTT format

Each cue in the `.vtt` file maps a time range to a rectangular region inside a sprite image using the `#xywh=x,y,w,h` fragment:

```
WEBVTT

00:00:00.000 --> 00:00:05.000
https://example.com/thumbs/sprite.jpg#xywh=0,0,160,90

00:00:05.000 --> 00:00:10.000
https://example.com/thumbs/sprite.jpg#xywh=160,0,160,90

00:00:10.000 --> 00:00:15.000
https://example.com/thumbs/sprite.jpg#xywh=320,0,160,90
```

The player fetches the VTT file once, parses all cues, and uses CSS `background-position` to display the correct sprite cell during hover — **no additional network requests per hover**.

To disable the preview entirely:

```tsx
<VideoPlayer src="..." enablePreview={false} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | — | Video URL (MP4, WebM, HLS `.m3u8`, …) |
| `poster` | `string` | — | Poster image shown before playback |
| `controls` | `boolean` | `true` | Show the built-in control bar |
| `autoplay` | `boolean` | `false` | Start playback on mount |
| `muted` | `boolean` | `false` | Start muted |
| `loop` | `boolean` | `false` | Loop the video |
| `preload` | `"none" \| "metadata" \| "auto"` | `"metadata"` | Native `preload` attribute |
| `playbackRates` | `PlaybackRate[]` | `[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]` | Available speed options |
| `enableHLS` | `boolean` | `true` | Enable HLS.js for `.m3u8` sources |
| `enablePreview` | `boolean` | `true` | Show thumbnail / time tooltip on progress bar hover |
| `thumbnailVtt` | `string` | — | URL to a WebVTT sprite sheet file for rich thumbnail preview |
| `hlsConfig` | `Partial<HlsConfig>` | — | Override any [hls.js configuration](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning) option |
| `subtitles` | `SubtitleTrack[]` | — | Subtitle / caption tracks |
| `crossOrigin` | `"anonymous" \| "use-credentials"` | — | CORS attribute for the video element |
| `className` | `string` | — | CSS class on the player container |
| `onPlay` | `() => void` | — | Fired when playback starts |
| `onPause` | `() => void` | — | Fired when playback pauses |
| `onEnded` | `() => void` | — | Fired when playback ends |
| `onError` | `(error: VideoError) => void` | — | Fired on playback or stream errors |
| `onTimeUpdate` | `(time: number) => void` | — | Fired every ~250 ms during playback |
| `onDurationChange` | `(duration: number) => void` | — | Fired when video duration becomes known |
| `onBuffering` | `(isBuffering: boolean) => void` | — | Fired when buffering starts / stops |

## Imperative API (Ref)

Use a `ref` to control the player programmatically:

```tsx
import { useRef } from "react";
import { VideoPlayer, VideoPlayerRef } from "react-helios";

export default function App() {
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <>
      <VideoPlayer ref={playerRef} src="..." controls />
      <button onClick={() => playerRef.current?.play()}>Play</button>
      <button onClick={() => playerRef.current?.pause()}>Pause</button>
      <button onClick={() => playerRef.current?.seek(30)}>Jump to 30s</button>
      <button onClick={() => playerRef.current?.setVolume(0.5)}>50% volume</button>
      <button onClick={() => playerRef.current?.setPlaybackRate(1.5)}>1.5× speed</button>
    </>
  );
}
```

### `VideoPlayerRef` methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `play` | `() => Promise<void>` | Start playback |
| `pause` | `() => void` | Pause playback |
| `seek` | `(time: number) => void` | Seek to a time in seconds |
| `setVolume` | `(volume: number) => void` | Set volume `0–1` |
| `toggleMute` | `() => void` | Toggle mute, restoring the pre-mute volume |
| `setPlaybackRate` | `(rate: PlaybackRate) => void` | Set playback speed |
| `setQualityLevel` | `(level: number) => void` | Set HLS quality level; `-1` = auto ABR |
| `seekToLive` | `() => void` | Jump to the live edge (HLS live streams) |
| `toggleFullscreen` | `() => Promise<void>` | Toggle fullscreen |
| `togglePictureInPicture` | `() => Promise<void>` | Toggle Picture-in-Picture |
| `getState` | `() => PlayerState` | Snapshot of current player state |
| `getVideoElement` | `() => HTMLVideoElement \| null` | Access the underlying `<video>` element |

## Subtitles

```tsx
<VideoPlayer
  src="https://example.com/video.mp4"
  subtitles={[
    { id: "en", src: "/subs/en.vtt", label: "English", srclang: "en", default: true },
    { id: "es", src: "/subs/es.vtt", label: "Español", srclang: "es" },
  ]}
/>
```

## Keyboard Shortcuts

Shortcuts activate when the player has focus (click the player or tab to it).

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / Pause |
| `←` / `→` | Seek −5 s / +5 s |
| `↑` / `↓` | Volume +10% / −10% |
| `M` | Toggle mute (restores previous volume) |
| `F` | Toggle fullscreen |
| `P` | Toggle Picture-in-Picture |
| `L` | Seek to live edge (live streams only) |
| `0`–`9` | Jump to 0%–90% of duration |

Progress bar keyboard (when the progress bar has focus):

| Key | Action |
|-----|--------|
| `←` / `→` | Seek −5 s / +5 s |
| `Shift + ←` / `Shift + →` | Seek −10 s / +10 s |
| `Home` | Jump to start |
| `End` | Jump to end |

## TypeScript

All types are exported from the package:

```ts
import type {
  VideoPlayerProps,
  VideoPlayerRef,
  PlayerState,
  PlaybackRate,
  HLSQualityLevel,
  SubtitleTrack,
  BufferedRange,
  VideoError,
  VideoErrorCode,
  ThumbnailCue,
} from "react-helios";

// VTT utilities (useful for server-side pre-parsing or custom UIs)
import { parseThumbnailVtt, findThumbnailCue } from "react-helios";
```

### `PlayerState`

```ts
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  bufferedRanges: BufferedRange[];
  isBuffering: boolean;
  error: VideoError | null;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isLive: boolean;
  qualityLevels: HLSQualityLevel[];
  currentQualityLevel: number; // -1 = ABR auto
}
```

### `VideoError`

```ts
type VideoErrorCode =
  | "MEDIA_ERR_ABORTED"
  | "MEDIA_ERR_NETWORK"
  | "MEDIA_ERR_DECODE"
  | "MEDIA_ERR_SRC_NOT_SUPPORTED"
  | "HLS_NETWORK_ERROR"
  | "HLS_FATAL_ERROR"
  | "UNKNOWN";

interface VideoError {
  code: VideoErrorCode;
  message: string;
}
```

### `ThumbnailCue`

```ts
interface ThumbnailCue {
  start: number; // seconds
  end: number;   // seconds
  url: string;   // absolute URL to the sprite image
  x: number;     // pixel offset within sprite
  y: number;
  w: number;     // cell width in pixels
  h: number;     // cell height in pixels
}
```

## Performance

The player is architected to produce **zero React re-renders during playback**:

- `timeupdate` and `progress` events are handled by direct DOM mutation (refs), not React state.
- `ProgressBar` and `TimeDisplay` self-subscribe to the video element — the parent tree never re-renders on seek or time change.
- VTT sprite thumbnails are looked up via binary search (O(log n)) and rendered via CSS `background-position` — no hidden `<video>` element, no canvas, no network requests per hover.
- Buffered ranges are the only state that triggers a re-render (fires every few seconds during buffering, not 60× per second).

## Project Structure

```
react-helios/
├── src/                    # Library source
│   ├── components/         # VideoPlayer, Controls, control elements
│   ├── hooks/              # useVideoPlayer (state + HLS init)
│   ├── lib/                # Types, HLS utilities, VTT parser, format helpers
│   └── styles/             # CSS
├── examples/
│   └── nextjs-demo/        # Standalone Next.js demo app
├── dist/                   # Build output (ESM + CJS + DTS)
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Type-check only
npm run typecheck
```

To run the demo app against your local build:

```bash
cd examples/nextjs-demo
npm install
npm run dev
```

## Publishing

`prepublishOnly` runs the build automatically:

```bash
npm publish
```

## License

MIT
