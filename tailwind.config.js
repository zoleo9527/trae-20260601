/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: '#E8F4F6',
          100: '#C5E4E9',
          200: '#9DD1D9',
          300: '#74BEC9',
          400: '#4DABB8',
          500: '#2A97A7',
          600: '#1D7A8A',
          700: '#155D6B',
          800: '#0F4C5C',
          900: '#0A3540',
          950: '#062028',
        },
        accent: {
          50: '#FEF3EC',
          100: '#FDE3D0',
          200: '#FBC9A1',
          300: '#F9AF72',
          400: '#F69543',
          500: '#E36414',
          600: '#C45310',
          700: '#9E420D',
          800: '#78320A',
          900: '#522207',
        },
        ink: {
          50: '#F7F6F3',
          100: '#E8E6DF',
          200: '#D4D2C8',
          300: '#B0ADA0',
          400: '#8A8677',
          500: '#6B675A',
          600: '#524F44',
          700: '#3D3B33',
          800: '#2A2822',
          900: '#1A1915',
        },
        paper: '#FAF8F3',
        amber: '#E36414',
        rose: '#DC2626',
        emerald: '#059669',
      },
      fontFamily: {
        serif: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(26, 25, 21, 0.06), 0 1px 2px rgba(26, 25, 21, 0.04)',
        'card-hover': '0 4px 12px rgba(26, 25, 21, 0.1), 0 2px 4px rgba(26, 25, 21, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'count-up': 'countUp 0.4s ease-out both',
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
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
