import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-input bg-background hover:bg-muted",
        "brand-base-blue":
          "bg-brand-base-blue-light text-brand-base-blue hover:bg-brand-base-blue-dark",
        "brand-cerulean":
          "bg-brand-cerulean-light text-brand-cerulean hover:bg-brand-cerulean-dark",
        "brand-yellow":
          "bg-brand-yellow-light text-brand-yellow hover:bg-brand-yellow-dark",
        "brand-tan":
          "bg-brand-tan-light text-brand-tan hover:bg-brand-tan-dark",
        "brand-green":
          "bg-brand-green-light text-brand-green hover:bg-brand-green-dark",
        "brand-lime-green":
          "bg-brand-lime-green-light text-brand-lime-green hover:bg-brand-lime-green-dark",
        // Legacy brand colors for backward compatibility
        "brand-purple":
          "bg-brand-purple-light text-brand-purple hover:bg-brand-purple-dark",
        "brand-blue":
          "bg-brand-blue-light text-brand-blue hover:bg-brand-blue-dark",
        "brand-pink":
          "bg-brand-pink-light text-brand-pink hover:bg-brand-pink-dark",
        destructive: "bg-red-100 text-red-700 hover:bg-red-200",
        ghost:
          "border-0 bg-transparent text-muted-foreground hover:text-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
