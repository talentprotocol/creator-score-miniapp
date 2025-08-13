import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "muted" | "brand" | "error";
  brandColor?: "purple" | "green" | "blue" | "pink"; // applies when color="brand"
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
  brand: "text-brand",
  error: "text-destructive",
} as const;

export function Icon({
  icon: IconComponent,
  size = "md",
  color = "muted",
  brandColor,
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
      {...(color === "brand" && brandColor
        ? { "data-accent": brandColor }
        : {})}
      {...props}
    />
  );
}
