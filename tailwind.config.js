/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#0d0e12",
        card: "rgba(18,18,22,0.6)",
        accent1: "#637bff",
        accent2: "#8a5cf6",
      },
    },
  },
  plugins: [],
};
