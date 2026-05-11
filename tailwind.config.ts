import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Bebas Neue'", "cursive"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: "#0a0a0f",
        paper: "#f5f0e8",
        acid: "#c8f135",
        slate: "#1a1a2e",
        mist: "#2a2a3e",
        ghost: "#3a3a4e",
      },
      animation: {
        "flip-in": "flipIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-acid": "pulseAcid 2s ease-in-out infinite",
      },
      keyframes: {
        flipIn: {
          "0%": { transform: "rotateY(90deg)", opacity: "0" },
          "100%": { transform: "rotateY(0deg)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseAcid: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(200, 241, 53, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(200, 241, 53, 0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
