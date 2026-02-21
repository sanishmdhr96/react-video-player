"use client";

import { memo } from "react";
import { formatTime } from "../../lib/format";

export interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  isLive?: boolean;
}


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
