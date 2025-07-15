import * as React from "react";
import { usePathname } from "next/navigation";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { useScoreRefresh } from "@/hooks/useScoreRefresh";
import { NoScoreStates } from "./NoScoreStates";

interface ProfileTabsProps {
  talentUUID: string;
  identifier: string; // The URL identifier for building links
}

export function ProfileTabs({ talentUUID, identifier }: ProfileTabsProps) {
  const pathname = usePathname();

  // Determine active tab from URL pathname
  const activeTab = pathname.endsWith("/posts")
    ? "content"
    : pathname.endsWith("/score")
      ? "credentials"
      : "score"; // default to stats tab

  const {
    hasNoScore,
    calculating,
    calculatingEnqueuedAt,
    loading: scoreLoading,
    refetch: refetchScore,
  } = useProfileCreatorScore(talentUUID);

  // Hook for handling score refresh
  const {
    isRefreshing,
    successMessage,
    error: refreshError,
    refreshScore,
  } = useScoreRefresh(talentUUID, refetchScore);

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

  // Handle calculate score action
  const handleCalculateScore = () => {
    refreshScore();
  };

  // If user has no score, show simplified version instead of tabs
  if (hasNoScore && !scoreLoading) {
    return (
      <div className="w-full flex flex-col">
        <div className="mt-6">
          <NoScoreStates
            calculating={calculating}
            calculatingEnqueuedAt={calculatingEnqueuedAt}
            onCalculateScore={handleCalculateScore}
            isRefreshing={isRefreshing}
            successMessage={successMessage}
            errorMessage={refreshError}
          />
        </div>
      </div>
    );
  }

  // For users with scores, just render the tab navigation
  // The content will be rendered by the children (tab-specific pages)
  return (
    <div className="w-full flex flex-col">
      <TabNavigation tabs={tabs} activeTab={activeTab} />
    </div>
  );
}
