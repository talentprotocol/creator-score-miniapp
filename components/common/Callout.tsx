"use client";

import * as React from "react";
import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn, openExternalUrl } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface CalloutProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  mode?: "informative" | "interactive"; // deprecated: interactivity inferred from href and onClose
  href?: string;
  external?: boolean;
  variant?:
    | "brand-purple"
    | "brand-green"
    | "brand-blue"
    | "brand-pink"
    | "muted";
  icon?: React.ReactNode;
  className?: string;
  onClose?: () => void;
  onClick?: () => void;
}

export function Callout({
  children,
  title,
  description,
  // mode deprecated / ignored
  href,
  external,
  variant = "brand-purple",
  icon,
  className,
  onClose,
  onClick,
}: CalloutProps) {
  const shouldShowLeftIcon = !!icon;
  const hasStructured = !!title || !!description;
  const { context } = useMiniKit();
  const router = useRouter();
  const hasHref = !!href;
  const showArrow = hasHref && !onClose; // suppress arrow when dismissible
  const isExternal = external ?? (href ? href.startsWith("http") : false);

  const content = (
    <>
      <div className="flex items-start gap-3 w-full">
        {shouldShowLeftIcon && (
          <div
            className={cn(
              "h-5 w-5 shrink-0 mt-0.5",
              variant.startsWith("brand-")
                ? variant === "brand-purple"
                  ? "text-brand-purple"
                  : variant === "brand-green"
                    ? "text-brand-green"
                    : variant === "brand-blue"
                      ? "text-brand-blue"
                      : variant === "brand-pink"
                        ? "text-brand-pink"
                        : "text-foreground"
                : "text-foreground",
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1 text-left">
          {hasStructured ? (
            <div className="space-y-1">
              {title && (
                <Typography
                  size="base"
                  weight="medium"
                  color={
                    variant.startsWith("brand-")
                      ? (variant as
                          | "brand-purple"
                          | "brand-green"
                          | "brand-blue"
                          | "brand-pink")
                      : "default"
                  }
                >
                  {title}
                </Typography>
              )}
              {description && (
                <Typography size="sm" color="muted">
                  {description}
                </Typography>
              )}
              {!title && !description && children}
            </div>
          ) : (
            <div className="text-left">{children}</div>
          )}
        </div>
        {showArrow ? (
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
        ) : null}
        {onClose && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className={
              "h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-150 hover:opacity-80"
            }
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );

  const baseStyles =
    "w-full flex items-start justify-between px-4 py-4 h-auto rounded-xl transition-colors duration-150";

  const variantStyles = {
    "brand-purple": "bg-brand-purple-light text-foreground",
    "brand-green": "bg-brand-green-light text-foreground",
    "brand-blue": "bg-brand-blue-light text-foreground",
    "brand-pink": "bg-brand-pink-light text-foreground",
    muted: "bg-muted text-foreground",
  };

  const styles = cn(
    baseStyles,
    variantStyles[variant],
    (hasHref || onClick) && "group cursor-pointer",
    className,
  );

  // No more data-accent logic needed

  const handleRootClick = async (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }
    if (hasHref && href) {
      if (isExternal) {
        e.preventDefault();
        await openExternalUrl(href, context);
      } else {
        router.push(href);
      }
    }
  };

  return (
    <div
      className={styles}
      role={hasHref || onClick ? "button" : undefined}
      tabIndex={hasHref || onClick ? 0 : undefined}
      onClick={handleRootClick}
      onKeyDown={(e) => {
        if ((hasHref || onClick) && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          // Trigger click flow
          (async () => handleRootClick(e as unknown as React.MouseEvent))();
        }
      }}
    >
      {content}
    </div>
  );
}
