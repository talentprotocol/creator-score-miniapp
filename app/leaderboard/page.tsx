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
  getLeaderboardStats,
  getCredentialsForFarcaster,
} from "@/app/services/talentService";
import { filterEthAddresses } from "@/lib/utils";
import type { LeaderboardEntry } from "@/app/services/talentService";
import { MinimalProfileDrawer } from "@/components/leaderboard/MinimalProfileDrawer";
import { LeaderboardRow } from "@/components/leaderboard/LeaderboardRow";
import { sdk } from "@farcaster/frame-sdk";
import { Skeleton } from "@/components/ui/skeleton";
import { determineCreatorCategory, type Category } from "@/lib/categories";

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

  // Leaderboard stats state
  const [minScore, setMinScore] = useState<number | null>(null);
  const [totalCreators, setTotalCreators] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Categories state
  const [userCategory, setUserCategory] = useState<Category | null>(null);

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

  // Fetch real Creator Score and Category
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
          
          // Fetch category
          try {
            const credentials = await getCredentialsForFarcaster(user.fid.toString());
            const categoryData = determineCreatorCategory(credentials);
            setUserCategory(categoryData.primaryCategory);
          } catch {
            setUserCategory(null);
          }
        } else {
          setCreatorScore(0);
          setUserCategory(null);
        }
      } catch {
        setCreatorScore(null);
        setUserCategory(null);
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

  // Fetch leaderboard stats (minScore and totalCreators)
  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const stats = await getLeaderboardStats();
        if (!cancelled) {
          setMinScore(stats.minScore);
          setTotalCreators(stats.totalCreators);
        }
      } catch {
        if (!cancelled) {
          setMinScore(null);
          setTotalCreators(null);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    fetchStats();
    return () => {
      cancelled = true;
    };
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
    category: userCategory,
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
        {/* New: Min. Creator Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Min. Creator Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <p className="text-2xl font-bold">
                {minScore !== null ? minScore : "-"}
              </p>
            )}
          </CardContent>
        </Card>
        {/* New: Total Creators */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">
              Total Creators
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20 rounded" />
            ) : (
              <p className="text-2xl font-bold">
                {totalCreators !== null ? totalCreators : "-"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {error && <div className="text-destructive text-sm px-2">{error}</div>}
        {/* User pinned entry always on top */}
        {pinnedUserEntry && (
          <div onClick={handlePinnedUserClick}>
            <LeaderboardRow
              rank={typeof pinnedUserEntry.rank === 'number' ? pinnedUserEntry.rank : 0}
              name={pinnedUserEntry.name}
              avatarUrl={pinnedUserEntry.pfp}
              score={pinnedUserEntry.score}
              rewards={getEthRewards(pinnedUserEntry.score)}
              category={pinnedUserEntry.category}
              highlight={true}
            />
          </div>
        )}
        {/* Leaderboard list (user may appear again in their real position) */}
        <div className="space-y-2">
          {entries.map((user) => (
            <div key={user.id} onClick={() => handleEntryClick(user)}>
              <LeaderboardRow
                rank={user.rank}
                name={user.name}
                avatarUrl={user.pfp}
                score={user.score}
                rewards={getEthRewards(user.score)}
                category={null} // We don't have category data for other users yet
              />
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
