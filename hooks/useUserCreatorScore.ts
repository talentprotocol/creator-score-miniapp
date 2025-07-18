"use client";

import { useState, useEffect } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

export function useUserCreatorScore(fid: number | undefined) {
  const [creatorScore, setCreatorScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserScore() {
      if (!fid) {
        setCreatorScore(null);
        setLoading(false);
        return;
      }

      const cacheKey = `user_creator_score_${fid}`;

      // Check cache first
      const cachedScore = getCachedData<number>(
        cacheKey,
        CACHE_DURATIONS.SCORE_BREAKDOWN,
      );
      if (cachedScore !== null) {
        setCreatorScore(cachedScore);
        setLoading(false);
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
          throw new Error(`Failed to fetch creator score: ${response.status}`);
        }
        const scoreData = await response.json();

        if (scoreData.error) {
          throw new Error(scoreData.error);
        }

        const score = scoreData.score?.points ?? 0;
        setCreatorScore(score);

        // Cache the score
        setCachedData(cacheKey, score);
      } catch (err) {
        console.error("Error fetching user creator score:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch creator score",
        );
        setCreatorScore(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserScore();
  }, [fid]);

  return { creatorScore, loading, error };
}
