"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { useUserResolution } from "@/hooks/useUserResolution";
import type { LeaderboardEntry } from "@/app/services/types";
import { sdk } from "@farcaster/frame-sdk";
import { useUserCreatorScore } from "@/hooks/useUserCreatorScore";
import { useLeaderboardOptimized } from "@/hooks/useLeaderboardOptimized";
import { useRouter } from "next/navigation";
import {
  generateProfileUrl,
  formatWithK,
  formatDate,
  formatCurrency,
} from "@/lib/utils";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
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
  const router = useRouter();
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

  // Use hooks for data fetching
  const { creatorScore } = useUserCreatorScore(user?.fid);

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
  function handleEntryClick(entry: LeaderboardEntry) {
    const url = generateProfileUrl({
      farcasterHandle: null, // We don't have farcaster handle from leaderboard data
      talentId: entry.talent_protocol_id,
    });

    if (url) {
      router.push(url);
    }
  }

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

  console.log("visibleEntries", visibleEntries.length);
  console.log("hasMore", hasMore);

  return (
    <PageContainer noPadding>
      {/* Header section */}
      <Section variant="header">
        {/* My Rewards Hero - Only show if user is logged in */}
        {user && (
          <MyRewards
            rewards={
              creatorScore
                ? getUsdcRewards(creatorScore, userTop200Entry?.rank)
                : "$0"
            }
            score={creatorScore ?? 0}
            avatarUrl={user.pfpUrl}
            name={user.displayName || user.username || "Unknown user"}
            isLoading={statsLoading || (top200Loading && !userTop200Entry)}
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
            {/* Leaderboard list */}
            <div className="overflow-hidden rounded-lg bg-gray-50">
              {visibleEntries.map((user, index) => (
                <div key={user.id}>
                  <LeaderboardRow
                    rank={user.rank}
                    name={user.name}
                    avatarUrl={user.pfp}
                    score={user.score}
                    rewards={getUsdcRewards(user.score, user.rank)}
                    onClick={() => handleEntryClick(user)}
                    rewardsLoading={!userTop200Entry && top200Loading}
                  />
                  {index < visibleEntries.length - 1 && (
                    <div className="h-px bg-gray-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Load More button - only show if there are more entries and we haven't reached 200 */}
            {hasMore && visibleEntries.length < 200 && (
              <Button
                variant="default"
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
          <div className="overflow-hidden rounded-lg bg-gray-50">
            {ACTIVE_SPONSORS.map((sponsor, index, array) => (
              <div key={sponsor.id}>
                <div className="flex items-center gap-3 p-3">
                  <span className="text-sm font-medium w-6">
                    #{sponsor.rank}
                  </span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sponsor.avatar} />
                    <AvatarFallback>{sponsor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sponsor.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(sponsor.date)}
                    </p>
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
              Want to join as a sponsor? Reach out to @juampi
            </Callout>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
