import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        foreground: "#F8FAFC",
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#A1B0CB",
        },
        border: "#334155",
        input: "#1E293B",
        ring: "#3B82F6",
        card: {
          DEFAULT: "#0F172A",
          foreground: "#F8FAFC",
        },
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#FFFFFF",
          hover: "#2563EB",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          foreground: "#FFFFFF",
        },
        success: "#10B981",
        warning: "#F59E0B",
        destructive: "#EF4444",
        "match-high": "#10B981",
        "match-medium": "#F59E0B",
        "match-low": "#EF4444",
        "human-review": "#F97316",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
