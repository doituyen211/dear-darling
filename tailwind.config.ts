import type { Config } from "tailwindcss";
import { WIDE_QUERY } from "./lib/media";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Dùng chung hằng số với `useMediaQuery` trong carousel, để phần
        // CSS và phần JS luôn dùng cùng một ngưỡng.
        wide: { raw: WIDE_QUERY },
      },
      colors: {
        // Deep indigo-night background, read by lamplight rather than
        // the usual cream/terracotta or black/neon defaults.
        ink: {
          950: "#0c0f1a",
          900: "#12172a",
          800: "#1a2038",
        },
        candle: {
          // warm parchment cream used for the message text
          light: "#f4ead9",
          // muted slate used for helper copy
          muted: "#8b93ac",
          // warm gold accent — the only spot of color on the page
          gold: "#c9a876",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-instrument)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "glow-pulse": "glow-pulse 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
