/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Check if HLS URL
 */
export function isHLSUrl(url: string): boolean {
  return url.includes(".m3u8");
}

/**
 * Get MIME type for video source
 */
export function getMimeType(url: string): string {
  if (isHLSUrl(url)) {
    return "application/x-mpegURL";
  }

  if (url.includes(".mp4")) {
    return "video/mp4";
  }

  if (url.includes(".webm")) {
    return "video/webm";
  }

  if (url.includes(".ogv") || url.includes(".ogg")) {
    return "video/ogg";
  }

  return "video/mp4";
}
