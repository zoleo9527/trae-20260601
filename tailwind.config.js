/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        secondary: '#3b82f6',
        accent: '#f97316',
        warning: '#eab308',
        danger: '#ef4444',
        success: '#22c55e',
        dark: '#1f2937',
        light: '#f3f4f6',
      },
    },
  },
  plugins: [],
}
