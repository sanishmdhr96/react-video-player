"use client";

import React, { forwardRef, useEffect, useRef, useCallback } from "react";
import type { VideoPlayerProps, VideoPlayerRef } from "../lib/types";
import { useVideoPlayer } from "../hooks/useVideoPlayer";
import { Controls } from "./Controls";

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
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
      enablePreview = true,
      enablePrefetch = true,
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
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const {
      state,
      ref: playerRef,
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

      video.src = src;
      video.load();
    }, [src]);

    // Expose ref
    React.useImperativeHandle(forwardedRef, () => playerRef, [playerRef]);

    // Handle video click to play/pause
    const handleVideoClick = useCallback(() => {
      if (state.isPlaying) {
        playerRef.pause();
      } else {
        playerRef.play();
      }
    }, [state.isPlaying, playerRef]);

    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          backgroundColor: "#000",
          aspectRatio: "16 / 9",
        }}
        className={className}
        data-test="video-player-container"
      >
        <video
          ref={videoRef}
          poster={poster}
          preload={preload}
          onClick={handleVideoClick}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            cursor: "pointer",
          }}
          data-test="video-element"
        />

        {controls && (
          <Controls
            state={state}
            playerRef={playerRef}
            playbackRates={playbackRates}
            enablePreview={enablePreview}
            enablePrefetch={enablePrefetch}
          />
        )}

        {state.isBuffering && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              pointerEvents: "none",
            }}
            data-test="buffering-indicator"
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid rgba(255,255,255,0.3)",
                borderTop: "4px solid #fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ fontSize: "14px" }}>Loading...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {state.error && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "rgba(0,0,0,0.9)",
              color: "#fff",
              padding: "24px",
              borderRadius: "8px",
              textAlign: "center",
              maxWidth: "400px",
            }}
            data-test="error-overlay"
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>
              {state.error.code === "MEDIA_ERR_SRC_NOT_SUPPORTED"
                ? "Unsupported Format"
                : "Video Error"}
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>{state.error.message}</p>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;