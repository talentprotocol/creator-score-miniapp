import { useState, useEffect } from "react";
import { getCreatorScoreForTalentId } from "@/app/services/talentService";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

export function useProfileCreatorScore(talentUUID: string) {
  const [creatorScore, setCreatorScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScore() {
      const cacheKey = `creator_score_${talentUUID}`;

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

        const scoreData = await getCreatorScoreForTalentId(talentUUID);
        const score = scoreData.error ? null : scoreData.score;

        setCreatorScore(score);

        // Cache the score data
        if (score !== null) {
          setCachedData(cacheKey, score);
        }
      } catch (err) {
        console.error("Error fetching creator score:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch creator score",
        );
        setCreatorScore(null);
      } finally {
        setLoading(false);
      }
    }

    if (talentUUID) {
      fetchScore();
    }
  }, [talentUUID]);

  return { creatorScore, loading, error };
}
