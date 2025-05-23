"use client";

import { useEffect, useState } from "react";
import { getBuilderScore } from "@/app/services/talentService";
import { getUserWalletAddresses } from "@/app/services/neynarService";

interface BuilderScoreProps {
  fid: number | undefined;
}

export function BuilderScore({ fid }: BuilderScoreProps) {
  const [score, setScore] = useState<number | null>(null);
  const [levelName, setLevelName] = useState<string | null>(null);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [noWallet, setNoWallet] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      setLoading(true);
      setLocalError(null);
      setNoWallet(false);
      if (!fid) {
        setNoWallet(true);
        setLoading(false);
        return;
      }
      try {
        const walletData = await getUserWalletAddresses(fid);
        if (walletData.error) {
          setLocalError(walletData.error);
          setLoading(false);
          return;
        }
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
        const scoreData = await getBuilderScore(addresses);
        if (scoreData.error) {
          setLocalError(scoreData.error);
          setLoading(false);
          return;
        }
        setScore(scoreData.score);
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
  }, [fid]);

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    if (!score || !levelName) return 0;
    const LEVEL_RANGES = [
      { min: 0, max: 39 },
      { min: 40, max: 79 },
      { min: 80, max: 119 },
      { min: 120, max: 169 },
      { min: 170, max: 249 },
      { min: 250, max: Infinity },
    ];
    const level = parseInt(levelName.replace(/\D/g, ""), 10) || 1;
    const currentLevel = LEVEL_RANGES[level - 1];
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return 100;
    const range = nextLevel.min - currentLevel.min;
    const progress = score - currentLevel.min;
    return (progress / range) * 100;
  };

  // Calculate points to next level
  const getPointsToNextLevel = () => {
    if (!score || !levelName) return null;
    const LEVEL_RANGES = [
      { min: 0, max: 39 },
      { min: 40, max: 79 },
      { min: 80, max: 119 },
      { min: 120, max: 169 },
      { min: 170, max: 249 },
      { min: 250, max: Infinity },
    ];
    const level = parseInt(levelName.replace(/\D/g, ""), 10) || 1;
    const nextLevel = LEVEL_RANGES[level];
    if (!nextLevel || score >= nextLevel.min) return null;
    return nextLevel.min - score;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: 120,
          width: "100%",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <span style={{ color: "#888", fontSize: 16 }}>Loading...</span>
      </div>
    );
  }

  if (localError || noWallet || score === null || levelName === null) {
    return (
      <div
        style={{
          minHeight: 120,
          width: "100%",
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
          padding: 24,
        }}
      >
        <div
          style={{
            color: "#222",
            fontWeight: 500,
            fontSize: 18,
            marginBottom: 4,
          }}
        >
          No Builder Score found
        </div>
        <div style={{ color: "#888", fontSize: 14, textAlign: "center" }}>
          Connect a wallet to see your Builder Score and profile details here.
        </div>
        {localError && (
          <div style={{ color: "#d00", fontSize: 12, marginTop: 8 }}>
            {localError}
          </div>
        )}
      </div>
    );
  }

  const pointsToNext = getPointsToNextLevel();
  const progress = getProgressToNextLevel();

  return (
    <div
      style={{
        minHeight: 120,
        width: "100%",
        border: "1px solid #e5e5e5",
        borderRadius: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: 700,
          color: "#111",
          marginBottom: 8,
        }}
      >
        {score}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "#111",
          marginBottom: 8,
        }}
      >
        {levelName}
      </div>
      {lastCalculatedAt && (
        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
          Last updated: {new Date(lastCalculatedAt).toLocaleDateString()}
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: 4,
          background: "#eee",
          borderRadius: 2,
          margin: "12px 0",
        }}
      >
        <div
          style={{
            height: 4,
            background: "#111",
            borderRadius: 2,
            width: `${progress}%`,
            transition: "width 0.5s",
          }}
        />
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
        {pointsToNext
          ? `${pointsToNext} points to next level`
          : levelName === "Level 6"
            ? "Master level reached!"
            : "Level up!"}
      </div>
      {walletAddress && (
        <a
          href={`https://app.talentprotocol.com/wallet/${walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 12,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #111",
            background: "#fff",
            color: "#111",
            fontWeight: 500,
            fontSize: 14,
            textDecoration: "none",
            transition: "background 0.2s, color 0.2s",
            display: "inline-block",
          }}
        >
          View Profile on Talent Protocol
        </a>
      )}
    </div>
  );
}
