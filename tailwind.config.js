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
        'roast-brown': '#3C2415',
        'roast-orange': '#D4843E',
        'roast-cream': '#FAF6F1',
        'roast-text': '#2D2D2D',
        'risk-red': '#DC2626',
        'pending-amber': '#F59E0B',
        'done-green': '#16A34A',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
