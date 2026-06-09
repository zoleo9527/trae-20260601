import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8edf3',
          100: '#d0dbe9',
          200: '#a1b7d3',
          300: '#7293bd',
          400: '#436fa7',
          500: '#1e3a5f',
          600: '#182e4c',
          700: '#122339',
          800: '#0c1726',
          900: '#060c13',
        },
        accent: {
          50: '#fef3e8',
          100: '#fde4c8',
          200: '#fbc990',
          300: '#f9ae58',
          400: '#e8723a',
          500: '#d45a20',
          600: '#b04818',
          700: '#8c3812',
          800: '#68280c',
          900: '#441806',
        },
        warn: {
          50: '#fef3cd',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
        },
      },
    },
  },
  plugins: [],
}
export default config
