/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}", "./shared/**/*.ts"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554'
        },
        industrial: {
          blue: '#1E40AF',
          darkBlue: '#172554',
          warn: '#EA580C',
          success: '#16A34A',
          danger: '#DC2626',
          zinc: '#18181B',
          paper: '#FAFAFA',
          panel: '#F4F4F5'
        }
      },
      boxShadow: {
        'industrial': '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'industrial-lg': '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)',
        'focus-ring': '0 0 0 3px rgba(30,64,175,0.15)'
      },
      borderRadius: {
        'industrial': '4px',
        'panel': '6px'
      }
    },
  },
  plugins: [],
};
