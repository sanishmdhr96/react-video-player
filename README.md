# Video Player App

A production-grade React video player application built with Next.js 16. Features custom controls, HLS streaming support, keyboard shortcuts, and full accessibility.

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Features

- **Full HTML5 Support** - MP4, WebM, Ogg formats with automatic codec detection
- **HLS Streaming** - M3U8 support with adaptive bitrate using hls.js
- **Custom Controls** - Play/pause, seek, volume, speed, fullscreen, picture-in-picture
- **Keyboard Shortcuts** - Space (play/pause), arrows (seek/volume), F (fullscreen), P (PiP), 0-9 (jump)
- **Responsive Design** - Mobile-first controls that work on all devices
- **Accessibility** - ARIA labels, keyboard shortcuts, screen reader support
- **Error Handling** - Graceful error recovery and detailed error reporting
- **TypeScript** - Fully typed for developer experience

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space | Play / Pause |
| ← → | Seek ±5 seconds |
| ↑ ↓ | Volume ±10% |
| M | Mute / Unmute |
| F | Fullscreen |
| P | Picture-in-Picture |
| 0-9 | Jump to 0-90% of video |

## Project Structure

```
app/
  components/
    VideoPlayer.tsx        # Main player component
    Controls.tsx           # Control bar component
    ControlElements.tsx    # Individual control buttons
  hooks/
    useVideoPlayer.ts      # Video player state management hook
  lib/
    types.ts              # TypeScript type definitions
    format.ts             # Time formatting utilities
    hls.ts                # HLS.js integration
  page.tsx                # Home page with demo
  layout.tsx              # Root layout
  globals.css             # Global styles
```

## Using the Video Player

### Basic Usage

```jsx
import { VideoPlayer } from '@/app/components/VideoPlayer';

export default function App() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      poster="https://example.com/poster.jpg"
      controls
      autoplay={false}
    />
  );
}
```

### With Ref Control

```jsx
import { useRef } from 'react';
import { VideoPlayer } from '@/app/components/VideoPlayer';
import type { VideoPlayerRef } from '@/app/lib/types';

export default function App() {
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <>
      <VideoPlayer ref={playerRef} src="video.mp4" />
      <button onClick={() => playerRef.current?.play()}>Play</button>
      <button onClick={() => playerRef.current?.pause()}>Pause</button>
    </>
  );
}
```

### HLS Streaming

```jsx
<VideoPlayer
  src="https://example.com/playlist.m3u8"
  controls
  enableHLS={true}
/>
```

## Props

### VideoPlayer Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | string | required | Video source URL (MP4 or M3U8) |
| poster | string | - | Poster image URL |
| controls | boolean | true | Show player controls |
| autoplay | boolean | false | Auto-play on load |
| muted | boolean | false | Start muted |
| loop | boolean | false | Loop video |
| preload | 'none' \| 'metadata' \| 'auto' | 'metadata' | Preload behavior |
| playbackRates | number[] | [0.5, 0.75, 1, 1.25, 1.5] | Available playback speeds |
| enableHLS | boolean | true | Enable HLS support |
| className | string | - | Custom CSS class |
| onPlay | () => void | - | Play callback |
| onPause | () => void | - | Pause callback |
| onEnded | () => void | - | Ended callback |
| onError | (error: any) => void | - | Error callback |
| onTimeUpdate | (time: number) => void | - | Time update callback |
| onDurationChange | (duration: number) => void | - | Duration change callback |
| onBuffering | (isBuffering: boolean) => void | - | Buffering state callback |

## API Reference

### VideoPlayerRef Methods

```typescript
interface VideoPlayerRef {
  play(): Promise<void>
  pause(): void
  seek(time: number): void
  setVolume(volume: number): void
  setPlaybackRate(rate: number): void
  toggleFullscreen(): Promise<void>
  togglePictureInPicture(): Promise<void>
  getState(): PlayerState
  getVideoElement(): HTMLVideoElement | null
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14.5+
- Android Chrome 90+

## License

MIT
