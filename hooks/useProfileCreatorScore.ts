import { useState, useEffect, useCallback } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getCreatorScoreForTalentId } from "@/app/services/scoresService";

export function useProfileCreatorScore(talentUUID: string) {
  const [creatorScore, setCreatorScore] = useState<number | null>(null);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calculatingEnqueuedAt, setCalculatingEnqueuedAt] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    const cacheKey = `creator_score_data_${talentUUID}`;

    // Check cache first
    const cachedData = getCachedData<{
      score: number;
      lastCalculatedAt: string | null;
      calculating: boolean;
      calculatingEnqueuedAt: string | null;
    }>(cacheKey, CACHE_DURATIONS.SCORE_BREAKDOWN);
    if (cachedData !== null) {
      setCreatorScore(cachedData.score);
      setLastCalculatedAt(cachedData.lastCalculatedAt);
      setCalculating(cachedData.calculating);
      setCalculatingEnqueuedAt(cachedData.calculatingEnqueuedAt);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use service layer instead of direct API call
      const scoreData = await getCreatorScoreForTalentId(talentUUID);

      if (scoreData.error) {
        setError(scoreData.error);
        setCreatorScore(null);
        setLastCalculatedAt(null);
        setCalculating(false);
        setCalculatingEnqueuedAt(null);
      } else {
        setCreatorScore(scoreData.score);
        setLastCalculatedAt(scoreData.lastCalculatedAt);
        setCalculating(scoreData.calculating || false);
        setCalculatingEnqueuedAt(scoreData.calculatingEnqueuedAt || null);

        // Cache the complete score data
        setCachedData(cacheKey, {
          score: scoreData.score,
          lastCalculatedAt: scoreData.lastCalculatedAt,
          calculating: scoreData.calculating || false,
          calculatingEnqueuedAt: scoreData.calculatingEnqueuedAt || null,
        });
      }
    } catch (err) {
      console.error("Error fetching creator score:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch creator score",
      );
      setCreatorScore(null);
      setLastCalculatedAt(null);
      setCalculating(false);
      setCalculatingEnqueuedAt(null);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]);

  useEffect(() => {
    if (talentUUID) {
      fetchScore();
    }
  }, [talentUUID, fetchScore]);

  // Helper to determine if user has no score (never calculated)
  const hasNoScore = !loading && !error && lastCalculatedAt === null;

  return {
    creatorScore,
    lastCalculatedAt,
    calculating,
    calculatingEnqueuedAt,
    loading,
    error,
    hasNoScore,
    refetch: fetchScore,
  };
}
