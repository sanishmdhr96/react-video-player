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
      playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      className,
      enableHLS = true,
      enablePreview = true,
      thumbnailVtt,
      hlsConfig,
      subtitles,
      crossOrigin,
      onPlay,
      onPause,
      onEnded,
      onError,
      onTimeUpdate,
      onDurationChange,
      onBuffering,
    },
    forwardedRef,
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const { state, ref: playerRef, fullscreenContainerRef } = useVideoPlayer(
      videoRef,
      src,
      {
        autoplay,
        muted,
        loop,
        playbackRates,
        enableHLS,
        hlsConfig,
        onPlay,
        onPause,
        onEnded,
        onError,
        onTimeUpdate,
        onDurationChange,
        onBuffering,
      },
    );

    useEffect(() => {
      fullscreenContainerRef.current = containerRef.current;
    }, [fullscreenContainerRef]);

    React.useImperativeHandle(forwardedRef, () => playerRef, [playerRef]);

    const handleVideoClick = useCallback(() => {
      // Focus the container so keyboard shortcuts activate for this player
      containerRef.current?.focus();
      if (state.isPlaying) playerRef.pause();
      else playerRef.play();
    }, [state.isPlaying, playerRef]);

    const handleDoubleClick = useCallback(() => {
      playerRef.toggleFullscreen();
    }, [playerRef]);



    return (
      <div
        ref={containerRef}
        tabIndex={0}
        style={{
          position: "relative",
          width: "100%",
          backgroundColor: "#000",
          aspectRatio: "16 / 9",
          userSelect: "none",
          outline: "none",
        }}
        className={className}
        data-test="video-player-container"
      >
        <video
          ref={videoRef}
          poster={poster}
          preload={preload}
          crossOrigin={crossOrigin}
          onClick={handleVideoClick}
          onDoubleClick={handleDoubleClick}
          playsInline
          style={{ width: "100%", height: "100%", display: "block", cursor: "pointer" }}
          data-test="video-element"
        >
          {subtitles?.map((track) => (
            <track
              key={track.id}
              kind="subtitles"
              src={track.src}
              label={track.label}
              srcLang={track.srclang}
              default={track.default}
            />
          ))}
        </video>

        {controls && (
          <Controls
            videoRef={videoRef}
            playerRef={playerRef}
            playerContainerRef={containerRef}
            playbackRates={playbackRates}
            enablePreview={enablePreview}
            thumbnailVtt={thumbnailVtt}
            isPlaying={state.isPlaying}
            volume={state.volume}
            isMuted={state.isMuted}
            playbackRate={state.playbackRate}
            isFullscreen={state.isFullscreen}
            isPictureInPicture={state.isPictureInPicture}
            isLive={state.isLive}
            qualityLevels={state.qualityLevels}
            currentQualityLevel={state.currentQualityLevel}
          />
        )}

        {/* LIVE badge */}
        {state.isLive && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: "#e53935",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "2px 8px",
              borderRadius: 3,
              pointerEvents: "none",
            }}
          >
            LIVE
          </div>
        )}

        {/* Buffering spinner */}
        {state.isBuffering && !state.error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#fff",
              pointerEvents: "none",
            }}
            data-test="buffering-indicator"
          >
            <div
              style={{
                width: 48,
                height: 48,
                border: "4px solid rgba(255,255,255,0.25)",
                borderTop: "4px solid #fff",
                borderRadius: "50%",
                animation: "rvp-spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes rvp-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error overlay */}
        {state.error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.85)",
              color: "#fff",
              padding: 24,
            }}
            data-test="error-overlay"
          >
            <div style={{ textAlign: "center", maxWidth: 400 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠</div>
              <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
                {state.error.code === "MEDIA_ERR_SRC_NOT_SUPPORTED"
                  ? "Unsupported Format"
                  : state.error.code.startsWith("HLS")
                    ? "Stream Error"
                    : "Playback Error"}
              </h3>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.75 }}>
                {state.error.message}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
