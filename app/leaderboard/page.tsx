"use client";
import { useState, useEffect, Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserResolution } from "@/hooks/useUserResolution";
import { sdk } from "@farcaster/frame-sdk";
import { useUserCreatorScore } from "@/hooks/useUserCreatorScore";
import { useLeaderboardOptimized } from "@/hooks/useLeaderboardOptimized";
import { formatWithK, formatCurrency, openExternalUrl } from "@/lib/utils";
import { CreatorList } from "@/components/common/CreatorList";
import { MyRewards } from "@/components/leaderboard/MyRewards";
import { StatCard } from "@/components/common/StatCard";
import { HowToEarnModal } from "@/components/modals/HowToEarnModal";
import {
  ACTIVE_SPONSORS,
  TOTAL_SPONSORS_POOL,
  ROUND_ENDS_AT,
} from "@/lib/constants";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Callout } from "@/components/common/Callout";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfileHeaderData } from "@/hooks/useProfileHeaderData";
import { useProfileCreatorScore } from "@/hooks/useProfileCreatorScore";
import { usePostHog } from "posthog-js/react";
import { Rocket } from "lucide-react";
import { useUserTokenBalance } from "@/hooks/useUserTokenBalance";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";

function getCountdownParts(target: Date) {
  const nowUTC = Date.now();
  const targetUTC = target.getTime();
  const diff = targetUTC - nowUTC;
  if (diff <= 0) return { days: 0, hours: 0 };
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return { days, hours };
}

