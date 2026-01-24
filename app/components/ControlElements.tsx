"use client";

import React, { useRef, useState } from "react";
import { type PlaybackRate, type PlayerState, type VideoPlayerRef } from "../lib/types";
import styles from "./ControlElements.module.css";

// Play Button
export const PlayButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    className={styles.controlButton}
    onClick={onClick}
    aria-label="Play"
    title="Play (Space)"
    data-test="play-button"
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  </button>
);

// Pause Button
export const PauseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    className={styles.controlButton}
    onClick={onClick}
    aria-label="Pause"
    title="Pause (Space)"
    data-test="pause-button"
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  </button>
);

// Volume Control
interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
}) => {
  const [showSlider, setShowSlider] = useState(false);
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div
      className={styles.volumeControl}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        className={styles.controlButton}
        onClick={() => onVolumeChange(isMuted ? 0.5 : 0)}
        aria-label={isMuted ? "Unmute" : "Mute"}
        title={`${isMuted ? "Unmute" : "Mute"} (M)`}
        data-test="volume-button"
      >
        {displayVolume === 0 ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C23.16 14.42 24 13.3 24 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : displayVolume < 0.5 ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 9v6h4l5 5V4l-5 5H7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {showSlider && (
        <input
          type="range"
          className={styles.volumeSlider}
          min="0"
          max="100"
          value={displayVolume * 100}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          aria-label="Volume"
          data-test="volume-slider"
        />
      )}
    </div>
  );
};

// Progress Bar
interface ProgressBarProps {
  state: PlayerState;
  playerRef: VideoPlayerRef;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ state, playerRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPos, setHoverPos] = useState(0);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pos = e.clientX - rect.left;
    const percent = pos / rect.width;

    if (isDragging) {
      playerRef.seek(percent * state.duration);
    }

    setHoverTime(percent * state.duration);
    setHoverPos(pos);
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={styles.progressContainer}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(state.duration)}
      aria-valuenow={Math.round(state.currentTime)}
      data-test="progress-bar"
    >
      <div className={styles.progressBackground}>
        {/* Buffered progress */}
        {state.bufferedRanges.length > 0 && (
          state.bufferedRanges.map((range, i) => {
            const startPercent = (range.start / state.duration) * 100;
            const endPercent = (range.end / state.duration) * 100;
            return (
              <div
                key={i}
                className={styles.bufferedSegment}
                style={{
                  left: `${startPercent}%`,
                  width: `${endPercent - startPercent}%`,
                }}
              />
            );
          })
        )}

        {/* Current progress */}
        <div className={styles.progress} style={{ width: `${progress}%` }} />

        {/* Hover indicator */}
        {(isDragging || containerRef.current?.matches(":hover")) && (
          <div
            className={styles.hoverIndicator}
            style={{ left: `${hoverPos}px` }}
            data-test="progress-hover"
          />
        )}

        {/* Scrub handle */}
        <div
          className={styles.scrubHandle}
          style={{ left: `${progress}%` }}
          data-test="progress-handle"
        />
      </div>
    </div>
  );
};

// Settings Menu
interface SettingsMenuProps {
  currentRate: number;
  playbackRates: PlaybackRate[];
  onRateChange: (rate: PlaybackRate) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  currentRate,
  playbackRates,
  onRateChange,
  isOpen,
  onOpenChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={styles.settingsMenu}
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button
        className={styles.controlButton}
        onClick={() => onOpenChange(!isOpen)}
        aria-label="Settings"
        title="Playback speed"
        data-test="settings-button"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="12" r="2" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.settingsDropdown} data-test="settings-menu">
          {playbackRates.map((rate) => (
            <button
              key={rate}
              className={`${styles.settingsOption} ${currentRate === rate ? styles.active : ""}`}
              onClick={() => {
                onRateChange(rate);
                onOpenChange(false);
              }}
              data-test={`speed-${rate}`}
            >
              {rate}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Picture-in-Picture Button
export const PiPButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    className={styles.controlButton}
    onClick={onClick}
    aria-label="Picture-in-Picture"
    title="Picture-in-Picture (P)"
    data-test="pip-button"
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-4 .5h-8v-6h8v6z" />
    </svg>
  </button>
);

// Fullscreen Button
export const FullscreenButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    className={styles.controlButton}
    onClick={onClick}
    aria-label="Fullscreen"
    title="Fullscreen (F)"
    data-test="fullscreen-button"
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  </button>
);
