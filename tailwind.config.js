/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1440px',
      },
    },
    extend: {
      colors: {
        wine: {
          50: '#FBF1F2',
          100: '#F5DDE0',
          200: '#E8B4BA',
          300: '#D98B94',
          400: '#C85D6A',
          500: '#B03A48',
          600: '#8B2635',
          700: '#6D1D29',
          800: '#52161F',
          900: '#3A0F16',
          950: '#26080D',
        },
        gold: {
          50: '#FBF6EE',
          100: '#F3E6D3',
          200: '#E6CDA7',
          300: '#D9B078',
          400: '#D4A574',
          500: '#C49460',
          600: '#A87A4A',
          700: '#87613B',
          800: '#63492E',
          900: '#4A3722',
          950: '#2E2014',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF6EE',
          200: '#F5F0E8',
          300: '#EDE4D3',
          400: '#DFD1B8',
          500: '#CDB894',
          600: '#B89D70',
          700: '#9A7F55',
          800: '#7D6546',
          900: '#66523B',
          950: '#3B2E1F',
        },
        ink: {
          50: '#F7F7F7',
          100: '#E3E3E3',
          200: '#C8C8C8',
          300: '#A4A4A4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#383838',
          900: '#2C2C2C',
          950: '#1A1A1A',
        },
        status: {
          pending: '#E07B26',
          processing: '#2E8BC0',
          success: '#3D8B5F',
          warning: '#D4A017',
          danger: '#8B2635',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(139, 38, 53, 0.08), 0 4px 16px -4px rgba(139, 38, 53, 0.06)',
        'card': '0 4px 20px -4px rgba(44, 44, 44, 0.08), 0 8px 32px -8px rgba(44, 44, 44, 0.06)',
        'elevated': '0 8px 32px -8px rgba(139, 38, 53, 0.12), 0 16px 48px -16px rgba(139, 38, 53, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
