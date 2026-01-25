"use client";

import React, { useState } from "react";
import type { PlaybackRate } from "../../lib/types";
import "../../styles/ControlElements.css";

export interface SettingsMenuProps {
    currentRate: number;
    playbackRates: PlaybackRate[];
    onRateChange: (rate: PlaybackRate) => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
    currentRate,
    playbackRates,
    onRateChange,
}) => {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div
            className={'settingsContainer'}
            onMouseEnter={() => setShowSettings(true)}
            onMouseLeave={() => setShowSettings(false)}
        >
            <button
                onClick={() => setShowSettings(!showSettings)}
                className={'controlButton'}
                aria-label="Settings"
                title="Playback speed"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                    <circle cx="5" cy="12" r="2" />
                </svg>
            </button>

            {showSettings && (
                <div className={'settingsDropdown'}>
                    {playbackRates.map((rate) => (
                        <button
                            key={rate}
                            onClick={() => {
                                onRateChange(rate);
                                setShowSettings(false);
                            }}
                            className={`settingsOption ${currentRate === rate ? 'active' : ""
                                }`}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SettingsMenu;