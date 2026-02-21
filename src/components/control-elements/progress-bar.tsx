"use client";

import React, { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import type { VideoPlayerRef, BufferedRange } from "../../lib/types";
import { formatTime } from "../../lib/format";
import "../../styles/ProgressBar.css";

export interface ProgressBarProps {
  playerRef: VideoPlayerRef;
  currentTime: number;
  duration: number;
  bufferedRanges: BufferedRange[];
  enablePreview?: boolean;
}

/**
 * ProgressBar re-renders on every timeupdate (currentTime changes).
 * Internal optimisations:
 *  - getBoundingClientRect cached in a ref, invalidated on resize (no layout
 *    thrash per mouse-move pixel)
 *  - Buffered segments memoized (only recalculate when bufferedRanges or
 *    duration change)
 *  - Preview RAF and fallback timeout share a single cancel path so the
 *    same frame isn't drawn twice
 */
const ProgressBar: React.FC<ProgressBarProps> = memo(({
  playerRef,
  currentTime,
  duration,
  bufferedRanges,
  enablePreview = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPos, setHoverPos] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  // Fix #6: ref so the non-passive touchmove listener can read isDragging
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  /**
   * Cache the bounding rect so mouse-move doesn't trigger layout reflow
   * on every pixel. Invalidated whenever the window is resized.
   */
  const rectCacheRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const invalidate = () => { rectCacheRef.current = null; };
    window.addEventListener("resize", invalidate, { passive: true });
    return () => window.removeEventListener("resize", invalidate);
  }, []);

  const getRect = useCallback((): DOMRect | null => {
    if (!rectCacheRef.current && containerRef.current) {
      rectCacheRef.current = containerRef.current.getBoundingClientRect();
    }
    return rectCacheRef.current;
  }, []);

  // ─── Preview video setup ────────────────────────────────────────────────
  useEffect(() => {
    if (!enablePreview) return;

    const mainVideo = playerRef.getVideoElement();
    const previewVideo = previewVideoRef.current;
    if (!mainVideo || !previewVideo) return;

    const videoSrc = mainVideo.currentSrc || mainVideo.src;
    if (!videoSrc) return;

    previewVideo.src = videoSrc;
    previewVideo.muted = true;
    previewVideo.preload = "auto";
    previewVideo.crossOrigin = mainVideo.crossOrigin;

    const onReady = () => setPreviewLoaded(true);
    const onErr = () => { console.warn("[preview] failed to load"); setPreviewLoaded(false); };

    previewVideo.addEventListener("loadedmetadata", onReady);
    previewVideo.addEventListener("loadeddata", onReady);
    previewVideo.addEventListener("error", onErr);

    return () => {
      previewVideo.removeEventListener("loadedmetadata", onReady);
      previewVideo.removeEventListener("loadeddata", onReady);
      previewVideo.removeEventListener("error", onErr);
      // Fix #4: removeAttribute('src') avoids a spurious network request for ""
      previewVideo.removeAttribute("src");
      previewVideo.load();
      setPreviewLoaded(false);
    };
  }, [playerRef, enablePreview]);

  // ─── Fix #6: non-passive touchmove to prevent scroll only while scrubbing ──
  // React 17+ attaches root listeners as passive, so calling e.preventDefault()
  // in onTouchMove has no effect. We register a non-passive native listener
  // that calls preventDefault only when a drag is in progress.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) e.preventDefault();
    };
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => container.removeEventListener("touchmove", onTouchMove);
  }, []);

  // ─── Draw preview frame ─────────────────────────────────────────────────
  const updatePreview = useCallback((time: number) => {
    if (!enablePreview || !previewLoaded) return;

    const previewVideo = previewVideoRef.current;
    const canvas = canvasRef.current;
    if (!previewVideo || !canvas) return;

    // Throttle to ~10 seeks/s
    const now = Date.now();
    if (now - lastSeekTimeRef.current < 100) return;
    lastSeekTimeRef.current = now;

    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    let drawn = false;

    const drawFrame = () => {
      if (drawn) return; // Guard against both RAF and timeout firing
      if (previewVideo.readyState >= 2) {
        drawn = true;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
          if (!ctx) return;
          canvas.width = 160;
          canvas.height = 90;
          ctx.drawImage(previewVideo, 0, 0, 160, 90);
        });
      }
    };

    previewVideo.currentTime = time;
    previewVideo.addEventListener("seeked", drawFrame, { once: true });
    // Fallback if seeked never fires
    updateTimeoutRef.current = setTimeout(() => {
      if (!drawn) drawFrame();
    }, 200);
  }, [enablePreview, previewLoaded]);

  // ─── Geometry helpers (no layout thrash) ───────────────────────────────
  const getTimeFromClientX = useCallback((clientX: number): number => {
    const rect = getRect();
    // Fix #9: guard against zero-width container (would produce NaN)
    if (!rect || rect.width === 0) return 0;
    const pos = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (pos / rect.width) * duration;
  }, [getRect, duration]);

  const getPxFromClientX = useCallback((clientX: number): number => {
    const rect = getRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(clientX - rect.left, rect.width));
  }, [getRect]);

  // ─── Keyboard control (Fix #5) ──────────────────────────────────────────
  // The slider has role="slider" and tabIndex={0}; ARIA requires keyboard
  // navigation. stopImmediatePropagation prevents the Controls window-level
  // handler from also firing for the same keypress.
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowRight": {
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        const step = e.shiftKey ? 10 : 5;
        const newTime = e.key === "ArrowLeft"
          ? Math.max(0, currentTime - step)
          : Math.min(duration || 0, currentTime + step);
        playerRef.seek(newTime);
        break;
      }
      case "Home":
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        playerRef.seek(0);
        break;
      case "End":
        if (duration > 0) {
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
          playerRef.seek(duration);
        }
        break;
    }
  }, [currentTime, duration, playerRef]);

  // ─── Mouse / touch handlers ─────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const time = getTimeFromClientX(e.clientX);
    const px = getPxFromClientX(e.clientX);
    setHoverTime(time);
    setHoverPos(px);

    if (isDragging) {
      playerRef.seek(time);
    } else if (enablePreview && previewLoaded) {
      updatePreview(time);
    }
  }, [isDragging, enablePreview, previewLoaded, playerRef, updatePreview, getTimeFromClientX, getPxFromClientX]);

  const handleMouseEnter = useCallback(() => {
    // Invalidate rect cache when re-entering (layout may have shifted)
    rectCacheRef.current = null;
    setShowPreview(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowPreview(false);
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    playerRef.seek(getTimeFromClientX(e.clientX));
  }, [getTimeFromClientX, playerRef]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) playerRef.seek(getTimeFromClientX(e.clientX));
  }, [isDragging, getTimeFromClientX, playerRef]);

  // Fix #6: removed e.preventDefault() from touchstart — page scroll must not
  // be blocked on initial touch. Scroll is only prevented during an active drag
  // via the non-passive touchmove listener registered above.
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    rectCacheRef.current = null; // Invalidate on touch start
    setIsDragging(true);
    playerRef.seek(getTimeFromClientX(e.touches[0].clientX));
  }, [getTimeFromClientX, playerRef]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    playerRef.seek(getTimeFromClientX(e.touches[0].clientX));
  }, [isDragging, getTimeFromClientX, playerRef]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  // Global mouseup so drag keeps working when cursor leaves the element
  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  /**
   * Memoize buffered segment nodes – only recalculated when bufferedRanges
   * or duration actually change, not on every timeupdate tick.
   */
  const bufferedSegments = useMemo(() => {
    if (duration <= 0) return null;
    return bufferedRanges.map((range, i) => {
      const start = (range.start / duration) * 100;
      const width = ((range.end - range.start) / duration) * 100;
      return (
        <div
          key={i}
          className="bufferedSegment"
          style={{ left: `${start}%`, width: `${width}%` }}
        />
      );
    });
  }, [bufferedRanges, duration]);

  return (
    <div
      ref={containerRef}
      className="progressContainer"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={formatTime(currentTime)}
      tabIndex={0}
    >
      {/* Hidden preview video */}
      {enablePreview && (
        <video ref={previewVideoRef} className="previewVideo" playsInline muted preload="auto" aria-hidden="true" />
      )}

      {/* Preview thumbnail tooltip */}
      {enablePreview && showPreview && previewLoaded && (
        <div className="previewTooltip" style={{ left: hoverPos }} aria-hidden="true">
          <canvas ref={canvasRef} className="previewCanvas" />
          <div className="previewTime">{formatTime(hoverTime)}</div>
        </div>
      )}

      {/* Track background (overflow:hidden – keeps buffered/filled bars clipped) */}
      <div className="progressBackground">
        {bufferedSegments}
        <div className="progressFilled" style={{ width: `${progress}%` }} />
        {showPreview && (
          <div className="hoverIndicator" style={{ left: hoverPos }} aria-hidden="true" />
        )}
      </div>

      {/*
        Scrub handle sits OUTSIDE progressBackground's overflow:hidden.
        Positioned relative to progressContainer (taller due to padding),
        centering it on the track via top:50%.
      */}
      <div
        className={`scrubHandle${isDragging ? " dragging" : ""}`}
        style={{ left: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  );
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
