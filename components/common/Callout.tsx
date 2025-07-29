import * as React from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn, openExternalUrl } from "@/lib/utils";

interface CalloutProps {
  children: React.ReactNode;
  href?: string;
  variant?: "brand" | "neutral";
  className?: string;
  onClick?: () => void;
}

export function Callout({
  children,
  href,
  variant = "brand",
  className,
  onClick,
}: CalloutProps) {
  const { context } = useMiniKit();
  const isExternal = href?.startsWith("http");
  const Icon = isExternal ? ExternalLink : ArrowRight;

  const content = (
    <>
      <div className="flex-1 text-left">{children}</div>
      {href && (
        <Icon className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
      )}
    </>
  );

  const baseStyles =
    "w-full rounded-xl px-6 py-4 my-1 flex items-center text-xs transition-colors duration-150";

  const variantStyles = {
    brand: "bg-purple-100 text-purple-700",
    neutral: "bg-muted text-muted-foreground",
  };

  const hoverStyles = href
    ? {
        brand: "hover:bg-purple-200",
        neutral: "hover:bg-muted/80",
      }
    : {};

  const styles = cn(
    baseStyles,
    variantStyles[variant],
    href && hoverStyles[variant],
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
