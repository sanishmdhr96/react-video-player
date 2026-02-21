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

export interface HLSQualityLevel {
  id: number;
  height: number;
  width: number;
  bitrate: number;
  /** Display name e.g. "1080p", "720p", "Auto" */
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
  /** True when the stream is a live HLS stream (Infinity duration) */
  isLive: boolean;
  /** Available HLS quality levels; empty for non-HLS sources */
  qualityLevels: HLSQualityLevel[];
  /** Currently active quality level id; -1 = ABR auto */
  currentQualityLevel: number;
}

export type PlaybackRate = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  /** Toggle mute while remembering the pre-mute volume */
  toggleMute: () => void;
  setPlaybackRate: (rate: PlaybackRate) => void;
  /** Set HLS quality level; pass -1 for automatic ABR */
  setQualityLevel: (level: number) => void;
  /** Jump to the live edge of an HLS live stream */
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
  /** Additional hls.js configuration options */
  hlsConfig?: Partial<HlsConfig>;
  /** Subtitle / caption tracks */
  subtitles?: SubtitleTrack[];
  /** crossorigin attribute for CORS-enabled preview thumbnails */
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
