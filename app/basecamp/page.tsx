"use client";

import { useEffect, Suspense } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useBasecampLeaderboard } from "@/hooks/useBasecampLeaderboard";
import { useBasecampStats } from "@/hooks/useBasecampStats";
import { useBasecampTotals } from "@/hooks/useBasecampTotals";
import { useBasecampTabVisibility } from "@/hooks/useBasecampTabVisibility";
import { useUserCalloutPrefs } from "@/hooks/useUserCalloutPrefs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter, useSearchParams } from "next/navigation";
import { sdk } from "@farcaster/frame-sdk";

import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { CreatorList } from "@/components/common/CreatorList";
import { BasecampDataTable } from "@/components/basecamp/BasecampDataTable";
import { BasecampStatsCards } from "@/components/basecamp/BasecampStatsCards";
import { CalloutCarousel } from "@/components/common/CalloutCarousel";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target } from "lucide-react";

import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import { BasecampTab } from "@/lib/types/basecamp";

function BasecampContent() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { talentUuid: userTalentUuid } = useFidToTalentUuid();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Tab state management
  const currentTab = (searchParams.get("tab") || "reputation") as BasecampTab;

  // Check if coins tab should be visible
  const { showCoinsTab, loading: tabCheckLoading } = useBasecampTabVisibility();

  // Note: Sort state is managed by the hook, we just need to track tab changes

  // Data hooks
  const { stats, loading: statsLoading } = useBasecampStats();
  const { reputationTotal, coinsTotal } = useBasecampTotals();

  const {
    profiles,
    pinnedUser,
    loading,
    error,
    hasMore,
    sortColumn,
    sortOrder,
    isSorting,
    offset,
    showMore,
    setSorting,
  } = useBasecampLeaderboard(userTalentUuid, currentTab);

  // Callout preferences
  const {
    permanentlyHiddenIds: permanentlyHiddenCalloutIds,
    addPermanentlyHiddenId,
  } = useUserCalloutPrefs(userTalentUuid ?? null);

  // Hide Farcaster Mini App splash screen when ready
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const isLoggedIn = !!(user?.fid || userTalentUuid);

  // Handle tab change with URL update
  const handleTabChange = (tabId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (tabId === "reputation") {
      newSearchParams.delete("tab"); // Default tab
    } else {
      newSearchParams.set("tab", tabId);
    }
    router.push(`/basecamp?${newSearchParams.toString()}`);
  };

  // Handle row/item clicks
  const handleItemClick = (profile: { talent_uuid?: string; id?: string }) => {
    router.push(`/${profile.talent_uuid || profile.id}`);
  };

  // Define tabs based on visibility
  const tabs = [
    { id: "reputation", label: "Creator Reputation", count: reputationTotal },
    ...(showCoinsTab
      ? [{ id: "coins", label: "Creator Coins", count: coinsTotal }]
      : []),
  ];

  // Map data for mobile CreatorList based on current tab
  const creatorListItems = profiles.map((profile, index) => ({
    id: profile.talent_uuid,
    name: profile.display_name,
    avatarUrl: profile.image_url || undefined,
    rank: offset + index + 1, // Simple mobile rank based on current sort order
    primaryMetric:
      currentTab === "coins"
        ? formatCompactNumber(profile.base200_score || 0)
        : formatCompactNumber(profile.creator_score || 0),
    secondaryMetric:
      currentTab === "coins"
        ? profile.zora_creator_coin_market_cap
          ? `Market Cap: ${formatCurrency(profile.zora_creator_coin_market_cap)}`
          : "Market Cap: N/A"
        : profile.total_earnings
          ? `Total Earnings: ${formatCurrency(profile.total_earnings)}`
          : "Total Earnings: N/A",
  }));

  // Add pinned user for both desktop and mobile views in correct position
  const finalCreatorItems = (() => {
    if (isLoggedIn && pinnedUser) {
      const pinnedItem = {
        id: pinnedUser.talent_uuid,
        name: pinnedUser.display_name,
        avatarUrl: pinnedUser.image_url || undefined,
        rank: pinnedUser.rank || 0, // Use server-calculated rank for pinned users
        primaryMetric:
          currentTab === "coins"
            ? formatCompactNumber(pinnedUser.base200_score || 0)
            : formatCompactNumber(pinnedUser.creator_score || 0),
        secondaryMetric:
          currentTab === "coins"
            ? pinnedUser.zora_creator_coin_market_cap
              ? `Market Cap: ${formatCurrency(pinnedUser.zora_creator_coin_market_cap)}`
              : "Market Cap: N/A"
            : pinnedUser.total_earnings
              ? `Total Earnings: ${formatCurrency(pinnedUser.total_earnings)}`
              : "Total Earnings: N/A",
      };

      // Remove from main list if present and insert at correct position
      const filteredItems = creatorListItems.filter(
        (item) => item.id !== pinnedUser.talent_uuid,
      );

      // Insert pinned user at their correct rank position
      const pinnedRank = pinnedUser.rank || 0;
      const insertIndex = Math.max(
        0,
        Math.min(pinnedRank - offset - 1, filteredItems.length),
      );

      // Insert the pinned user at the correct position
      const result = [...filteredItems];
      result.splice(insertIndex, 0, pinnedItem);

      return result;
    }
    return creatorListItems;
  })();

  // Create final desktop data with pinned user in rank position
  const finalDesktopData = (() => {
    if (isLoggedIn && pinnedUser) {
      // Remove pinned user from main profiles if present
      const filteredProfiles = profiles.filter(
        (profile) => profile.talent_uuid !== pinnedUser.talent_uuid,
      );

      // Insert pinned user at their correct rank position
      const pinnedRank = pinnedUser.rank || 0;
      const insertIndex = Math.max(
        0,
        Math.min(pinnedRank - offset - 1, filteredProfiles.length),
      );

      // Insert the pinned user at the correct position
      const result = [...filteredProfiles];
      result.splice(insertIndex, 0, pinnedUser);

      return result;
    }
    return profiles;
  })();

  return (
    <PageContainer className={isDesktop ? "max-w-none px-6" : undefined}>
      {/* Stats Cards */}
      <Section variant="content">
        <BasecampStatsCards stats={stats} loading={statsLoading} />
      </Section>

      {/* Welcome Banner */}
      <Section variant="content">
        <CalloutCarousel
          permanentlyHiddenIds={permanentlyHiddenCalloutIds}
          onPersistPermanentHide={(id) => addPermanentlyHiddenId(id)}
          items={[
            {
              id: "basecamp-welcome",
              variant: "brand-blue",
              icon: <Target className="h-4 w-4" />,
              title: "Welcome to BaseCamp",
              description:
                "Explore 500+ Base builders and creators. Sort by creator coins, scores, or earnings.",
              permanentHideKey: "basecamp_welcome_dismissed",
              onClose: () => {
                // Handle dismissal - persistence handled by CalloutCarousel
              },
            },
          ]}
        />
      </Section>

      {/* Tabs - only show if coins tab is available OR loading */}
      {(showCoinsTab || tabCheckLoading) && (
        <Section variant="full-width">
          <TabNavigation
            tabs={tabs}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />
        </Section>
      )}

      {/* Leaderboard Section */}
      <Section variant="content" animate>
        {error && (
          <div className="text-destructive text-sm px-2 mb-4">
            Failed to load leaderboard data. Please try again later.
          </div>
        )}

        {loading && profiles.length === 0 && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table View */}
        {isDesktop && !loading && profiles.length > 0 && (
          <div className="relative">
            {isSorting && (
              <div className="absolute top-2 right-2 z-10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                  <div className="animate-spin h-3 w-3 border border-muted-foreground border-t-transparent rounded-full" />
                  Sorting...
                </div>
              </div>
            )}
            <BasecampDataTable
              data={finalDesktopData}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={setSorting}
              onRowClick={handleItemClick}
              pinnedIndex={isLoggedIn && pinnedUser ? 0 : undefined}
              tab={currentTab}
            />
          </div>
        )}

        {/* Mobile Card View */}
        {!isDesktop && !loading && profiles.length > 0 && (
          <>
            {/* Column headings for mobile */}
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="w-6 text-[10px] uppercase tracking-wide text-muted-foreground">
                Rank
              </span>
              <div className="w-8" />
              <span className="flex-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                Creator
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {currentTab === "coins" ? "Coin Score" : "Creator Score"}
              </span>
            </div>

            <CreatorList
              items={finalCreatorItems}
              onItemClick={handleItemClick}
              loading={loading}
              pinnedIndex={isLoggedIn && pinnedUser ? 0 : undefined}
            />
          </>
        )}

        {/* Show More Button */}
        {!loading && hasMore && !isSorting && (
          <div className="flex justify-center mt-6">
            <Button
              variant="ghost"
              onClick={showMore}
              disabled={loading || isSorting}
            >
              Show More
            </Button>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}

export default function BasecampPage() {
  return (
    <Suspense fallback={<Skeleton className="h-16 w-full" />}>
      <BasecampContent />
    </Suspense>
  );
}
