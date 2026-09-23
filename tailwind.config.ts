import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          DEFAULT: "#c49e62",
          dark: "#8b682b",
          light: "#e4c28c",
        },
        // Identidade do site emobe.com.br: a cor de destaque é o dourado da marca.
        // A escala "green" foi remapeada para o dourado para alinhar todo o sistema ao site.
        green: {
          50: "#fcf6ec",
          100: "#f9edd8",
          200: "#f2dbb6",
          300: "#e4c28c",
          400: "#c49e62",
          500: "#ac8545",
          600: "#8b682b",
          700: "#70521d",
          800: "#553e15",
          900: "#3c2a0d",
          950: "#1d1406",
        },
        // Neutros do site: a escala zinc passa a usar os tons grafite/pedra do emobe.com.br
        zinc: {
          50: "#f8f8f6",
          100: "#efeeeb",
          200: "#dddee1",
          300: "#c8cace",
          400: "#8d8f94",
          500: "#696c71",
          600: "#585b61",
          700: "#3a3d43",
          800: "#27292d",
          900: "#131518",
          950: "#0b0c0f",
        },
        graphite: {
          DEFAULT: "#16181d",
          900: "#0e0f13",
          800: "#16181d",
          700: "#212327",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 6px #c49e6230" },
          "50%": { boxShadow: "0 0 16px #c49e6250" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
