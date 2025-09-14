import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  color?:
    | "primary"
    | "muted"
    | "brand"
    | "brand-purple"
    | "brand-green"
    | "brand-blue"
    | "brand-pink"
    | "error";
  disabled?: boolean;
  isActive?: boolean;
}

const iconSizes = {
  sm: "size-3.5", // 14px - Small indicators
  md: "size-4.5", // 18px - Engagement icons
  lg: "size-6", // 24px - Navigation
} as const;

const iconColors = {
  primary: "text-foreground",
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
  error: "text-destructive",
} as const;

export function Icon({
  icon: IconComponent,
  size = "md",
  color = "muted",
  disabled = false,
  isActive = false,
  className,
  ...props
}: IconProps) {
  return (
    <IconComponent
      className={cn(
        // Base styles
        iconSizes[size],
        "transition-all duration-200",

        // Stroke weight - consistent across all states
        "stroke-[1.5]",

        // States
        disabled && "opacity-20 cursor-not-allowed",
        !disabled && "active:scale-110",

        // Active state: Color + Weight (Option 1)
        !disabled && isActive && "text-foreground stroke-2",

        // Color variants (only apply when not active)
        !disabled && !isActive && iconColors[color],

        className,
      )}
      {...props}
    />
  );
}
