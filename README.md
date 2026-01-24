# @videoplayer/react

A production-grade, lightweight React video player component with zero dependencies. Features custom controls, thumbnail preview, keyboard shortcuts, and full accessibility support.

## Features

- **Zero Dependencies** - No external UI libraries required (React only)
- **CSS Modules** - Scoped styling with full customization support
- **Responsive Design** - Mobile-first controls that work on all devices
- **Accessibility** - ARIA labels, keyboard shortcuts, screen reader support
- **Thumbnail Preview** - Hover over progress bar to see video thumbnails
- **Performance** - Optimized with requestAnimationFrame and debouncing
- **Custom Controls** - Play/pause, seek, volume, speed, fullscreen, picture-in-picture
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Picture-in-Picture** - Native PiP support
- **TypeScript** - Fully typed for excellent developer experience
- **Playback Speed** - Adjustable playback rates
- **Volume Control** - Visual slider with gradient fill
- **HTML5 Support** - MP4, WebM, Ogg formats

## Installation

```bash
npm install @videoplayer/react
```

or

```bash
yarn add @videoplayer/react
```

or

```bash
pnpm add @videoplayer/react
```

## Quick Start

### Basic Usage

```tsx
import VideoPlayer from "@videoplayer/react";
import "@videoplayer/react/dist/style.css";

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

### With Programmatic Control

```tsx
import { useRef } from "react";
import VideoPlayer from "@videoplayer/react";
import type { VideoPlayerRef } from "@videoplayer/react";

export default function App() {
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <div>
      <VideoPlayer
        ref={playerRef}
        src="https://example.com/video.mp4"
        poster="https://example.com/poster.jpg"
        controls
      />

      <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
        <button onClick={() => playerRef.current?.play()}>Play</button>
        <button onClick={() => playerRef.current?.pause()}>Pause</button>
        <button onClick={() => playerRef.current?.seek(30)}>Jump to 30s</button>
        <button onClick={() => playerRef.current?.setVolume(0.5)}>
          50% Volume
        </button>
        <button onClick={() => playerRef.current?.setPlaybackRate(1.5)}>
          1.5x Speed
        </button>
        <button onClick={() => playerRef.current?.toggleFullscreen()}>
          Fullscreen
        </button>
      </div>
    </div>
  );
}
```

## Keyboard Shortcuts

| Shortcut  | Action                    |
| --------- | ------------------------- |
| **Space** | Play / Pause              |
| **← →**   | Seek ±5 seconds           |
| **↑ ↓**   | Volume ±10%               |
| **M**     | Mute / Unmute             |
| **F**     | Fullscreen toggle         |
| **P**     | Picture-in-Picture toggle |
| **0-9**   | Jump to 0-90% of video    |

## Props

### VideoPlayer Component

| Prop               | Type                             | Default                        | Description                            |
| ------------------ | -------------------------------- | ------------------------------ | -------------------------------------- |
| `src`              | `string`                         | **required**                   | Video source URL (MP4, WebM, Ogg)      |
| `poster`           | `string`                         | -                              | Poster image URL displayed before play |
| `controls`         | `boolean`                        | `true`                         | Show/hide player controls              |
| `autoplay`         | `boolean`                        | `false`                        | Auto-play video on load                |
| `muted`            | `boolean`                        | `false`                        | Start video muted                      |
| `loop`             | `boolean`                        | `false`                        | Loop video playback                    |
| `preload`          | `'none' \| 'metadata' \| 'auto'` | `'metadata'`                   | Video preload strategy                 |
| `playbackRates`    | `number[]`                       | `[0.5, 0.75, 1, 1.25, 1.5, 2]` | Available playback speed options       |
| `enablePreview`    | `boolean`                        | `true`                         | Enable thumbnail preview on hover      |
| `enablePrefetch`   | `boolean`                        | `true`                         | Enable video prefetching               |
| `className`        | `string`                         | -                              | Custom CSS class for container         |
| `onPlay`           | `() => void`                     | -                              | Callback when video starts playing     |
| `onPause`          | `() => void`                     | -                              | Callback when video is paused          |
| `onEnded`          | `() => void`                     | -                              | Callback when video ends               |
| `onError`          | `(error: VideoError) => void`    | -                              | Callback on video error                |
| `onTimeUpdate`     | `(time: number) => void`         | -                              | Callback on time update                |
| `onDurationChange` | `(duration: number) => void`     | -                              | Callback when duration changes         |
| `onBuffering`      | `(isBuffering: boolean) => void` | -                              | Callback on buffering state change     |

## API Reference

### VideoPlayerRef Methods

The `VideoPlayerRef` provides programmatic control over the player:

```typescript
interface VideoPlayerRef {
  // Playback control
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;

