import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Button } from "./button";
import type { ButtonProps } from "./button";
import { Typography } from "@/components/ui/typography";
import { cn, openExternalUrl } from "@/lib/utils";

type ButtonBaseVariant = NonNullable<ButtonProps["variant"]>;

interface ButtonFullWidthProps extends Omit<ButtonProps, "variant"> {
  icon: React.ReactNode;
  href?: string;
  external?: boolean;
  variant?: ButtonBaseVariant | "muted";
  color?: "purple" | "green" | "blue" | "pink"; // applies when variant="brand"
  showRightIcon?: boolean;
}

const ButtonFullWidth = React.forwardRef<
  HTMLButtonElement,
  ButtonFullWidthProps
>(
  (
    {
      className,
      icon,
      children,
      href,
      external,
      onClick,
      variant,
      color,
      showRightIcon,
      ...props
    },
    ref,
  ) => {
    const { context } = useMiniKit();
    const isExternal = external ?? (href ? href.startsWith("http") : false);
    const isMutedVariant = variant === "muted";

    const content = (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "h-4 w-4",
              variant === "brand"
                ? "text-brand"
                : variant === "destructive"
                  ? "text-red-700"
                  : "text-muted-foreground",
            )}
            {...(variant === "brand" && color ? { "data-accent": color } : {})}
          >
            {icon}
          </span>
          <Typography
            as="span"
            size="base"
            color={
              variant === "brand"
                ? "brand"
                : variant === "destructive"
                  ? "destructive"
                  : "default"
            }
            className="truncate text-left"
            {...(variant === "brand" && color ? { "data-accent": color } : {})}
          >
            {children}
          </Typography>
        </div>
        {(showRightIcon ?? !!href) && (
          <ArrowRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
              variant === "brand"
                ? "text-brand"
                : variant === "destructive"
                  ? "text-red-700"
                  : "text-muted-foreground",
            )}
            {...(variant === "brand" && color ? { "data-accent": color } : {})}
          />
        )}
      </div>
    );

    if (href) {
      if (isExternal) {
        return (
          <Button
            ref={ref}
            variant={
              isMutedVariant
                ? "default"
                : (variant as ButtonBaseVariant | undefined)
            }
            onClick={async (e) => {
              onClick?.(e);
              await openExternalUrl(href, context);
            }}
            className={cn(
              "w-full h-auto rounded-xl px-6 py-4 group",
              isMutedVariant ? "bg-muted text-foreground border-0" : undefined,
              className,
            )}
            {...(variant === "brand" && color ? { "data-accent": color } : {})}
            {...props}
          >
            {content}
          </Button>
        );
      }

      return (
        <Button
          ref={ref}
          asChild
          variant={
            isMutedVariant
              ? "default"
              : (variant as ButtonBaseVariant | undefined)
          }
          onClick={onClick}
          className={cn(
            "w-full h-auto rounded-xl px-6 py-4 group",
            isMutedVariant ? "bg-muted text-foreground border-0" : undefined,
            className,
          )}
          {...(variant === "brand" && color ? { "data-accent": color } : {})}
          {...props}
        >
          <Link href={href}>{content}</Link>
        </Button>
      );
    }

    return (
      <Button
        ref={ref}
        variant={
          isMutedVariant
            ? "default"
            : (variant as ButtonBaseVariant | undefined)
        }
        onClick={onClick}
        className={cn(
          "w-full h-auto rounded-xl px-6 py-4 group",
          isMutedVariant ? "bg-muted text-foreground border-0" : undefined,
          className,
        )}
        {...(variant === "brand" && color ? { "data-accent": color } : {})}
        {...props}
      >
        {content}
      </Button>
    );
  },
);
ButtonFullWidth.displayName = "ButtonFullWidth";

export { ButtonFullWidth };
export type { ButtonFullWidthProps };
