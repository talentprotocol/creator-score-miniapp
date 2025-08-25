"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProfileBadgesError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[ProfileBadgesError] Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
      <Typography as="h2" size="lg" weight="bold" color="destructive">
        Something went wrong
      </Typography>
      
      <Typography size="sm" color="muted" className="max-w-md">
        We couldn&apos;t load the badges. This might be a temporary issue.
      </Typography>

      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
        
        <Button onClick={() => window.location.reload()} variant="ghost">
          Reload page
        </Button>
      </div>
    </div>
  );
}
