/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        command: {
          ink: "#12151c",
          panel: "#f7f2e7",
          brass: "#b98943",
          ocean: "#9fb9bd",
          line: "#5f5a50",
        },
      },
      boxShadow: {
        command: "0 20px 60px rgba(19, 23, 29, 0.18)",
      },
    },
  },
  plugins: [],
};
