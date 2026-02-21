"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import type {
  PlaybackRate,
  VideoPlayerRef,
  HLSQualityLevel,
} from "../lib/types";
import { ControlElements } from "./control-elements";

interface ControlsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playerRef: VideoPlayerRef;
  playerContainerRef: React.RefObject<HTMLElement | null>;
  playbackRates: PlaybackRate[];
  enablePreview: boolean;
  thumbnailVtt?: string;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isLive: boolean;
  qualityLevels: HLSQualityLevel[];
  currentQualityLevel: number;
}

export const Controls: React.FC<ControlsProps> = ({
  videoRef,
  playerRef,
  playerContainerRef,
  playbackRates,
  enablePreview,
  thumbnailVtt,
  isPlaying,
  volume,
  isMuted,
  playbackRate,
  isFullscreen,
  isPictureInPicture,
  isLive,
  qualityLevels,
  currentQualityLevel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showControls, setShowControls] = useState(true);

  /**
   * Stable ref capturing the values the keyboard handler needs.
   * isPlaying/volume/isMuted/isLive come from React state (rare changes).
   * currentTime/duration are read directly from the video element so the
   * keyboard shortcuts always see fresh values without subscribing to state.
   */
  const liveRef = useRef({ isPlaying, volume, isMuted, isLive });
  liveRef.current = { isPlaying, volume, isMuted, isLive };

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
      if (!playerContainerRef.current?.contains(document.activeElement)) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const { isPlaying: playing, volume: vol, isLive: live } = liveRef.current;
      // Read time/duration directly from the video element — always fresh
      const ct = videoRef.current?.currentTime ?? 0;
      const dur = videoRef.current?.duration ?? 0;

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
  }, [playerRef, playerContainerRef, videoRef]);

  // ─── Stable callbacks for child components ───────────────────────────────
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
        {/* Progress bar — self-subscribes to timeupdate/progress on videoRef */}
        <ControlElements.ProgressBar
          videoRef={videoRef}
          playerRef={playerRef}
          enablePreview={enablePreview}
          thumbnailVtt={thumbnailVtt}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {isPlaying ? (
            <ControlElements.PauseButton onClick={handlePause} />
          ) : (
            <ControlElements.PlayButton onClick={handlePlay} />
          )}

          <ControlElements.VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
          />

          {/* TimeDisplay — self-subscribes to timeupdate/durationchange on videoRef */}
          <ControlElements.TimeDisplay
            videoRef={videoRef}
            isLive={isLive}
          />

          <div style={{ flex: 1 }} />

          {isLive && (
            <GoLiveButton onClick={handleSeekToLive} />
          )}

          <ControlElements.SettingsMenu
            currentRate={playbackRate}
            playbackRates={playbackRates}
            onRateChange={handleRateChange}
            qualityLevels={qualityLevels}
            currentQualityLevel={currentQualityLevel}
            onQualityChange={handleQualityChange}
          />

          <ControlElements.PiPButton onClick={handlePiP} isPiP={isPictureInPicture} />
          <ControlElements.FullscreenButton onClick={handleFullscreen} isFullscreen={isFullscreen} />
        </div>
      </div>
    </div>
  );
};

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
