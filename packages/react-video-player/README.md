# @sanishmdhr/react-video-player

> A modern, production-ready video player for React with YouTube-style features, built with TypeScript.

[![npm version](https://img.shields.io/npm/v/@sanishmdhr/react-video-player.svg)](https://www.npmjs.com/package/@sanishmdhr/react-video-player)
[![npm downloads](https://img.shields.io/npm/dm/@sanishmdhr/react-video-player.svg)](https://www.npmjs.com/package/@sanishmdhr/react-video-player)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎬 **YouTube-style UI** - Familiar, intuitive controls
- 🖼️ **Thumbnail Previews** - Hover over progress bar to preview frames
- 📺 **HLS Streaming** - Native HLS support with hls.js
- ⚡ **Smart Prefetching** - Preload video data for instant playback
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation support
- 📱 **Fully Responsive** - Works seamlessly on all devices
- ♿ **Accessible** - WCAG compliant with ARIA labels
- 🎨 **Customizable** - Flexible playback rates and styling options
- 🖥️ **Modern APIs** - Fullscreen and Picture-in-Picture support
- 📦 **TypeScript** - Fully typed with comprehensive type definitions
- 🔧 **Ref API** - Programmatic control with imperative methods
- 🎯 **Next.js Ready** - Works out of the box with Next.js 13+

## 📦 Installation

```bash
npm install @sanishmdhr/react-video-player
```

Or with yarn:

```bash
yarn add @sanishmdhr/react-video-player
```

Or with pnpm:

```bash
pnpm add @sanishmdhr/react-video-player
```

## 🚀 Quick Start

```tsx
import { VideoPlayer } from "@sanishmdhr/react-video-player";
import "@sanishmdhr/react-video-player/styles";

function App() {
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

## 📖 Usage Examples

### Basic Usage

```tsx
import { VideoPlayer } from "@sanishmdhr/react-video-player";

export default function MyVideo() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <VideoPlayer
        src="https://example.com/video.mp4"
        poster="https://example.com/poster.jpg"
        controls
      />
    </div>
  );
}
```

### With HLS Streaming

```tsx
import { VideoPlayer } from "@sanishmdhr/react-video-player";

export default function StreamingVideo() {
  return (
    <VideoPlayer
      src="https://example.com/playlist.m3u8"
      poster="https://example.com/poster.jpg"
      controls
      enablePrefetch
    />
  );
}
```

### Programmatic Control with Ref

```tsx
import { useRef } from "react";
import { VideoPlayer, VideoPlayerRef } from "@sanishmdhr/react-video-player";

export default function ControlledVideo() {
  const playerRef = useRef<VideoPlayerRef>(null);

  const handlePlay = () => {
    playerRef.current?.play();
  };

  const handleSeek = () => {
    playerRef.current?.seek(30); // Jump to 30 seconds
  };

  const handleSpeedUp = () => {
    playerRef.current?.setPlaybackRate(1.5);
  };

  return (
    <div>
      <VideoPlayer
        ref={playerRef}
        src="https://example.com/video.mp4"
        controls
      />

      <div style={{ marginTop: "20px" }}>
        <button onClick={handlePlay}>Play</button>
        <button onClick={handleSeek}>Jump to 30s</button>
        <button onClick={handleSpeedUp}>1.5x Speed</button>
      </div>
    </div>
  );
}
```

### With Error Handling

```tsx
import { VideoPlayer } from "@sanishmdhr/react-video-player";

export default function VideoWithErrorHandling() {
  const handleError = (error: Error) => {
    console.error("Video error:", error);
    // Show user-friendly error message
  };

  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      poster="https://example.com/poster.jpg"
      controls
      onError={handleError}
    />
  );
}
```

### Custom Playback Rates

```tsx
import { VideoPlayer } from "@sanishmdhr/react-video-player";

export default function CustomRatesVideo() {
  return (
    <VideoPlayer
      src="https://example.com/video.mp4"
      controls
      playbackRates={[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
    />
  );
}
```

## 🎯 API Reference

### Component Props

| Prop             | Type                     | Default                        | Description                                |
| ---------------- | ------------------------ | ------------------------------ | ------------------------------------------ |
| `src`            | `string`                 | **required**                   | Video source URL (MP4, WebM, or HLS)       |
| `poster`         | `string`                 | `undefined`                    | Poster image URL displayed before playback |
| `controls`       | `boolean`                | `true`                         | Show/hide player controls                  |
| `autoplay`       | `boolean`                | `false`                        | Auto-play video on load                    |
| `loop`           | `boolean`                | `false`                        | Loop video playback                        |
| `muted`          | `boolean`                | `false`                        | Start with audio muted                     |
| `playbackRates`  | `number[]`               | `[0.5, 0.75, 1, 1.25, 1.5, 2]` | Available playback speed options           |
| `enablePreview`  | `boolean`                | `true`                         | Enable thumbnail preview on hover          |
| `enablePrefetch` | `boolean`                | `false`                        | Prefetch video data for faster playback    |
| `onPlay`         | `() => void`             | `undefined`                    | Callback when video starts playing         |
| `onPause`        | `() => void`             | `undefined`                    | Callback when video is paused              |
| `onEnded`        | `() => void`             | `undefined`                    | Callback when video ends                   |
| `onTimeUpdate`   | `(time: number) => void` | `undefined`                    | Callback on time update                    |
| `onError`        | `(error: Error) => void` | `undefined`                    | Callback on error                          |
| `className`      | `string`                 | `undefined`                    | Custom CSS class                           |
| `style`          | `CSSProperties`          | `undefined`                    | Inline styles                              |

### Ref Methods

Access these methods via ref:

```typescript
interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  togglePictureInPicture: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getVolume: () => number;
  isPaused: () => boolean;
  isMuted: () => boolean;
}
```

#### Method Details

**`play()`**

- Starts video playback
- Returns: `void`

**`pause()`**

- Pauses video playback
- Returns: `void`

**`seek(time: number)`**

- Jump to specific time in seconds
- Parameters: `time` - Time in seconds
- Returns: `void`

**`setVolume(volume: number)`**

- Set playback volume
- Parameters: `volume` - Volume level (0-1)
- Returns: `void`

**`setPlaybackRate(rate: number)`**

- Change playback speed
- Parameters: `rate` - Speed multiplier (e.g., 1.5 for 1.5x speed)
- Returns: `void`

**`toggleFullscreen()`**

- Enter or exit fullscreen mode
- Returns: `void`

**`togglePictureInPicture()`**

- Enter or exit Picture-in-Picture mode
- Returns: `void`

**`getCurrentTime()`**

- Get current playback time
- Returns: `number` - Current time in seconds

**`getDuration()`**

- Get total video duration
- Returns: `number` - Duration in seconds

**`getVolume()`**

- Get current volume level
- Returns: `number` - Volume (0-1)

**`isPaused()`**

- Check if video is paused
- Returns: `boolean`

**`isMuted()`**

- Check if audio is muted
- Returns: `boolean`

## ⌨️ Keyboard Shortcuts

| Key            | Action                       |
| -------------- | ---------------------------- |
| `Space` or `K` | Play / Pause                 |
| `←`            | Seek backward 5 seconds      |
| `→`            | Seek forward 5 seconds       |
| `↑`            | Increase volume by 10%       |
| `↓`            | Decrease volume by 10%       |
| `M`            | Mute / Unmute                |
| `F`            | Toggle Fullscreen            |
| `P`            | Toggle Picture-in-Picture    |
| `0-9`          | Jump to 0-90% of video       |
| `,`            | Previous frame (when paused) |
| `.`            | Next frame (when paused)     |

## 🎨 Styling

### Using Default Styles

Import the default stylesheet:

```tsx
import "@sanishmdhr/react-video-player/styles";
```

### Custom Styling

Override default styles with CSS:

```css
/* Custom controls background */
.video-player-controls {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
}

/* Custom progress bar color */
.video-player-progress-filled {
  background-color: #ff0000;
}

/* Custom button hover effect */
.video-player-button:hover {
  color: #ff0000;
}
```

### CSS Variables

Customize using CSS variables:

```css
:root {
  --player-primary-color: #1e90ff;
  --player-control-bg: rgba(0, 0, 0, 0.7);
  --player-control-padding: 12px;
  --player-button-size: 40px;
}
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

HLS streaming requires browsers that support Media Source Extensions (MSE) or native HLS playback (Safari).

## 📱 Mobile Support

The player is fully responsive and optimized for mobile devices:

- Touch-friendly controls
- Optimized for portrait and landscape orientations
- Native fullscreen support
- Gesture controls (tap to play/pause)

## ♿ Accessibility

This player follows WCAG 2.1 guidelines:

- Full keyboard navigation
- Screen reader support with ARIA labels
- High contrast mode support
- Focus indicators
- Accessible controls

## 🔧 Advanced Configuration

### TypeScript

Full TypeScript support with comprehensive type definitions:

```typescript
import {
  VideoPlayer,
  VideoPlayerRef,
  VideoPlayerProps,
} from "@sanishmdhr/react-video-player";
```

### Next.js Integration

Works seamlessly with Next.js 13+ App Router:

```tsx
"use client";

import { VideoPlayer } from "@sanishmdhr/react-video-player";
import "@sanishmdhr/react-video-player/styles";

export default function VideoPage() {
  return (
    <VideoPlayer src="/videos/demo.mp4" poster="/images/poster.jpg" controls />
  );
}
```

## 🐛 Troubleshooting

### HLS Videos Not Playing

Make sure hls.js is properly installed (it's included as a dependency). For Safari, HLS works natively.

### Controls Not Showing

Ensure you've imported the styles:

```tsx
import "@sanishmdhr/react-video-player/styles";
```

### TypeScript Errors

Make sure you have the latest type definitions:

```bash
npm install --save-dev @types/react @types/react-dom
```

## 📄 License

MIT © Sanish Manandhar

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support

- 📧 Email: mail.sanishmanandhar@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/sanishmdhr/react-video-player/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/sanishmdhr/react-video-player/wiki)

## 🙏 Acknowledgments

- Built with [hls.js](https://github.com/video-dev/hls.js/) for HLS streaming
- Inspired by YouTube and modern video players
- Thanks to all contributors

---

Made with ❤️ by Sanish Manandhar
