"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { resolveFidToTalentUuid } from "@/lib/user-resolver";
import type { LeaderboardEntry } from "@/app/services/types";
import { sdk } from "@farcaster/frame-sdk";
import { useUserCreatorScore } from "@/hooks/useUserCreatorScore";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useLeaderboardStats } from "@/hooks/useLeaderboardStats";
import { useRouter } from "next/navigation";
import { generateProfileUrl } from "@/lib/utils";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { MyRewards } from "@/components/leaderboard/MyRewards";
import { StatCard } from "@/components/common/StatCard";
import { HowToEarnModal } from "@/components/modals/HowToEarnModal";
import { useTop200Scores } from "@/hooks/useTop200Scores";

const ROUND_ENDS_AT = new Date(Date.UTC(2025, 7, 31, 23, 59, 59)); // August is month 7 (0-indexed)

// Mock sponsor data
const SPONSORS = [
  {
    id: "base",
    name: "Base",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2F7Q0QBrm.jpg",
    amount: 5000,
    date: "2025-07-15",
    rank: 1,
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "zora",
    name: "Zora",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/1b471987-45b1-48e3-6af4-44929b6e4900/anim=false,fit=contain,f=auto,w=576",
    amount: 2500,
    date: "2025-07-18",
    rank: 2,
    txHash: "0x2345678901bcdef12345678901bcdef23456789",
  },
  {
    id: "farcaster",
    name: "Farcaster",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2FI2rEbPF.png",
    amount: 2500,
    date: "2025-07-12",
    rank: 3,
    txHash: "0x3456789012cdef123456789012cdef3456789a",
  },
  {
    id: "talent-protocol",
    name: "Talent Protocol",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/002f0efe-2513-41e7-3d89-d38875d76800/anim=false,f=auto,w=288",
    amount: 2500,
    date: "2025-07-25",
    rank: 4,
    txHash: "0x456789013def23456789013def456789ab",
  },
  {
    id: "noice",
    name: "Noice",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/96aabcca-a8ce-47d6-b6f6-d2b6d1272500/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    date: "2025-07-08",
    rank: 5,
    txHash: "0x56789014ef3456789014ef56789abc",
  },
  {
    id: "phi",
    name: "Phi",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/9b5ad594-f3e9-4160-9c33-4e0eeaf28500/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    date: "2025-07-22",
    rank: 6,
    txHash: "0x6789015f456789015f6789abcd",
  },
  {
    id: "coop-records",
    name: "Coop Records",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2FYZRdO5m.jpg",
    amount: 1250,
    date: "2025-07-10",
    rank: 7,
    txHash: "0x789016056789016056789abcde",
  },
  {
    id: "paragraph",
    name: "Paragraph",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/4855b0cc-c1da-482c-de24-962162497200/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    date: "2025-07-28",
    rank: 8,
    txHash: "0x89017067890170567890abcdef",
  },
];

// Calculate total sponsors pool
const TOTAL_SPONSORS_POOL = SPONSORS.reduce(
  (sum, sponsor) => sum + sponsor.amount,
  0,
);

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

// Helper to format numbers with K notation (2 decimals)
function formatWithK(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toString();
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Helper to format currency
function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${formatWithK(amount)}`;
  }
  return `$${amount}`;
}

export default function LeaderboardPage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("creators");
  const [userTalentUuid, setUserTalentUuid] = useState<string | null>(null);
  const [howToEarnOpen, setHowToEarnOpen] = useState(false);

  // Static total of all eligible creators' scores (calculated once via script)
  const TOTAL_ELIGIBLE_SCORES = 54279;

  // Use hooks for data fetching
  const { creatorScore } = useUserCreatorScore(user?.fid);
  const { entries, loading, error, hasMore, loadMore } = useLeaderboard(10);
  const { loading: statsLoading } = useLeaderboardStats();
  const {
    entries: top200Entries,
    totalScores: totalTop200Scores,
    loading: top200Loading,
  } = useTop200Scores();

  // Countdown state
  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(ROUND_ENDS_AT),
  );

  // Resolve user's FID to Talent UUID for proper identification
  useEffect(() => {
    async function resolveUserTalentUuid() {
      if (user?.fid) {
        try {
          const uuid = await resolveFidToTalentUuid(user.fid);
          setUserTalentUuid(uuid);
        } catch (error) {
          console.error("Error resolving user talent UUID:", error);
          setUserTalentUuid(null);
        }
      }
    }

    resolveUserTalentUuid();
  }, [user?.fid]);

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
  const userTop200Entry = userTalentUuid
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
    if (!rank || rank > 200) return "$0";

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

  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6 pb-24">
      {/* My Rewards Hero - Only show if user is logged in */}
      {user && (
        <div className="mt-4">
          <MyRewards
            rewards={
              creatorScore
                ? getUsdcRewards(creatorScore, userTop200Entry?.rank)
                : "$0"
            }
            score={creatorScore ?? 0}
            avatarUrl={user.pfpUrl}
            name={user.displayName || user.username || "Unknown user"}
            isLoading={loading || statsLoading || top200Loading}
            rank={userTop200Entry?.rank}
            pointsToTop200={pointsToTop200}
            onHowToEarnClick={() => setHowToEarnOpen(true)}
          />
        </div>
      )}

      {/* How to Earn Modal */}
      <HowToEarnModal open={howToEarnOpen} onOpenChange={setHowToEarnOpen} />

      {/* Simplified Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Rewards Pool"
          value={`$${formatWithK(TOTAL_SPONSORS_POOL)}`}
        />
        <StatCard
          title="Rewards Distribution"
          value={`${countdown.days}d ${countdown.hours}h`}
        />
      </div>

      {/* Tabs */}
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
            count: SPONSORS.length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Leaderboard */}
      <div className="space-y-2 -mt-4">
        {error && <div className="text-destructive text-sm px-2">{error}</div>}

        {activeTab === "creators" && (
          <>
            {/* Leaderboard list */}
            <div className="overflow-hidden rounded-lg bg-gray-50">
              {entries.map((user, index) => (
                <div key={user.id}>
                  <LeaderboardRow
                    rank={user.rank}
                    name={user.name}
                    avatarUrl={user.pfp}
                    score={user.score}
                    rewards={getUsdcRewards(user.score, user.rank)}
                    onClick={() => handleEntryClick(user)}
                    rewardsLoading={top200Loading}
                  />
                  {index < entries.length - 1 && (
                    <div className="h-px bg-gray-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Load More button - only show if there are more entries and we haven't reached 200 */}
            {hasMore && entries.length < 200 && (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
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
            {SPONSORS.map((sponsor, index, array) => (
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
      </div>
    </div>
  );
}
