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
          dark: '#2D5016',
          light: '#8BC34A',
          DEFAULT: '#4A7C23'
        },
        warning: '#FF9800',
        danger: '#E53935',
        overdue: '#C62828'
      }
    },
  },
  plugins: [],
}
