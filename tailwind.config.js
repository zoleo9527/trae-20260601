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
        ochre: {
          50: '#fdf5ef',
          100: '#fae7d6',
          200: '#f4cba9',
          300: '#eca673',
          400: '#e3783c',
          500: '#dc5a1e',
          600: '#cd4214',
          700: '#aa3213',
          800: '#8B2500',
          900: '#712012',
          950: '#3d0d07',
        },
        brass: {
          50: '#fbf8ee',
          100: '#f5edc9',
          200: '#ebd98f',
          300: '#e0c054',
          400: '#d8ac35',
          500: '#c49022',
          600: '#B8860B',
          700: '#8e630c',
          800: '#744f12',
          900: '#634115',
          950: '#382207',
        },
        carbon: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#2C2C2C',
          900: '#1a1a1a',
          950: '#0e0e0e',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'press': 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.05)',
        'card': '0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
