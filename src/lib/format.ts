/**
 * Format seconds → MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Detect an HLS stream URL regardless of query-string parameters.
 */
export function isHLSUrl(url: string): boolean {
  try {
    const pathname = new URL(url, "https://x").pathname.toLowerCase();
    return (
      pathname.endsWith(".m3u8") ||
      /\/hls\//i.test(url) ||
      /\/stream\.m3u8/i.test(url)
    );
  } catch {
    return url.toLowerCase().includes(".m3u8");
  }
}

/**
 * Return the MIME type for a given video URL.
 */
export function getMimeType(url: string): string {
  if (isHLSUrl(url)) return "application/x-mpegURL";

  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".ogv") || lower.endsWith(".ogg")) return "video/ogg";
  if (lower.endsWith(".mov")) return "video/quicktime";

  return "video/mp4";
}
