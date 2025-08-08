import * as React from "react";
import { Button } from "./button";
import type { ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface ButtonFullWidthProps extends ButtonProps {
  icon: React.ReactNode;
}

const ButtonFullWidth = React.forwardRef<
  HTMLButtonElement,
  ButtonFullWidthProps
>(({ className, icon, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        "w-full flex justify-start items-center gap-3 px-6 py-4 h-auto rounded-xl",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </Button>
  );
});
ButtonFullWidth.displayName = "ButtonFullWidth";

export { ButtonFullWidth };
export type { ButtonFullWidthProps };
