"use client";

import { useState, useEffect } from "react";
import {
  filterEthAddresses,
  getCachedData,
  setCachedData,
  CACHE_DURATIONS,
} from "@/lib/utils";
import { getUserWalletAddresses } from "@/app/services/neynarService";
import { getCreatorScore } from "@/app/services/scoresService";

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

        // Fetch wallet addresses using service
        const walletData = await getUserWalletAddresses(fid);

        if (walletData.error) {
          throw new Error(walletData.error);
        }

        const addresses = filterEthAddresses([
          ...walletData.addresses,
          walletData.primaryEthAddress,
          walletData.primarySolAddress,
        ]);

        if (addresses.length > 0) {
          // Get creator score using service
          const scoreData = await getCreatorScore(addresses);

          if (scoreData.error) {
            throw new Error(scoreData.error);
          }

          const score = scoreData.score;
          setCreatorScore(score);

          // Cache the score
          setCachedData(cacheKey, score);
        } else {
          setCreatorScore(0);
          setCachedData(cacheKey, 0);
        }
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
