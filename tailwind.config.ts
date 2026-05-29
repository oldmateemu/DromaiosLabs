import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        command: {
          ink: "#172033",
          muted: "#667085",
          line: "#D8DEE8",
          panel: "#F7F9FC",
          surface: "#FFFFFF",
          navy: "#1F3A5F",
          teal: "#0F766E",
          amber: "#B45309",
          red: "#B42318",
          green: "#027A48"
        }
      },
      boxShadow: {
        control: "0 1px 2px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
