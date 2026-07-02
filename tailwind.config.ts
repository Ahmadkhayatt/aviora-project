import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/presentation/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          50: "#faf8f6",
          100: "#f0ece7",
          200: "#ddd4c8",
          300: "#c8b8a3",
          400: "#b09b7f",
          500: "#9e8465",
          600: "#8b6f50",
          700: "#745942",
          800: "#614a39",
          900: "#523f32",
          950: "#2c221b",
        },
        gold: {
          50: "#fffdf0",
          100: "#fff9d0",
          200: "#fff29e",
          300: "#ffe66b",
          400: "#ffd839",
          500: "#f5c518",
          600: "#d4a208",
          700: "#a87c0a",
          800: "#886510",
          900: "#6f5011",
          950: "#412c05",
        },
        charcoal: {
          50: "#f6f6f7",
          100: "#e3e3e7",
          200: "#c9c9d0",
          300: "#a3a3af",
          400: "#7e7e8d",
          500: "#636372",
          600: "#4f4f5b",
          700: "#42424b",
          800: "#3a3a41",
          900: "#18181b",
          950: "#0f0f11",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient": "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))",
      },
      boxShadow: {
        "luxury": "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
        "luxury-lg": "0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.05)",
        "gold": "0 2px 12px rgba(245, 197, 24, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
