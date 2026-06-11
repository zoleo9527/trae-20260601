/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4F9',
          100: '#D9E3EF',
          200: '#B3C7DF',
          300: '#8DABCF',
          400: '#4A6FA5',
          500: '#0F2B4A',
          600: '#0D2540',
          700: '#0A1E35',
          800: '#08172A',
          900: '#05101F',
        },
        amber: {
          50: '#FBF5E8',
          100: '#F5E6C5',
          200: '#EDD49D',
          300: '#E5C175',
          400: '#DDAF4D',
          500: '#D4A853',
          600: '#B98F3A',
          700: '#8B6B2C',
          800: '#5C471E',
          900: '#2E2410',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 43, 74, 0.08), 0 1px 2px rgba(15, 43, 74, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 43, 74, 0.12), 0 2px 4px rgba(15, 43, 74, 0.08)',
        'glow': '0 0 0 3px rgba(212, 168, 83, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
