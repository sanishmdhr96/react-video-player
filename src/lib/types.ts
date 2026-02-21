import type { HlsConfig } from "hls.js";

export interface BufferedRange {
  start: number;
  end: number;
}

export type VideoErrorCode =
  | "MEDIA_ERR_ABORTED"
  | "MEDIA_ERR_NETWORK"
  | "MEDIA_ERR_DECODE"
  | "MEDIA_ERR_SRC_NOT_SUPPORTED"
  | "HLS_NETWORK_ERROR"
  | "HLS_FATAL_ERROR"
  | "UNKNOWN";

export interface VideoError {
  code: VideoErrorCode;
  message: string;
}

/** Display name e.g. "1080p", "720p", "Auto" */
export interface HLSQualityLevel {
  id: number;
  height: number;
  width: number;
  bitrate: number;
  name: string;
}

export interface SubtitleTrack {
  id: string;
  src: string;
  label: string;
  srclang: string;
  default?: boolean;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  bufferedRanges: BufferedRange[];
  isBuffering: boolean;
  error: VideoError | null;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isLive: boolean;
  qualityLevels: HLSQualityLevel[];
  currentQualityLevel: number;
}

export type PlaybackRate = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  setQualityLevel: (level: number) => void;
  seekToLive: () => void;
  toggleFullscreen: () => Promise<void>;
  togglePictureInPicture: () => Promise<void>;
  getState: () => PlayerState;
  getVideoElement: () => HTMLVideoElement | null;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  playbackRates?: PlaybackRate[];
  className?: string;
  enableHLS?: boolean;
  enablePreview?: boolean;
  /**
   * URL to a WebVTT thumbnail track for sprite-sheet preview on the progress bar.
   *
   * The VTT file should map time ranges to sprite-sheet coordinates using the
   * standard `#xywh=x,y,w,h` fragment format:
   *
   * ```
   * WEBVTT
   *
   * 00:00:00.000 --> 00:00:05.000
   * https://cdn.example.com/thumbs/storyboard0.jpg#xywh=0,0,160,90
   * ```
   *
   * When provided, hovering the progress bar shows a thumbnail instead of
   * requiring a second video decode. If omitted, only the timestamp tooltip
   * is shown.
   */
  thumbnailVtt?: string;
  hlsConfig?: Partial<HlsConfig>;
  subtitles?: SubtitleTrack[];
  crossOrigin?: "anonymous" | "use-credentials";
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: VideoError) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
}

/** Internal error type used by the HLS module */
export interface PlayerError {
  code: string;
  message: string;
  details?: unknown;
}
