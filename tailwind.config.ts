import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // SegmentedBar dynamic colors (brand colors: purple, green, blue, pink)
    "bg-purple-600",
    "bg-purple-500",
    "bg-purple-400",
    "bg-purple-300",
    "bg-purple-200",
    "bg-purple-100",
    "bg-green-600",
    "bg-green-500",
    "bg-green-400",
    "bg-green-300",
    "bg-green-200",
    "bg-green-100",
    "bg-blue-600",
    "bg-blue-500",
    "bg-blue-400",
    "bg-blue-300",
    "bg-blue-200",
    "bg-blue-100",
    "bg-pink-600",
    "bg-pink-500",
    "bg-pink-400",
    "bg-pink-300",
    "bg-pink-200",
    "bg-pink-100",

    // PostsChart solid colors (brand colors: purple, green, blue, pink)
    "bg-purple-500",
    "bg-green-500",
    "bg-blue-500",
    "bg-pink-500",

    // Badge level progression colors (dynamically constructed in getBadgeProgressColor)
    "bg-badge-level-1",
    "bg-badge-level-2",
    "bg-badge-level-3",
    "bg-badge-level-4",
    "bg-badge-level-5",
    "bg-badge-level-6",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        typekit: ["var(--font-typekit)", "system-ui", "sans-serif"],
        heading: [
          "var(--font-cy)",
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        brand: {
          DEFAULT: "hsl(var(--creator-purple))",
        },
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
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
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
