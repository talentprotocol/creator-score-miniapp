import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Dynamic color classes for SegmentedBar component
    "bg-green-600",
    "bg-green-500",
    "bg-green-400",
    "bg-green-300",
    "bg-green-200",
    "bg-green-100",
    "bg-pink-600",
    "bg-pink-500",
    "bg-pink-400",
    "bg-pink-300",
    "bg-pink-200",
    "bg-pink-100",
    "bg-blue-600",
    "bg-blue-500",
    "bg-blue-400",
    "bg-blue-300",
    "bg-blue-200",
    "bg-blue-100",
    "bg-purple-600",
    "bg-purple-500",
    "bg-purple-400",
    "bg-purple-300",
    "bg-purple-200",
    "bg-purple-100",
    "bg-red-600",
    "bg-red-500",
    "bg-red-400",
    "bg-red-300",
    "bg-red-200",
    "bg-red-100",
    "bg-orange-600",
    "bg-orange-500",
    "bg-orange-400",
    "bg-orange-300",
    "bg-orange-200",
    "bg-orange-100",
    "bg-yellow-600",
    "bg-yellow-500",
    "bg-yellow-400",
    "bg-yellow-300",
    "bg-yellow-200",
    "bg-yellow-100",
    "bg-indigo-600",
    "bg-indigo-500",
    "bg-indigo-400",
    "bg-indigo-300",
    "bg-indigo-200",
    "bg-indigo-100",
    // Solid color classes for PostsChart
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-pink-500",
    "bg-red-500",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      animation: {
        "fade-out": "1s fadeOut 3s ease-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeOut: {
          "0%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
