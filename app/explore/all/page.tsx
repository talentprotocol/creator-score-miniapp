"use client";

import { SearchResults } from "@/components/search";
import { useSearch } from "@/hooks/useSearch";
import { ExploreLayout } from "../ExploreLayout";

export default function ExploreAllPage() {
  const search = useSearch();

  return (
    <ExploreLayout>
      <SearchResults
        results={search.results}
        loading={search.loading}
        error={search.error}
        hasMore={search.hasMore}
        query={search.query}
        onLoadMore={search.loadMore}
        onRetry={search.retry}
        retryCount={search.retryCount}
      />
    </ExploreLayout>
  );
}
