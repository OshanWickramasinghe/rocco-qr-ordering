import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF8F3",
        espresso: {
          DEFAULT: "#2B1B12",
          light: "#3D2A1D",
          dark: "#1C110B",
        },
        chili: {
          DEFAULT: "#C1272D",
          light: "#E0454B",
          dark: "#8F1A1F",
        },
        gold: {
          DEFAULT: "#E8A33D",
          light: "#F4C27A",
          dark: "#C17F1F",
        },
        basil: {
          DEFAULT: "#3A5A40",
          light: "#588157",
        },
        ink: "#1F1A17",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        ticket: "0 1px 0 rgba(0,0,0,0.05), 0 8px 24px -8px rgba(43,27,18,0.25)",
      },
      keyframes: {
        "ticket-in": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "ticket-in": "ticket-in 0.35s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
