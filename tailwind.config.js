/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bank: {
          50: '#f5f7ff',
          100: '#e8edff',
          200: '#c8d4ff',
          300: '#9cb1ff',
          400: '#6b84f5',
          500: '#475fe6',
          600: '#3346cc',
          700: '#2a38a6',
          800: '#253185',
          900: '#222c6b',
        },
      },
    },
  },
  plugins: [],
};
