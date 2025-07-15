"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface NoScoreStatesProps {
  calculating: boolean;
  calculatingEnqueuedAt: string | null;
  onCalculateScore?: () => void;
  isRefreshing?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
}

function formatEnqueuedDate(isoString: string): string {
  const date = new Date(isoString);

  // Format as "23 Jan, 11:59pm"
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleDateString("en-US", options).replace(",", ",");
}

export function NoScoreStates({
  calculating,
  calculatingEnqueuedAt,
  onCalculateScore,
  isRefreshing = false,
  successMessage,
  errorMessage,
}: NoScoreStatesProps) {
  // State 1: Currently calculating
  if (calculating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Calculating Creator Score
        </h3>
        <p className="text-sm text-muted-foreground">
          Can take several minutes...
        </p>
      </div>
    );
  }

  // State 2: Calculation is enqueued
  if (calculatingEnqueuedAt) {
    const formattedDate = formatEnqueuedDate(calculatingEnqueuedAt);

    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Calculating Creator Score
        </h3>
        <p className="text-sm text-muted-foreground">
          Scheduled for {formattedDate}
        </p>
      </div>
    );
  }

  // State 3: No calculation in progress, show button
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-4">
        Creator Score Not Calculated
      </h3>

      <Button
        onClick={onCalculateScore}
        className="w-full max-w-xs"
        size="lg"
        disabled={isRefreshing || !!successMessage}
        variant={errorMessage ? "destructive" : "default"}
      >
        {isRefreshing ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Enqueueing...
          </>
        ) : successMessage ? (
          <>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Calculation enqueued
          </>
        ) : errorMessage ? (
          <>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Failed to calculate score
          </>
        ) : (
          "Calculate Creator Score"
        )}
      </Button>
    </div>
  );
}
