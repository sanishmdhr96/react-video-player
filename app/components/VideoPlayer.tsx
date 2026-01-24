"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { type VideoPlayerProps, type VideoPlayerRef } from "../lib/types";
import { useVideoPlayer } from "../hooks/useVideoPlayer";
import { Controls } from "./Controls";
import styles from "./VideoPlayer.module.css";

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  (
    {
      src,
      poster,
      autoplay = false,
      muted = false,
      loop = false,
      controls = true,
      preload = "metadata",
      playbackRates = [0.5, 0.75, 1, 1.25, 1.5],
      className,
      enableHLS = true,
      onPlay,
      onPause,
      onEnded,
      onError,
      onTimeUpdate,
      onDurationChange,
      onBuffering,
    },
    forwardedRef
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null) as React.RefObject<HTMLVideoElement>;
    const containerRef = useRef<HTMLDivElement>(null);

    const {
      state,
      ref: playerRef,
      hlsRef,
      fullscreenContainerRef,
    } = useVideoPlayer(videoRef, {
      autoplay,
      muted,
      loop,
      playbackRates,
      onPlay,
      onPause,
      onEnded,
      onError,
      onTimeUpdate,
      onDurationChange,
      onBuffering,
      enableHLS,
    });

    // Set fullscreen container ref
    useEffect(() => {
      fullscreenContainerRef.current = containerRef.current;
    }, [fullscreenContainerRef]);

    // Load video source
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      // Simple approach: just set the src directly
      // HLS support removed for simplicity
      video.src = src;
      video.load();
    }, [src]);

    // Expose ref
    React.useImperativeHandle(forwardedRef, () => playerRef, [playerRef]);

    return (
      <div
        ref={containerRef}
        className={`${styles.container} ${className || ""}`}
        data-test="video-player-container"
      >
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            className={styles.video}
            poster={poster}
            preload={preload}
            data-test="video-element"
          />

          {controls && (
            <Controls
              state={state}
              playerRef={playerRef}
              playbackRates={playbackRates}
            />
          )}

          {state.isBuffering && (
            <div
              className={styles.bufferingIndicator}
              data-test="buffering-indicator"
            >
              <div className={styles.spinner} />
              <span className={styles.bufferingText}>Loading...</span>
            </div>
          )}

          {state.error && (
            <div
              className={styles.errorOverlay}
              data-test="error-overlay"
            >
              <div className={styles.errorContent}>
                <h3 className={styles.errorTitle}>
                  {state.error.code === "MEDIA_ERR_SRC_NOT_SUPPORTED"
                    ? "Unsupported Format"
                    : "Video Error"}
                </h3>
                <p className={styles.errorMessage}>{state.error.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";