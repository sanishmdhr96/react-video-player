# Video Player Usage Examples

## Feature Comparison

| Feature          | Description          | Network Impact | When Active |
| ---------------- | -------------------- | -------------- | ----------- |
| `enablePreview`  | Thumbnail on hover   | ~500KB         | On hover    |
| `enablePrefetch` | Background buffering | ~5-15MB        | When paused |

## Basic Examples

### 1. Full Features (Desktop Experience)

```typescript
<VideoPlayer
  src="video.mp4"
  enablePreview={true}   // ✅ Show thumbnails
  enablePrefetch={true}  // ✅ Buffer ahead when paused
/>
```

### 2. Preview Only (Lightweight)

```typescript
<VideoPlayer
  src="video.mp4"
  enablePreview={true}   // ✅ Show thumbnails
  enablePrefetch={false} // ❌ No background buffering
/>
```

### 3. Prefetch Only (No Thumbnails)

```typescript
<VideoPlayer
  src="video.mp4"
  enablePreview={false}  // ❌ No thumbnails
  enablePrefetch={true}  // ✅ Buffer ahead when paused
/>
```

### 4. Minimal (No Extra Features)

```typescript
<VideoPlayer
  src="video.mp4"
  enablePreview={false}  // ❌ No thumbnails
  enablePrefetch={false} // ❌ No background buffering
/>
```

## Adaptive Based on Device

### Mobile Detection

```typescript
'use client';

import { VideoPlayer } from './components/VideoPlayer';
import { useState, useEffect } from 'react';

export default function AdaptivePlayer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  return (
    <VideoPlayer
      src="video.mp4"
      enablePreview={!isMobile}   // Desktop only
      enablePrefetch={!isMobile}  // Desktop only
    />
  );
}
```

### Connection-Based

```typescript
'use client';

import { VideoPlayer } from './components/VideoPlayer';
import { useState, useEffect } from 'react';

export default function ConnectionAwarePlayer() {
  const [isGoodConnection, setIsGoodConnection] = useState(true);

  useEffect(() => {
    const checkConnection = () => {
      const conn = (navigator as any).connection;
      if (conn) {
        const isFast = conn.effectiveType === '4g' && !conn.saveData;
        setIsGoodConnection(isFast);
      }
    };

    checkConnection();
    (navigator as any).connection?.addEventListener('change', checkConnection);

    return () => {
      (navigator as any).connection?.removeEventListener('change', checkConnection);
    };
  }, []);

  return (
    <VideoPlayer
      src="video.mp4"
      enablePreview={isGoodConnection}
      enablePrefetch={isGoodConnection}
    />
  );
}
```

### File Size Based

```typescript
export default function FileSizeAwarePlayer({ videoUrl, videoSize }: {
  videoUrl: string;
  videoSize: number; // in bytes
}) {
  const isLargeFile = videoSize > 200 * 1024 * 1024; // > 200MB

  return (
    <VideoPlayer
      src={videoUrl}
      enablePreview={true}           // Always show previews
      enablePrefetch={!isLargeFile}  // Disable for large files
    />
  );
}
```

## User-Controlled Settings

### With Settings Panel

```typescript
'use client';

import { VideoPlayer } from './components/VideoPlayer';
import { useState } from 'react';

export default function PlayerWithSettings() {
  const [settings, setSettings] = useState({
    preview: true,
    prefetch: true,
  });

  return (
    <div>
      {/* Settings Panel */}
      <div style={{ marginBottom: '20px', padding: '16px', background: '#f5f5f5' }}>
        <h3>Player Settings</h3>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={settings.preview}
            onChange={(e) => setSettings({ ...settings, preview: e.target.checked })}
          />
          {' '}Enable thumbnail preview on hover
        </label>
        <label style={{ display: 'block' }}>
          <input
            type="checkbox"
            checked={settings.prefetch}
            onChange={(e) => setSettings({ ...settings, prefetch: e.target.checked })}
          />
          {' '}Enable background prefetch when paused
        </label>
      </div>

      {/* Video Player */}
      <VideoPlayer
        src="video.mp4"
        enablePreview={settings.preview}
        enablePrefetch={settings.prefetch}
      />
    </div>
  );
}
```

### With localStorage Persistence

```typescript
'use client';

import { VideoPlayer } from './components/VideoPlayer';
import { useState, useEffect } from 'react';

export default function PersistentSettingsPlayer() {
  const [settings, setSettings] = useState({
    preview: true,
    prefetch: true,
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('videoPlayerSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const updateSetting = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('videoPlayerSettings', JSON.stringify(newSettings));
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => updateSetting('preview', !settings.preview)}>
          Preview: {settings.preview ? 'ON' : 'OFF'}
        </button>
        <button onClick={() => updateSetting('prefetch', !settings.prefetch)}>
          Prefetch: {settings.prefetch ? 'ON' : 'OFF'}
        </button>
      </div>

      <VideoPlayer
        src="video.mp4"
        enablePreview={settings.preview}
        enablePrefetch={settings.prefetch}
      />
    </div>
  );
}
```

