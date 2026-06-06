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
        navy: {
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#243B53",
          900: "#0F2B4A",
        },
        amber: {
          50: "#FFF8E6",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#D4A853",
          600: "#FFB300",
          700: "#FF8F00",
          800: "#FF6F00",
        },
        status: {
          success: "#2E9E5C",
          warning: "#F2994A",
          error: "#E5484D",
          info: "#2F80ED",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 43, 74, 0.08), 0 1px 2px rgba(15, 43, 74, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 43, 74, 0.12), 0 2px 4px rgba(15, 43, 74, 0.08)",
      },
    },
  },
  plugins: [],
};
