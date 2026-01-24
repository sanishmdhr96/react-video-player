"use client";

import React from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import HLS from "hls.js";
import {
  type PlaybackRate,
  type PlayerState,
  type VideoPlayerRef,
} from "../lib/types";
import {
  destroyHLS,
  handleHLSError,
  hlsErrorToPlayerError,
  initializeHLS,
} from "../lib/hls";
import { isHLSUrl } from "../lib/format";

interface UseVideoPlayerOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playbackRates?: PlaybackRate[];
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
  enableHLS?: boolean;
}

export function useVideoPlayer(
  videoRef: React.RefObject<HTMLVideoElement>,
  options: UseVideoPlayerOptions = {},
) {
  const hlsRef = useRef<HLS | null>(null);
  const fullscreenContainerRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: options.muted || false,
    playbackRate: 1,
    isFullscreen: false,
    isPictureInPicture: false,
    isBuffering: false,
    bufferedRanges: [],
    error: null,
  });

  // Setup video element listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
      options.onPlay?.();
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      options.onPause?.();
    };

    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      options.onEnded?.();
    };

    const handleTimeUpdate = () => {
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
      options.onTimeUpdate?.(video.currentTime);
    };

    const handleDurationChange = () => {
      setState((prev) => ({ ...prev, duration: video.duration }));
      options.onDurationChange?.(video.duration);
    };

    const handleVolumeChange = () => {
      setState((prev) => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted,
      }));
    };

    const handleRateChange = () => {
      setState((prev) => ({ ...prev, playbackRate: video.playbackRate }));
    };

    const handleError = () => {
      const error = video.error;
      if (error) {
        let code:
          | "MEDIA_ERR_ABORTED"
          | "MEDIA_ERR_NETWORK"
          | "MEDIA_ERR_DECODE"
          | "MEDIA_ERR_SRC_NOT_SUPPORTED"
          | "UNKNOWN" = "UNKNOWN";
        switch (error.code) {
          case 1:
            code = "MEDIA_ERR_ABORTED";
            break;
          case 2:
            code = "MEDIA_ERR_NETWORK";
            break;
          case 3:
            code = "MEDIA_ERR_DECODE";
            break;
          case 4:
            code = "MEDIA_ERR_SRC_NOT_SUPPORTED";
            break;
          default:
            code = "UNKNOWN";
        }
        const playerError = {
          code,
          message: error.message || "Unknown media error",
        };
        setState((prev) => ({ ...prev, error: playerError }));
        options.onError?.(playerError);
      }
    };

    const handleWaiting = () => {
      setState((prev) => ({ ...prev, isBuffering: true }));
      options.onBuffering?.(true);
    };

    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isBuffering: false }));
      options.onBuffering?.(false);
    };

    const handleProgress = () => {
      const bufferedRanges: Array<{ start: number; end: number }> = [];
      for (let i = 0; i < video.buffered.length; i++) {
        bufferedRanges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i),
        });
      }
      setState((prev) => ({ ...prev, bufferedRanges }));
    };

    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setState((prev) => ({ ...prev, isFullscreen }));
    };

    const handlePictureInPictureChange = () => {
      setState((prev) => ({
        ...prev,
        isPictureInPicture: document.pictureInPictureElement === video,
      }));
    };

    // Add event listeners
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("volumechange", handleVolumeChange);
    video.addEventListener("ratechange", handleRateChange);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("progress", handleProgress);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener(
      "pictureInPicturechange",
      handlePictureInPictureChange,
    );

    // Set initial state
    if (options.muted) video.muted = true;
    if (options.autoplay) video.autoplay = true;
    if (options.loop) video.loop = true;

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("volumechange", handleVolumeChange);
      video.removeEventListener("ratechange", handleRateChange);
      video.removeEventListener("error", handleError);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("progress", handleProgress);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "pictureInPicturechange",
        handlePictureInPictureChange,
      );
    };
  }, [options, videoRef]);

  // Control methods
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (video) {
      try {
        await video.play();
      } catch (err) {
        console.error("Play failed:", err);
      }
    }
  }, [videoRef]);

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
  }, [videoRef]);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(0, Math.min(time, video.duration));
      }
    },
    [videoRef],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const video = videoRef.current;
      if (video) {
        video.volume = Math.max(0, Math.min(volume, 1));
      }
    },
    [videoRef],
  );

  const setPlaybackRate = useCallback(
    (rate: PlaybackRate) => {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = rate;
      }
    },
    [videoRef],
  );

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const container = fullscreenContainerRef.current || video.parentElement;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen().catch(() => {
          // Fallback for webkit
          (container as any).webkitRequestFullscreen?.();
        });
      } else {
        document.exitFullscreen().catch(() => {
          (document as any).webkitExitFullscreen?.();
        });
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  }, [videoRef]);

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP toggle failed:", err);
    }
  }, [videoRef]);

  const getState = useCallback((): PlayerState => {
    return { ...state };
  }, [state]);

  const getVideoElement = useCallback((): HTMLVideoElement | null => {
    return videoRef.current || null;
  }, [videoRef]);

  const ref: VideoPlayerRef = {
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    toggleFullscreen,
    togglePictureInPicture,
    getState,
    getVideoElement,
  };

  return {
    state,
    ref,
    hlsRef,
    fullscreenContainerRef,
  };
}
