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
          50: '#e8f0fe',
          100: '#d0e3fd',
          200: '#a5c7fa',
          300: '#72a3f6',
          400: '#3d7ef2',
          500: '#1e59eb',
          600: '#1e3a5f',
          700: '#162a4a',
          800: '#0f1f36',
          900: '#091427',
        },
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#c9a227',
          600: '#a18020',
          700: '#7d601a',
          800: '#5e4816',
          900: '#463812',
        },
        status: {
          pending: '#3b82f6',
          reviewing: '#f97316',
          approved: '#10b981',
          rejected: '#ef4444',
          closed: '#22c55e',
          recheck: '#8b5cf6',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
