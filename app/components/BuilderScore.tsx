"use client";

import { useEffect, useState } from "react";
import { getBuilderScore } from "@/app/services/talentService";
import { getUserWalletAddresses } from "@/app/services/neynarService";

interface BuilderScoreProps {
  fid: number | undefined;
}

export function BuilderScore({ fid }: BuilderScoreProps) {
  // Use FID 1 as fallback if no FID is provided
  const fallbackFid = 3;
  const effectiveFid = fid ?? fallbackFid;

  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [levelName, setLevelName] = useState<string | null>(null);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [noWallet, setNoWallet] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      if (!effectiveFid) {
        setNoWallet(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLocalError(null);
        setNoWallet(false);

        // Get all wallet addresses from FID
        const walletData = await getUserWalletAddresses(effectiveFid);
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
          setLoading(false);
          return;
        }

        // Get Builder Score using all addresses
        const scoreData = await getBuilderScore(addresses);
        if (scoreData.error) {
          setLocalError(scoreData.error);
          setLoading(false);
          return;
        }

        setScore(scoreData.score);
        setLevel(scoreData.level);
        setLevelName(scoreData.levelName);
        setLastCalculatedAt(scoreData.lastCalculatedAt);
        setWalletAddress(scoreData.walletAddress);
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : "Failed to fetch Builder Score",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [effectiveFid]);

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    if (!score || !level) return 0;
    const LEVEL_RANGES = [
      { min: 0, max: 39 },
      { min: 40, max: 79 },
      { min: 80, max: 119 },
      { min: 120, max: 169 },
      { min: 170, max: 249 },
      { min: 250, max: Infinity },
    ];
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
    const LEVEL_RANGES = [
      { min: 0, max: 39 },
      { min: 40, max: 79 },
      { min: 80, max: 119 },
      { min: 120, max: 169 },
      { min: 170, max: 249 },
      { min: 250, max: Infinity },
    ];
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return null;
    return nextLevel.min - score;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg border border-gray-200 animate-pulse min-h-[140px] w-full">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Show placeholder if error, noWallet, or no score
  if (
    localError ||
    noWallet ||
    score === null ||
    level === null ||
    levelName === null
  ) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200 min-h-[140px] w-full">
        <div className="text-gray-400 text-3xl mb-2">–</div>
        <div className="text-gray-500 font-medium text-base mb-1">
          No Builder Score found
        </div>
        <div className="text-gray-400 text-sm text-center max-w-xs">
          Connect a wallet to see your Builder Score and profile details here.
        </div>
        {localError && (
          <div className="text-red-400 text-xs mt-2">{localError}</div>
        )}
      </div>
    );
  }

  const pointsToNext = getPointsToNextLevel();
  const progress = getProgressToNextLevel();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200 w-full">
      <div className="text-5xl font-bold mb-2 text-black">{score}</div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="text-base text-gray-700 font-medium">
            Level {level}
          </div>
        </div>
        {lastCalculatedAt && (
          <div className="text-xs text-gray-400">
            Last updated: {new Date(lastCalculatedAt).toLocaleDateString()}
          </div>
        )}
      </div>
      <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-black rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {pointsToNext
          ? `${pointsToNext} points to next level`
          : level === 6
            ? "Master level reached!"
            : "Level up!"}
      </div>
      {walletAddress && (
        <a
          href={`https://app.talentprotocol.com/wallet/${walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-black border border-gray-300 transition-colors duration-200"
        >
          View Profile on Talent Protocol
        </a>
      )}
    </div>
  );
}