  // Audio control
  setVolume(volume: number): void; // 0.0 to 1.0

  // Playback speed
  setPlaybackRate(rate: number): void;

  // Display modes
  toggleFullscreen(): Promise<void>;
  togglePictureInPicture(): Promise<void>;

  // State access
  getState(): PlayerState;
  getVideoElement(): HTMLVideoElement | null;
}
```

### PlayerState Interface

```typescript
interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isBuffering: boolean;
  bufferedRanges: Array<{ start: number; end: number }>;
  error: VideoError | null;
}
```

### VideoError Interface

```typescript
interface VideoError {
  code: string;
  message: string;
}
```

## Customization

### Using CSS Variables (Recommended)

Override default colors and styles using CSS variables:

```css
.my-custom-player {
  --player-primary-color: #ff0000;
  --player-bg-color: #1a1a1a;
  --player-control-bg: rgba(20, 20, 20, 0.95);
  --player-text-color: #ffffff;
}
```

```tsx
<VideoPlayer className="my-custom-player" src="video.mp4" />
```

### Custom Styling with CSS Modules

Target specific elements by their class names:

```css
/* Override control button styles */
.my-player :global(.controlButton) {
  background-color: rgba(255, 0, 0, 0.1);
}

/* Override progress bar */
.my-player :global(.progressFilled) {
  background: linear-gradient(to right, #ff0000, #00ff00);
}

/* Override volume slider */
.my-player :global(.volumeSlider) {
  background: linear-gradient(
    to right,
    #ff6b6b 0%,
    #ff6b6b var(--volume-percent),
    rgba(255, 255, 255, 0.3) var(--volume-percent)
  );
}
```

### Inline Styles

```tsx
<VideoPlayer
  src="video.mp4"
  style={{
    borderRadius: "16px",
    overflow: "hidden",
  }}
/>
```

## Project Structure

```
@videoplayer/react/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx          # Main player component
│   │   ├── VideoPlayer.module.css   # Player styles
│   │   ├── Controls.tsx             # Control bar component
│   │   ├── Controls.module.css      # Controls styles
│   │   └── control-elements/
│   │       ├── ProgressBar.tsx      # Progress bar with preview
│   │       ├── ProgressBar.module.css
│   │       ├── VolumeControl.tsx    # Volume slider
│   │       ├── TimeDisplay.tsx      # Time display
│   │       ├── SettingsMenu.tsx     # Speed settings
│   │       ├── index.tsx            # Control buttons
│   │       └── control-elements.module.css
│   ├── hooks/
│   │   └── useVideoPlayer.ts        # Video player hook
│   ├── lib/
│   │   ├── types.ts                 # TypeScript definitions
│   │   └── format.ts                # Utility functions
│   └── index.ts                     # Package entry point
├── package.json
└── README.md
```

## Browser Support

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **iOS Safari**: 14.5+
- **Android Chrome**: 90+

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/videoplayer-react.git
cd videoplayer-react

# Install dependencies
npm install

# Run development server
npm run dev
```

### Build

```bash
# Build the package
npm run build

# Run tests
npm test
```

## Examples

### With Error Handling

```tsx
<VideoPlayer
  src="https://example.com/video.mp4"
  onError={(error) => {
    console.error("Video error:", error.code, error.message);
    // Handle error - show notification, fallback content, etc.
  }}
  onBuffering={(isBuffering) => {
    console.log("Buffering:", isBuffering);
  }}
/>
```

### With Event Callbacks

```tsx
const [progress, setProgress] = useState(0);

<VideoPlayer
  src="https://example.com/video.mp4"
  onTimeUpdate={(time) => {
    setProgress(time);
  }}
  onPlay={() => console.log("Video started")}
  onPause={() => console.log("Video paused")}
  onEnded={() => console.log("Video ended")}
/>;
```

### Disable Preview Feature

```tsx
<VideoPlayer
  src="https://example.com/video.mp4"
  enablePreview={false}
  enablePrefetch={false}
/>
```

### Custom Playback Rates

```tsx
<VideoPlayer
  src="https://example.com/video.mp4"
  playbackRates={[0.25, 0.5, 1, 1.5, 2, 3]}
/>
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Built with React and TypeScript
- Inspired by modern video players like Plyr and Video.js

## Support

- Email: mail.sanishmanandhar@gmail.com
- Issues: [GitHub Issues](https://github.com/sanishmdhr96/react-video-player/issues)

---

**Made with care by Sanish Manandhar**
