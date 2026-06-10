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
        primary: '#1E293B',
        accent: '#F59E0B',
        success: '#10B981',
        status: {
          pending: '#F59E0B',
          checked_in: '#3B82F6',
          reviewing: '#8B5CF6',
          completed: '#10B981',
          rejected: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
