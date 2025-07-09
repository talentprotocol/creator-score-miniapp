"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const ROUND_ENDS_AT = new Date(Date.UTC(2025, 7, 31, 23, 59, 59)); // August is month 7 (0-indexed)

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
    rewards: "-", // To be calculated later
    score: creatorScore ?? 0,
    id: userLeaderboardEntry ? userLeaderboardEntry.id : "user-pinned",
  };

  // Helper to calculate rewards
  function getEthRewards(score: number) {
    const multiplier = 0.00005588184343025108;
    return (score * multiplier).toFixed(3) + " ETH";
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

  return (
    <div className="max-w-md mx-auto w-full p-4 space-y-6 pb-24">
      {/* Page Title */}
      <div className="flex items-center px-1 mb-2">
        <span className="text-xl font-bold leading-tight">
          Rewards Leaderboard
        </span>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Rewards Pool - Top Left */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">Rewards Pool</p>
            <p className="text-2xl font-bold">$2.50K</p>
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
            <p className="text-sm text-gray-600 mb-4">Creator Score</p>
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

      {/* Leaderboard */}
      <div className="space-y-2">
        {error && <div className="text-destructive text-sm px-2">{error}</div>}
        {/* User pinned entry always on top */}
        {pinnedUserEntry && (
          <div
            className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors mb-2"
            onClick={handlePinnedUserClick}
          >
            <span className="text-sm font-medium w-6">
              #{pinnedUserEntry.rank}
            </span>
            <Avatar className="h-8 w-8">
              {pinnedUserEntry.pfp ? (
                <AvatarImage src={pinnedUserEntry.pfp} />
              ) : (
                <AvatarFallback>{pinnedUserEntry.name[0]}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{pinnedUserEntry.name}</p>
              <p className="text-xs text-gray-600">
                Creator Score: {pinnedUserEntry.score}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">
                {getEthRewards(pinnedUserEntry.score)}
              </span>
            </div>
          </div>
        )}
        {/* Leaderboard list (user may appear again in their real position) */}
        <div className="overflow-hidden rounded-lg bg-gray-50">
          {entries.map((user, index, array) => (
            <div key={user.id}>
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleEntryClick(user)}
              >
                <span className="text-sm font-medium w-6">#{user.rank}</span>
                <Avatar className="h-8 w-8">
                  {user.pfp ? (
                    <AvatarImage src={user.pfp} />
                  ) : (
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-600">
                    Creator Score: {user.score}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium">
                    {getEthRewards(user.score)}
                  </span>
                </div>
              </div>
              {index < array.length - 1 && <div className="h-px bg-gray-200" />}
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
      </div>
    </div>
  );
}
