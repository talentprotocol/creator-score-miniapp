"use client";

import { SearchResults } from "@/components/search";
import { ExploreLayout } from "../ExploreLayout";

export default function ExploreAllPage() {
  return (
    <ExploreLayout>
      {(search) => (
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
      )}
    </ExploreLayout>
  );
}
