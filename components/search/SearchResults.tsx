"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchResultRow } from "./SearchResultRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchResult } from "@/app/services/types";

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  query: string;
  onLoadMore: () => void;
  onRetry?: () => void;
  retryCount?: number;
}

export function SearchResults({
  results,
  loading,
  error,
  hasMore,
  query,
  onLoadMore,
  onRetry,
  retryCount = 0,
}: SearchResultsProps) {
  const router = useRouter();

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the profile page using the talent UUID
    router.push(`/${result.id}`);

    // TODO: Track search result click for PostHog
    // posthog?.capture('search_result_clicked', {
    //   query,
    //   result_id: result.id,
    //   result_name: result.name,
    //   result_position: results.indexOf(result) + 1
    // });
  };

  // Show loading skeletons during initial search
  if (loading && results.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state
  if (error) {
    const isNetworkError =
      error.includes("temporarily unavailable") ||
      error.includes("network") ||
      error.includes("fetch");
    const isRateLimited = error.includes("Too many requests");
    const isServerError = error.includes("500") || error.includes("server");

    return (
      <div className="text-center py-8 px-4">
        <div className="max-w-sm mx-auto space-y-4">
          {/* Error icon and title */}
          <div>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 6.5c-.77.833-.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {isNetworkError
                ? "Connection Problem"
                : isRateLimited
                  ? "Please Wait"
                  : isServerError
                    ? "Service Unavailable"
                    : "Something went wrong"}
            </h3>
          </div>

          {/* Error message */}
          <p className="text-sm text-gray-600 leading-relaxed">{error}</p>

          {/* Retry button - only show if we have a retry function and it's not a rate limit error */}
          {onRetry && !isRateLimited && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={onRetry}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Retrying..." : "Try Again"}
              </Button>
              {retryCount > 0 && (
                <p className="text-xs text-gray-500">
                  Retry attempt {retryCount}
                </p>
              )}
            </div>
          )}

          {/* Rate limit specific message */}
          {isRateLimited && (
            <p className="text-xs text-gray-500">
              Please wait a moment before searching again
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show empty state when no results found after a completed search
  // Only show this if we have a query, no results, not currently loading, and not showing error
  if (results.length === 0 && query.trim().length >= 2 && !loading && !error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-2">No creators found</p>
        <p className="text-sm text-gray-500">
          Try searching with a different name or handle
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Results container with gray background and dividers like leaderboard */}
      {results.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-gray-50">
          {results.map((result, index, array) => (
            <div key={result.id}>
              <SearchResultRow
                name={result.name}
                avatarUrl={result.avatarUrl}
                score={result.score}
                onClick={() => handleResultClick(result)}
              />
              {index < array.length - 1 && <div className="h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      )}

      {/* Load more button - only show loading when actually loading more results */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="w-full max-w-sm"
          >
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
