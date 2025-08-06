"use client";

import { useState, useEffect } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { CACHE_KEYS } from "@/lib/cache-keys";

export function useUserCreatorScore(fid: number | undefined) {
  const [creatorScore, setCreatorScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTalentAccount, setHasTalentAccount] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    async function fetchUserScore() {
      if (!fid) {
        setCreatorScore(null);
        setLoading(false);
        setHasTalentAccount(null);
        return;
      }

      const cacheKey = `${CACHE_KEYS.USER_CREATOR_SCORE}_${fid}`;

      // Check cache first
      const cachedScore = getCachedData<number>(
        cacheKey,
        CACHE_DURATIONS.SCORE_BREAKDOWN,
      );
      if (cachedScore !== null) {
        setCreatorScore(cachedScore);
        setLoading(false);
        // Assume they have an account if we have a cached score
        setHasTalentAccount(true);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Direct FID-based score lookup - much more efficient than fetching wallets first
        const response = await fetch(
          `/api/talent-score?fid=${fid}&account_source=farcaster&scorer_slug=creator_score`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a Talent Protocol account
            setCreatorScore(0);
            setHasTalentAccount(false);
            setError(
              "No Talent Protocol account found. Create an account to get your Creator Score.",
            );
            setCachedData(cacheKey, 0);
            return;
          }
          throw new Error(`Failed to fetch creator score: ${response.status}`);
        }

        const scoreData = await response.json();

        if (scoreData.error) {
          // Check if it's a "not found" type error
          if (
            scoreData.error.includes("not found") ||
            scoreData.error.includes("404")
          ) {
            setCreatorScore(0);
            setHasTalentAccount(false);
            setError(
              "No Talent Protocol account found. Create an account to get your Creator Score.",
            );
            setCachedData(cacheKey, 0);
            return;
          }
          throw new Error(scoreData.error);
        }

        const score = scoreData.score?.points ?? 0;
        setCreatorScore(score);
        setHasTalentAccount(true);

        // Cache the score
        setCachedData(cacheKey, score);
      } catch (err) {
        console.error("Error fetching user creator score:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch creator score",
        );
        setCreatorScore(null);
        setHasTalentAccount(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserScore();
  }, [fid]);

  return { creatorScore, loading, error, hasTalentAccount };
}
