import * as React from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { cn, openExternalUrl } from "@/lib/utils";

interface CalloutProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
}

export function Callout({ children, href, className }: CalloutProps) {
  const { context } = useMiniKit();
  const isExternal = href?.startsWith("http");
  const Icon = isExternal ? ExternalLink : ArrowRight;

  const content = (
    <>
      <div className="flex-1">{children}</div>
      {href && <Icon className="size-4 shrink-0" />}
    </>
  );

  const styles = cn(
    "bg-purple-100 rounded-xl px-6 py-4 my-1 flex items-center text-purple-700 text-xs",
    href && "hover:bg-purple-200 cursor-pointer transition-colors",
    className,
  );

  const handleClick = async (e: React.MouseEvent) => {
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
      <Link href={href} className={styles}>
        {content}
      </Link>
    );
  }

  return <div className={styles}>{content}</div>;
}
