/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        accent: '#f59e0b',
        success: '#10b981',
        danger: '#ef4444',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
