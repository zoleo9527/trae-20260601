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
        primary: {
          50: "#f0f5f7",
          100: "#dce6ea",
          200: "#b8ccd4",
          300: "#8faebb",
          400: "#6a97a8",
          500: "#4d7d91",
          600: "#3d6a7d",
          700: "#2d5566",
          800: "#1f404e",
          900: "#142c37",
        },
        status: {
          normal: "#6b9e84",
          pending: "#d4a856",
          warning: "#c46b5a",
          completed: "#8a9199",
        },
        surface: {
          base: "#f5f6f7",
          card: "#ffffff",
          muted: "#eef0f2",
          hover: "#f0f2f4",
        },
        text: {
          primary: "#2c3640",
          secondary: "#5a6872",
          tertiary: "#8d969e",
          inverse: "#ffffff",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans SC",
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};
