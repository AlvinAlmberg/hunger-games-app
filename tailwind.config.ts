import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Platshållarfärger — byts ut i en dedikerad UX/design-fas
        arena: {
          bg: "#0b0d0f",
          accent: "#c9a227",
          danger: "#8a1f1f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
