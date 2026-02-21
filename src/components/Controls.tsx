"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import type {
  PlaybackRate,
  VideoPlayerRef,
  HLSQualityLevel,
  BufferedRange,
} from "../lib/types";
import { ControlElements } from "./control-elements";

interface ControlsProps {
  playerRef: VideoPlayerRef;
  /** Ref to the outer player container; used to scope keyboard shortcuts to the focused player */
  playerContainerRef: React.RefObject<HTMLElement | null>;
  playbackRates: PlaybackRate[];
  enablePreview: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isLive: boolean;
  qualityLevels: HLSQualityLevel[];
  currentQualityLevel: number;
  bufferedRanges: BufferedRange[];
}

/**
 * Controls is intentionally NOT wrapped in React.memo here – it receives
 * currentTime which changes every tick, so memo wouldn't help at this level.
 * Instead, all its CHILDREN are memoized so they skip renders when their
 * specific props haven't changed.
 */
export const Controls: React.FC<ControlsProps> = ({
  playerRef,
  playerContainerRef,
  playbackRates,
  enablePreview,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  isPictureInPicture,
  isLive,
  qualityLevels,
  currentQualityLevel,
  bufferedRanges,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showControls, setShowControls] = useState(true);

  /**
   * A ref that always holds the latest state values.
   * The keyboard handler reads from this ref so the effect only needs
   * playerRef as a dependency – it NEVER re-registers on every timeupdate.
   *
   */
  const liveRef = useRef({
    isPlaying, currentTime, duration, volume, isMuted, isLive,
  });
  liveRef.current = { isPlaying, currentTime, duration, volume, isMuted, isLive };

  // ─── Auto-hide controls ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      return;
    }

    const reset = () => {
      setShowControls(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("mousemove", reset);
      el.addEventListener("mouseenter", reset);
      el.addEventListener("touchstart", reset, { passive: true });
    }
    reset();

    return () => {
      if (el) {
        el.removeEventListener("mousemove", reset);
        el.removeEventListener("mouseenter", reset);
        el.removeEventListener("touchstart", reset);
      }
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying]);

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when this player container has focus,
      // preventing shortcuts from firing on all players simultaneously.
      if (!playerContainerRef.current?.contains(document.activeElement)) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      // Read latest values from the ref – no state in closure
      const { isPlaying: playing, currentTime: ct, duration: dur, volume: vol, isLive: live } = liveRef.current;

      switch (e.code) {
        case "Space": case "KeyK":
          e.preventDefault();
          playing ? playerRef.pause() : playerRef.play();
          break;
        case "ArrowLeft":
          e.preventDefault();
          playerRef.seek(Math.max(0, ct - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          playerRef.seek(Math.min(dur || Infinity, ct + 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          playerRef.setVolume(Math.min(1, vol + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          playerRef.setVolume(Math.max(0, vol - 0.1));
          break;
        case "KeyM":
          e.preventDefault();
          playerRef.toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          playerRef.toggleFullscreen();
          break;
        case "KeyP":
          e.preventDefault();
          playerRef.togglePictureInPicture();
          break;
        case "KeyL":
          e.preventDefault();
          if (live) playerRef.seekToLive();
          break;
        case "Digit0": case "Digit1": case "Digit2": case "Digit3": case "Digit4":
        case "Digit5": case "Digit6": case "Digit7": case "Digit8": case "Digit9": {
          e.preventDefault();
          const pct = Number(e.code.replace("Digit", "")) * 10;
          playerRef.seek((dur / 100) * pct);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerRef, playerContainerRef]); // ← state read via liveRef; container ref for focus check

  // ─── Stable callbacks for child components ───────────────────────────────
  // These are memoized so child React.memo components don't re-render due
  // to new function references on every render.
  const handlePlay = useCallback(() => playerRef.play(), [playerRef]);
  const handlePause = useCallback(() => playerRef.pause(), [playerRef]);
  const handleVolumeChange = useCallback((v: number) => playerRef.setVolume(v), [playerRef]);
  const handleToggleMute = useCallback(() => playerRef.toggleMute(), [playerRef]);
  const handleRateChange = useCallback((r: PlaybackRate) => playerRef.setPlaybackRate(r), [playerRef]);
  const handleQualityChange = useCallback((l: number) => playerRef.setQualityLevel(l), [playerRef]);
  const handlePiP = useCallback(() => playerRef.togglePictureInPicture(), [playerRef]);
  const handleFullscreen = useCallback(() => playerRef.toggleFullscreen(), [playerRef]);
  const handleSeekToLive = useCallback(() => playerRef.seekToLive(), [playerRef]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        opacity: showControls ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: showControls ? "auto" : "none",
      }}
    >
      <div
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
          padding: "48px 12px 12px",
        }}
        role="region"
        aria-label="Video player controls"
      >
        {/* Progress bar – re-renders on every tick, intentionally */}
        <ControlElements.ProgressBar
          playerRef={playerRef}
          currentTime={currentTime}
          duration={duration}
          bufferedRanges={bufferedRanges}
          enablePreview={enablePreview}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {/* Play/Pause – memoized; only re-renders when isPlaying changes */}
          {isPlaying ? (
            <ControlElements.PauseButton onClick={handlePause} />
          ) : (
            <ControlElements.PlayButton onClick={handlePlay} />
          )}

          {/* Volume – memoized; skips timeupdate renders */}
          <ControlElements.VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
          />

          {/* Time – re-renders on every tick (needs currentTime) */}
          <ControlElements.TimeDisplay
            currentTime={currentTime}
            duration={duration}
            isLive={isLive}
          />

          <div style={{ flex: 1 }} />

          {/* GO LIVE – memoized; only shown for live streams */}
          {isLive && (
            <GoLiveButton onClick={handleSeekToLive} />
          )}

          {/* Settings – memoized; skips timeupdate renders */}
          <ControlElements.SettingsMenu
            currentRate={playbackRate}
            playbackRates={playbackRates}
            onRateChange={handleRateChange}
            qualityLevels={qualityLevels}
            currentQualityLevel={currentQualityLevel}
            onQualityChange={handleQualityChange}
          />

          {/* PiP  */}
          <ControlElements.PiPButton onClick={handlePiP} isPiP={isPictureInPicture} />

          {/* Fullscreen  */}
          <ControlElements.FullscreenButton onClick={handleFullscreen} isFullscreen={isFullscreen} />
        </div>
      </div>
    </div>
  );
};

/**
 * GO LIVE button – only rendered for live streams.
 * Stable onClick prop (useCallback in parent) prevents unnecessary re-renders.
 */
const GoLiveButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: "1px solid rgba(255,255,255,0.6)",
      color: "#fff",
      borderRadius: 3,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
      letterSpacing: "0.06em",
    }}
    title="Go to live (L)"
  >
    GO LIVE
  </button>
));
GoLiveButton.displayName = "GoLiveButton";