function LeaderboardContent() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("creators");
  const { talentUuid: userTalentUuid } = useUserResolution();
  const [howToEarnOpen, setHowToEarnOpen] = useState(false);
  const posthog = usePostHog();

  // Use optimized leaderboard hook for all data
  const {
    entries: top200Entries,
    loading: top200Loading,
    rewardsLoading,
    error: top200Error,
    boostedCreatorsCount,
  } = useLeaderboardOptimized();

  // Use hooks for data fetching - both auth paths
  const { creatorScore: fidScore, loading: fidScoreLoading } =
    useUserCreatorScore(user?.fid);
  const { creatorScore: uuidScore, loading: uuidScoreLoading } =
    useProfileCreatorScore(userTalentUuid || "");
  const { profile, loading: profileLoading } = useProfileHeaderData(
    userTalentUuid || "",
  );

  // Combine data from both auth paths
  const creatorScore = fidScore ?? uuidScore ?? 0;
  const avatarUrl = user?.pfpUrl ?? profile?.image_url;
  const name =
    user?.displayName ??
    user?.username ??
    profile?.display_name ??
    profile?.fname ??
    "Unknown user";
  const loadingStats = profileLoading || fidScoreLoading || uuidScoreLoading;

  // Fetch user token balance
  const { balance: tokenBalance, loading: tokenLoading } =
    useUserTokenBalance(userTalentUuid);

  // Countdown state
  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(ROUND_ENDS_AT),
  );

  // Hide Farcaster Mini App splash screen when ready
  useEffect(() => {
    sdk.actions.ready(); // Notifies Farcaster host to hide splash
  }, []);

  // Live countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownParts(ROUND_ENDS_AT));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  // Find user entry in top 200 data for accurate rewards
  const userTop200Entry =
    userTalentUuid && top200Entries.length > 0
      ? top200Entries.find((e) => e.talent_protocol_id === userTalentUuid)
      : null;

  // Get the 200th position score
  const lastTop200Score = top200Entries[199]?.score ?? 0;

  // Calculate points needed to reach top 200
  const pointsToTop200 =
    creatorScore && !userTop200Entry && lastTop200Score > 0
      ? Math.max(0, lastTop200Score - creatorScore)
      : 0;

  // Helper to calculate the reward multiplier based on total boosted scores
  function calculateRewardMultiplier(): number {
    const totalBoostedScores = top200Entries.reduce((sum, entry) => {
      return sum + (entry.isBoosted ? entry.score * 1.1 : entry.score);
    }, 0);

    if (totalBoostedScores === 0) return 0;
    return TOTAL_SPONSORS_POOL / totalBoostedScores;
  }

  function getUsdcRewards(
    score: number,
    rank?: number,
    isBoosted?: boolean,
  ): string {
    // Only top 200 creators earn rewards
    if (!rank || rank > 200) return "$0";

    const multiplier = calculateRewardMultiplier();
    if (multiplier === 0) return "$0";

    // Calculate reward based on boosted score if applicable
    const boostedScore = isBoosted ? score * 1.1 : score;
    const reward = boostedScore * multiplier;

    // Format as currency
    if (reward >= 1) {
      return `$${reward.toFixed(0)}`;
    } else {
      return `$${reward.toFixed(2)}`;
    }
  }

  // Helper to calculate boost amount for a given score and rank
  function getBoostAmount(score: number, rank?: number): number {
    if (!rank || rank > 200 || !top200Entries.length) return 0;

    // Find the entry to check if it's boosted
    const entry = top200Entries.find((e) => e.rank === rank);
    if (!entry?.isBoosted) return 0;

    const multiplier = calculateRewardMultiplier();
    if (multiplier === 0) return 0;

    // Calculate rewards using the same multiplier
    const baseReward = score * multiplier; // Base score reward
    const boostedReward = score * 1.1 * multiplier; // Boosted score reward

    // Return the difference (boost amount)
    return boostedReward - baseReward;
  }

  // Handle tab changes with PostHog tracking
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "talent") {
      posthog?.capture("talent_tab_opened");
    }
  };

  return (
    <>
      {/* My Rewards Hero - Show if user is logged in via either path */}
      {(user || profile) && (
        <MyRewards
          rewards={
            creatorScore
              ? getUsdcRewards(
                  creatorScore,
                  userTop200Entry?.rank,
                  userTop200Entry?.isBoosted,
                )
              : "$0"
          }
          score={creatorScore}
          avatarUrl={avatarUrl}
          name={name}
          isLoading={loadingStats || (top200Loading && !userTop200Entry)}
          rank={userTop200Entry?.rank}
          pointsToTop200={pointsToTop200}
          onHowToEarnClick={() => setHowToEarnOpen(true)}
          tokenBalance={tokenBalance}
          tokenLoading={tokenLoading}
          isBoosted={userTop200Entry?.isBoosted}
        />
      )}

      {/* How to Earn Modal */}
      <HowToEarnModal open={howToEarnOpen} onOpenChange={setHowToEarnOpen} />

      {/* Simplified Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard
          title="Rewards Pool"
          value={`$${formatWithK(TOTAL_SPONSORS_POOL)}`}
        />
        <StatCard
          title="Rewards Distribution"
          value={`${countdown.days}d ${countdown.hours}h`}
        />
      </div>

      {/* Full width tabs */}
      <Section variant="full-width">
        <TabNavigation
          tabs={[
            {
              id: "creators",
              label: "Leaderboard",
            },
            {
              id: "talent",
              label: "Boosts",
              count: boostedCreatorsCount || 0,
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
            {/* Leaderboard list - show all 200 entries */}
            <CreatorList
              items={top200Entries.map((user) => {
                // Check if user is boosted
                const isBoosted = user.isBoosted;

                return {
                  id: user.id,
                  name: user.name,
                  avatarUrl: user.pfp,
                  rank: user.rank,
                  primaryMetric: getUsdcRewards(
                    user.score,
                    user.rank,
                    isBoosted,
                  ),
                  secondaryMetric: `Creator Score: ${user.score.toLocaleString()}`,
                  primaryMetricVariant: isBoosted ? "brand" : "default",
                  badge: isBoosted ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                      <Rocket className="h-3 w-3 text-purple-600" />
                    </div>
                  ) : undefined,
                };
              })}
              onItemClick={(item) => {
                // Navigate to profile page
                router.push(`/${item.id}`);
              }}
              loading={top200Loading}
              primaryMetricLoading={rewardsLoading}
            />
          </>
        )}

        {activeTab === "talent" && (
          <>
            {top200Loading && (
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

            {!top200Loading && (
              <>
                {/* Filter for boosted creators only */}
                {top200Entries.filter(
                  (entry) => entry.isBoosted && entry.score > 0,
                ).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No boosted creators found
                    </p>
                  </div>
                ) : (
                  /* Talent leaderboard list */
                  <CreatorList
                    items={top200Entries
                      .filter((entry) => entry.isBoosted && entry.score > 0)
                      .map((user) => {
                        const boostAmount = getBoostAmount(
                          user.score,
                          user.rank,
                        );

                        return {
                          id: user.id,
                          name: user.name,
                          avatarUrl: user.pfp,
                          rank: user.rank,
                          primaryMetric: `$${boostAmount.toFixed(0)}`,
                          secondaryMetric: `Creator Score: ${user.score.toLocaleString()}`,
                          primaryMetricVariant: "brand",
                        };
                      })}
                    onItemClick={(item) => {
                      // Navigate to profile page
                      router.push(`/${item.id}`);
                    }}
                    loading={false}
                  />
                )}
              </>
            )}
          </>
        )}

        {activeTab === "sponsors" && (
          <div className="overflow-hidden rounded-lg bg-gray-50">
            {ACTIVE_SPONSORS.map((sponsor, index, array) => (
              <div key={sponsor.id}>
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openExternalUrl(sponsor.farcasterUrl)}
                >
                  <span className="text-sm font-medium w-6">
                    #{sponsor.rank}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sponsor.avatar} />
                    <AvatarFallback>{sponsor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sponsor.name}</p>
                    <p className="text-xs text-gray-600">{sponsor.handle}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {formatCurrency(sponsor.amount)}
                    </span>
                  </div>
                </div>
                {index < array.length - 1 && (
                  <div className="h-px bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sponsor Callout */}
        {activeTab === "sponsors" && (
          <div className="mt-4">
            <Callout variant="brand" href="https://farcaster.xyz/juampi">
              <Typography size="xs" color="brand">
                Want to join as a sponsor? Reach out to @juampi
              </Typography>
            </Callout>
          </div>
        )}
      </Section>
    </>
  );
}

export default function LeaderboardPage() {
  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        <Suspense fallback={<Skeleton className="h-16 w-full" />}>
          <LeaderboardContent />
        </Suspense>
      </Section>
    </PageContainer>
  );
}
