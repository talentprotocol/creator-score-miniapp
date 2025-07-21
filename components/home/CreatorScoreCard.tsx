"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import {
  calculateScoreProgress,
  calculatePointsToNextLevel,
} from "@/lib/utils";
import { LEVEL_RANGES } from "@/lib/constants";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { getUserContext } from "@/lib/user-context";

interface CreatorScoreCardProps {
  score: number | null;
  loading?: boolean;
}

export function CreatorScoreCard({ score, loading }: CreatorScoreCardProps) {
  const { context } = useMiniKit();
  const user = getUserContext(context);

  // Calculate level using LEVEL_RANGES
  const level = score
    ? (() => {
        const levelInfo = LEVEL_RANGES.find(
          (range) => score >= range.min && score <= range.max,
        );
        return levelInfo ? LEVEL_RANGES.indexOf(levelInfo) + 1 : 1;
      })()
    : 1;

  // Calculate progress to next level
  const progress = score ? calculateScoreProgress(score, level) : 0;
  const pointsToNext = score ? calculatePointsToNextLevel(score, level) : 0;

  // Get canonical URL for profile
  const profileUrl = user?.username ? `/${user.username}/stats` : null;

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-16 w-32 rounded-lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          Creator Score
        </span>
        {profileUrl && (
          <Link
            href={profileUrl}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            See breakdown
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <span className="text-3xl font-bold">
            {score?.toLocaleString() || "—"}
          </span>
          <div className="text-xs text-muted-foreground">
            {level < 6 && pointsToNext && pointsToNext > 0
              ? `${pointsToNext.toLocaleString()} points to Level ${level + 1}`
              : `Level ${level} achieved!`}
          </div>
        </div>

        <div className="w-32">
          <div className="h-16 flex flex-col justify-end">
            {[...Array(6)].map((_, i) => (
              <Progress
                key={i}
                value={level > 5 - i ? 100 : level === 5 - i ? progress : 0}
                className="h-2 mb-1"
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
