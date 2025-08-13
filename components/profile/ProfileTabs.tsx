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

  // Determine active tab from URL pathname
  const activeTab = pathname.endsWith("/posts")
    ? "content"
    : pathname.endsWith("/score")
      ? "credentials"
      : "score"; // default to stats tab

  const tabs = [
    {
      id: "score",
      label: "Stats",
      href: `/${identifier}/stats`,
    },
    {
      id: "content",
      label: "Posts",
      href: `/${identifier}/posts`,
    },
    {
      id: "credentials",
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
