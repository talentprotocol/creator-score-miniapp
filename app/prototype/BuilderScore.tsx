"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import { getBuilderScore } from "@/app/services/talentService";
import {
  filterEthAddresses,
  calculateScoreProgress,
  calculatePointsToNextLevel,
} from "@/lib/utils";

type ScoreProps = {
  fid: number | undefined;
  title?: string;
};

function ScoreCard({
  fid,
  title = "Builder Score",
  scorerSlug,
}: ScoreProps & { scorerSlug?: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noWallet, setNoWallet] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      if (!fid) return;

      try {
        setError(null);
        setNoWallet(false);

        const walletData = await getUserWalletAddresses(fid);
        if (walletData.error) {
          throw new Error(walletData.error);
        }

        const addresses = filterEthAddresses([
          ...walletData.addresses,
          walletData.primaryEthAddress,
          walletData.primarySolAddress,
        ]);

        if (addresses.length === 0) {
          setNoWallet(true);
          return;
        }

        const scoreData = await getBuilderScore(addresses, scorerSlug);
        if (scoreData.error) {
          setError(scoreData.error);
          return;
        }

        setScore(scoreData.score);
        setLevel(scoreData.level);
        setWalletAddress(scoreData.walletAddress);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch Builder Score",
        );
      }
    }

    fetchScore();
  }, [fid, scorerSlug]);

  const progress = calculateScoreProgress(score ?? 0, level ?? 1);
  const pointsToNext = calculatePointsToNextLevel(score ?? 0, level ?? 1);

  return (
    <Card className="bg-gray-100 border-0 shadow-none">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-base text-foreground">
                {title}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                Level {level ?? "—"}
              </span>
            </div>
            <span className="text-xl font-semibold text-foreground">
              {score?.toLocaleString() ?? "—"}
            </span>
          </div>

          {error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : noWallet ? (
            <div className="text-sm text-muted-foreground">
              No wallet addresses found
            </div>
          ) : (
            <>
              <div className="w-full text-xs text-muted-foreground text-right">
                {pointsToNext && level
                  ? `${pointsToNext.toString()} points to Level ${(
                      level + 1
                    ).toString()}`
                  : level === 6
                    ? "Master level reached!"
                    : "Level up!"}
              </div>
              <div className="relative w-full flex items-center justify-center">
                <Progress
                  value={progress}
                  className="h-4 bg-gray-200 [&>div]:bg-gray-800"
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" className="gap-1">
                  <RefreshCw className="h-4 w-4" /> Refresh Score
                </Button>
                {walletAddress && (
                  <span className="text-xs text-muted-foreground">
                    Using: {walletAddress.slice(0, 6)}...
                    {walletAddress.slice(-4)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BuilderScore(props: ScoreProps) {
  return <ScoreCard {...props} />;
}

export function CreatorScore(props: ScoreProps) {
  return (
    <ScoreCard {...props} scorerSlug="creator_score" title="Creator Score" />
  );
}
