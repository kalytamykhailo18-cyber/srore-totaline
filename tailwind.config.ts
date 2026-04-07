import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0f5fa",
          100: "#dbe7f3",
          200: "#bcd1e8",
          300: "#8eb1d6",
          400: "#5c8bbf",
          500: "#3a6ba6",
          600: "#2c5282",
          700: "#244269",
          800: "#1e3a5f",
          900: "#152d4a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
