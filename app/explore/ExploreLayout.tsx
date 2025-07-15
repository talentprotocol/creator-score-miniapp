"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { SearchBar } from "@/components/search";
import { useSearch } from "@/hooks/useSearch";

interface ExploreLayoutProps {
  children: React.ReactNode;
}

export function ExploreLayout({ children }: ExploreLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearch();

  const tabs = [
    { id: "all", label: "All" },
    { id: "friends", label: "Friends", disabled: true },
    { id: "featured", label: "Featured", disabled: true },
  ];

  // Determine active tab from pathname
  const activeTab = pathname.split("/").pop() || "all";

  const handleTabChange = (tabId: string) => {
    // Navigate to the selected tab (even if disabled for now)
    router.push(`/explore/${tabId}`);
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

      {/* Tab Content */}
      {children}
    </div>
  );
}
