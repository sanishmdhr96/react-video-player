"use client";

import React, { useRef, useState } from "react";
import {
  Play, Pause, SkipForward, Volume2, Maximize, PictureInPicture,
  Zap, Smartphone, Radio, Subtitles, Layers, MonitorPlay,
} from "lucide-react";
import { VideoPlayer } from "react-helios";
import type { VideoError, VideoPlayerRef } from "react-helios";
import "react-helios/styles";

export default function DemoPage() {
  const playerRef = useRef<VideoPlayerRef>(null);
  const [activeTab, setActiveTab] = useState("demo");

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Header */}
      <header style={{ padding: "40px 24px", textAlign: "center", color: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "inline-block", padding: "8px 20px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50px", fontSize: "14px", fontWeight: "600", marginBottom: "20px", backdropFilter: "blur(10px)" }}>
            react-helios
          </div>
          <h1 style={{ fontSize: "56px", fontWeight: "800", margin: "0 0 20px 0", letterSpacing: "-1px" }}>
            Production-Ready<br />Video Player
          </h1>
          <p style={{ fontSize: "20px", opacity: 0.95, maxWidth: "600px", margin: "0 auto 32px", lineHeight: "1.6" }}>
            HLS streaming, adaptive quality, live streams, VTT sprite thumbnails, subtitles, theater mode — zero re-renders during playback.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://www.npmjs.com/package/react-helios"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "14px 32px", backgroundColor: "white", color: "#667eea", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", textDecoration: "none" }}
            >
              Get Started
            </a>
            <a
              href="https://github.com/sanishmdhr96/react-video-player"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "14px 32px", backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "2px solid white", borderRadius: "10px", fontSize: "16px", fontWeight: "600", cursor: "pointer", backdropFilter: "blur(10px)", textDecoration: "none" }}
            >
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Video Player Demo */}
        <section style={{ backgroundColor: "white", borderRadius: "20px", padding: "40px", marginBottom: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", gap: "16px", marginBottom: "32px", borderBottom: "2px solid #f0f0f0" }}>
            {["demo", "features", "shortcuts"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "transparent",
                  color: activeTab === tab ? "#667eea" : "#666",
                  border: "none",
                  borderBottom: activeTab === tab ? "3px solid #667eea" : "3px solid transparent",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  marginBottom: "-2px",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "demo" && (
            <>
              <div style={{ aspectRatio: "16 / 9", width: "100%", marginBottom: "32px", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", borderRadius: "12px", overflow: "hidden" }}>
                <VideoPlayer
                  ref={playerRef}
                  src="https://luniba.com/high_quality_video/index.m3u8"
                  thumbnailVtt="https://luniba.com/high_quality_video/thumbnails/thumbnails.vtt"
                  controls
                  autoplay={false}
                  playbackRates={[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
                  enablePreview={true}
                  enableHLS={true}
                  onError={(err: VideoError) => console.error("Video error:", err)}
                />
              </div>

              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "#333" }}>
                  Programmatic Controls
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                  {[
                    { icon: Play,             label: "Play",          action: () => playerRef.current?.play() },
                    { icon: Pause,            label: "Pause",         action: () => playerRef.current?.pause() },
                    { icon: SkipForward,      label: "Jump 30s",      action: () => playerRef.current?.seek(30) },
                    { icon: Volume2,          label: "50% Vol",       action: () => playerRef.current?.setVolume(0.5) },
                    { icon: Zap,              label: "1.5× Speed",    action: () => playerRef.current?.setPlaybackRate(1.5) },
                    { icon: Maximize,         label: "Fullscreen",    action: () => playerRef.current?.toggleFullscreen() },
                    { icon: PictureInPicture, label: "PiP",           action: () => playerRef.current?.togglePictureInPicture() },
                    { icon: MonitorPlay,      label: "Theater",       action: () => playerRef.current?.toggleTheaterMode() },
                  ].map(({ icon: Icon, label, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{
                        padding: "16px",
                        backgroundColor: "#f8f9fa",
                        color: "#333",
                        border: "2px solid #e9ecef",
                        borderRadius: "12px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#667eea";
                        e.currentTarget.style.color = "white";
                        e.currentTarget.style.borderColor = "#667eea";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                        e.currentTarget.style.color = "#333";
                        e.currentTarget.style.borderColor = "#e9ecef";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <Icon size={20} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "features" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              {[
                { icon: Radio,      title: "HLS Streaming",      desc: "Adaptive bitrate via HLS.js. Auto quality selection with manual override. Native HLS on Safari.", color: "#667eea" },
                { icon: Layers,     title: "VTT Thumbnails",     desc: "Sprite-sheet preview on progress bar hover, edge-clamped like YouTube. Zero extra network requests per hover.", color: "#764ba2" },
                { icon: MonitorPlay,title: "Theater Mode",       desc: "Wide-layout theater mode toggle. Fires onTheaterModeChange for layout integration.", color: "#f093fb" },
                { icon: Radio,      title: "Live Streams",       desc: "Infinite-duration detection, LIVE badge, GO LIVE button, and L key shortcut to seek to the live edge.", color: "#4facfe" },
                { icon: Subtitles,  title: "Subtitles",          desc: "Multiple WebVTT subtitle tracks with language selection built into the settings menu.", color: "#43e97b" },
                { icon: Smartphone, title: "Zero Re-renders",    desc: "timeupdate and progress events handled via direct DOM mutation. React state only changes on play/pause/volume.", color: "#fa709a" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  style={{
                    padding: "28px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
                    border: "2px solid #e9ecef",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 12px 24px ${color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e9ecef";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                    <Icon size={24} color={color} />
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", color: "#333" }}>{title}</h3>
                  <p style={{ fontSize: "14px", color: "#666", margin: 0, lineHeight: "1.6" }}>{desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "shortcuts" && (
            <>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#333", marginBottom: "16px" }}>Player focus</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "32px" }}>
                {[
                  { key: "Space / K", action: "Play / Pause" },
                  { key: "← →",       action: "Seek ±5 seconds" },
                  { key: "↑ ↓",       action: "Volume ±10%" },
                  { key: "M",          action: "Mute / Unmute (restores volume)" },
                  { key: "F",          action: "Toggle Fullscreen" },
                  { key: "T",          action: "Toggle Theater mode" },
                  { key: "P",          action: "Toggle Picture-in-Picture" },
                  { key: "L",          action: "Seek to live edge (live streams)" },
                  { key: "0 – 9",      action: "Jump to 0 – 90% of duration" },
                ].map(({ key, action }) => (
                  <div key={key} style={{ padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "12px", border: "2px solid #e9ecef" }}>
                    <div style={{ display: "inline-block", padding: "8px 16px", backgroundColor: "white", border: "2px solid #667eea", borderRadius: "8px", fontFamily: "monospace", fontWeight: "700", fontSize: "14px", color: "#667eea", marginBottom: "12px" }}>
                      {key}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>{action}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#333", marginBottom: "16px" }}>Progress bar focus</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {[
                  { key: "← →",             action: "Seek ±5 seconds" },
                  { key: "Shift + ← →",     action: "Seek ±10 seconds" },
                  { key: "Home",             action: "Jump to start" },
                  { key: "End",              action: "Jump to end" },
                ].map(({ key, action }) => (
                  <div key={key} style={{ padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "12px", border: "2px solid #e9ecef" }}>
                    <div style={{ display: "inline-block", padding: "8px 16px", backgroundColor: "white", border: "2px solid #764ba2", borderRadius: "8px", fontFamily: "monospace", fontWeight: "700", fontSize: "14px", color: "#764ba2", marginBottom: "12px" }}>
                      {key}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>{action}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Quick Start */}
        <section style={{ backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "20px", padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "24px", color: "#333" }}>Quick Start</h2>
          <div style={{ backgroundColor: "#1e1e1e", color: "#d4d4d4", padding: "24px", borderRadius: "12px", fontFamily: "monospace", fontSize: "14px", marginBottom: "20px", overflowX: "auto" }}>
            <div style={{ color: "#6a9955", marginBottom: "4px" }}>// Install</div>
            <div style={{ marginBottom: "20px" }}>npm install react-helios</div>

            <div style={{ color: "#6a9955", marginBottom: "4px" }}>// Import</div>
            <div><span style={{ color: "#c586c0" }}>import</span>{" "}{"{ VideoPlayer }"}{" "}<span style={{ color: "#c586c0" }}>from</span>{" "}<span style={{ color: "#ce9178" }}>"react-helios"</span>;</div>
            <div style={{ marginBottom: "20px" }}><span style={{ color: "#c586c0" }}>import</span>{" "}<span style={{ color: "#ce9178" }}>"react-helios/styles"</span>;</div>

            <div style={{ color: "#6a9955", marginBottom: "4px" }}>// Use</div>
            <div>{"<"}<span style={{ color: "#4ec9b0" }}>VideoPlayer</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#9cdcfe" }}>src</span>=<span style={{ color: "#ce9178" }}>"https://example.com/stream.m3u8"</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#9cdcfe" }}>thumbnailVtt</span>=<span style={{ color: "#ce9178" }}>"https://example.com/thumbs/storyboard.vtt"</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#9cdcfe" }}>controls</span></div>
            <div>{"/"}{">"}
            </div>
          </div>
          <p style={{ fontSize: "16px", color: "#666", lineHeight: "1.6" }}>
            Works with Next.js and plain React. TypeScript types included. HLS.js is bundled — no extra install needed.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "40px 24px", color: "white" }}>
        <p style={{ fontSize: "14px", opacity: 0.8 }}>
          Built with ❤️ for the React community
        </p>
      </footer>
    </div>
  );
}
