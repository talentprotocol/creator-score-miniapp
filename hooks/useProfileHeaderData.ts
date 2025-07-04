import { useState, useEffect } from "react";
import { resolveTalentUser } from "@/lib/user-resolver";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

export function useProfileHeaderData(talentUUID: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const cacheKey = `profile_header_${talentUUID}`;

      // Check cache first
      const cachedProfile = getCachedData<any>(
        cacheKey,
        CACHE_DURATIONS.PROFILE_DATA,
      );
      if (cachedProfile) {
        setProfile(cachedProfile);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const user = await resolveTalentUser(talentUUID);

        setProfile(user);

        // Cache the profile data
        if (user) {
          setCachedData(cacheKey, user);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile",
        );
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    if (talentUUID) {
      fetchProfile();
    }
  }, [talentUUID]);

  return { profile, loading, error };
}
