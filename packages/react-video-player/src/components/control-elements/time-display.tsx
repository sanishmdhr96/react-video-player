"use client";

import React from "react";
import { formatTime } from "../../lib/format";
import "../../styles/ControlElements.css";

export interface TimeDisplayProps {
    currentTime: number;
    duration: number;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
    currentTime,
    duration,
}) => {
    return (
        <span className={'timeDisplay'}>
            {formatTime(currentTime)} / {formatTime(duration)}
        </span>
    );
};

export default TimeDisplay;