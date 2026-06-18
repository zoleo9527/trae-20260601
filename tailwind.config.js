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
        brand: {
          50: "#FFF3E0", 100: "#FFE0B2", 200: "#FFCC80", 300: "#FFB74D",
          400: "#FFA726", 500: "#FF9800", 600: "#FB8C00", 700: "#F57C00",
          800: "#EF6C00", 900: "#E65100",
        },
        flame: {
          50: "#FBE9E7", 100: "#FFCCBC", 200: "#FFAB91", 300: "#FF8A65",
          400: "#FF7043", 500: "#FF5722", 600: "#F4511E", 700: "#E64A19",
          800: "#D84315", 900: "#BF360C",
        },
        ink: {
          50: "#FAFAFA", 100: "#F5F5F5", 200: "#EEEEEE", 300: "#E0E0E0",
          400: "#BDBDBD", 500: "#9E9E9E", 600: "#757575", 700: "#616161",
          800: "#424242", 900: "#212121",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        pop: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        pulseDot: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
      },
      animation: { "pulse-dot": "pulseDot 1.5s ease-in-out infinite" },
    },
  },
  plugins: [],
};
