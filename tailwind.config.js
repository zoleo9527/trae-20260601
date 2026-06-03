/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        factory: {
          bg: '#0f0f1a',
          surface: '#1a1a2e',
          'surface-light': '#252540',
          border: '#2d2d4a',
          'border-light': '#3d3d5c',
        },
        warn: {
          orange: '#ff6b35',
          yellow: '#ffd54f',
        },
        pass: {
          green: '#00c853',
        },
        flow: {
          blue: '#4fc3f7',
        },
        danger: {
          red: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow-orange': 'glowOrange 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowOrange: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255,107,53,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255,107,53,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
