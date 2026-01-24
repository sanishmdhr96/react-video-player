# Background Prefetch Feature Guide

## Overview

The `enablePrefetch` feature downloads video segments in the background when playback is paused, similar to YouTube. This provides a smoother seeking experience and faster preview generation.

## How It Works

### YouTube-Style Prefetching

```
When paused:
├─ Current position: 2:30
├─ Already buffered: 2:30 - 2:45 (15s)
└─ Prefetch target: 2:30 - 3:30 (60s ahead)
    ├─ Downloads in background
    ├─ Uses browser cache
    └─ Stops when playback resumes
```

### Prefetch Strategy

1. **Only when paused**: Doesn't interfere with active playback
2. **Smart buffering**: Checks what's already cached
3. **30-60s window**: Prefetches ahead of current position
4. **Periodic checks**: Re-evaluates every 5 seconds
5. **Auto-cleanup**: Stops when playback resumes

## Performance Impact

### Network Usage

- **Amount**: ~5-15MB for 60s of HD video
- **Timing**: Only when paused
- **Caching**: Uses browser cache (no redundant downloads)
- **Control**: Automatically stops on play

### Memory Usage

- **Buffered segments**: ~10-30MB (temporary)
- **Browser managed**: Released automatically
- **No memory leaks**: Proper cleanup on unmount

### CPU Usage

- **Minimal**: Browser handles buffering natively
- **No blocking**: Runs in background
- **Optimized**: Uses native video APIs

## Usage Examples

### Basic Usage

```typescript
// Enable prefetch (default)
<VideoPlayer
  src="video.mp4"
  enablePrefetch={true}
/>
```

### Conditional Enabling

```typescript
// Disable on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

<VideoPlayer
  src="video.mp4"
  enablePrefetch={!isMobile}
/>
```

```typescript
// Disable on slow connections
const isSlowConnection =
  navigator.connection?.effectiveType === 'slow-2g' ||
  navigator.connection?.effectiveType === '2g';

<VideoPlayer
  src="video.mp4"
  enablePrefetch={!isSlowConnection}
/>
```

```typescript
// Disable on metered connections
const isMetered = navigator.connection?.saveData === true;

<VideoPlayer
  src="video.mp4"
  enablePrefetch={!isMetered}
/>
```

```typescript
// Disable for large files
const videoSize = 500 * 1024 * 1024; // 500MB

<VideoPlayer
  src="large-video.mp4"
  enablePrefetch={videoSize < 200 * 1024 * 1024}
/>
```

### Combine with Preview

```typescript
// Both features work together
<VideoPlayer
  src="video.mp4"
  enablePreview={true}    // Thumbnail on hover
  enablePrefetch={true}   // Background buffering
/>

// Disable both on mobile
<VideoPlayer
  src="video.mp4"
  enablePreview={!isMobile}
  enablePrefetch={!isMobile}
/>

// Enable preview only (lighter weight)
<VideoPlayer
  src="video.mp4"
  enablePreview={true}
  enablePrefetch={false}
/>
```

## When to Enable/Disable

### ✅ Enable Prefetch When:

- Desktop/laptop users with good internet
- Users frequently pause to analyze content
- Educational or tutorial videos
- Content where seeking is common
- WiFi connections

### ❌ Disable Prefetch When:

- Mobile devices (bandwidth concerns)
- Metered/limited data plans
- Slow internet connections (< 3G)
- Very large files (> 500MB)
- Live streams
- Users with data saver mode enabled

## Comparison: Preview vs Prefetch

| Feature         | enablePreview            | enablePrefetch                 |
| --------------- | ------------------------ | ------------------------------ |
| **Purpose**     | Show thumbnails on hover | Buffer ahead when paused       |
| **Network**     | ~100-500KB metadata      | ~5-15MB video segments         |
| **When Active** | On hover over progress   | When paused                    |
| **Performance** | Minimal (<1% CPU)        | Minimal (browser managed)      |
| **Benefits**    | Better UX for seeking    | Faster seeks, smoother preview |
| **Best For**    | All users                | Desktop/WiFi users             |

