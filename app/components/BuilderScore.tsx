"use client";

import { useEffect, useState } from "react";
import { getBuilderScore } from "@/app/services/talentService";
import { getUserWalletAddresses } from "@/app/services/neynarService";

interface ScoreProps {
  fid: number | undefined;
  title: string;
}

const LEVEL_RANGES = [
  { min: 0, max: 39, name: "Level 1" },
  { min: 40, max: 79, name: "Level 2" },
  { min: 80, max: 119, name: "Level 3" },
  { min: 120, max: 169, name: "Level 4" },
  { min: 170, max: 249, name: "Level 5" },
  { min: 250, max: Infinity, name: "Level 6" },
] as const;

function ScoreCard({
  fid,
  title,
  scorerSlug,
}: ScoreProps & { scorerSlug?: string }) {
  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [levelName, setLevelName] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [noWallet, setNoWallet] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      if (!fid) {
        setNoWallet(true);
        setLocalError(
          "Please connect your Farcaster account to view your Builder Score",
        );
        return;
      }
      try {
        setLocalError(null);
        setNoWallet(false);

        // Get all wallet addresses from FID
        const walletData = await getUserWalletAddresses(fid);
        if (walletData.error) {
          throw new Error(walletData.error);
        }

        // Get all addresses to check
        const addresses = [
          ...walletData.addresses,
          walletData.primaryEthAddress,
          walletData.primarySolAddress,
        ].filter((addr): addr is string => addr !== null && addr !== "");

        if (addresses.length === 0) {
          setNoWallet(true);
          return;
        }

        // Get Builder Score using all addresses
        const scoreData = await getBuilderScore(addresses, scorerSlug);
        if (scoreData.error) {
          setLocalError(scoreData.error);
          return;
        }

        setScore(scoreData.score);
        setLevel(scoreData.level);
        setLevelName(scoreData.levelName);
        setWalletAddress(scoreData.walletAddress);
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : "Failed to fetch Builder Score",
        );
      }
    }

    fetchScore();
  }, [fid, scorerSlug]);

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    if (!score || !level) return 0;
    const currentLevel = LEVEL_RANGES[level - 1];
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return 100;
    const range = nextLevel.min - currentLevel.min;
    const progress = score - currentLevel.min;
    return (progress / range) * 100;
  };

  // Calculate points to next level
  const getPointsToNextLevel = () => {
    if (!score || !level) return null;
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return null;
    return nextLevel.min - score;
  };

  // Empty state
  if (
    localError ||
    noWallet ||
    score === null ||
    level === null ||
    levelName === null
  ) {
    return (
      <div className="flex flex-col items-start justify-center p-8 bg-[#f5f7fa] rounded-2xl border border-gray-200 w-full min-h-[140px]">
        <div className="text-base font-medium text-black mb-3">{title}</div>
        <div
          className="text-5xl font-bold mb-2 text-gray-400"
          style={{ textAlign: "left", alignSelf: "flex-start" }}
        >
          N/A
        </div>
        <div className="flex flex-col items-start gap-2">
          <div
            className="text-base text-gray-700 font-medium"
            style={{ textAlign: "left" }}
          >
            Level 0
          </div>
        </div>
        <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `0%` }}
          />
        </div>
        <div
          className="mt-2 text-xs text-gray-500"
          style={{ textAlign: "left", width: "100%" }}
        >
          {/* No message */}
        </div>
      </div>
    );
  }

  // Normal state
  const pointsToNext = getPointsToNextLevel();
  const progress = getProgressToNextLevel();

  return (
    <div className="flex flex-col items-start justify-center p-8 bg-[#f5f7fa] rounded-2xl border border-gray-200 w-full min-h-[140px]">
      <div className="text-base font-medium text-black mb-3">{title}</div>
      <a
        href={
          walletAddress
            ? `https://app.talentprotocol.com/wallet/${walletAddress}`
            : undefined
        }
        target="_blank"
        rel="noopener noreferrer"
        className="text-5xl font-bold mb-2 text-black hover:underline"
        style={{ textAlign: "left", alignSelf: "flex-start" }}
      >
        {score}
      </a>
      <div className="flex flex-col items-start gap-2">
        <div
          className="text-base text-gray-700 font-medium"
          style={{ textAlign: "left" }}
        >
          Level {level}
        </div>
      </div>
      <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="mt-2 text-xs text-gray-500"
        style={{ textAlign: "left", width: "100%" }}
      >
        {pointsToNext
          ? `${pointsToNext} points to next level`
          : level === 6
            ? "Master level reached!"
            : "Level up!"}
      </div>
    </div>
  );
}

export function BuilderScore({ fid }: { fid: number | undefined }) {
  return (
    <ScoreCard fid={fid} title="Builder Score" scorerSlug="builder_score" />
  );
}

export function CreatorScore({ fid }: { fid: number | undefined }) {
  return (
    <ScoreCard fid={fid} title="Creator Score" scorerSlug="creator_score" />
  );
}
