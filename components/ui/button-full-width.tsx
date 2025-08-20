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
  showRightIcon?: boolean;
  align?: "left" | "center"; // layout alignment (default: center)
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
      showRightIcon,
      align,
      ...props
    },
    ref,
  ) => {
    const { context } = useMiniKit();
    const isExternal = external ?? (href ? href.startsWith("http") : false);
    const isMutedVariant = variant === "muted";
    const computedAlign = align ?? (href ? "left" : "center");

    const content = (
      <div
        className={cn(
          "flex w-full items-center gap-3",
          computedAlign === "center" ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "h-4 w-4",
              variant?.startsWith("brand-")
                ? variant === "brand-purple"
                  ? "text-brand-purple"
                  : variant === "brand-green"
                    ? "text-brand-green"
                    : variant === "brand-blue"
                      ? "text-brand-blue"
                      : variant === "brand-pink"
                        ? "text-brand-pink"
                        : "text-muted-foreground"
                : variant === "destructive"
                  ? "text-red-700"
                  : "text-muted-foreground",
            )}
          >
            {icon}
          </span>
          <Typography
            as="span"
            size="base"
            color={
              variant?.startsWith("brand-")
                ? (variant as
                    | "brand-purple"
                    | "brand-green"
                    | "brand-blue"
                    | "brand-pink")
                : variant === "destructive"
                  ? "destructive"
                  : "default"
            }
            className={cn(
              "truncate",
              computedAlign === "center" ? "text-center" : "text-left",
            )}
          >
            {children}
          </Typography>
        </div>
        {(showRightIcon ?? !!href) && (
          <ArrowRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
              variant?.startsWith("brand-")
                ? variant === "brand-purple"
                  ? "text-brand-purple"
                  : variant === "brand-green"
                    ? "text-brand-green"
                    : variant === "brand-blue"
                      ? "text-brand-blue"
                      : variant === "brand-pink"
                        ? "text-brand-pink"
                        : "text-muted-foreground"
                : variant === "destructive"
                  ? "text-red-700"
                  : "text-muted-foreground",
            )}
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
