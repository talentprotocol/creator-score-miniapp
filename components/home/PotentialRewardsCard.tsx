"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { useLeaderboardData } from "@/hooks/useLeaderboardOptimized";
// import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { RewardsCalculationProgress } from "@/components/common/RewardsCalculationProgress";
import { TOTAL_SPONSORS_POOL } from "@/lib/constants";

interface PotentialRewardsCardProps {
  score: number | null;
  loading?: boolean;
}

export function PotentialRewardsCard({
  score,
  loading,
}: PotentialRewardsCardProps) {
  const { talentUuid } = useFidToTalentUuid();
  const { entries: top200Entries, loading: top200Loading } =
    useLeaderboardData();

  // Calculate loading progress
  const loadingProgress = (() => {
    if (!top200Loading && top200Entries.length > 0) return 100;
    if (top200Loading && top200Entries.length === 0) return 25;
    if (top200Entries.length > 0) return 50 + (top200Entries.length / 200) * 50;
    return 0;
  })();

  // Find user entry in top 200 data for accurate rewards
  const userTop200Entry = talentUuid
    ? top200Entries.find((e) => e.talent_protocol_id === talentUuid)
    : null;

  // Calculate points needed to reach top 200
  const pointsNeededForTop200 =
    top200Entries.length > 0
      ? top200Entries[top200Entries.length - 1]?.score || 0
      : 0;

  // Calculate rewards
  const currentRewards = getUsdcRewards(score || 0, userTop200Entry?.rank);
  const potentialRewards = getUsdcRewards(pointsNeededForTop200);

  // Show progress indicator while loading top 200 data
  if (top200Loading && top200Entries.length === 0) {
    return (
      <Card className="w-full">
        <div className="p-6">
          <RewardsCalculationProgress
            progress={loadingProgress}
            message="Loading leaderboard data..."
          />
        </div>
      </Card>
    );
  }

  // Show skeleton while loading basic data
  if (loading) {
    return (
      <Card className="w-full">
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </Card>
    );
  }

  // Helper to calculate USDC rewards using top 200 scores
  function getUsdcRewards(score: number, rank?: number): string {
    // Only top 200 creators earn rewards
    if (!rank || rank > 200 || top200Entries.length === 0) return "$0";

    // Calculate total scores from top 200 entries
    const totalTop200Scores = top200Entries.reduce(
      (sum, entry) => sum + entry.score,
      0,
    );

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

  const rewards = score ? currentRewards : potentialRewards;
  const isTop200 = userTop200Entry !== null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          Creator Rewards
        </span>
        <Link
          href="/leaderboard"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          See more
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <span className="text-3xl font-bold">{rewards}</span>
          <div className="text-xs text-muted-foreground">
            {isTop200
              ? `Congrats, you're in the top 200!`
              : pointsNeededForTop200
                ? `${pointsNeededForTop200.toLocaleString()} points left to earn rewards.`
                : "Earn points to qualify for rewards."}
          </div>
        </div>

        <div className="w-32">
          {/* TODO: Add a visual representation of rewards progress */}
          <div className="h-16 flex items-center justify-center text-muted-foreground">
            {isTop200 ? "🎉" : "🎯"}
          </div>
        </div>
      </div>
    </Card>
  );
}
