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
        background: "#FAF7F2",
        foreground: "#1C1917",
        muted: {
          DEFAULT: "#F3EDE4",
          foreground: "#78716C",
        },
        border: "#E7DFD4",
        input: "#FFFFFF",
        ring: "#EA580C",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1C1917",
        },
        primary: {
          DEFAULT: "#EA580C",
          foreground: "#FFFFFF",
          hover: "#C2410C",
          light: "#FFF7ED",
          muted: "#FFEDD5",
        },
        secondary: {
          DEFAULT: "#F5EDE2",
          foreground: "#44403C",
          hover: "#EADBCC",
        },
        accent: {
          DEFAULT: "#D97706",
          foreground: "#FFFFFF",
          light: "#FEF3C7",
        },
        terracotta: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        sand: {
          50: "#FDFCFB",
          100: "#FAF7F2",
          200: "#F3EDE4",
          300: "#E7DFD4",
          400: "#D4C7B8",
          500: "#B8A693",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#F0FDF4",
          foreground: "#15803D",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
          foreground: "#B45309",
        },
        destructive: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
          foreground: "#B91C1C",
        },
        "match-high": "#16A34A",
        "match-medium": "#D97706",
        "match-low": "#DC2626",
        "human-review": "#EA580C",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "'Space Grotesk'", "'Plus Jakarta Sans'", "sans-serif"],
        mono: ["var(--font-mono)", "'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        artisan: "0 1px 3px rgba(44, 28, 16, 0.04), 0 8px 24px -4px rgba(44, 28, 16, 0.06)",
        "artisan-card": "0 2px 4px rgba(44, 28, 16, 0.03), 0 12px 32px -6px rgba(44, 28, 16, 0.07)",
        "artisan-button": "0 2px 0 0 #9A3412, 0 4px 12px rgba(234, 88, 12, 0.22)",
        "artisan-hover": "0 4px 16px -2px rgba(44, 28, 16, 0.08), 0 16px 36px -4px rgba(234, 88, 12, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
