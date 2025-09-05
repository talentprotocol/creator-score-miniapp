"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { TabNavigation } from "@/components/common/tabs-navigation";

interface ProfileTabsProps {
  talentUUID: string;
  identifier: string; // The URL identifier for building links
}

export function ProfileTabs({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  talentUUID,
  identifier,
}: ProfileTabsProps) {
  const pathname = usePathname() || "";

  // Determine active tab from URL pathname - badges is default
  const activeTab = pathname.endsWith("/posts")
    ? "posts"
    : pathname.endsWith("/score")
      ? "score"
      : pathname.endsWith("/stats")
        ? "stats"
        : "badges"; // default to badges tab

  const tabs = [
    {
      id: "badges",
      label: "Badges",
      href: `/${identifier}/badges`,
    },
    {
      id: "stats",
      label: "Stats",
      href: `/${identifier}/stats`,
    },
    {
      id: "posts",
      label: "Posts",
      href: `/${identifier}/posts`,
    },
    {
      id: "score",
      label: "Score",
      href: `/${identifier}/score`,
    },
  ];

  // Always render the tab navigation
  return (
    <div className="w-full flex flex-col">
      <TabNavigation tabs={tabs} activeTab={activeTab} />
    </div>
  );
}
