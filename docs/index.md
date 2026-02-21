# react-helios — Technical Case Study

This directory contains technical documentation covering the internal design and implementation of **react-helios**, a production-grade React video player component with HLS support.

---

## Documents

| Document | Description |
|---|---|
| [architecture.md](./architecture.md) | Overall system architecture, component hierarchy, and data flow |
| [hls-rendering.md](./hls-rendering.md) | How HLS streams are detected, initialized, rendered, and quality-selected |
| [thumbnail-preview.md](./thumbnail-preview.md) | WebVTT sprite-sheet thumbnail preview system on the progress bar |
| [state-management.md](./state-management.md) | State management using hooks, refs, and the stable-ref pattern |
| [controls.md](./controls.md) | Control bar structure, auto-hide behavior, and keyboard shortcuts |
| [buffering.md](./buffering.md) | Buffering detection, loading indicators, and buffered range visualization |
| [context-menu.md](./context-menu.md) | Right-click context menu — built-in options, custom items, and positioning |

---

## Project at a Glance

**react-helios** is built around a single custom hook (`useVideoPlayer`) that owns all player state and imperative controls. Components consume state via props; no React Context is used. The architecture deliberately favors refs and imperative DOM updates over React state for anything that changes at frame rate (time updates, progress bar scrubbing, thumbnail lookups).

### Key Design Decisions

- **No Context API** — State is passed via props to avoid uncontrolled re-renders.
- **Refs over state for high-frequency data** — `currentTime`, buffered ranges on hover, and thumbnail lookups are handled imperatively.
- **HLS.js with native fallback** — Safari's native HLS support is preferred; HLS.js handles all other browsers.
- **WebVTT thumbnail sprites** — Binary search over parsed cues for O(log n) lookup on every `mousemove`.
- **Stable option refs** — A `useRef` mirror of `options` lets effects reference the latest callback without re-running.

### Source Layout

```
src/
├── components/
│   ├── VideoPlayer.tsx          # Top-level component (forwardRef)
│   ├── Controls.tsx             # Control bar + keyboard shortcuts
│   ├── ContextMenu.tsx          # Right-click menu
│   └── control-elements/
│       ├── control-buttons.tsx  # Play, Pause, Fullscreen, PiP, Theater
│       ├── progress-bar.tsx     # Scrub bar + VTT thumbnail preview
│       ├── volume-control.tsx   # Volume slider with mute
│       ├── settings-menu.tsx    # Speed & quality selector
│       ├── time-display.tsx     # Current / duration display
│       └── index.ts
├── hooks/
│   └── useVideoPlayer.ts        # All player state + imperative API
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   ├── hls.ts                   # HLS.js utilities
│   ├── vtt.ts                   # WebVTT sprite parser
│   └── format.ts                # Time formatting + HLS URL detection
├── styles/
│   ├── VideoPlayer.css
│   ├── Controls.css
│   ├── ProgressBar.css
│   └── ControlElements.css
└── index.ts                     # Public entry point
```
