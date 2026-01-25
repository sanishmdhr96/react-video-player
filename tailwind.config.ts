import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./packages/react-video-player/src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
