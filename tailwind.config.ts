import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08080c",
        panel: "#0e0e15",
        panel2: "#14141d",
        line: "#1e1f2b",
        line2: "#34384a",
        ink: "#e8eaf2",
        muted: "#8b93a8",
        accent: "#1a2fff",
        accent2: "#5ee0ff",
        good: "#3ddc9a",
        warn: "#e0a83c",
        bad: "#ff4d5e"
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      letterSpacing: {
        // 0,32em était joli mais illisible en 10 px : on resserre.
        hud: "0.18em",
        mega: "0.16em"
      },
      boxShadow: {
        glow: "0 0 60px rgba(26, 47, 255, 0.35)",
        glow2: "0 0 40px rgba(94, 224, 255, 0.18)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.6)"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(30,31,43,0.6) 0 1px, transparent 1px 100%)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "line-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" }
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 1s ease both",
        "line-grow": "line-grow 1.2s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
        marquee: "marquee 40s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
