import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#05070f",
          900: "#0a0e1a",
          850: "#0d1324",
          800: "#121a2f",
          700: "#1a243d",
        },
        cl: {
          blue: "#00d4ff",
          "blue-dim": "#0a8fad",
          gold: "#c9a227",
          white: "#e8eef7",
          muted: "#8b9bb4",
        },
      },
      boxShadow: {
        glow: "0 0 24px rgba(0, 212, 255, 0.25)",
        "glow-sm": "0 0 12px rgba(0, 212, 255, 0.15)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "pitch-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 255, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(10, 143, 173, 0.08), transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
