"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import type { PlayerState, VideoPlayerRef } from "../../lib/types";
import { formatTime } from "../../lib/format";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
    state: PlayerState;
    playerRef: VideoPlayerRef;
    enablePreview?: boolean;
    enablePrefetch?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
    state,
    playerRef,
    enablePreview = true,
    enablePrefetch = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [hoverTime, setHoverTime] = useState(0);
    const [hoverPos, setHoverPos] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [previewLoaded, setPreviewLoaded] = useState(false);

    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSeekTimeRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    // Initialize preview video
    useEffect(() => {
        if (!enablePreview) return;

        const mainVideo = playerRef.getVideoElement();
        const previewVideo = previewVideoRef.current;

        if (!mainVideo || !previewVideo) return;

        previewVideo.src = mainVideo.src;
        previewVideo.muted = true;
        previewVideo.preload = "auto";

        const handleLoadedMetadata = () => {
            setPreviewLoaded(true);
            if (previewVideo.duration > 0) {
                previewVideo.currentTime = 0;
            }
        };

        const handleLoadedData = () => {
            setPreviewLoaded(true);
        };

        const handleError = () => {
            console.warn("Preview video failed to load");
            setPreviewLoaded(false);
        };

        previewVideo.addEventListener("loadedmetadata", handleLoadedMetadata);
        previewVideo.addEventListener("loadeddata", handleLoadedData);
        previewVideo.addEventListener("error", handleError);

        return () => {
            previewVideo.removeEventListener("loadedmetadata", handleLoadedMetadata);
            previewVideo.removeEventListener("loadeddata", handleLoadedData);
            previewVideo.removeEventListener("error", handleError);
            previewVideo.src = "";
            previewVideo.load();
        };
    }, [playerRef, enablePreview]);

    // Update preview frame
    const updatePreview = useCallback(
        (time: number) => {
            if (!enablePreview) return;

            const previewVideo = previewVideoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d", {
                alpha: false,
                willReadFrequently: false,
            });

            if (!previewVideo || !canvas || !ctx || !previewLoaded) return;

            const now = Date.now();
            if (now - lastSeekTimeRef.current < 100) return;

            lastSeekTimeRef.current = now;

            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            previewVideo.currentTime = time;

            const captureFrame = () => {
                if (previewVideo.readyState >= 2) {
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current);
                    }

                    rafRef.current = requestAnimationFrame(() => {
                        canvas.width = 160;
                        canvas.height = 90;
                        ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
                    });
                }
            };

            previewVideo.addEventListener("seeked", captureFrame, { once: true });
            updateTimeoutRef.current = setTimeout(captureFrame, 150);
        },
        [enablePreview, previewLoaded]
    );

    // Get time from mouse position
    const getTimeFromPosition = useCallback(
        (clientX: number) => {
            const container = containerRef.current;
            if (!container) return 0;

            const rect = container.getBoundingClientRect();
            const pos = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percent = pos / rect.width;
            return percent * state.duration;
        },
        [state.duration]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const time = getTimeFromPosition(e.clientX);

            setHoverTime(time);
            setHoverPos(pos);

            if (isDragging) {
                playerRef.seek(time);
            } else if (enablePreview && previewLoaded) {
                updatePreview(time);
            }
        },
        [isDragging, enablePreview, previewLoaded, playerRef, updatePreview, getTimeFromPosition]
    );

    const handleMouseEnter = useCallback(() => {
        setShowPreview(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setShowPreview(false);
        setIsDragging(false);
    }, []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(true);
            const time = getTimeFromPosition(e.clientX);
            playerRef.seek(time);
        },
        [getTimeFromPosition, playerRef]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!isDragging) {
                const time = getTimeFromPosition(e.clientX);
                playerRef.seek(time);
            }
        },
        [isDragging, getTimeFromPosition, playerRef]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Global mouse up handler
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
    }, []);

    const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

    return (
        <div
            ref={containerRef}
            className={styles.progressContainer}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(state.duration)}
            aria-valuenow={Math.round(state.currentTime)}
        >
            {/* Hidden preview video */}
            {enablePreview && (
                <video
                    ref={previewVideoRef}
                    className={styles.previewVideo}
                    playsInline
                    muted
                    preload="auto"
                />
            )}

            {/* Preview tooltip */}
            {enablePreview && showPreview && previewLoaded && (
                <div
                    className={styles.previewTooltip}
                    style={{ left: `${hoverPos}px` }}
                >
                    <canvas
                        ref={canvasRef}
                        className={styles.previewCanvas}
                    />
                    <div className={styles.previewTime}>
                        {formatTime(hoverTime)}
                    </div>
                </div>
            )}

            {/* Progress bar background */}
            <div className={styles.progressBackground}>
                {/* Buffered segments */}
                {state.bufferedRanges.map((range, i) => {
                    const startPercent = (range.start / state.duration) * 100;
                    const endPercent = (range.end / state.duration) * 100;
                    return (
                        <div
                            key={i}
                            className={styles.bufferedSegment}
                            style={{
                                left: `${startPercent}%`,
                                width: `${endPercent - startPercent}%`,
                            }}
                        />
                    );
                })}

                {/* Current progress */}
                <div
                    className={styles.progressFilled}
                    style={{ width: `${progress}%` }}
                />

                {/* Hover indicator */}
                {showPreview && (
                    <div
                        className={styles.hoverIndicator}
                        style={{ left: `${hoverPos}px` }}
                    />
                )}

                {/* Scrub handle */}
                <div
                    className={`${styles.scrubHandle} ${isDragging ? styles.dragging : ""}`}
                    style={{ left: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;