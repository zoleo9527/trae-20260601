/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0f1320',
          800: '#141a2a',
          700: '#1e2330',
          600: '#2a3142',
          500: '#3a4358',
          400: '#5a6478',
          300: '#8892a6',
          200: '#b8c0d0',
          100: '#e1e6ef',
        },
        warn: {
          500: '#ff7a45',
          400: '#ff9561',
          600: '#e85d25',
        },
        safe: {
          500: '#52c41a',
          400: '#73d13d',
          600: '#389e0d',
        },
        info: {
          500: '#1890ff',
          400: '#40a9ff',
          600: '#096dd9',
        },
        danger: {
          500: '#f5222d',
          400: '#ff4d4f',
          600: '#cf1322',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
        sans: ['"Source Han Sans CN"', '"PingFang SC"', 'sans-serif'],
      },
      fontSize: {
        xs2: ['10px', '14px'],
      },
    },
  },
  plugins: [],
}
