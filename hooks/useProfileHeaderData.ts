import { useState, useEffect } from "react";
import { resolveTalentUser } from "@/lib/user-resolver";

export function useProfileHeaderData(talentUUID: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!talentUUID) return;
    setLoading(true);
    setError(null);
    resolveTalentUser(talentUUID)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message || "Failed to fetch profile");
        setProfile(null);
        setLoading(false);
      });
  }, [talentUUID]);

  return { profile, loading, error };
}
