"use client";

import React from "react";
import "../../styles/ControlElements.css";

// Play Button
export interface PlayButtonProps {
    onClick: () => void;
}

export const PlayButton: React.FC<PlayButtonProps> = ({ onClick }) => (
    <button
        onClick={onClick}
        className={'controlButton'}
        aria-label="Play"
        title="Play (Space)"
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
        </svg>
    </button>
);

// Pause Button
export interface PauseButtonProps {
    onClick: () => void;
}

export const PauseButton: React.FC<PauseButtonProps> = ({ onClick }) => (
    <button
        onClick={onClick}
        className={'controlButton'}
        aria-label="Pause"
        title="Pause (Space)"
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
        </svg>
    </button>
);

// Fullscreen Button
export interface FullscreenButtonProps {
    onClick: () => void;
    isFullscreen?: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
    onClick,
    isFullscreen = false,
}) => (
    <button
        onClick={onClick}
        className={'controlButton'}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {isFullscreen ? (
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            ) : (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            )}
        </svg>
    </button>
);

// Picture-in-Picture Button
export interface PiPButtonProps {
    onClick: () => void;
    isPiP?: boolean;
}

export const PiPButton: React.FC<PiPButtonProps> = ({
    onClick,
    isPiP = false,
}) => (
    <button
        onClick={onClick}
        className={'controlButton'}
        aria-label={isPiP ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
        title={isPiP ? "Exit Picture-in-Picture (P)" : "Picture-in-Picture (P)"}
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-4 .5h-8v-6h8v6z" />
        </svg>
    </button>
);

export default { PlayButton, PauseButton, FullscreenButton, PiPButton };