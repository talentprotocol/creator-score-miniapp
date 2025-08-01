"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserResolution } from "@/hooks/useUserResolution";
import type { LeaderboardEntry } from "@/app/services/types";
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

export default function LeaderboardPage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const [activeTab, setActiveTab] = useState("creators");
  const { talentUuid: userTalentUuid } = useUserResolution();
  const [howToEarnOpen, setHowToEarnOpen] = useState(false);
  const [visibleEntries, setVisibleEntries] = useState<LeaderboardEntry[]>([]);

  // Initial fast load of first 10 entries
  // Use optimized leaderboard hook for all data
  const {
    top200: top200Entries,
    loading: { top200: top200Loading, stats: statsLoading },
    error: top200Error,
    totalScores: totalTop200Scores,
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
  const loadingStats =
    statsLoading || profileLoading || fidScoreLoading || uuidScoreLoading;

  // Countdown state
  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(ROUND_ENDS_AT),
  );

  // Update visible entries when data changes
  useEffect(() => {
    if (top200Entries.length > 0) {
      setVisibleEntries(top200Entries);
    }
  }, [top200Entries]);

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

  // Helper to calculate USDC rewards using top 200 scores
  function getUsdcRewards(score: number, rank?: number): string {
    // Only top 200 creators earn rewards
    if (!rank || rank > 200 || !totalTop200Scores) return "$0";

    // Calculate multiplier based on total top 200 scores
    const multiplier = TOTAL_SPONSORS_POOL / totalTop200Scores;
    const reward = score * multiplier;

    // Format as currency
    if (reward >= 1) {
      return `$${reward.toFixed(0)}`;
    } else {
      return `$${reward.toFixed(2)}`;
    }
  }

  // Handler to navigate to profile page for a leaderboard entry
  // function handleEntryClick(entry: LeaderboardEntry) {
  //   const url = generateProfileUrl({
  //     farcasterHandle: null, // We don't have farcaster handle from leaderboard data
  //     talentId: entry.talent_protocol_id,
  //   });

  //   if (url) {
  //     router.push(url);
  //   }
  // }

  // Determine loading and pagination state
  const hasMore =
    top200Entries.length > 0
      ? top200Entries.length < 200
      : visibleEntries.length < top200Entries.length;
  const loading = top200Loading;

  // Handler to load more entries
  const loadMore = () => {
    // Load more from top200Entries
    const currentLength = visibleEntries.length;
    const nextEntries = top200Entries.slice(currentLength, currentLength + 10);
    setVisibleEntries([...visibleEntries, ...nextEntries]);
  };

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        {/* My Rewards Hero - Show if user is logged in via either path */}
        {(user || profile) && (
          <MyRewards
            rewards={
              creatorScore
                ? getUsdcRewards(creatorScore, userTop200Entry?.rank)
                : "$0"
            }
            score={creatorScore}
            avatarUrl={avatarUrl}
            name={name}
            isLoading={loadingStats || (top200Loading && !userTop200Entry)}
            rank={userTop200Entry?.rank}
            pointsToTop200={pointsToTop200}
            onHowToEarnClick={() => setHowToEarnOpen(true)}
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
      </Section>

      {/* Full width tabs */}
      <Section variant="full-width">
        <TabNavigation
          tabs={[
            {
              id: "creators",
              label: "Leaderboard",
              count: 200,
            },
            {
              id: "sponsors",
              label: "Sponsors",
              count: ACTIVE_SPONSORS.length,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </Section>

      {/* Content section */}
      <Section variant="content" animate>
        {loading && top200Error && (
          <div className="text-destructive text-sm px-2">{top200Error}</div>
        )}

        {activeTab === "creators" && (
          <>
            {loading && visibleEntries.length === 0 && (
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
            {/* Leaderboard list */}
            <CreatorList
              items={visibleEntries.map((user) => ({
                id: String(user.talent_protocol_id),
                name: user.name,
                avatarUrl: user.pfp,
                rank: user.rank,
                secondaryMetric: `Creator Score: ${user.score.toLocaleString()}`,
                primaryMetric: getUsdcRewards(user.score, user.rank),
              }))}
              onItemClick={(item) => {
                // Navigate to profile page
                window.location.href = `/${item.id}`;
              }}
              loading={loading}
            />

            {/* Load More button - only show if there are more entries and we haven't reached 200 */}
            {hasMore && visibleEntries.length < 200 && (
              <Button
                styling="default"
                className="w-full flex items-center justify-center mt-4"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mr-2"></span>
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            )}
          </>
        )}

        {activeTab === "sponsors" && (
          <CreatorList
            items={ACTIVE_SPONSORS.map((sponsor) => ({
              id: sponsor.id,
              name: sponsor.name,
              avatarUrl: sponsor.avatar,
              rank: sponsor.rank,
              secondaryMetric: sponsor.handle,
              primaryMetric: formatCurrency(sponsor.amount),
            }))}
            onItemClick={(item) => {
              const sponsor = ACTIVE_SPONSORS.find((s) => s.id === item.id);
              if (sponsor) {
                openExternalUrl(sponsor.farcasterUrl);
              }
            }}
          />
        )}

        {/* Sponsor Callout */}
        {activeTab === "sponsors" && (
          <div className="mt-4">
            <Callout
              variant="brand"
              href="https://farcaster.xyz/juampi"
              textSize="xs"
            >
              Want to join as a sponsor? Reach out to @juampi
            </Callout>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
