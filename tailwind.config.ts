import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0D0E10",
          950: "#0D0E10",
          900: "#141518",
          850: "#181A1E",
          800: "#1C1E23",
          700: "#232529",
        },
        line: {
          DEFAULT: "#23262B",
          soft: "#1B1D21",
          strong: "#2E3138",
        },
        paper: {
          DEFAULT: "#E8E9EA",
          dim: "#A6A9B0",
          faint: "#6E7178",
        },
        accent: {
          DEFAULT: "#8B93FF",
          soft: "#B9BDFF",
          deep: "#5A64E6",
        },
        ok: {
          DEFAULT: "#4CD08C",
          dim: "#2F9E68",
        },
        bad: {
          DEFAULT: "#F0626F",
          dim: "#C24B57",
        },
        warn: {
          DEFAULT: "#F2B85C",
          dim: "#C98F32",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.035em",
      },
      animation: {
        "fade-up": "fadeUp 320ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "fade-in": "fadeIn 240ms ease-out both",
        "scale-in": "scaleIn 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "slide-down": "slideDown 280ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "bar-grow": "barGrow 700ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "draw-line": "drawLine 900ms cubic-bezier(0.77, 0, 0.175, 1) both",
        "blink": "blink 1.1s steps(2, start) infinite",
        "spin-slow": "spin 1.4s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        barGrow: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        drawLine: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        blink: {
          "50%": { opacity: "0" },
        },
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(139,147,255,0.25), 0 0 32px -8px rgba(110,120,255,0.35)",
        pop: "0 12px 40px -8px rgba(0,0,0,0.75)",
      },
    },
  },
  plugins: [],
};

export default config;