## Smart Adaptive Strategy

### Recommended Default Configuration

```typescript
'use client';

import { VideoPlayer } from './components/VideoPlayer';
import { useState, useEffect } from 'react';

export default function SmartPlayer({ videoUrl }: { videoUrl: string }) {
  const [features, setFeatures] = useState({
    preview: true,
    prefetch: true,
  });

  useEffect(() => {
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Check connection
    const conn = (navigator as any).connection;
    const isSlowConnection = conn?.effectiveType === 'slow-2g' ||
                            conn?.effectiveType === '2g' ||
                            conn?.saveData;

    // Check battery (if on mobile)
    const isBatteryLow = (navigator as any).getBattery?.then((battery: any) =>
      battery.level < 0.2
    );

    // Decide features
    if (isMobile || isSlowConnection) {
      setFeatures({
        preview: !isSlowConnection,  // Disable on very slow connections
        prefetch: false,              // Disable prefetch on mobile
      });
    }
  }, []);

  return (
    <VideoPlayer
      src={videoUrl}
      enablePreview={features.preview}
      enablePrefetch={features.prefetch}
    />
  );
}
```

## Real-World Use Cases

### 1. Educational Platform

```typescript
// Students often pause to take notes
// Enable prefetch for better seeking
<VideoPlayer
  src="lecture.mp4"
  enablePreview={true}
  enablePrefetch={true}  // ✅ Important for seeking back
/>
```

### 2. Short-Form Content (TikTok-style)

```typescript
// Quick videos, less pausing
// Prefetch not as useful
<VideoPlayer
  src="short-video.mp4"
  enablePreview={true}
  enablePrefetch={false}  // ❌ Not needed
/>
```

### 3. Live Stream

```typescript
// No seeking backward
// No prefetch needed
<VideoPlayer
  src="live-stream.m3u8"
  enablePreview={false}   // ❌ Can't seek on live
  enablePrefetch={false}  // ❌ Not applicable
/>
```

### 4. High-Quality Cinema

```typescript
// Large files, desktop viewers
// Enable preview, but careful with prefetch
<VideoPlayer
  src="4k-movie.mp4"
  enablePreview={true}
  enablePrefetch={navigator.onLine && !isMobile}
/>
```

## Performance Comparison

### Scenario 1: Desktop WiFi (Fast)

```typescript
// Best experience
<VideoPlayer
  src="video.mp4"
  enablePreview={true}   // Network: ~500KB
  enablePrefetch={true}  // Network: ~15MB (60s HD)
/>
// Total: ~15.5MB one-time download when paused
// Result: Instant seeking, smooth previews ✅
```

### Scenario 2: Mobile 4G

```typescript
// Balanced
<VideoPlayer
  src="video.mp4"
  enablePreview={true}   // Network: ~500KB
  enablePrefetch={false} // Network: 0
/>
// Total: ~500KB
// Result: Good previews, normal seeking ✅
```

### Scenario 3: Mobile 3G/Slow

```typescript
// Minimal
<VideoPlayer
  src="video.mp4"
  enablePreview={false}  // Network: 0
  enablePrefetch={false} // Network: 0
/>
// Total: 0 extra bandwidth
// Result: Basic player ✅
```

## Debugging & Monitoring

### Check Current Settings

```typescript
function PlayerDebug() {
  const [features] = useState({
    preview: true,
    prefetch: true,
  });

  return (
    <div>
      <pre>
        Current Settings:
        - Preview: {features.preview ? 'Enabled' : 'Disabled'}
        - Prefetch: {features.prefetch ? 'Enabled' : 'Disabled'}

        Network Impact:
        - Preview: ~500KB metadata
        - Prefetch: {features.prefetch ? '~15MB' : '0'} when paused
      </pre>

      <VideoPlayer
        src="video.mp4"
        enablePreview={features.preview}
        enablePrefetch={features.prefetch}
      />
    </div>
  );
}
```

## Summary

| Use Case             | Preview | Prefetch | Why                |
| -------------------- | ------- | -------- | ------------------ |
| Desktop/WiFi         | ✅      | ✅       | Best experience    |
| Desktop/Slow         | ✅      | ❌       | Previews are light |
| Mobile/WiFi          | ✅      | ⚠️       | Consider battery   |
| Mobile/Cellular      | ⚠️      | ❌       | Save bandwidth     |
| Mobile/Slow          | ❌      | ❌       | Minimize data      |
| Large Files (>500MB) | ✅      | ❌       | Prefetch too heavy |
| Live Streams         | ❌      | ❌       | Not applicable     |
| Educational Content  | ✅      | ✅       | Seeking important  |
| Short Videos         | ✅      | ❌       | Less pausing       |

**Default Recommendation**:

```typescript
<VideoPlayer
  src="video.mp4"
  enablePreview={true}
  enablePrefetch={!isMobile}
/>
```
