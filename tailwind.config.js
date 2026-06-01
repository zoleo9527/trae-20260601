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
        vet: {
          teal: '#0D9488',
          'teal-light': '#CCFBF1',
          'teal-dark': '#0F766E',
          sky: '#0284C7',
          'sky-light': '#E0F2FE',
          'sky-dark': '#0369A1',
          violet: '#7C3AED',
          'violet-light': '#EDE9FE',
          'violet-dark': '#6D28D9',
          amber: '#F59E0B',
          'amber-light': '#FEF3C7',
          red: '#EF4444',
          'red-light': '#FEE2E2',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
