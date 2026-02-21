// Main component
import VideoPlayer from "./components/VideoPlayer";
export { VideoPlayer };

// Controls and Control Elements
export { Controls } from "./components/Controls";
export * as ControlElements from "./components/control-elements";

// Types
export type {
  VideoPlayerProps,
  VideoPlayerRef,
  PlayerState,
  PlaybackRate,
  HLSQualityLevel,
  SubtitleTrack,
  BufferedRange,
  VideoError,
  VideoErrorCode,
} from "./lib/types";

// Utilities
export { formatTime, isHLSUrl, getMimeType } from "./lib/format";
