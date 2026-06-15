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
        brand: {
          bg: '#1a1a2e',
          surface: '#16213e',
          card: '#1e2a4a',
          border: '#2a3a5c',
          info: '#0f3460',
          accent: '#e94560',
          warn: '#f39c12',
        },
        grade: {
          A: '#27ae60',
          B: '#2980b9',
          C: '#f39c12',
          D: '#e67e22',
          scrap: '#c0392b',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
