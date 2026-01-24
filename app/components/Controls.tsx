"use client";

import React, { useEffect, useRef, useState } from "react";
import { type PlaybackRate, type PlayerState, type VideoPlayerRef } from "../lib/types";
import { formatTime } from "../lib/format";
import {
  PlayButton,
  PauseButton,
  VolumeControl,
  ProgressBar,
  SettingsMenu,
  FullscreenButton,
  PiPButton,
} from "./ControlElements";
import styles from "./Controls.module.css";

interface ControlsProps {
  state: PlayerState;
  playerRef: VideoPlayerRef;
  playbackRates: PlaybackRate[];
}

export const Controls: React.FC<ControlsProps> = ({
  state,
  playerRef,
  playbackRates,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
      container.addEventListener("click", resetHideTimer);
      container.addEventListener("keydown", resetHideTimer);
    }

    resetHideTimer();

    return () => {
      if (container) {
        container.removeEventListener("mousemove", resetHideTimer);
        container.removeEventListener("mouseenter", resetHideTimer);
        container.removeEventListener("click", resetHideTimer);
        container.removeEventListener("keydown", resetHideTimer);
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
      className={`${styles.controls} ${showControls ? styles.visible : styles.hidden}`}
      role="region"
      aria-label="Video player controls"
      data-test="controls-container"
    >
      {/* Progress bar */}
      <ProgressBar state={state} playerRef={playerRef} />

      {/* Bottom controls bar */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsLeft}>
          {state.isPlaying ? (
            <PauseButton onClick={() => playerRef.pause()} />
          ) : (
            <PlayButton onClick={() => playerRef.play()} />
          )}

          <VolumeControl
            volume={state.volume}
            isMuted={state.isMuted}
            onVolumeChange={(v) => playerRef.setVolume(v)}
          />

          <div className={styles.timeDisplay}>
            <span className={styles.currentTime}>{formatTime(state.currentTime)}</span>
            <span className={styles.separator}> / </span>
            <span className={styles.duration}>{formatTime(state.duration)}</span>
          </div>
        </div>

        <div className={styles.controlsRight}>
          <SettingsMenu
            currentRate={state.playbackRate}
            playbackRates={playbackRates}
            onRateChange={(rate) => playerRef.setPlaybackRate(rate)}
            isOpen={showSettings}
            onOpenChange={setShowSettings}
          />

          <PiPButton onClick={() => playerRef.togglePictureInPicture()} />

          <FullscreenButton onClick={() => playerRef.toggleFullscreen()} />
        </div>
      </div>
    </div>
  );
};
