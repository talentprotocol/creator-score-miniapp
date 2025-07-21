import { useState, useEffect, useCallback } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getCreatorScoreForTalentId } from "@/app/services/scoresService";

export function useProfileCreatorScore(talentUUID: string) {
  const [creatorScore, setCreatorScore] = useState<number | undefined>(
    undefined,
  );
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calculatingEnqueuedAt, setCalculatingEnqueuedAt] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoScore, setHasNoScore] = useState<boolean>(false);

  const fetchScore = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `creator_score_data_${talentUUID}`;

    // TEMPORARILY DISABLE CACHE - Check cache first
    // const cachedData = getCachedData<{
    //   score: number;
    //   lastCalculatedAt: string | null;
    //   calculating: boolean;
    //   calculatingEnqueuedAt: string | null;
    // }>(cacheKey, CACHE_DURATIONS.SCORE_BREAKDOWN);
    // if (cachedData !== null) {
    //   console.log("[useProfileCreatorScore] Using cached data:", cachedData);
    //   setCreatorScore(cachedData.score);
    //   setLastCalculatedAt(cachedData.lastCalculatedAt);
    //   setCalculating(cachedData.calculating);
    //   setCalculatingEnqueuedAt(cachedData.calculatingEnqueuedAt);
    //   setLoading(false);
    //   setHasNoScore(cachedData.lastCalculatedAt === null);
    //   return;
    // }

    try {
      setLoading(true);
      setError(null);

      // Use service layer instead of direct API call
      const scoreData = await getCreatorScoreForTalentId(talentUUID);

      if (scoreData.error) {
        setError(scoreData.error);
        setCreatorScore(undefined);
        setLastCalculatedAt(null);
        setCalculating(false);
        setCalculatingEnqueuedAt(null);
        setHasNoScore(true);
      } else {
        setCreatorScore(scoreData.score);
        setLastCalculatedAt(scoreData.lastCalculatedAt);
        setCalculating(scoreData.calculating || false);
        setCalculatingEnqueuedAt(scoreData.calculatingEnqueuedAt || null);
        // Fix: hasNoScore should be based on lastCalculatedAt, not score value
        setHasNoScore(scoreData.lastCalculatedAt === null);

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
      setCreatorScore(undefined);
      setLastCalculatedAt(null);
      setCalculating(false);
      setCalculatingEnqueuedAt(null);
      setHasNoScore(true);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]); // Only depend on talentUUID

  useEffect(() => {
    fetchScore();
  }, [fetchScore]); // Only depend on the memoized function

  const refetch = useCallback(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    creatorScore,
    lastCalculatedAt,
    calculating,
    calculatingEnqueuedAt,
    loading,
    error,
    hasNoScore,
    refetch,
  };
}
