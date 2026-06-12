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
          100: "#d9e3f0",
          200: "#aec5df",
          300: "#7ea3cb",
          400: "#5482b7",
          500: "#36659e",
          600: "#274e7d",
          700: "#1e3a5f",
          800: "#182e4b",
          900: "#12233a",
          950: "#0b1624",
        },
        amber: {
          50: "#faf6ee",
          100: "#f1e5cb",
          200: "#e6cca0",
          300: "#d4a853",
          400: "#c48f36",
          500: "#a87426",
          600: "#865a1e",
        },
        coral: {
          50: "#fff3ef",
          100: "#ffded1",
          200: "#ffbda5",
          300: "#ff9672",
          400: "#ff6b4a",
          500: "#ee4f2b",
          600: "#c93919",
        },
        sage: {
          50: "#f2f7f4",
          100: "#dcebe1",
          200: "#b8d7c3",
          300: "#8dbda0",
          400: "#5fa07a",
          500: "#3f835d",
          600: "#2e6949",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'number-roll': 'numberRoll 0.8s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        numberRoll: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(30, 58, 95, 0.06), 0 1px 3px rgba(30, 58, 95, 0.04)',
        'card-hover': '0 8px 24px rgba(30, 58, 95, 0.12), 0 2px 6px rgba(30, 58, 95, 0.06)',
        'navy-glow': '0 0 0 1px rgba(30, 58, 95, 0.1), 0 8px 24px rgba(30, 58, 95, 0.15)',
      },
    },
  },
  plugins: [],
};
