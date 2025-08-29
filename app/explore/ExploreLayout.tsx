"use client";

import * as React from "react";
import { SearchBar } from "@/components/search";
import { useSearch } from "@/hooks/useSearch";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { useState, useEffect } from "react";

interface ExploreLayoutProps {
  children: (search: ReturnType<typeof useSearch>) => React.ReactNode;
}

export function ExploreLayout({ children }: ExploreLayoutProps) {
  const [loadSearch, setLoadSearch] = useState(false);
  const search = useSearch(loadSearch);

  useEffect(() => {
    setLoadSearch(true);
  }, []);

  // TODO: Re-enable tab system when Friends and Featured tabs are ready for development
  // const tabs = [
  //   { id: "all", label: "All" },
  //   { id: "friends", label: "Friends", disabled: true },
  //   { id: "featured", label: "Featured", disabled: true },
  // ];

  // // Determine active tab from pathname
  // const activeTab = pathname.split("/").pop() || "all";

  // const handleTabChange = (tabId: string) => {
  //   // Navigate to the selected tab (even if disabled for now)
  //   router.push(`/explore/${tabId}`);
  // };

  // TODO: Track search queries for PostHog
  const handleSearchChange = (query: string) => {
    search.handleQueryChange(query);
  };

  return (
    <PageContainer>
      {/* Header section */}
      <Section variant="header">
        <SearchBar
          value={search.query}
          onChange={handleSearchChange}
          placeholder="Search creators by name…"
        />
      </Section>

      {/* TODO: Re-enable tab navigation when Friends and Featured tabs are ready for development */}
      {/* Full width tabs */}
      {/* <Section variant="full-width">
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </Section> */}

      {/* Content section */}
      <Section variant="content" animate>
        {children(search)}
      </Section>
    </PageContainer>
  );
}
