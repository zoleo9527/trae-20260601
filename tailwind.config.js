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
        mint: {
          DEFAULT: '#2BA88C',
          50: '#F0FAF7',
          100: '#D6F2EA',
          200: '#ADE5D5',
          300: '#84D8C0',
          400: '#5BCAAB',
          500: '#2BA88C',
          600: '#23957A',
          700: '#1A7A63',
          800: '#124E40',
          900: '#09231D',
        },
      },
    },
  },
  plugins: [],
};
