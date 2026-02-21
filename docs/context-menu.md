# Context Menu

## Overview

react-helios ships a right-click context menu that provides quick access to common player actions. It supports both built-in items and consumer-injected custom items. The menu is rendered portal-less at a `position: fixed` offset based on the click coordinates, with boundary clamping to keep it inside the viewport.

---

## Files

| File | Role |
|---|---|
| `src/components/ContextMenu.tsx` | Menu component — items, positioning, close behavior |
| `src/components/VideoPlayer.tsx` | Right-click handler, menu state, rendering |

---

## Activation

**File:** `src/components/VideoPlayer.tsx`

`contextMenu` position is stored as local UI state (not in `PlayerState`):

```ts
const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

const handleContextMenu = useCallback((e: React.MouseEvent) => {
  e.preventDefault();                          // suppress browser's native menu
  setContextMenu({ x: e.clientX, y: e.clientY });
}, []);
```

The `<div>` wrapping the entire player receives `onContextMenu={handleContextMenu}`. When `contextMenu` is non-null, the `ContextMenu` component renders:

```tsx
{contextMenu && (
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    isPlaying={state.isPlaying}
    src={src}
    videoRef={videoRef}
    playerRef={playerRef}
    onClose={() => setContextMenu(null)}
    contextMenuItems={contextMenuItems}
  />
)}
```

---

## Positioning and Viewport Clamping

**File:** `src/components/ContextMenu.tsx`

The menu is `position: fixed` — it is placed relative to the viewport, not the player container. This ensures it appears correctly even when the player is inside a scrollable container or CSS transform.

The raw click coordinates are clamped so the menu never overflows the viewport:

```ts
const MENU_WIDTH = 220;
const MENU_HEIGHT = 290;   // approximate maximum height

const adjustedX = Math.min(x, window.innerWidth - MENU_WIDTH);
const adjustedY = Math.min(y, window.innerHeight - MENU_HEIGHT);
```

Applied as inline style:

```tsx
<div
  className="contextMenu"
  style={{ top: adjustedY, left: adjustedX }}
  ref={menuRef}
>
```

If the consumer shows the menu near the bottom-right corner, these clamps prevent it from appearing off-screen.

---

## Built-in Menu Items

The built-in options are always rendered and reflect live player state:

### Play / Pause Toggle

```tsx
<button className="contextMenuItem" onClick={() => {
  isPlaying ? playerRef.current.pause() : playerRef.current.play();
  onClose();
}}>
  {isPlaying ? "Pause" : "Play"}
</button>
```

### Loop Toggle

```tsx
<button className="contextMenuItem" onClick={() => {
  const video = videoRef.current;
  if (video) video.loop = !video.loop;
  setLoop((prev) => !prev);
}}>
  Loop
  {loop && <span className="contextMenuCheck">✓</span>}
</button>
```

`loop` is local state inside `ContextMenu` initialized from `videoRef.current.loop`. It is not surfaced in `PlayerState` because the loop setting is rarely needed externally.

### Copy Video URL

```tsx
<button className="contextMenuItem" onClick={() => {
  navigator.clipboard.writeText(src).catch(() => {});
  onClose();
}}>
  Copy video URL
</button>
```

### Copy Video URL at Current Time

```tsx
<button className="contextMenuItem" onClick={() => {
  const time = Math.floor(videoRef.current?.currentTime ?? 0);
  const url = `${src}${src.includes("?") ? "&" : "?"}t=${time}`;
  navigator.clipboard.writeText(url).catch(() => {});
  onClose();
}}>
  Copy URL at current time
</button>
```

The timestamp is appended as `?t=<seconds>`. If the URL already has a query string, `&t=<seconds>` is used instead.

### Picture-in-Picture Toggle

```tsx
<button className="contextMenuItem" onClick={() => {
  playerRef.current.togglePictureInPicture();
  onClose();
}}>
  {isPiP ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
</button>
```

`isPiP` mirrors `state.isPictureInPicture` passed from the parent.

---

## Custom Menu Items

Consumer code can inject additional items via the `contextMenuItems` prop:

```ts
interface ContextMenuItem {
  label: string;
  onClick: () => void;
}
```

```tsx
<VideoPlayer
  src="…"
  contextMenuItems={[
    { label: "Download", onClick: () => downloadVideo() },
    { label: "Report issue", onClick: () => openReport() },
  ]}
/>
```

Custom items are rendered below a divider after all built-in items:

```tsx
{contextMenuItems && contextMenuItems.length > 0 && (
  <>
    <div className="contextMenuDivider" />
    {contextMenuItems.map((item, i) => (
      <button
        key={i}
        className="contextMenuItem"
        onClick={() => {
          item.onClick();
          onClose();
        }}
      >
        {item.label}
      </button>
    ))}
  </>
)}
```

All items — built-in and custom — call `onClose()` after their action to dismiss the menu.

---

## Dismissal

The menu closes on four triggers:

### 1. Item click

Every `onClick` handler calls `onClose()` as its last action.

### 2. Click outside

```ts
useEffect(() => {
  const handleOutsideClick = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  document.addEventListener("mousedown", handleOutsideClick);
  return () => document.removeEventListener("mousedown", handleOutsideClick);
}, [onClose]);
```

### 3. Escape key

```ts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [onClose]);
```

### 4. Scroll

```ts
useEffect(() => {
  window.addEventListener("scroll", onClose, { passive: true });
  return () => window.removeEventListener("scroll", onClose);
}, [onClose]);
```

Scroll dismissal prevents the menu from drifting away from its original activation point when the page scrolls.

---

## Styling

```css
.contextMenu {
  position: fixed;
  z-index: 1000;
  background-color: rgba(15, 15, 15, 0.95);
  border-radius: 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  min-width: 200px;
  overflow: hidden;
  padding: 4px 0;
}

.contextMenuItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s;
}

.contextMenuItem:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.contextMenuCheck {
  color: #60a5fa;
  font-weight: 700;
  margin-left: 8px;
}

.contextMenuDivider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}
```

Key visual properties:
- `backdrop-filter: blur(8px)` gives a frosted-glass appearance over video content.
- `z-index: 1000` ensures the menu renders above all player UI elements.
- The check mark (`✓`) uses `#60a5fa` (light blue) to match the active state color used elsewhere in the UI.

---

## Full Flow

```
User right-clicks anywhere on the player
        │
        ▼
onContextMenu(e)
  e.preventDefault()               ← suppress browser native menu
  setContextMenu({ x, y })
        │
        ▼
ContextMenu renders at (adjustedX, adjustedY)
        │
        ├── Built-in items (always shown)
        └── Custom items (if contextMenuItems provided)

User clicks an item
        │
        ▼
item.onClick()
onClose()  →  setContextMenu(null)  →  ContextMenu unmounts

User clicks outside / presses Escape / scrolls
        │
        ▼
onClose()  →  setContextMenu(null)  →  ContextMenu unmounts
```
