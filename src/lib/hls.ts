import HLS, { type HlsConfig, Events } from "hls.js";
import type { HLSQualityLevel, PlayerError } from "./types";

const MAX_NETWORK_RETRIES = 3;

/**
 * Initialize an HLS.js instance with sensible production defaults.
 * Returns null when HLS.js is not supported (caller should fall back to native).
 */
export function initializeHLS(
  video: HTMLVideoElement,
  hlsUrl: string,
  config?: Partial<HlsConfig>,
): HLS | null {
  if (!HLS.isSupported()) {
    return null;
  }

  const hls = new HLS({
    autoStartLoad: true,
    startLevel: -1,              // start with auto ABR
    capLevelOnFPSDrop: true,
    capLevelToPlayerSize: true,
    enableWorker: true,

    // ABR tuning
    abrEwmaFastLive: 3,
    abrEwmaSlowLive: 9,
    abrEwmaFastVoD: 3,
    abrEwmaSlowVoD: 9,
    abrBandWidthFactor: 0.95,

    // Buffer tuning
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    maxBufferSize: 60 * 1000 * 1000, // 60 MB

    // Low-latency live
    liveBackBufferLength: 30,
    liveSyncDurationCount: 3,

    ...config,
  });

  hls.attachMedia(video);
  hls.loadSource(hlsUrl);

  return hls;
}

/**
 * Map HLS.js level objects to our own quality-level shape.
 */
export function buildQualityLevels(levels: HLS["levels"]): HLSQualityLevel[] {
  return levels.map((l, i) => ({
    id: i,
    height: l.height ?? 0,
    width: l.width ?? 0,
    bitrate: l.bitrate ?? 0,
    name: l.height ? `${l.height}p` : `Level ${i + 1}`,
  }));
}

/**
 * Attach a robust error-recovery handler to an HLS instance.
 * Returns the retry-count object so callers can inspect / reset it.
 */
export function attachHLSErrorHandler(
  hls: HLS,
  onFatalError: (err: PlayerError) => void,
): { retries: number } {
  const state = { retries: 0 };

  hls.on(Events.ERROR, (_, data) => {
    if (!data.fatal) {
      // Non-fatal: log and let HLS.js auto-recover
      console.warn("[hls] non-fatal error:", data.type, data.details);
      return;
    }

    switch (data.type) {
      case HLS.ErrorTypes.NETWORK_ERROR:
        if (state.retries < MAX_NETWORK_RETRIES) {
          state.retries += 1;
          console.warn(
            `[hls] network error – retry ${state.retries}/${MAX_NETWORK_RETRIES}`,
          );
          // Exponential back-off before retrying
          setTimeout(() => hls.startLoad(), 1000 * state.retries);
        } else {
          console.error("[hls] fatal network error after retries:", data);
          onFatalError({
            code: "HLS_NETWORK_ERROR",
            message: "Failed to load video stream after multiple retries.",
            details: data.details,
          });
        }
        break;

      case HLS.ErrorTypes.MEDIA_ERROR:
        console.warn("[hls] media error – attempting recovery");
        hls.recoverMediaError();
        break;

      default:
        console.error("[hls] unrecoverable fatal error:", data);
        hls.destroy();
        onFatalError({
          code: "HLS_FATAL_ERROR",
          message: "An unrecoverable HLS error occurred.",
          details: data.details,
        });
    }
  });

  return state;
}

/** Safely destroy an HLS instance */
export function destroyHLS(hls: HLS | null): void {
  hls?.destroy();
}
