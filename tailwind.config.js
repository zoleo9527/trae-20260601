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
        navy: {
          50: "#f0f4f9",
          100: "#d8e1ee",
          200: "#b3c3dd",
          300: "#88a0c8",
          400: "#5b7daf",
          500: "#3d5f94",
          600: "#2c4876",
          700: "#1f355a",
          800: "#0F2540",
          900: "#0a1a2e",
        },
        accent: {
          DEFAULT: "#FF6B35",
          light: "#ffa07a",
          dark: "#e55a2b",
        },
        status: {
          pending: "#F59E0B",
          progress: "#3B82F6",
          success: "#10B981",
          danger: "#EF4444",
          disputed: "#EF4444",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgba(0,0,0,0.04)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
      },
    },
  },
  plugins: [],
};
