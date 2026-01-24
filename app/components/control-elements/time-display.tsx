"use client";

import React from "react";
import { formatTime } from "../../lib/format";
import styles from "./control-elements.module.css";

interface TimeDisplayProps {
    currentTime: number;
    duration: number;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
    currentTime,
    duration,
}) => {
    return (
        <span className={styles.timeDisplay}>
            {formatTime(currentTime)} / {formatTime(duration)}
        </span>
    );
};

export default TimeDisplay;