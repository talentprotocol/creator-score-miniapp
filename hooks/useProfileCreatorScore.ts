import { useState, useEffect } from "react";
import { getCreatorScoreForTalentId } from "@/app/services/talentService";

export function useProfileCreatorScore(talentUUID: string) {
  const [creatorScore, setCreatorScore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!talentUUID) return;
    setLoading(true);
    getCreatorScoreForTalentId(talentUUID)
      .then((data) => {
        setCreatorScore(
          typeof data?.score === "number" ? data.score.toLocaleString() : null,
        );
        setLoading(false);
      })
      .catch(() => {
        setCreatorScore(null);
        setLoading(false);
      });
  }, [talentUUID]);

  return { creatorScore, loading };
}
