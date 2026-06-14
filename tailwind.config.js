/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        'serif-sc': ['"Noto Serif SC"', '"Source Han Serif SC"', '"思源宋体"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#dbe6f2',
          200: '#b5cbde',
          300: '#83a9c7',
          400: '#4c7faa',
          500: '#2a4d78',
          600: '#1e3a5f',
          700: '#162c4a',
          800: '#112339',
          900: '#0b1826',
        },
        justice: {
          danger: '#c0392b',
          success: '#27ae60',
          warning: '#e67e22',
          muted: '#34495e',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      },
      transitionTimingFunction: {
        workbench: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
