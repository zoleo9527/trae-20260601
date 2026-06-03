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
        wine: {
          50: '#fdf2f2',
          100: '#fce4e4',
          200: '#f9c9c9',
          300: '#f3a3a3',
          400: '#ea7070',
          500: '#dc143c',
          600: '#c71536',
          700: '#a9122d',
          800: '#8B1A1A',
          900: '#6b1515',
          950: '#4a0d0d',
        },
        champagne: {
          50: '#fdfbf4',
          100: '#faf5e3',
          200: '#f4e7bf',
          300: '#edd496',
          400: '#e4ba63',
          500: '#D4AF37',
          600: '#c49e2e',
          700: '#a38228',
          800: '#856926',
          900: '#6e5723',
          950: '#3c2e10',
        },
        forest: {
          50: '#f1f9f2',
          100: '#dff1e1',
          200: '#bfe3c3',
          300: '#91cc97',
          400: '#5cae65',
          500: '#228B22',
          600: '#1f7d1f',
          700: '#1c6a1c',
          800: '#195619',
          900: '#154715',
          950: '#0b270b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fff3c6',
          200: '#ffe588',
          300: '#ffd249',
          400: '#ffc020',
          500: '#FF8C00',
          600: '#e67300',
          700: '#cc6600',
          800: '#b35900',
          900: '#994d00',
          950: '#663300',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Lato', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
