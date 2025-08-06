import * as React from "react";
import { ArrowRight, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn, openExternalUrl } from "@/lib/utils";

interface CalloutProps {
  children: React.ReactNode;
  href?: string;
  variant?: "brand" | "neutral";
  icon?: React.ReactNode;
  external?: boolean;
  className?: string;
  onClick?: () => void;
  onClose?: () => void;
}

export function Callout({
  children,
  href,
  variant = "brand",
  icon,
  external,
  className,
  onClick,
  onClose,
}: CalloutProps) {
  // Auto-detect if we should show left icon based on text length
  const shouldShowLeftIcon = icon && React.Children.count(children) > 0;
  const { context } = useMiniKit();
  const isExternal = external ?? href?.startsWith("http");
  const RightIcon = isExternal ? ExternalLink : ArrowRight;

  const content = (
    <>
      <div className="flex items-center gap-3">
        {shouldShowLeftIcon && (
          <div
            className={`h-4 w-4 ${variant === "brand" ? "text-purple-700" : "text-muted-foreground"}`}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: "h-4 w-4",
            })}
          </div>
        )}
        <span className="font-medium max-w-[38ch] sm:max-w-[80ch] overflow-hidden text-ellipsis whitespace-nowrap">
          {children}
        </span>
      </div>
      {href && (
        <RightIcon
          className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 ${variant === "brand" ? "text-purple-700" : "text-muted-foreground"}`}
        />
      )}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`h-4 w-4 shrink-0 transition-colors duration-150 ${variant === "brand" ? "text-purple-700 hover:text-purple-800" : "text-muted-foreground hover:text-foreground"}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </>
  );

  const baseStyles =
    "w-full flex items-center justify-between px-6 py-4 h-auto rounded-xl transition-colors duration-150";

  const variantStyles = {
    brand: href
      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
      : "bg-purple-100 text-purple-700",
    neutral: href
      ? "bg-muted text-muted-foreground hover:bg-gray-200"
      : "bg-muted text-muted-foreground",
  };

  const styles = cn(
    baseStyles,
    variantStyles[variant],
    href && "group cursor-pointer",
    className,
  );

  const handleClick = async (e: React.MouseEvent) => {
    // Call custom onClick handler if provided
    if (onClick) {
      onClick();
    }

    if (isExternal && href) {
      e.preventDefault();
      await openExternalUrl(href, context);
    }
  };

  if (href) {
    return isExternal ? (
      <button onClick={handleClick} className={styles}>
        {content}
      </button>
    ) : (
      <Link href={href} className={styles} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <div className={styles}>{content}</div>;
}
