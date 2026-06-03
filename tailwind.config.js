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
        surface: {
          DEFAULT: '#1a1a2e',
          dark: '#12121f',
          deeper: '#0f0f1a',
        }
      }
    },
  },
  plugins: [],
};
