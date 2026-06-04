/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beer: {
          50: '#fdf8f3',
          100: '#f9edd9',
          200: '#f3d9b0',
          300: '#ebc17d',
          400: '#e2a34a',
          500: '#d98b2a',
          600: '#c46f20',
          700: '#a3531d',
          800: '#84421f',
          900: '#6c371c',
        }
      }
    },
  },
  plugins: [],
}
