/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#1E3A8A",
        },
        warning: {
          50: "#FFF7ED",
          500: "#F97316",
          600: "#EA580C",
        },
        success: {
          50: "#ECFDF5",
          500: "#10B981",
          600: "#059669",
        },
        danger: {
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
        },
        info: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },
        neutral: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        cardHover: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        sidebar: "-4px 0 24px rgba(0, 0, 0, 0.15)",
      },
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-out-right": "slideOutRight 0.3s ease-in",
        "fade-in": "fadeIn 0.2s ease-out",
        "pulse-bg": "pulseBg 1s ease-in-out",
        "pulse-ring": "pulseRing 2s ease-in-out infinite",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseBg: {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(30, 64, 175, 0.1)" },
        },
        pulseRing: {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(30, 64, 175, 0.4)",
            transform: "scale(1.1)",
          },
          "50%": {
            boxShadow: "0 0 0 8px rgba(30, 64, 175, 0)",
            transform: "scale(1.15)",
          },
        },
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
