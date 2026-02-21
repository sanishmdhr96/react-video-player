"use client";

import { memo, useState, useRef, useEffect, useMemo } from "react";
import type { PlaybackRate, HLSQualityLevel } from "../../lib/types";
import "../../styles/ControlElements.css";

export interface SettingsMenuProps {
  currentRate: number;
  playbackRates: PlaybackRate[];
  onRateChange: (rate: PlaybackRate) => void;
  qualityLevels?: HLSQualityLevel[];
  currentQualityLevel?: number;
  onQualityChange?: (level: number) => void;
}

type Tab = "speed" | "quality";

/**
 * SettingsMenu wrapped in React.memo.
 * playbackRate and qualityLevel rarely change → this component skips
 * almost all re-renders during normal playback.
 *
 * sortedLevels is memoized so the .sort() only runs when qualityLevels
 * actually changes (usually once after manifest is parsed).
 */
const SettingsMenu = memo<SettingsMenuProps>(({
  currentRate,
  playbackRates,
  onRateChange,
  qualityLevels = [],
  currentQualityLevel = -1,
  onQualityChange,
}) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("speed");
  const containerRef = useRef<HTMLDivElement>(null);

  const hasQuality = qualityLevels.length > 0 && !!onQualityChange;

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /**
   * Sort once when qualityLevels changes – not on every render.
   */
  const sortedLevels = useMemo(
    () => [...qualityLevels].sort((a, b) => b.bitrate - a.bitrate),
    [qualityLevels],
  );

  const currentQualityName = useMemo(() => {
    if (currentQualityLevel === -1) return "Auto";
    return qualityLevels.find((l) => l.id === currentQualityLevel)?.name ?? "Auto";
  }, [qualityLevels, currentQualityLevel]);

  return (
    <div ref={containerRef} className="settingsContainer">
      <button
        onClick={() => setOpen((o) => !o)}
        className="controlButton"
        aria-label="Settings"
        title="Settings"
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54a6.88 6.88 0 0 0-1.61.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54a6.88 6.88 0 0 0 1.61-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 0 1 8.4 12 3.6 3.6 0 0 1 12 8.4a3.6 3.6 0 0 1 3.6 3.6 3.6 3.6 0 0 1-3.6 3.6z" />
        </svg>
      </button>

      {open && (
        <div className="settingsDropdown" role="menu">
          {hasQuality && (
            <div className="settingsTabs">
              <button
                className={`settingsTab${tab === "speed" ? " active" : ""}`}
                onClick={() => setTab("speed")}
              >
                Speed
              </button>
              <button
                className={`settingsTab${tab === "quality" ? " active" : ""}`}
                onClick={() => setTab("quality")}
              >
                Quality
              </button>
            </div>
          )}

          {(!hasQuality || tab === "speed") && (
            <div>
              {!hasQuality && <div className="settingsPanelLabel">Playback Speed</div>}
              {playbackRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => { onRateChange(rate); setOpen(false); }}
                  className={`settingsOption${currentRate === rate ? " active" : ""}`}
                  role="menuitemradio"
                  aria-checked={currentRate === rate}
                >
                  {rate === 1 ? "Normal" : `${rate}×`}
                </button>
              ))}
            </div>
          )}

          {hasQuality && tab === "quality" && (
            <div>
              <button
                onClick={() => { onQualityChange!(-1); setOpen(false); }}
                className={`settingsOption${currentQualityLevel === -1 ? " active" : ""}`}
                role="menuitemradio"
                aria-checked={currentQualityLevel === -1}
              >
                Auto {currentQualityLevel === -1 && currentQualityName !== "Auto"
                  ? `(${currentQualityName})`
                  : ""}
              </button>
              {sortedLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => { onQualityChange!(level.id); setOpen(false); }}
                  className={`settingsOption${currentQualityLevel === level.id ? " active" : ""}`}
                  role="menuitemradio"
                  aria-checked={currentQualityLevel === level.id}
                >
                  {level.name}
                  {level.bitrate > 0 && (
                    <span className="settingsOptionBadge">
                      {Math.round(level.bitrate / 1000)} kbps
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SettingsMenu.displayName = "SettingsMenu";
export default SettingsMenu;
