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
        'farm-dark': '#1a1a2e',
        'farm-darker': '#13132a',
        'farm-card': '#252547',
        'farm-border': '#3a3a5c',
        'farm-orange': '#ff6b35',
        'farm-red': '#e63946',
        'farm-green': '#2ec4b6',
        'farm-yellow': '#ffd166',
        'farm-text': '#e8e8f0',
        'farm-muted': '#8888aa',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-overdue': 'pulse-overdue 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
      keyframes: {
        'pulse-overdue': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
