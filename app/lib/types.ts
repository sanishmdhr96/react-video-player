/**
 * Core types for the video player library
 */

export type PlaybackRate = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export type PreloadType = "auto" | "metadata" | "none";

export interface VideoPlayerProps {
  /**
   * The video source URL (MP4 or HLS .m3u8)
   */
  src: string;

  /**
   * Poster image URL displayed before playback starts
   */
  poster?: string;

  /**
   * Autoplay the video on load
   */
  autoplay?: boolean;

  /**
   * Start muted
   */
  muted?: boolean;

  /**
   * Loop the video
   */
  loop?: boolean;

  /**
   * Show custom controls
   */
  controls?: boolean;

  /**
   * Preload strategy
   */
  preload?: PreloadType;

  /**
   * Available playback rates
   */
  playbackRates?: PlaybackRate[];

  /**
   * Custom class name for the player container
   */
  className?: string;

  /**
   * Enable HLS adaptive streaming
   */
  enableHLS?: boolean;

  /**
   * Callbacks
   */
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: PlayerError) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onBuffering?: (isBuffering: boolean) => void;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isBuffering: boolean;
  bufferedRanges: BufferedRange[];
  error: PlayerError | null;
}

export interface BufferedRange {
  start: number;
  end: number;
}

export interface PlayerError {
  code: "MEDIA_ERR_ABORTED" | "MEDIA_ERR_NETWORK" | "MEDIA_ERR_DECODE" | "MEDIA_ERR_SRC_NOT_SUPPORTED" | "HLS_ERROR" | "UNKNOWN";
  message: string;
  details?: unknown;
}

export interface VideoPlayerRef {
  /**
   * Play the video
   */
  play: () => Promise<void>;

  /**
   * Pause the video
   */
  pause: () => void;

  /**
   * Seek to a specific time (in seconds)
   */
  seek: (time: number) => void;

  /**
   * Set volume (0-1)
   */
  setVolume: (volume: number) => void;

  /**
   * Set playback rate
   */
  setPlaybackRate: (rate: PlaybackRate) => void;

  /**
   * Toggle fullscreen
   */
  toggleFullscreen: () => Promise<void>;

  /**
   * Toggle picture-in-picture
   */
  togglePictureInPicture: () => Promise<void>;

  /**
   * Get current player state
   */
  getState: () => PlayerState;

  /**
   * Get the underlying video element
   */
  getVideoElement: () => HTMLVideoElement | null;
}
