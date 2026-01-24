import HLS, { type HLSConfig } from "hls.js";
import { type PlayerError } from "../types";

/**
 * Initialize HLS.js instance with sensible defaults
 */
export function initializeHLS(video: HTMLVideoElement, hlsUrl: string, config?: Partial<HLSConfig>) {
  if (!HLS.isSupported()) {
    console.warn("HLS.js is not supported in this browser");
    video.src = hlsUrl;
    return null;
  }

  const hls = new HLS({
    autoStartLoad: true,
    startLevel: undefined,
    capLevelOnFPS: true,
    capLevelToPlayerSize: true,
    enableWorker: true,
    // Adaptive bitrate switching
    abrEwmaFastLive: 3,
    abrEwmaSlowLive: 9,
    abrEwmaFastVoD: 3,
    abrEwmaSlowVoD: 9,
    abrBandwidthFactor: 0.95,
    abrBandwidthSafetyFactor: 0.9,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    maxBufferSize: 60 * 1000 * 1000, // 60MB
    ...config,
  });

  hls.attachMedia(video);
  hls.loadSource(hlsUrl);

  return hls;
}

/**
 * Convert HLS error to PlayerError
 */
export function hlsErrorToPlayerError(data: any): PlayerError {
  return {
    code: "HLS_ERROR",
    message: data.message || "HLS streaming error",
    details: {
      type: data.type,
      details: data.details,
    },
  };
}

/**
 * Handle HLS errors with recovery
 */
export function handleHLSError(hls: HLS, data: any): boolean {
  if (data.fatal) {
    switch (data.type) {
      case HLS.ErrorTypes.NETWORK_ERROR:
        console.error("Fatal network error encountered, retry loading", data);
        hls.startLoad();
        return true;
      case HLS.ErrorTypes.MEDIA_ERROR:
        console.error("Fatal media error encountered, recovery attempted", data);
        hls.recoverMediaError();
        return true;
      default:
        console.error("Fatal HLS error encountered:", data);
        return false;
    }
  }

  console.warn("Non-fatal HLS error:", data);
  return true;
}

/**
 * Destroy HLS instance
 */
export function destroyHLS(hls: HLS | null) {
  if (hls) {
    hls.destroy();
  }
}
