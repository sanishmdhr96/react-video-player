"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PlaybackRate, PlayerState, VideoPlayerRef } from "../lib/types";
import { ControlElements } from "./control-elements";

interface ControlsProps {
  state: PlayerState;
  playerRef: VideoPlayerRef;
  playbackRates: PlaybackRate[];
  enablePreview?: boolean;
  enablePrefetch?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  state,
  playerRef,
  playbackRates,
  enablePreview = true,
  enablePrefetch = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls on inactivity
  useEffect(() => {
    if (!state.isPlaying) {
      setShowControls(true);
      return;
    }

    const resetHideTimer = () => {
      setShowControls(true);

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", resetHideTimer);
      container.addEventListener("mouseenter", resetHideTimer);
    }

    resetHideTimer();

    return () => {
      if (container) {
        container.removeEventListener("mousemove", resetHideTimer);
        container.removeEventListener("mouseenter", resetHideTimer);
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [state.isPlaying]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = playerRef.getVideoElement();
      if (!video) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (state.isPlaying) {
            playerRef.pause();
          } else {
            playerRef.play();
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          playerRef.seek(Math.max(0, state.currentTime - 5));
          break;
        case "ArrowRight":
          e.preventDefault();
          playerRef.seek(Math.min(state.duration, state.currentTime + 5));
          break;
        case "ArrowUp":
          e.preventDefault();
          playerRef.setVolume(Math.min(1, state.volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          playerRef.setVolume(Math.max(0, state.volume - 0.1));
          break;
        case "KeyM":
          e.preventDefault();
          playerRef.setVolume(state.isMuted ? 0.5 : 0);
          break;
        case "KeyF":
          e.preventDefault();
          playerRef.toggleFullscreen();
          break;
        case "KeyP":
          e.preventDefault();
          playerRef.togglePictureInPicture();
          break;
        case "Digit0":
        case "Digit1":
        case "Digit2":
        case "Digit3":
        case "Digit4":
        case "Digit5":
        case "Digit6":
        case "Digit7":
        case "Digit8":
        case "Digit9": {
          e.preventDefault();
          const percent = Number(e.code.replace("Digit", "")) * 10;
          playerRef.seek((state.duration / 100) * percent);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerRef, state]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
        padding: "16px",
        opacity: showControls ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: showControls ? "auto" : "none",
      }}
      onMouseEnter={() => setShowControls(true)}
      role="region"
      aria-label="Video player controls"
    >
      {/* Progress bar */}
      <ControlElements.ProgressBar
        state={state}
        playerRef={playerRef}
        enablePreview={enablePreview}
        enablePrefetch={enablePrefetch}
      />

      {/* Bottom controls bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "8px",
        }}
      >
        {/* Play/Pause button */}
        {state.isPlaying ? (
          <ControlElements.PauseButton onClick={() => playerRef.pause()} />
        ) : (
          <ControlElements.PlayButton onClick={() => playerRef.play()} />
        )}

        {/* Volume control */}
        <ControlElements.VolumeControl
          volume={state.volume}
          isMuted={state.isMuted}
          onVolumeChange={(v) => playerRef.setVolume(v)}
        />

        {/* Time display */}
        <ControlElements.TimeDisplay currentTime={state.currentTime} duration={state.duration} />

        <div style={{ flex: 1 }} />

        {/* Settings menu */}
        <ControlElements.SettingsMenu
          currentRate={state.playbackRate}
          playbackRates={playbackRates}
          onRateChange={(rate) => playerRef.setPlaybackRate(rate)}
        />

        {/* Picture-in-Picture button */}
        <ControlElements.PiPButton
          onClick={() => playerRef.togglePictureInPicture()}
          isPiP={state.isPictureInPicture}
        />

        {/* Fullscreen button */}
        <ControlElements.FullscreenButton
          onClick={() => playerRef.toggleFullscreen()}
          isFullscreen={state.isFullscreen}
        />
      </div>
    </div>
  );
};