/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        status: {
          pending: '#f59e0b',
          progress: '#3b82f6',
          approved: '#10b981',
          rejected: '#ef4444',
          stuck: '#dc2626',
          confirmed: '#059669',
          submitted: '#8b5cf6',
          reviewing: '#0ea5e9',
          revised: '#f97316',
          customer: '#6366f1'
        }
      }
    },
  },
  plugins: [],
}
