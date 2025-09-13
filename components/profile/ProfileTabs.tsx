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

  // Determine active tab from URL pathname - stats is default
  const activeTab = pathname.endsWith("/badges") ? "badges" : "stats"; // default to stats tab

  const tabs = [
    {
      id: "stats",
      label: "Stats",
      href: `/${identifier}/stats`,
    },
    {
      id: "badges",
      label: "Badges",
      href: `/${identifier}/badges`,
    },
  ];

  // Always render the tab navigation
  return (
    <div className="w-full flex flex-col">
      <TabNavigation tabs={tabs} activeTab={activeTab} />
    </div>
  );
}
