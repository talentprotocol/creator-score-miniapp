"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TabNavigation } from "@/components/common/tabs-navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import type { LeaderboardEntry } from "@/app/services/types";
import { sdk } from "@farcaster/frame-sdk";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserCreatorScore } from "@/hooks/useUserCreatorScore";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useLeaderboardStats } from "@/hooks/useLeaderboardStats";
import { useRouter } from "next/navigation";
import { generateProfileUrl } from "@/lib/utils";
import { LEVEL_RANGES } from "@/lib/constants";
import { ExternalLink } from "lucide-react";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";

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

// Helper to truncate wallet address
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper to get user level from creator score
function getUserLevel(score: number): string {
  const level = LEVEL_RANGES.find(
    (range) => score >= range.min && score <= range.max,
  );
  return level ? level.name : "Level 1";
}

// Helper to check if user is eligible (Level 3+)
function isEligible(score: number): boolean {
  const level = LEVEL_RANGES.find(
    (range) => score >= range.min && score <= range.max,
  );
  return level ? level.min >= 80 : false; // Level 3 starts at 80
}

export default function LeaderboardPage() {
  const { context } = useMiniKit();
  const user = getUserContext(context);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("creators");

  // Static total of all eligible creators' scores (calculated once via script)
  const TOTAL_ELIGIBLE_SCORES = 54279;

  // Use new hooks for data fetching
  const { creatorScore } = useUserCreatorScore(user?.fid);
  const { entries, loading, error, hasMore, loadMore } = useLeaderboard(10);
  const { stats, loading: statsLoading } = useLeaderboardStats();

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

  // Find user entry in leaderboard data (if present)
  const userLeaderboardEntry =
    user && entries.find((e) => e.name === (user.displayName || user.username));

  // Always show the user pinned at the top
  const pinnedUserEntry = user && {
    rank: userLeaderboardEntry ? userLeaderboardEntry.rank : "—",
    name: user.displayName || user.username || "Unknown user",
    pfp: user.pfpUrl || undefined,
    rewards: creatorScore ? getUsdcRewards(creatorScore) : "$0",
    score: creatorScore ?? 0,
    id: userLeaderboardEntry ? userLeaderboardEntry.id : "user-pinned",
  };

  // Helper to calculate USDC rewards using static multiplier
  function getUsdcRewards(score: number): string {
    // Only eligible creators earn rewards
    if (score < 80) return "$0";

    // Calculate static multiplier: total_rewards_pool / total_eligible_scores
    const multiplier = TOTAL_SPONSORS_POOL / TOTAL_ELIGIBLE_SCORES;
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

  // Handler to navigate to profile page for pinned user
  function handlePinnedUserClick() {
    if (!user) return;
    const entry = entries.find(
      (e) => e.name === (user.displayName || user.username),
    );

    const url = generateProfileUrl({
      farcasterHandle: user.username,
      talentId: entry?.talent_protocol_id,
    });

    if (url) {
      router.push(url);
    }
  }

  // Tab configuration
  const tabs = [
    {
      id: "creators",
      label: "Rewards",
    },
    {
      id: "sponsors",
      label: "Sponsors",
      count: SPONSORS.length,
    },
  ];

  return (
    <div className="max-w-xl mx-auto w-full p-4 space-y-6 pb-24">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rewards Pool - Top Left */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Rewards Pool</p>
            <p className="text-2xl font-bold">
              ${formatWithK(TOTAL_SPONSORS_POOL)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <a
                href="https://basescan.org/address/0x3758e0f97f7f5f91372329d43eca69fcc1af48a7"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 flex items-center gap-1"
              >
                {truncateAddress("0x3758e0f97f7f5f91372329d43eca69fcc1af48a7")}
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Rewards End - Top Right */}
        <Card className="relative">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Rewards End</p>
            <p className="text-2xl font-bold">
              {countdown.days}d {countdown.hours}h
            </p>
            <p className="text-sm text-gray-600 mt-1">Jul 22 - Aug 31</p>
          </CardContent>
        </Card>

        {/* Creator Score - Bottom Left */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Your Score</p>
            <p className="text-2xl font-bold">
              {creatorScore !== null ? creatorScore : "-"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {creatorScore !== null ? (
                <>
                  <span className="text-sm text-gray-600">
                    {getUserLevel(creatorScore)}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isEligible(creatorScore)
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isEligible(creatorScore) ? "Eligible" : "Not Eligible"}
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-600">-</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Eligible Creators - Bottom Right */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Eligible Creators</p>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {stats.eligibleCreators !== null
                    ? formatWithK(stats.eligibleCreators)
                    : "-"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.totalCreators !== null
                    ? `${formatWithK(stats.totalCreators)} total`
                    : "-"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Leaderboard */}
      <div className="space-y-2">
        {error && <div className="text-destructive text-sm px-2">{error}</div>}

        {activeTab === "creators" && (
          <>
            {/* User pinned entry always on top */}
            {pinnedUserEntry && (
              <LeaderboardRow
                rank={pinnedUserEntry.rank}
                name={pinnedUserEntry.name}
                avatarUrl={pinnedUserEntry.pfp}
                score={pinnedUserEntry.score}
                rewards={getUsdcRewards(pinnedUserEntry.score)}
                isPinned={true}
                onClick={handlePinnedUserClick}
              />
            )}
            {/* Leaderboard list (user may appear again in their real position) */}
            <div className="overflow-hidden rounded-lg bg-gray-50">
              {entries.map((user, index, array) => (
                <div key={user.id}>
                  <LeaderboardRow
                    rank={user.rank}
                    name={user.name}
                    avatarUrl={user.pfp}
                    score={user.score}
                    rewards={getUsdcRewards(user.score)}
                    onClick={() => handleEntryClick(user)}
                  />
                  {index < array.length - 1 && (
                    <div className="h-px bg-gray-200" />
                  )}
                </div>
              ))}
            </div>
            {/* Only show Load More if there are more entries available */}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full mt-2 flex items-center justify-center"
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
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-gray-600">
                        {formatDate(sponsor.date)}
                      </p>
                      <a
                        href={`https://basescan.org/tx/${sponsor.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
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
