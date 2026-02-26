import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050b0a",
        panel: "#0a1412",
        ink: "#e9f5ef",
        muted: "#8aa59a",
        line: "#1d332d",
        brand: "#14c784",
        good: "#14c784",
        warn: "#d6a43b",
        bad: "#dd5a5a"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(20, 199, 132, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
