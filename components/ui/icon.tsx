import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  color?: "default" | "muted" | "brand" | "error";
  disabled?: boolean;
  isActive?: boolean;
}

const iconSizes = {
  sm: "size-3.5", // 14px - Small indicators
  md: "size-4.5", // 18px - Engagement icons
  lg: "size-6", // 24px - Navigation
} as const;

const iconColors = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  brand: "text-purple-500", // Reserved for special moments
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
        "stroke-2",
        "transition-all duration-200",

        // States
        disabled && "opacity-20 cursor-not-allowed",
        !disabled && "active:scale-110 active:fill-current",
        !disabled && isActive && "fill-current text-foreground",
        !disabled && !isActive && iconColors[color],

        className,
      )}
      {...props}
    />
  );
}
