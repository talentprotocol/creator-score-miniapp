"use client";

import * as React from "react";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { SearchBar, SearchResults } from "@/components/search";
import { useSearch } from "@/hooks/useSearch";

interface ExplorePageContentProps {
  activeTab: string;
}

export function ExplorePageContent({ activeTab }: ExplorePageContentProps) {
  const search = useSearch();

  const tabs = [
    { id: "all", label: "All" },
    { id: "friends", label: "Friends", disabled: true },
    { id: "featured", label: "Featured", disabled: true },
  ];

  const handleTabChange = () => {
    // Do nothing - tabs are disabled
    return;
  };

  // TODO: Track search queries for PostHog
  const handleSearchChange = (query: string) => {
    search.handleQueryChange(query);

    // TODO: Add PostHog tracking
    // if (query.trim().length >= 2) {
    //   posthog?.capture('search_query_entered', {
    //     query: query.trim(),
    //     query_length: query.trim().length
    //   });
    // }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6 pb-24">
      {/* Search Bar */}
      <SearchBar
        value={search.query}
        onChange={handleSearchChange}
        placeholder="Search creators by name…"
      />

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content */}
      {activeTab === "all" && (
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

      {activeTab === "friends" && (
        <div className="text-center py-12">
          <p className="text-gray-600">Friends tab coming soon</p>
        </div>
      )}

      {activeTab === "featured" && (
        <div className="text-center py-12">
          <p className="text-gray-600">Featured tab coming soon</p>
        </div>
      )}
    </div>
  );
}
