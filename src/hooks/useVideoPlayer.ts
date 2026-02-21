"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import HLS, { Events } from "hls.js";
import type {
  PlayerState,
  VideoPlayerRef,
  PlaybackRate,
  HLSQualityLevel,
  VideoError,
  VideoErrorCode,
} from "../lib/types";
import type { HlsConfig } from "hls.js";
import { isHLSUrl } from "../lib/format";
import { buildQualityLevels } from "../lib/hls";

interface UseVideoPlayerOptions {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playbackRates?: PlaybackRate[];
  enableHLS?: boolean;
  hlsConfig?: Partial<HlsConfig>;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: VideoError) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
}

const DEFAULT_STATE: PlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isFullscreen: false,
  isPictureInPicture: false,
  isBuffering: false,
  bufferedRanges: [],
  error: null,
  isLive: false,
  qualityLevels: [],
  currentQualityLevel: -1,
};

export function useVideoPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  options: UseVideoPlayerOptions = {},
) {
  const hlsRef = useRef<HLS | null>(null);
  const fullscreenContainerRef = useRef<HTMLElement | null>(null);
  const lastVolumeRef = useRef<number>(1);
  const networkRetriesRef = useRef<number>(0);

  // ── Stable refs so effects never need options/state in their dep arrays ──────
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [state, setState] = useState<PlayerState>({
    ...DEFAULT_STATE,
    isMuted: options.muted ?? false,
    volume: options.muted ? 0 : 1,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // ─── Source / HLS initialisation ────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    networkRetriesRef.current = 0;

    setState((prev) => ({
      ...prev,
      currentTime: 0,
      duration: 0,
      error: null,
      isBuffering: false,
      isLive: false,
      qualityLevels: [],
      currentQualityLevel: -1,
    }));

    if (!src) return;

    const opts = optionsRef.current;

    if (opts.enableHLS !== false && isHLSUrl(src)) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS (Safari) – no HLS.js instance needed
        video.src = src;
        video.load();
        if (opts.autoplay) video.play().catch(() => {});
      } else if (HLS.isSupported()) {
        const hls = new HLS({
          autoStartLoad: true,
          startLevel: -1,
          capLevelToPlayerSize: true,
          capLevelOnFPSDrop: true,
          enableWorker: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          liveBackBufferLength: 30,
          liveSyncDurationCount: 3,
          ...opts.hlsConfig,
        });

        hls.attachMedia(video);
        hls.loadSource(src);

        hls.on(Events.MANIFEST_PARSED, (_, data) => {
          const levels: HLSQualityLevel[] = buildQualityLevels(data.levels);
          setState((prev) => ({
            ...prev,
            qualityLevels: levels,
            currentQualityLevel: -1,
          }));
          if (optionsRef.current.autoplay) video.play().catch(() => {});
        });

        hls.on(Events.LEVEL_SWITCHED, (_, data) => {
          setState((prev) => ({ ...prev, currentQualityLevel: data.level }));
        });

        const MAX_RETRIES = 3;
        hls.on(Events.ERROR, (_, data) => {
          if (!data.fatal) {
            console.warn("[hls] non-fatal:", data.details);
            return;
          }
          switch (data.type) {
            case HLS.ErrorTypes.NETWORK_ERROR:
              if (networkRetriesRef.current < MAX_RETRIES) {
                networkRetriesRef.current += 1;
                const delay = 1000 * networkRetriesRef.current;
                console.warn(
                  `[hls] network error – retry ${networkRetriesRef.current}/${MAX_RETRIES} in ${delay}ms`,
                );
                // Guard against retry firing after this HLS instance was replaced/destroyed
                setTimeout(() => {
                  if (hlsRef.current === hls) hls.startLoad();
                }, delay);
              } else {
                const err: VideoError = {
                  code: "HLS_NETWORK_ERROR",
                  message: "Failed to load stream after multiple retries.",
                };
                setState((prev) => ({ ...prev, error: err }));
                optionsRef.current.onError?.(err);
              }
              break;
            case HLS.ErrorTypes.MEDIA_ERROR:
              console.warn("[hls] media error – recovering");
              hls.recoverMediaError();
              break;
            default: {
              hls.destroy();
              hlsRef.current = null;
              const fatalErr: VideoError = {
                code: "HLS_FATAL_ERROR",
                message: "An unrecoverable HLS error occurred.",
              };
              setState((prev) => ({ ...prev, error: fatalErr }));
              optionsRef.current.onError?.(fatalErr);
              break;
            }
          }
        });

        hlsRef.current = hls;
      }
    } else {
      // Regular video (mp4, webm, etc.)
      video.src = src;
      video.load();
      if (opts.autoplay) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, videoRef]);

  // ─── Video element event listeners ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (optionsRef.current.muted) video.muted = true;
    if (optionsRef.current.loop) video.loop = true;

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
      optionsRef.current.onPlay?.();
    };
    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      optionsRef.current.onPause?.();
    };
    const handleEnded = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      optionsRef.current.onEnded?.();
    };
    const handleTimeUpdate = () => {
      // Only notify external callback – internal state is updated but
      // onTimeUpdate is called outside setState to avoid extra renders.
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
      optionsRef.current.onTimeUpdate?.(video.currentTime);
    };
    const handleDurationChange = () => {
      const dur = video.duration;
      const live = !Number.isFinite(dur);
      setState((prev) => ({ ...prev, duration: live ? 0 : dur, isLive: live }));
      if (!live) optionsRef.current.onDurationChange?.(dur);
    };
    const handleVolumeChange = () => {
      const vol = video.volume;
      if (vol > 0 && !video.muted) lastVolumeRef.current = vol;
      setState((prev) => ({
        ...prev,
        volume: vol,
        isMuted: video.muted || vol === 0,
      }));
    };
    const handleRateChange = () => {
      setState((prev) => ({ ...prev, playbackRate: video.playbackRate }));
    };
    const handleError = () => {
      const e = video.error;
      if (!e) return;
      const codeMap: Partial<Record<number, VideoErrorCode>> = {
        1: "MEDIA_ERR_ABORTED",
        2: "MEDIA_ERR_NETWORK",
        3: "MEDIA_ERR_DECODE",
        4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
      };
      const err: VideoError = {
        code: codeMap[e.code] ?? "UNKNOWN",
        message: e.message || "Unknown media error",
      };
      setState((prev) => ({ ...prev, error: err }));
      optionsRef.current.onError?.(err);
    };
    const handleWaiting = () => {
      setState((prev) => ({ ...prev, isBuffering: true }));
      optionsRef.current.onBuffering?.(true);
    };
    const handleCanPlay = () => {
      setState((prev) => ({ ...prev, isBuffering: false }));
      optionsRef.current.onBuffering?.(false);
    };
    const handlePlaying = () =>
      setState((prev) => ({ ...prev, isBuffering: false }));
    const handleProgress = () => {
      const ranges: Array<{ start: number; end: number }> = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({
          start: video.buffered.start(i),
          end: video.buffered.end(i),
        });
      }
      setState((prev) => ({ ...prev, bufferedRanges: ranges }));
    };
    const handleFullscreenChange = () => {
      const fs = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setState((prev) => ({ ...prev, isFullscreen: fs }));
    };
    const handlePiPChange = () => {
      setState((prev) => ({
        ...prev,
        isPictureInPicture: document.pictureInPictureElement === video,
      }));
    };

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
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("progress", handleProgress);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    video.addEventListener("enterpictureinpicture", handlePiPChange);
    video.addEventListener("leavepictureinpicture", handlePiPChange);

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
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("progress", handleProgress);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      video.removeEventListener("enterpictureinpicture", handlePiPChange);
      video.removeEventListener("leavepictureinpicture", handlePiPChange);
    };
  }, [videoRef]); // stable – options accessed via optionsRef

  // ─── Control methods (all stable via useCallback with empty or minimal deps) ─
  const play = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError")
        console.error("[player] play() failed:", err);
    }
  }, [videoRef]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, [videoRef]);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.max(0, Math.min(time, video.duration || time));
    },
    [videoRef],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const video = videoRef.current;
      if (!video) return;
      const v = Math.max(0, Math.min(volume, 1));
      if (v > 0) lastVolumeRef.current = v;
      video.volume = v;
      video.muted = v === 0;
    },
    [videoRef],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) {
      const restore = lastVolumeRef.current > 0 ? lastVolumeRef.current : 1;
      video.volume = restore;
      video.muted = false;
    } else {
      lastVolumeRef.current = video.volume;
      video.muted = true;
    }
  }, [videoRef]);

  const setPlaybackRate = useCallback(
    (rate: PlaybackRate) => {
      const video = videoRef.current;
      if (video) video.playbackRate = rate;
    },
    [videoRef],
  );

  const setQualityLevel = useCallback((level: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = level;
    setState((prev) => ({ ...prev, currentQualityLevel: level }));
  }, []);

  const seekToLive = useCallback(() => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;
    const livePos = hls.liveSyncPosition;
    if (livePos != null && Number.isFinite(livePos))
      video.currentTime = livePos;
  }, [videoRef]);

  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const container = fullscreenContainerRef.current ?? video.parentElement;
    if (!container) return;
    try {
      if (
        !document.fullscreenElement &&
        !(document as any).webkitFullscreenElement
      ) {
        if (container.requestFullscreen) await container.requestFullscreen();
        else (container as any).webkitRequestFullscreen?.();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else (document as any).webkitExitFullscreen?.();
      }
    } catch (err) {
      console.error("[player] fullscreen toggle failed:", err);
    }
  }, [videoRef]);

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch (err) {
      console.error("[player] PiP toggle failed:", err);
    }
  }, [videoRef]);

  const getState = useCallback(
    (): PlayerState => ({ ...stateRef.current }),
    [],
  );

  const getVideoElement = useCallback(
    (): HTMLVideoElement | null => videoRef.current ?? null,
    [videoRef],
  );

  const ref = useMemo<VideoPlayerRef>(
    () => ({
      play,
      pause,
      seek,
      setVolume,
      toggleMute,
      setPlaybackRate,
      setQualityLevel,
      seekToLive,
      toggleFullscreen,
      togglePictureInPicture,
      getState,
      getVideoElement,
    }),
    [
      play,
      pause,
      seek,
      setVolume,
      toggleMute,
      setPlaybackRate,
      setQualityLevel,
      seekToLive,
      toggleFullscreen,
      togglePictureInPicture,
      getState,
      getVideoElement,
    ],
  );

  return { state, ref, hlsRef, fullscreenContainerRef };
}
