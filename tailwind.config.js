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
        factory: {
          bg: '#0F1117',
          surface: '#1A1D27',
          border: '#2A2D3A',
          amber: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
          blue: '#3B82F6',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { borderColor: '#EF4444' },
          '50%': { borderColor: 'transparent' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
