"use client";

import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import type { VideoPlayerRef } from "../lib/types";

interface ContextMenuProps {
  x: number;
  y: number;
  isPlaying: boolean;
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playerRef: VideoPlayerRef;
  onClose: () => void;
}

export const ContextMenu = memo<ContextMenuProps>(
  ({ x, y, isPlaying, src, videoRef, playerRef, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isLooping, setIsLooping] = useState(
      () => videoRef.current?.loop ?? false,
    );

    // Clamp position so menu never overflows the viewport
    const adjustedX = Math.min(x, window.innerWidth - 220);
    const adjustedY = Math.min(y, window.innerHeight - 290);

    useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node))
          onClose();
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      const handleScroll = () => onClose();

      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("mousedown", handleMouseDown);
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }, [onClose]);

    const handlePlayPause = useCallback(() => {
      isPlaying ? playerRef.pause() : playerRef.play();
      onClose();
    }, [isPlaying, playerRef, onClose]);

    const handleToggleLoop = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      const next = !isLooping;
      video.loop = next;
      setIsLooping(next);
    }, [videoRef, isLooping]);

    const handleCopyUrl = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(src);
      } catch {}
      onClose();
    }, [src, onClose]);

    const handleCopyTimestamp = useCallback(async () => {
      const time = Math.floor(videoRef.current?.currentTime ?? 0);
      try {
        await navigator.clipboard.writeText(`${src}?t=${time}`);
      } catch {}
      onClose();
    }, [src, videoRef, onClose]);

    const handlePiP = useCallback(() => {
      playerRef.togglePictureInPicture();
      onClose();
    }, [playerRef, onClose]);

    const handleFullscreen = useCallback(() => {
      playerRef.toggleFullscreen();
      onClose();
    }, [playerRef, onClose]);

    return (
      <div
        ref={menuRef}
        className="contextMenu"
        style={{ left: adjustedX, top: adjustedY }}
      >
        <button className="contextMenuItem" onClick={handlePlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button className="contextMenuItem" onClick={handleToggleLoop}>
          <span>Loop</span>
          {isLooping && <span className="contextMenuCheck">✓</span>}
        </button>

        <div className="contextMenuDivider" />

        <button className="contextMenuItem" onClick={handleCopyUrl}>
          Copy video URL
        </button>
        <button className="contextMenuItem" onClick={handleCopyTimestamp}>
          Copy video URL at current time
        </button>

        <div className="contextMenuDivider" />

        <button className="contextMenuItem" onClick={handlePiP}>
          Picture-in-Picture
        </button>
        <button className="contextMenuItem" onClick={handleFullscreen}>
          Fullscreen
        </button>
      </div>
    );
  },
);

ContextMenu.displayName = "ContextMenu";
