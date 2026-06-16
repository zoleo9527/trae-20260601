/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A90A4',
          50: '#f0f9fb',
          100: '#e0f1f5',
          200: '#c2e3ec',
          300: '#9dd0df',
          400: '#6db5cd',
          500: '#4A90A4',
          600: '#3a7383',
          700: '#315a6a',
          800: '#2c4957',
          900: '#293f4b',
        },
        accent: {
          DEFAULT: '#E8A87C',
          50: '#fdf8f5',
          100: '#fbf0e9',
          200: '#f7e1d4',
          300: '#efcdb6',
          400: '#E8A87C',
          500: '#db8a5d',
          600: '#c9724a',
          700: '#a75c3d',
          800: '#884d36',
          900: '#714231',
        },
      },
      fontFamily: {
        sans: ['Source Han Sans CN', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
