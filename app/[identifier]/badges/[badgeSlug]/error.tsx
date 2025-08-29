"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicBadgeError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[PublicBadgeError] Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
      <Typography as="h2" size="lg" weight="bold" color="destructive">
        Badge not found
      </Typography>

      <Typography size="sm" color="muted" className="max-w-md">
        We couldn&apos;t load this badge. It might have been removed or the link
        might be incorrect.
      </Typography>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>

        <Link href="/">
          <Button variant="ghost">
            <Home className="h-4 w-4 mr-2" />
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