## Advanced Configuration

### Smart Adaptive Prefetch

```typescript
const usePrefetch = () => {
  const [enablePrefetch, setEnablePrefetch] = useState(true);

  useEffect(() => {
    // Check connection
    const connection = navigator.connection;

    if (connection) {
      const updatePrefetch = () => {
        const isGoodConnection =
          connection.effectiveType === '4g' &&
          !connection.saveData &&
          connection.downlink > 5; // > 5 Mbps

        setEnablePrefetch(isGoodConnection);
      };

      connection.addEventListener('change', updatePrefetch);
      updatePrefetch();

      return () => {
        connection.removeEventListener('change', updatePrefetch);
      };
    }
  }, []);

  return enablePrefetch;
};

// Usage
function MyPlayer() {
  const shouldPrefetch = usePrefetch();

  return (
    <VideoPlayer
      src="video.mp4"
      enablePrefetch={shouldPrefetch}
    />
  );
}
```

### User Preference

```typescript
// Let users control it
function MyPlayer() {
  const [userPrefetch, setUserPrefetch] = useState(() => {
    return localStorage.getItem('prefetch') !== 'false';
  });

  const togglePrefetch = () => {
    const newValue = !userPrefetch;
    setUserPrefetch(newValue);
    localStorage.setItem('prefetch', String(newValue));
  };

  return (
    <>
      <button onClick={togglePrefetch}>
        Prefetch: {userPrefetch ? 'ON' : 'OFF'}
      </button>
      <VideoPlayer
        src="video.mp4"
        enablePrefetch={userPrefetch}
      />
    </>
  );
}
```

## Technical Details

### How Prefetch Works

```typescript
// Simplified version of the prefetch logic
const prefetchAhead = () => {
  const currentTime = state.currentTime;
  const duration = state.duration;

  // Target: 30-60s ahead
  const prefetchEnd = Math.min(currentTime + 60, duration);

  // Check if already buffered
  const buffered = video.buffered;
  let needsPrefetch = true;

  for (let i = 0; i < buffered.length; i++) {
    if (buffered.end(i) >= currentTime + 30) {
      needsPrefetch = false;
      break;
    }
  }

  // Trigger buffering
  if (needsPrefetch) {
    video.preload = "auto";
  }
};
```

### Buffering Visualization

```
Progress Bar:
|━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|
|          |     |                        |
Current    30s   60s                     End
position   └─────┘
           Prefetch
           window
```

## Best Practices

1. **Default to enabled**: Safe for most use cases
2. **Detect connection**: Disable on poor networks
3. **Respect user settings**: Check `navigator.connection.saveData`
4. **Monitor buffering**: Use `buffered` property to verify
5. **Provide toggle**: Let users control it
6. **Test on mobile**: Ensure good experience

## Monitoring Prefetch

```typescript
// Check buffer status
const checkBuffer = () => {
  const video = playerRef.getVideoElement();
  if (!video) return;

  const buffered = video.buffered;
  console.log("Buffered ranges:");

  for (let i = 0; i < buffered.length; i++) {
    console.log(`  ${buffered.start(i)}s - ${buffered.end(i)}s`);
  }

  // Check how much is buffered ahead
  const currentTime = video.currentTime;
  const bufferedAhead =
    buffered.length > 0 ? buffered.end(buffered.length - 1) - currentTime : 0;

  console.log(`Buffered ahead: ${bufferedAhead}s`);
};
```

## Conclusion

The prefetch feature provides YouTube-like performance with:

- ✅ Instant seeking to nearby timestamps
- ✅ Faster preview generation
- ✅ Smoother playback experience
- ✅ Independent toggle control
- ✅ Minimal performance impact

**Recommendation**: Enable by default for desktop users, disable for mobile/slow connections.
