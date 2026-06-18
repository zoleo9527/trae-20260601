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
        primary: '#2563EB',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F8FAFC',
        'text-main': '#1E293B',
        'text-muted': '#64748B',
        border: '#E2E8F0',
      },
    },
  },
  plugins: [],
};
