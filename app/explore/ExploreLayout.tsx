"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { SearchBar } from "@/components/search";
import { useSearch } from "@/hooks/useSearch";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { useState, useEffect } from "react";

interface ExploreLayoutProps {
  children: (search: ReturnType<typeof useSearch>) => React.ReactNode;
}

export function ExploreLayout({ children }: ExploreLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadSearch, setLoadSearch] = useState(false);
  const search = useSearch(loadSearch);

  useEffect(() => {
    setLoadSearch(true);
  }, []);

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
  };

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        <SearchBar
          value={search.query}
          onChange={handleSearchChange}
          placeholder="Search creators by name…"
        />
      </Section>

      {/* Full width tabs */}
      <Section variant="full-width">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </Section>

      {/* Content section */}
      <Section variant="content" animate>
        {children(search)}
      </Section>
    </PageContainer>
  );
}
