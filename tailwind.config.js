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
        primary: {
          DEFAULT: '#1E3A5F',
          light: '#2A4F7F',
          dark: '#152C4A',
          50: '#E8EDF4',
          100: '#C5D1E3',
          200: '#8FA3C7',
          300: '#5A76AB',
          400: '#3D5A8A',
          500: '#1E3A5F',
          600: '#182F4D',
          700: '#13243B',
          800: '#0D1929',
          900: '#070E17',
        },
        accent: {
          DEFAULT: '#E8A838',
          light: '#F0BE60',
          dark: '#D4952A',
          50: '#FDF6E9',
          100: '#F9E8CC',
          200: '#F3D199',
          300: '#EDBA66',
          400: '#E8A838',
          500: '#D4952A',
          600: '#B37D22',
          700: '#8C611A',
          800: '#664713',
          900: '#3F2C0C',
        },
        warm: {
          bg: '#F5F3EF',
          card: '#FFFFFF',
          border: '#E5E2DC',
          50: '#FAF9F7',
          100: '#F5F3EF',
          200: '#EBE8E1',
          300: '#E5E2DC',
          400: '#D1CCC3',
          500: '#B5AFA3',
          600: '#9A9388',
          700: '#7A736A',
          800: '#5C5650',
          900: '#3D3935',
        },
        status: {
          red: '#EF4444',
          amber: '#F59E0B',
          green: '#10B981',
          blue: '#3B82F6',
          gray: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
