import { useState, useEffect, useCallback } from "react";
import { getCreatorScoreForTalentId } from "@/app/services/scoresService";
import { CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";

// Global in-memory cache and deduplication helpers
type CreatorScoreData = {
  score: number;
  lastCalculatedAt: string | null;
  calculating?: boolean;
  calculatingEnqueuedAt?: string | null;
  error?: string;
};

// Global cache for creator scores (in-memory)
const globalScoreCache = new Map<
  string,
  { data: CreatorScoreData; timestamp: number }
>();

// Global promise cache to prevent duplicate requests
const globalFetchingPromises = new Map<string, Promise<CreatorScoreData>>();

// Cache duration: 5 minutes
const CACHE_DURATION = CACHE_DURATION_5_MINUTES * 1000; // Convert to milliseconds

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

    try {
      // 1. Check global in-memory cache first
      const cached = globalScoreCache.get(talentUUID);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const d = cached.data;
        setCreatorScore(d.score);
        setLastCalculatedAt(d.lastCalculatedAt);
        setCalculating(d.calculating || false);
        setCalculatingEnqueuedAt(d.calculatingEnqueuedAt || null);
        setHasNoScore(d.lastCalculatedAt === null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // 2. Deduplicate concurrent fetches
      let scorePromise = globalFetchingPromises.get(talentUUID);
      if (!scorePromise) {
        scorePromise = getCreatorScoreForTalentId(talentUUID);
        globalFetchingPromises.set(talentUUID, scorePromise);
      }

      const scoreData = await scorePromise;

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

        // Store in global cache for future hook instances (in-memory)
        globalScoreCache.set(talentUUID, {
          data: scoreData,
          timestamp: Date.now(),
        });
      }

      // Ensure we clean up the promise map
      globalFetchingPromises.delete(talentUUID);
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
