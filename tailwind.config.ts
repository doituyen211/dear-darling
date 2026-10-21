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
        // Dùng cho sự kiện đầu tiên (thu-dau) — giữ nguyên, không đổi.
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
        // Hệ nền tảng lấy cảm hứng Lovable — dùng cho các phần MỚI
        // (trang chủ và các sự kiện tương lai). Xem DESIGN.md.
        // Mọi xám đều dẫn xuất từ charcoal qua opacity, không dùng hex rời.
        cream: "#f7f4ed",
        charcoal: "#1c1c1c",
        "off-white": "#fcfbf8",
        "muted-gray": "#5f5f5d",
        "cream-line": "#eceae4",
        "charcoal-82": "rgba(28,28,28,0.82)",
        "charcoal-40": "rgba(28,28,28,0.4)",
        "charcoal-04": "rgba(28,28,28,0.04)",
        // Theme theo sự kiện. Giá trị là biến CSS do wrapper của từng
        // sự kiện ghi đè, nên một sự kiện có thể mang một thế giới màu
        // riêng mà không phải sửa class nào.
        event: {
          base: "var(--event-base)",
          surface: "var(--event-surface)",
          ink: "var(--event-ink)",
          muted: "var(--event-muted)",
          accent: "var(--event-accent)",
          "accent-2": "var(--event-accent-2)",
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
