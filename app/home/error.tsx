"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Home page error:", error);
  }, [error]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-xl mx-auto w-full p-4">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading the home page."}
          </p>
          <Button onClick={reset} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </main>
  );
}
