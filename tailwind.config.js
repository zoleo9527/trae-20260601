/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef4fa',
          100: '#dbe8f5',
          200: '#b7d1eb',
          300: '#7eb0da',
          400: '#4a8ec8',
          500: '#2d6099',
          600: '#254d7a',
          700: '#1e3a5f',
          800: '#1a2744',
          900: '#0f1d32',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: [
          'Noto Sans SC',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        serif: ['Noto Serif SC', 'Noto Sans SC', 'serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out both',
        'fade-in': 'fadeIn 0.25s ease-out both',
        'slide-in-right': 'slideInRight 0.3s ease-out both',
        'slide-in-up': 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulse-soft 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-glow': 'border-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(15, 29, 50, 0.04), 0 1px 2px -1px rgba(15, 29, 50, 0.04)',
        'card-hover': '0 4px 16px -2px rgba(15, 29, 50, 0.08)',
        'card-active': '0 8px 24px -4px rgba(15, 29, 50, 0.12)',
        'nav': '0 1px 3px 0 rgba(15, 29, 50, 0.06)',
        'elevated': '0 8px 32px -4px rgba(15, 29, 50, 0.12)',
      },
    },
  },
  plugins: [],
};
