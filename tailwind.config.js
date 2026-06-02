/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        primary: {
          50: '#FFF5ED',
          100: '#FFE8D6',
          200: '#FFD1AD',
          300: '#FFB985',
          400: '#FFA25C',
          500: '#FF8A3D',
          600: '#E67024',
          700: '#B3571C',
          800: '#803E14',
          900: '#4D250C',
        },
        success: {
          50: '#EDFAF8',
          100: '#D4F4F0',
          200: '#A9E9E1',
          300: '#7EDED2',
          400: '#53D3C3',
          500: '#4ECDC4',
          600: '#3BA99F',
          700: '#2C7F77',
          800: '#1D5650',
          900: '#0E2D29',
        },
        warning: {
          50: '#FFF0F0',
          100: '#FFDBDB',
          200: '#FFB8B8',
          300: '#FF9494',
          400: '#FF7F7F',
          500: '#FF6B6B',
          600: '#E64A4A',
          700: '#B33030',
          800: '#801F1F',
          900: '#4D1010',
        },
        info: {
          50: '#EAF6FA',
          100: '#CFEAF2',
          200: '#9FD5E5',
          300: '#6FC0D8',
          400: '#5ABBD3',
          500: '#45B7D1',
          600: '#2E94AB',
          700: '#227081',
          800: '#174D58',
          900: '#0B292F',
        },
        cream: {
          50: '#FFFCF9',
          100: '#FFF9F2',
          200: '#FFF3E5',
          300: '#FFEDD8',
          400: '#FFE7CB',
          500: '#FFE1BE',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 30px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'bounce-soft': 'bounce-soft 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
};
