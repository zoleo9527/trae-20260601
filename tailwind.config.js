/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        'luxury': {
          900: '#0F2424',
          800: '#1A3A3A',
          700: '#255050',
          600: '#306666',
        },
        'champagne': {
          50: '#FBF7ED',
          100: '#F5EDD7',
          200: '#EADAAE',
          300: '#DFC786',
          400: '#D4B45E',
          500: '#C9A961',
          600: '#B8944A',
          700: '#A17D3D',
          800: '#8A6630',
        },
        'coral': {
          400: '#E89A85',
          500: '#E07A5F',
          600: '#D65F3F',
        },
        'jade': {
          400: '#9DC7B3',
          500: '#81B29A',
          600: '#669D81',
        },
        'ivory': {
          50: '#FBFAF6',
          100: '#F4F1E9',
          200: '#E9E3D3',
        },
        'charcoal': {
          800: '#2D2D2D',
          700: '#444444',
          600: '#6B6B6B',
          500: '#999999',
        }
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'sans': ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'luxury': '4px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        'luxury': '0 8px 30px rgba(26, 58, 58, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
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
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
