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
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1e3a5f',
        },
        orange: {
          50: '#fff4ed',
          100: '#ffe0cc',
          200: '#ffc9a8',
          300: '#ffab7a',
          400: '#ff8547',
          500: '#ff6b35',
          600: '#e85a2a',
          700: '#c24820',
          800: '#9a3a1a',
          900: '#7a2f15',
        },
        teal: {
          50: '#effbf9',
          100: '#d4f5f2',
          200: '#a9ebe4',
          300: '#75ddcf',
          400: '#4ecdc4',
          500: '#2eb9af',
          600: '#20968d',
          700: '#1d7971',
          800: '#1b615a',
          900: '#1a5049',
        },
        coral: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa8a8',
          400: '#ff8787',
          500: '#ff6b6b',
          600: '#fa5252',
          700: '#f03e3e',
          800: '#e03131',
          900: '#c92a2a',
        },
      },
    },
  },
  plugins: [],
};
