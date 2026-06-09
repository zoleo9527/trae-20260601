export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        port: {
          navy: '#0F2B46',
          'navy-light': '#1A3A5C',
          'navy-dark': '#0A1E33',
          orange: '#E8722A',
          'orange-light': '#F08C4A',
          'orange-dark': '#C55E1E',
        },
        status: {
          normal: '#10B981',
          overstay: '#DC2626',
          inspecting: '#F59E0B',
          disputed: '#8B5CF6',
          misplaced: '#EF4444',
          departed: '#6B7280',
        }
      },
      fontFamily: {
        display: ['"Noto Sans SC"', 'sans-serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
