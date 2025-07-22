import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "header" | "content" | "full-width";
  animate?: boolean;
}

export function Section({
  children,
  variant = "content",
  animate = false,
  className,
  ...props
}: SectionProps) {
  const content = animate ? (
    <div className="animate-in fade-in zoom-in-98 duration-300 ease-out">
      {children}
    </div>
  ) : (
    children
  );

  return (
    <div
      className={cn(
        // Base styles
        "w-full",
        // Variant styles
        variant === "full-width" && "w-full",
        variant !== "full-width" && "px-4 py-6",
        className,
      )}
      {...props}
    >
      {content}
    </div>
  );
}
