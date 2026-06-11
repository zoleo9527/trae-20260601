/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        coral: {
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}
