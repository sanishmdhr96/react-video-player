"use client";

import React, { useRef } from "react";
import { VideoPlayer, VideoPlayerRef } from "@sanishmdhr/react-video-player";

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  backgroundColor: "#0066cc",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "background-color 0.2s",
};

export default function DemoPage() {
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "48px" }}>
        <h1>@videoplayer/react</h1>
      </div>

      {/* Video Player Demo */}
      <section style={{ marginBottom: "48px" }}>
        <h2>Video Player</h2>
        <div style={{ aspectRatio: "16 / 9", width: "100%", marginBottom: "24px" }}>
          <VideoPlayer
            ref={playerRef}
            src={'https://cimex.com.np/sealion-phone.mp4'}
            poster="https://cimex.com.np/sealion/1.webp"
            controls
            autoplay={false}
            playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 2]}
            enablePreview={true}
            enablePrefetch={true}
            onError={(error) => {
              console.error("Video error:", error);
            }}
          />
        </div>

        {/* Custom Control Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => playerRef.current?.play()} style={buttonStyle}>
            Play
          </button>
          <button onClick={() => playerRef.current?.pause()} style={buttonStyle}>
            Pause
          </button>
          <button onClick={() => playerRef.current?.seek(30)} style={buttonStyle}>
            Jump to 30s
          </button>
          <button onClick={() => playerRef.current?.setVolume(0.5)} style={buttonStyle}>
            50% Volume
          </button>
          <button onClick={() => playerRef.current?.setPlaybackRate(1.5)} style={buttonStyle}>
            1.5x Speed
          </button>
          <button onClick={() => playerRef.current?.toggleFullscreen()} style={buttonStyle}>
            Fullscreen
          </button>
          <button onClick={() => playerRef.current?.togglePictureInPicture()} style={buttonStyle}>
            Picture-in-Picture
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ marginBottom: "48px" }}>
        <h2>Features</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
          }}
        >
          <FeatureCard
            title="Full HTML5 Support"
            description="MP4, WebM, Ogg formats with automatic codec detection"
          />
          <FeatureCard
            title="Responsive Design"
            description="Mobile-first controls that work on all devices"
          />
          <FeatureCard
            title="Accessibility"
            description="ARIA labels, keyboard shortcuts, screen reader support"
          />
          <FeatureCard
            title="Custom Controls"
            description="Play/pause, seek, volume, speed, fullscreen, PiP"
          />
          <FeatureCard
            title="Error Handling"
            description="Graceful error recovery and detailed error reporting"
          />
          <FeatureCard
            title="Keyboard Shortcuts"
            description="Space (play/pause), arrows (seek/volume), F (fullscreen), P (PiP)"
          />
          <FeatureCard title="Thumbnail Preview" description="Hover over progress bar to see thumbnails" />
          <FeatureCard title="Ref API" description="Programmatic control with VideoPlayerRef" />
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section style={{ marginBottom: "48px" }}>
        <h2>Keyboard Shortcuts</h2>
        <div
          style={{
            backgroundColor: "#f5f5f5",
            padding: "24px",
            borderRadius: "8px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <ShortcutItem keys="Space" action="Play / Pause" />
          <ShortcutItem keys="← →" action="Seek ±5 seconds" />
          <ShortcutItem keys="↑ ↓" action="Volume ±10%" />
          <ShortcutItem keys="M" action="Mute / Unmute" />
          <ShortcutItem keys="F" action="Fullscreen" />
          <ShortcutItem keys="P" action="Picture-in-Picture" />
          <ShortcutItem keys="0-9" action="Jump to 0-90%" />
        </div>
      </section>

      {/* Info */}
      <section style={{ marginBottom: "48px" }}>
        <h2>About This Player</h2>
        <div
          style={{
            backgroundColor: "#e8f4f8",
            padding: "24px",
            borderRadius: "8px",
            lineHeight: "1.6",
          }}
        >
          <p>
            This is a demonstration of @videoplayer/react, a production-grade video player library for React
            applications. It's fully typed with TypeScript, works with Next.js and plain React, and includes
            features like thumbnail previews, keyboard shortcuts, and full accessibility support.
          </p>
          <p style={{ marginTop: "12px" }}>
            Try the video above, use the buttons for programmatic control, or press Space to play/pause. All
            keyboard shortcuts are available and the player is fully responsive on mobile devices. Click
            directly on the video to play/pause!
          </p>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fafafa",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "16px" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>{description}</p>
    </div>
  );
}

function ShortcutItem({ keys, action }: { keys: string; action: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "monospace",
          fontWeight: "600",
          fontSize: "14px",
          marginBottom: "4px",
        }}
      >
        {keys}
      </div>
      <div style={{ fontSize: "13px", color: "#666" }}>{action}</div>
    </div>
  );
}


