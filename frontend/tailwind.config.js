/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        status: {
          draft: '#6b7280',
          submitted: '#3b82f6',
          reviewing: '#f97316',
          approved: '#22c55e',
          rejected: '#ef4444',
          supplemented: '#a855f7',
          practicing: '#06b6d4',
          completed: '#14b8a6',
          passed: '#f59e0b',
          failed: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}
