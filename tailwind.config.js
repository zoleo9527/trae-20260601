/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        park: {
          bg: '#0f1724',
          card: '#1e2a3a',
          border: '#2a3a4e',
          hover: '#243044',
          text: '#e8ecf1',
          muted: '#8899aa',
          amber: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
          blue: '#3b82f6',
          sidebar: '#1a2332',
        }
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
