"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import {
  getCreatorScore,
  getLeaderboardCreators,
} from "@/app/services/talentService";
import { filterEthAddresses } from "@/lib/utils";
import type { LeaderboardEntry } from "@/app/services/talentService";
import { MinimalProfileDrawer } from "@/components/leaderboard/MinimalProfileDrawer";
import { sdk } from "@farcaster/frame-sdk";

const ROUND_ENDS_AT = new Date(Date.UTC(2025, 6, 7, 23, 59, 59)); // July is month 6 (0-indexed)

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

  // Real Creator Score state
  const [creatorScore, setCreatorScore] = useState<number | null>(null);

  // Leaderboard state
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const perPage = 10;

  // Countdown state
  const [countdown, setCountdown] = useState(() =>
    getCountdownParts(ROUND_ENDS_AT),
  );

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<{
    talent_protocol_id?: string | number;
    id: string;
    name: string;
    pfp?: string;
  } | null>(null);

  // Hide Farcaster Mini App splash screen when ready
  useEffect(() => {
    sdk.actions.ready(); // Notifies Farcaster host to hide splash
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    let cancelled = false;
    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboardCreators({ page: 1, perPage });
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load leaderboard",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load more handler
  const handleLoadMore = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const data = await getLeaderboardCreators({ page: nextPage, perPage });
      // Combine previous and new entries
      const combined = [...entries, ...data];
      // Recalculate rank for all entries
      const reRanked = combined.map((entry, idx) => ({
        ...entry,
        rank: idx + 1,
      }));
      setEntries(reRanked);
      setPage(nextPage);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard",
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch real Creator Score
  useEffect(() => {
    async function fetchScore() {
      if (!user?.fid) return;
      try {
        const walletData = await getUserWalletAddresses(user.fid);
        const addresses = filterEthAddresses([
          ...walletData.addresses,
          walletData.primaryEthAddress,
          walletData.primarySolAddress,
        ]);
        if (addresses.length > 0) {
          const scoreData = await getCreatorScore(addresses);
          setCreatorScore(scoreData.score ?? 0);
        } else {
          setCreatorScore(0);
        }
      } catch {
        setCreatorScore(null);
      }
    }
    fetchScore();
  }, [user?.fid]);

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

  // Handler to open drawer for a leaderboard entry
  function handleEntryClick(entry: LeaderboardEntry) {
    setSelectedProfile({
      talent_protocol_id: entry.talent_protocol_id,
      id: entry.id,
      name: entry.name,
      pfp: entry.pfp,
    });
    setDrawerOpen(true);
  }

  // Handler to open drawer for pinned user
  function handlePinnedUserClick() {
    if (!user) return;
    const entry = entries.find(
      (e) => e.name === (user.displayName || user.username),
    );
    setSelectedProfile({
      talent_protocol_id: entry?.talent_protocol_id,
      id: entry?.id || "user-pinned",
      name: user.displayName || user.username || "Unknown user",
      pfp: user.pfpUrl || undefined,
    });
    setDrawerOpen(true);
  }

  return (
    <div className="max-w-md mx-auto w-full p-4 space-y-6 pb-24">
      {/* MinimalProfileDrawer */}
      <MinimalProfileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        talentId={selectedProfile?.talent_protocol_id || selectedProfile?.id}
        name={selectedProfile?.name || ""}
        avatarUrl={selectedProfile?.pfp}
      />
      {/* Page Title */}
      <div className="flex items-center px-1 mb-2">
        <span className="text-xl font-bold leading-tight">
          Rewards Leaderboard
        </span>
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Round Ends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {countdown.days}d {countdown.hours}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Total Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">10 ETH</p>
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
        {/* Only show Load More if at least 10 entries are loaded */}
        {entries.length >= 10 && (
          <Button
            variant="outline"
            className="w-full mt-2 flex items-center justify-center"
            onClick={handleLoadMore}
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
