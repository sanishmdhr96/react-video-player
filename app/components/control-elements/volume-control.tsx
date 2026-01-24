"use client";

import React, { useState } from "react";
import styles from "./control-elements.module.css";

interface VolumeControlProps {
    volume: number;
    isMuted: boolean;
    onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
    volume,
    isMuted,
    onVolumeChange,
}) => {
    const [showSlider, setShowSlider] = useState(false);
    const displayVolume = isMuted ? 0 : volume;
    const percentage = displayVolume * 100;

    return (
        <div
            className={styles.volumeContainer}
            onMouseEnter={() => setShowSlider(true)}
            onMouseLeave={() => setShowSlider(false)}
        >
            <button
                onClick={() => onVolumeChange(isMuted ? 0.5 : 0)}
                className={styles.controlButton}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    {displayVolume === 0 ? (
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C23.16 14.42 24 13.3 24 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    ) : displayVolume < 0.5 ? (
                        <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                    ) : (
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    )}
                </svg>
            </button>

            {showSlider && (
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                    className={styles.volumeSlider}
                    style={{
                        background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${percentage}%, rgba(255, 255, 255, 0.3) ${percentage}%, rgba(255, 255, 255, 0.3) 100%)`
                    }}
                    aria-label="Volume"
                />
            )}
        </div>
    );
};

export default VolumeControl;