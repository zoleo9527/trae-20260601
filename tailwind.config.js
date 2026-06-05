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
        brand: {
          50: '#FEF3EE',
          100: '#FDE4D5',
          200: '#FBC5AA',
          300: '#F8A276',
          400: '#F2844F',
          500: '#E8734A',
          600: '#D55A30',
          700: '#B14523',
          800: '#8F381F',
          900: '#1A3A2A',
        },
        cream: '#FAF7F2',
        moss: {
          50: '#EDF5F0',
          100: '#D4E8DB',
          200: '#ABD1BA',
          300: '#7BB893',
          400: '#559E73',
          500: '#3D8558',
          600: '#2F6A46',
          700: '#265539',
          800: '#1A3A2A',
          900: '#0F2219',
        },
        blush: {
          50: '#FFF0F0',
          100: '#FFD9D9',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF4D4D',
          500: '#E63946',
        },
        honey: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
