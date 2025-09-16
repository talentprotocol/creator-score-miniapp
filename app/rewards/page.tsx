"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { sdk } from "@farcaster/frame-sdk";
import { useResolvedTalentProfile } from "@/hooks/useResolvedTalentProfile";
import { useRewardsData } from "@/hooks/useRewardsData";
import {
  formatCompactNumber,
  formatCurrency,
  openExternalUrl,
  getLevelFromScore,
} from "@/lib/utils";
import { CreatorList } from "@/components/common/CreatorList";
import { MyRewards } from "@/components/leaderboard/MyRewards";
import { StatCard } from "@/components/common/StatCard";

import { FarcasterAccessModal } from "@/components/modals/FarcasterAccessModal";
import {
  ACTIVE_SPONSORS,
  TOTAL_SPONSORS_POOL,
  LEVEL_RANGES,
  PERK_DRAW_DEADLINE_UTC,
} from "@/lib/constants";

import { Section } from "@/components/common/Section";
import { PageContainer } from "@/components/common/PageContainer";
import { HandHeart, HandCoins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import posthog from "posthog-js";

import * as React from "react";
import { useRouter } from "next/navigation";

import { PerkModal } from "@/components/modals/PerkModal";
import { usePerkEntry } from "@/hooks/usePerkEntry";

// Token balance not needed for read-only rewards page

// Feature flag to enable/disable pinned leaderboard entry
const ENABLE_PINNED_LEADERBOARD_ENTRY = true;

// Countdown function not needed for read-only rewards page

function RewardsContent() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("creators");
  const [perkOpen, setPerkOpen] = useState(false);
  const searchParams = useSearchParams();
  const { talentUuid: userTalentUuid } = useFidToTalentUuid();

  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Use optimized leaderboard hook for all data
  const {
    entries: top200Entries,
    loading: top200Loading,
    rewardsLoading,
    error: top200Error,
    pinnedUser,
  } = useRewardsData(userTalentUuid);

  // No rewards decision logic needed for rewards page - it's read-only

  // Use hooks for data fetching - both auth paths
  const {
    creatorScore: unifiedScore,
    displayName: unifiedName,
    avatarUrl: unifiedAvatar,
    loading: unifiedLoading,
  } = useResolvedTalentProfile();

  // Combine data from both auth paths
  const creatorScore = unifiedScore ?? 0;
  const avatarUrl = unifiedAvatar ?? user?.pfpUrl;
  const name = unifiedName ?? user?.displayName ?? user?.username;
  const loadingStats = unifiedLoading;
  const level = getLevelFromScore(creatorScore);
  const { refresh: refreshPerkStatus } = usePerkEntry(
    "screen_studio",
    userTalentUuid,
  );

  // Find user entry in top 200 data for accurate rewards
  const userTop200Entry =
    userTalentUuid && top200Entries.length > 0
      ? top200Entries.find((e) => e.talent_protocol_id === userTalentUuid)
      : null;

  // Token balance not needed for read-only rewards page

  // Rewards page is read-only - no need for decision logic

  // Countdown not needed for read-only rewards page

  // Hide Farcaster Mini App splash screen when ready
  useEffect(() => {
    sdk.actions.ready(); // Notifies Farcaster host to hide splash
  }, []);

  // No countdown needed for read-only rewards page

  function getUsdcRewards(): string {
    // If user is in top 200 but no reward data, show "N/A"
    if (userTop200Entry && userTop200Entry.boostedReward === null) {
      return "N/A";
    }

    const snapshotReward = userTop200Entry?.boostedReward || 0;
    return `$${Math.round(snapshotReward)}`;
  }

  // Handle tab changes with PostHog tracking
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    try {
      const perk = searchParams?.get("perk");
      if (perk === "screen-studio") setPerkOpen(true);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoggedIn = !!(user || unifiedName);

  return (
    <PageContainer>
      {/* Header section with all elements above tabs */}
      <Section variant="header">
        {/* My Rewards Hero - Show only when we have authenticated user context */}
        {(user || unifiedName) && (
          <MyRewards
            rewards={creatorScore ? getUsdcRewards() : "$0"}
            score={creatorScore}
            avatarUrl={avatarUrl}
            name={name!}
            isLoading={loadingStats || (top200Loading && !userTop200Entry)}
            rank={userTop200Entry?.rank}
            onInfoClick={undefined}
            talentUuid={userTalentUuid}
            rewardsDecision={
              userTop200Entry?.isOptedOut
                ? "opted_out"
                : userTop200Entry?.isOptedIn
                  ? "opted_in"
                  : null
            }
            onOptOutBadgeClick={() =>
              router.push("/settings?section=pay-it-forward")
            }
          />
        )}

        {/* Simplified Stat Cards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <StatCard
            title="Rewards Pool"
            value={`$${formatCompactNumber(TOTAL_SPONSORS_POOL)}`}
          />
          <StatCard title="Rewards Distributed" value="16.Set.25" />
        </div>
      </Section>

      {/* Perk Modal - Screen Studio */}
      <PerkModal
        open={perkOpen}
        onOpenChange={(o) => setPerkOpen(o)}
        title="Creator Perk: Screen Studio"
        subtitle="Get 1 month of Screen Studio for free."
        access={`Level 3 (Creator Score ≥ ${LEVEL_RANGES[2].min})`}
        distribution="Draw"
        supply="20 monthly subscriptions"
        url="https://screen.studio/"
        ctaLabel="Enter"
        level={level}
        requiredLevel={3}
        perkId="screen_studio"
        talentUUID={userTalentUuid ?? null}
        deadlineIso={PERK_DRAW_DEADLINE_UTC.toISOString()}
        iconUrl="/logos/screen-studio.png"
        iconAlt="Screen Studio"
        onClaim={() => {
          // Keep modal open; refresh callout state immediately
          refreshPerkStatus();
        }}
      />

      {/* Login Modal for logged-out users */}
      <FarcasterAccessModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />

      {/* Rewards info functionality removed - page is now read-only */}

      {/* Full width tabs - outside PageContainer constraints */}
      <Section variant="full-width">
        <div className="w-full border-b border-border bg-background">
          <TabNavigation
            tabs={[
              {
                id: "creators",
                label: "TOP200",
              },
              {
                id: "sponsors",
                label: "Sponsors",
                count: ACTIVE_SPONSORS.length,
              },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </Section>

      {/* Content section */}
      <Section variant="content" animate>
        {top200Loading && top200Error && (
          <div className="text-destructive text-sm px-2">{top200Error}</div>
        )}

        {activeTab === "creators" && (
          <>
            {top200Loading && top200Entries.length === 0 && (
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
            {/* Subtle column headings for Top 200 */}
            {!top200Loading && top200Entries.length > 0 && (
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="w-6 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Rank
                </span>
                <div className="w-8" />
                <span className="flex-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Creator
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Reward
                </span>
              </div>
            )}
            {/* Leaderboard list - include pinned current user as first item when logged in */}
            <CreatorList
              items={(() => {
                const baseItems: Array<{
                  id: string;
                  name: string;
                  avatarUrl?: string;
                  rank?: number;
                  primaryMetric?: string;
                  primaryMetricLoading?: boolean;
                  secondaryMetric?: string;
                  badge?: React.ReactNode;
                  primaryMetricVariant?:
                    | "default"
                    | "brand-purple"
                    | "brand-green"
                    | "brand-blue"
                    | "muted";
                  isOptedOut?: boolean;
                }> = top200Entries.map((user) => {
                  const isOptedOut = user.isOptedOut;
                  const isOptedIn = user.isOptedIn;
                  const isUndecided = user.isUndecided;

                  // Show "-" for rank -1 (no rank available)
                  const displayRank = user.rank === -1 ? undefined : user.rank;

                  return {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.pfp,
                    rank: displayRank,
                    primaryMetric:
                      (user.boostedReward || 0) >= 1
                        ? `$${(user.boostedReward || 0).toFixed(0)}`
                        : `$${(user.boostedReward || 0).toFixed(2)}`,
                    secondaryMetric: `Creator Score: ${user.score.toLocaleString()}`,
                    primaryMetricVariant: isUndecided
                      ? "muted"
                      : isOptedOut
                        ? "brand-green"
                        : isOptedIn
                          ? "brand-blue"
                          : "muted",
                    isOptedOut: isOptedOut,
                    badge: isOptedOut ? (
                      isLoggedIn ? (
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-light hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
                          aria-label="View Pay It Forward settings"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              posthog.capture("optout_badge_clicked", {
                                location: "leaderboard_row",
                              });
                            } catch {}
                            router.push("/settings?section=pay-it-forward");
                          }}
                        >
                          <HandHeart className="h-3 w-3 text-brand-green" />
                        </button>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-light">
                          <HandHeart className="h-3 w-3 text-brand-green" />
                        </div>
                      )
                    ) : isOptedIn ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue-light">
                        <HandCoins className="h-3 w-3 text-brand-blue" />
                      </div>
                    ) : undefined,
                  };
                });

                // Build pinned item for current user when authenticated
                const shouldShowPinned =
                  isLoggedIn && ENABLE_PINNED_LEADERBOARD_ENTRY;
                if (!shouldShowPinned) return baseItems;

                // For rewards page, no decision logic needed - it's read-only
                const pinnedIsOptedOut = false;
                const pinnedIsOptedIn = false;
                const pinnedIsUndecided = true;
                const pinnedId = userTop200Entry?.id || (userTalentUuid ?? "");
                if (!pinnedId) return baseItems;

                const pinnedItem: {
                  id: string;
                  name: string;
                  avatarUrl?: string;
                  rank?: number;
                  primaryMetric?: string;
                  primaryMetricLoading?: boolean;
                  secondaryMetric?: string;
                  badge?: React.ReactNode;
                  primaryMetricVariant?:
                    | "default"
                    | "brand-purple"
                    | "brand-green"
                    | "brand-blue"
                    | "muted";
                  isOptedOut?: boolean;
                } = {
                  id: pinnedId,
                  name: name || "",
                  avatarUrl: avatarUrl,
                  rank: userTop200Entry?.rank,
                  primaryMetric: creatorScore ? getUsdcRewards() : undefined,
                  primaryMetricLoading:
                    loadingStats ||
                    (top200Loading && !userTop200Entry) ||
                    false,
                  secondaryMetric: `Creator Score: ${(
                    userTop200Entry?.score ?? creatorScore
                  ).toLocaleString()}`,
                  primaryMetricVariant: pinnedIsUndecided
                    ? "muted"
                    : pinnedIsOptedOut
                      ? "brand-green"
                      : pinnedIsOptedIn
                        ? "brand-blue"
                        : "muted",
                  isOptedOut: pinnedIsOptedOut,
                  badge: pinnedIsOptedOut ? (
                    isLoggedIn ? (
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-light hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green"
                        aria-label="View Pay It Forward settings"
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            posthog.capture("optout_badge_clicked", {
                              location: "leaderboard_row",
                            });
                          } catch {}
                          router.push("/settings?section=pay-it-forward");
                        }}
                      >
                        <HandHeart className="h-3 w-3 text-brand-green" />
                      </button>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green-light">
                        <HandHeart className="h-3 w-3 text-brand-green" />
                      </div>
                    )
                  ) : pinnedIsOptedIn ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue-light">
                      <HandCoins className="h-3 w-3 text-brand-blue" />
                    </div>
                  ) : undefined,
                };

                // Build pinned item for current user when authenticated
                const shouldShowPinned =
                  isLoggedIn && ENABLE_PINNED_LEADERBOARD_ENTRY && pinnedUser;
                if (!shouldShowPinned) return baseItems;

                // Use pinnedUser data from API
                const pinnedItem: {
                  id: string;
                  name: string;
                  avatarUrl?: string;
                  rank?: number;
                  primaryMetric?: string;
                  primaryMetricLoading?: boolean;
                  secondaryMetric?: string;
                  badge?: React.ReactNode;
                  primaryMetricVariant?:
                    | "default"
                    | "brand-purple"
                    | "brand-green"
                    | "brand-blue"
                    | "muted";
                  isOptedOut?: boolean;
                } = {
                  id: pinnedUser.id,
                  name: pinnedUser.display_name || name || "",
                  avatarUrl: pinnedUser.image_url || avatarUrl,
                  rank: pinnedUser.rank,
                  primaryMetric: creatorScore ? getUsdcRewards() : undefined,
                  primaryMetricLoading:
                    loadingStats ||
                    (top200Loading && !userTop200Entry) ||
                    false,
                  secondaryMetric: `Creator Score: ${(
                    userTop200Entry?.score ?? creatorScore
                  ).toLocaleString()}`,
                  primaryMetricVariant: "muted", // Default for rewards page
                  isOptedOut: false, // Default for rewards page
                };
                const deduped = baseItems.filter((u) => u.id !== pinnedUser.id);
                return [pinnedItem, ...deduped];
              })()}
              onItemClick={(item) => {
                // Navigate to profile page
                router.push(`/${item.id}`);
              }}
              loading={top200Loading}
              primaryMetricLoading={rewardsLoading}
              pinnedIndex={
                isLoggedIn && ENABLE_PINNED_LEADERBOARD_ENTRY ? 0 : undefined
              }
            />
          </>
        )}

        {activeTab === "sponsors" && (
          <>
            {/* Subtle column headings for Sponsors (outside bordered list) */}
            {ACTIVE_SPONSORS.length > 0 && (
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="w-6 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Rank
                </span>
                <div className="w-8" />
                <span className="flex-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sponsor
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Amount
                </span>
              </div>
            )}
            <CreatorList
              items={ACTIVE_SPONSORS.map((sponsor) => ({
                id: sponsor.id,
                name: sponsor.name,
                avatarUrl: sponsor.avatar,
                rank: sponsor.rank,
                primaryMetric: formatCurrency(sponsor.amount),
                secondaryMetric: sponsor.handle,
              }))}
              onItemClick={(item) => {
                const sponsor = ACTIVE_SPONSORS.find((s) => s.id === item.id);
                if (sponsor) openExternalUrl(sponsor.farcasterUrl);
              }}
            />
          </>
        )}

        {/* Rewards decision functionality removed - page is now read-only */}
      </Section>
    </PageContainer>
  );
}

export default function RewardsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-16 w-full" />}>
      <RewardsContent />
    </Suspense>
  );
}
