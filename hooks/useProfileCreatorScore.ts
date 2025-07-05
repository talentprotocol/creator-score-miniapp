import { useState, useEffect } from "react";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

export function useProfileCreatorScore(talentUUID: string) {
  const [creatorScore, setCreatorScore] = useState<number | null>(null);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScore() {
      const cacheKey = `creator_score_data_${talentUUID}`;

      // Check cache first
      const cachedData = getCachedData<{
        score: number;
        lastCalculatedAt: string | null;
      }>(cacheKey, CACHE_DURATIONS.SCORE_BREAKDOWN);
      if (cachedData !== null) {
        setCreatorScore(cachedData.score);
        setLastCalculatedAt(cachedData.lastCalculatedAt);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch creator score via API route (explicitly request creator_score)
        const response = await fetch(
          `/api/talent-score?id=${talentUUID}&scorer_slug=creator_score`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch creator score");
        }

        const scoreData = await response.json();

        if (scoreData.error) {
          setCreatorScore(null);
          setLastCalculatedAt(null);
        } else {
          const score = scoreData.score?.points ?? 0;
          const lastCalculated = scoreData.score?.last_calculated_at ?? null;
          setCreatorScore(score);
          setLastCalculatedAt(lastCalculated);

          // Cache the complete score data
          setCachedData(cacheKey, {
            score: score,
            lastCalculatedAt: lastCalculated,
          });
        }
      } catch (err) {
        console.error("Error fetching creator score:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch creator score",
        );
        setCreatorScore(null);
        setLastCalculatedAt(null);
      } finally {
        setLoading(false);
      }
    }

    if (talentUUID) {
      fetchScore();
    }
  }, [talentUUID]);

  return { creatorScore, lastCalculatedAt, loading, error };
}
