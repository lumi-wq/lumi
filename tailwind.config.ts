import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cobalt: "#3B00FF",
        obsidian: "#1A1A1A",
        chalk: "#F6F5F2",
        mint: "#E2ECE9",
      },
      fontFamily: {
        display: ["var(--font-gabarito-latin)", "var(--font-manrope)", "sans-serif"],
        sans: ["var(--font-geist-sans)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1280px",
      },
      borderRadius: {
        input: "12px",
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
