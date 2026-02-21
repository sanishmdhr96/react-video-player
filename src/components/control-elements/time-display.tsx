"use client";

import { memo } from "react";
import { formatTime } from "../../lib/format";
import "../../styles/ControlElements.css";

export interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  isLive?: boolean;
}

/**
 * TimeDisplay re-renders every timeupdate tick (currentTime changes).
 * Wrapped in memo anyway so that if its specific props haven't changed
 * (e.g. when only volume changes) it skips the render.
 */
const TimeDisplay = memo<TimeDisplayProps>(({ currentTime, duration, isLive = false }) => {
  if (isLive) {
    return (
      <span className="timeDisplay" style={{ opacity: 0.7 }}>
        {formatTime(currentTime)}
      </span>
    );
  }
  return (
    <span className="timeDisplay">
      {formatTime(currentTime)}
      <span style={{ opacity: 0.6 }}> / {formatTime(duration)}</span>
    </span>
  );
});

TimeDisplay.displayName = "TimeDisplay";
export default TimeDisplay;
