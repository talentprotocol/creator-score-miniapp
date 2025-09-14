import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Typography component - Single source of truth for all typography values
 *
 * This component defines all available typography variants used throughout the app.
 * When adding new variants, update both the component and the design system documentation.
 *
 * Available variants:
 * - Size: xs, sm, base, lg, xl, 2xl
 * - Weight: light, normal, medium, bold
 * - Color: default, muted, brand
 */
const typographyVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm sm:text-[15px]",
      base: "text-sm sm:text-[15px]",
      lg: "text-lg sm:text-xl",
      xl: "text-xl sm:text-2xl",
      "2xl": "text-2xl sm:text-3xl",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      bold: "font-bold",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      brand: "text-brand-base-blue",
      "brand-base-blue": "text-brand-base-blue",
      "brand-cerulean": "text-brand-cerulean",
      "brand-yellow": "text-brand-yellow",
      "brand-tan": "text-brand-tan",
      "brand-green": "text-brand-green",
      "brand-lime-green": "text-brand-lime-green",
      // Legacy brand colors for backward compatibility
      "brand-purple": "text-brand-purple",
      "brand-blue": "text-brand-blue",
      "brand-pink": "text-brand-pink",
      destructive: "text-red-700",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
    color: "default",
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "color">,
    VariantProps<typeof typographyVariants> {
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Typography = React.forwardRef<HTMLParagraphElement, TypographyProps>(
  ({ className, size, weight, color, as: Component = "p", ...props }, ref) => {
    return (
      <Component
        className={cn(typographyVariants({ size, weight, color }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Typography.displayName = "Typography";

export { Typography, typographyVariants };
