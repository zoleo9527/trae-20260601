/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f1',
          100: '#e0ebde',
          200: '#c3d7bf',
          300: '#9cbc96',
          400: '#759c6d',
          500: '#57804f',
          600: '#43663d',
          700: '#365131',
          800: '#2d5a27',
          900: '#264024',
          950: '#122211',
        },
        amber: {
          50: '#fef8ec',
          100: '#fceed3',
          200: '#f8d9a5',
          300: '#f3bf6d',
          400: '#ed9c35',
          500: '#E87722',
          600: '#d65e18',
          700: '#b24616',
          800: '#8e3919',
          900: '#733018',
          950: '#3e1609',
        },
        cream: {
          50: '#fdfcf9',
          100: '#FAF8F3',
          200: '#f4efe4',
          300: '#e9e1ce',
          400: '#d9ccae',
          500: '#c9b68e',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(45, 90, 39, 0.08), 0 4px 16px -4px rgba(45, 90, 39, 0.06)',
        'card': '0 4px 12px -4px rgba(45, 90, 39, 0.1), 0 8px 24px -8px rgba(45, 90, 39, 0.08)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
