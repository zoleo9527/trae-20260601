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
        'ops-dark': '#0f0f1a',
        'ops-card': '#1a1a2e',
        'ops-border': '#2a2a4a',
        'ops-accent': '#f59e0b',
        'ops-danger': '#ef4444',
        'ops-success': '#10b981',
        'ops-info': '#3b82f6',
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse-red 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
