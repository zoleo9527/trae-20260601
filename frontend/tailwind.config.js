/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        base: {
          DEFAULT: '#2D5A27',
          50: '#E9F2E7',
          100: '#D3E5D0',
          200: '#A7CBA1',
          300: '#7BB173',
          400: '#4F9744',
          500: '#2D5A27',
          600: '#24481F',
          700: '#1B3617',
          800: '#122410',
          900: '#091208',
        },
        gold: {
          DEFAULT: '#C89B3C',
          50: '#FBF5E7',
          100: '#F6EBCF',
          200: '#EDD69E',
          300: '#E4C26E',
          400: '#DBAD3D',
          500: '#C89B3C',
          600: '#A07C30',
          700: '#785D24',
          800: '#503E18',
          900: '#281F0C',
        },
        alert: {
          DEFAULT: '#D64545',
          50: '#FBEAEA',
          100: '#F6D4D4',
          200: '#EDA9A9',
          300: '#E47E7E',
          400: '#DB5353',
          500: '#D64545',
          600: '#AB3737',
          700: '#802929',
          800: '#561C1C',
          900: '#2B0E0E',
        },
        success: {
          DEFAULT: '#4A7C59',
          50: '#EBF1ED',
          100: '#D7E3DB',
          200: '#AFC7B7',
          300: '#87AB93',
          400: '#5F8F6F',
          500: '#4A7C59',
          600: '#3B6347',
          700: '#2C4A35',
          800: '#1E3224',
          900: '#0F1912',
        },
        neutral: {
          DEFAULT: '#F8F7F4',
          50: '#FBFAF8',
          100: '#F8F7F4',
          200: '#EFEDE7',
          300: '#E6E3DA',
          400: '#DEDACF',
          500: '#9A9485',
          600: '#58534A',
          700: '#3D3A34',
          800: '#262420',
          900: '#131210',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(45, 90, 39, 0.08), 0 1px 4px -1px rgba(45, 90, 39, 0.06)',
        'card-hover': '0 8px 24px -4px rgba(45, 90, 39, 0.12), 0 4px 12px -2px rgba(45, 90, 39, 0.08)',
        stuck: '0 0 0 2px rgba(214, 69, 69, 0.3), 0 4px 12px -2px rgba(214, 69, 69, 0.15)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'pulse-stuck': 'pulseStuck 1.5s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
        pulseStuck: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(214, 69, 69, 0.5)' },
          '50%': { boxShadow: '0 0 0 6px rgba(214, 69, 69, 0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
