"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { sdk } from "@farcaster/frame-sdk";
import { useResolvedTalentProfile } from "@/hooks/useResolvedTalentProfile";
import { useLeaderboardData } from "@/hooks/useLeaderboardOptimized";
import {
  formatWithK,
  formatCurrency,
  openExternalUrl,
  getLevelFromScore,
} from "@/lib/utils";
import { CreatorList } from "@/components/common/CreatorList";
import { MyRewards } from "@/components/leaderboard/MyRewards";
import { StatCard } from "@/components/common/StatCard";
import { HowToEarnModal } from "@/components/modals/HowToEarnModal";
import { RewardBoostsModal } from "@/components/modals/RewardBoostsModal";
import {
  ACTIVE_SPONSORS,
  TOTAL_SPONSORS_POOL,
  ROUND_ENDS_AT,
  BOOST_CONFIG,
  LEVEL_RANGES,
  PERK_DRAW_DEADLINE_UTC,
} from "@/lib/constants";
import { PageContainer } from "@/components/common/PageContainer";
import { Section } from "@/components/common/Section";
import { Callout } from "@/components/common/Callout";
import { CalloutCarousel } from "@/components/common/CalloutCarousel";
import { HandHeart, Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// import { usePostHog } from "posthog-js/react";
import { Rocket } from "lucide-react";
import posthog from "posthog-js";
import { useUserTokenBalance } from "@/hooks/useUserTokenBalance";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { PerkModal } from "@/components/modals/PerkModal";
import { usePerkEntry } from "@/hooks/usePerkEntry";
import { useUserCalloutPrefs } from "@/hooks/useUserCalloutPrefs";

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
  const [, setShowBoostCallout] = useState(true);
  const [perkOpen, setPerkOpen] = useState(false);
  const searchParams = useSearchParams();
  // Season-aware dismissal for the "Rewards Boost" callout.
  // We persist the user's dismissal in localStorage with a key that includes
  // ROUND_ENDS_AT so the callout automatically reappears next rewards round.
  const boostDismissKey = React.useMemo(
    () => `boost_callout_dismissed:${ROUND_ENDS_AT.toISOString()}`,
    [],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = localStorage.getItem(boostDismissKey);
      if (dismissed === "true") setShowBoostCallout(false);
    } catch {}
  }, [boostDismissKey]);
  const { talentUuid: userTalentUuid } = useFidToTalentUuid();
  const [howToEarnOpen, setHowToEarnOpen] = useState(false);
  const [rewardBoostsOpen, setRewardBoostsOpen] = useState(false);
  // const posthog = usePostHog();

  // Use optimized leaderboard hook for all data
  const {
    entries: top200Entries,
    loading: top200Loading,
    rewardsLoading,
    error: top200Error,
    activeCreatorsTotal,
  } = useLeaderboardData();

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
  const { data: perkStatus, refresh: refreshPerkStatus } = usePerkEntry(
    "screen_studio",
    userTalentUuid,
  );

  // Fetch user token balance
  const { balance: tokenBalance, loading: tokenLoading } =
    useUserTokenBalance(userTalentUuid);

  // Server-persisted callout preferences
  const {
    dismissedIds: dismissedCalloutIds,
    permanentlyHiddenIds: permanentlyHiddenCalloutIds,
    addDismissedId,
    addPermanentlyHiddenId,
  } = useUserCalloutPrefs(userTalentUuid ?? null);

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

  function getBoostAmountUsd(
    score: number,
    rank?: number,
    isBoosted?: boolean,
  ): string | null {
    if (!rank || rank > 200 || !isBoosted) return null;
    const multiplier = calculateRewardMultiplier();
    if (multiplier === 0) return null;
    const base = score * multiplier;
    const boosted = score * 1.1 * multiplier;
    const boost = boosted - base;
    if (boost <= 0) return null;
    return boost >= 1 ? `$${boost.toFixed(0)}` : `$${boost.toFixed(2)}`;
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

  return (
    <>
      {/* My Rewards Hero - Show only when we have authenticated user context */}
      {(user || unifiedName) && (
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
          name={name!}
          isLoading={loadingStats || (top200Loading && !userTop200Entry)}
          rank={userTop200Entry?.rank}
          pointsToTop200={pointsToTop200}
          onHowToEarnClick={() => setHowToEarnOpen(true)}
          onBoostInfoClick={() => setRewardBoostsOpen(true)}
          tokenBalance={tokenBalance}
          tokenLoading={tokenLoading}
          isBoosted={userTop200Entry?.isBoosted}
          boostAmountUsd={getBoostAmountUsd(
            userTop200Entry?.score ?? creatorScore,
            userTop200Entry?.rank,
            userTop200Entry?.isBoosted,
          )}
          activeCreatorsTotal={activeCreatorsTotal}
        />
      )}

      {/* Callout Carousel (below MyRewards) - gated on user context */}
      {(user || unifiedName) && (
        <div className="mt-4 mb-2">
          <CalloutCarousel
            roundEndsAtIso={ROUND_ENDS_AT.toISOString()}
            dismissedIds={dismissedCalloutIds}
            permanentlyHiddenIds={permanentlyHiddenCalloutIds}
            onPersistDismiss={(id) => addDismissedId(id)}
            onPersistPermanentHide={(id) => addPermanentlyHiddenId(id)}
            items={(() => {
              const items = [] as Array<{
                id: string;
                variant: "brand" | "muted";
                color?: "purple" | "green" | "blue" | "pink";
                icon?: React.ReactNode;
                title: React.ReactNode;
                description?: React.ReactNode;
                href?: string;
                external?: boolean;
                onClick?: () => void;
                dismissKey?: string;
                permanentHideKey?: string;
                onClose?: () => void;
              }>;

              // REWARDS BOOST (purple) – visible to users with >= BOOST_CONFIG.TOKEN_THRESHOLD $TALENT
              const base = {
                id: "boost",
                variant: "brand" as const,
                color: "purple" as const,
                icon: <Rocket className="h-4 w-4" />,
                title: "10% Rewards Boost",
                description: <>Hold 100+ $TALENT to earn a boost.</>,
                href: "https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=0x9a33406165f562e16c3abd82fd1185482e01b49a",
                external: true,
              };
              if ((tokenBalance ?? 0) >= BOOST_CONFIG.TOKEN_THRESHOLD) {
                items.push({
                  ...base,
                  dismissKey: "boost_callout_dismissed",
                  onClose: () => {
                    try {
                      localStorage.setItem(boostDismissKey, "true");
                    } catch {}
                    setShowBoostCallout(false);
                  },
                });
              } else {
                items.push(base);
              }
              // OPTOUT REWARDS (green) – globally controlled via CALLOUT_FLAGS
              items.push({
                id: "optout",
                variant: "brand",
                color: "green",
                icon: <HandHeart className="h-4 w-4" />,
                title: "Pay It Forward",
                description: "Give your rewards, keep your rank.",
                dismissKey: "optout_callout_dismissed",
                onClose: () => {
                  try {
                    localStorage.setItem(
                      `optout_callout_dismissed:${ROUND_ENDS_AT.toISOString()}`,
                      "true",
                    );
                  } catch {}
                },
              });

              // CREATOR PERK (blue) – interactive, non-dismissible; reflects entered state
              items.push({
                id: "perk_screen_studio",
                variant: "brand",
                color: "blue",
                icon: <Gift className="h-4 w-4" />,
                title: "Creator Perk",
                description:
                  perkStatus?.status === "closed"
                    ? "Entries closed. Winners announced Aug 21"
                    : perkStatus?.status === "entered"
                      ? "You're in! 20 winners announced Aug 21"
                      : "Get a free Screen Studio subscription.",
                href: undefined,
                external: undefined,
                onClick: () => {
                  try {
                    posthog.capture("perk_draw_open", {
                      perk: "screen_studio",
                    });
                  } catch {}
                  setPerkOpen(true);
                },
                // Non-dismissible for this interactive callout
              });

              return items;
            })()}
          />
        </div>
      )}

      {/* How to Earn Modal */}
      <HowToEarnModal open={howToEarnOpen} onOpenChange={setHowToEarnOpen} />

      {/* Reward Boosts Modal (triggered only by MyRewards rocket) */}
      <RewardBoostsModal
        open={rewardBoostsOpen}
        onOpenChange={setRewardBoostsOpen}
        rewardUsd={getUsdcRewards(
          userTop200Entry?.score ?? creatorScore,
          userTop200Entry?.rank,
          false,
        )}
        tokenBalance={tokenBalance}
        boostUsd={
          getBoostAmountUsd(
            userTop200Entry?.score ?? creatorScore,
            userTop200Entry?.rank,
            true,
          ) ?? "$0"
        }
        totalUsd={getUsdcRewards(
          userTop200Entry?.score ?? creatorScore,
          userTop200Entry?.rank,
          userTop200Entry?.isBoosted,
        )}
        rank={userTop200Entry?.rank}
        score={userTop200Entry?.score ?? creatorScore}
      />

      {/* Perk Modal - Screen Studio */}
      <PerkModal
        open={perkOpen}
        onOpenChange={(o) => setPerkOpen(o)}
        color="blue"
        title="Creator Perk: Screen Studio"
        subtitle="Get 1 month of Screen Studio for free."
        access={`Level 3 (Creator Score ≥ ${LEVEL_RANGES[2].min})`}
        distribution="Draw"
        supply="20 monthly subscriptions"
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

      {/* Simplified Stat Cards */}
      <div className="grid grid-cols-2 gap-4 my-4">
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
              label: "Top 200",
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
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      aria-label="How to earn rewards boost"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Optional: analytics
                        try {
                          posthog.capture("boost_badge_clicked", {
                            location: "leaderboard_row",
                          });
                        } catch {}
                        setHowToEarnOpen(true);
                      }}
                    >
                      <Rocket className="h-3 w-3 text-purple-600" />
                    </button>
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

        {/* Sponsor Callout */}
        {activeTab === "sponsors" && (
          <div className="mt-4">
            <Callout variant="brand">
              <Typography size="xs" color="brand">
                Want to join as a sponsor? Reach out to {""}
                <button
                  className="underline hover:no-underline"
                  onClick={() =>
                    openExternalUrl("https://farcaster.xyz/juampi", context)
                  }
                >
                  @juampi
                </button>
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
