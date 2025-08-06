import { useState, useEffect, useCallback } from "react";
import { resolveTalentUser } from "@/lib/user-resolver";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { CACHE_KEYS } from "@/lib/cache-keys";

export function useProfileHeaderData(talentUUID: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `${CACHE_KEYS.PROFILE_HEADER}_${talentUUID}`;

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
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]); // Only depend on talentUUID

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]); // Only depend on the memoized function

  return { profile, loading, error };
}
