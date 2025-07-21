import { useState, useEffect, useCallback } from "react";
import type { SocialAccount } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { getSocialAccountsForTalentId } from "@/app/services/socialAccountsService";

export function useProfileSocialAccounts(talentUUID: string) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSocialAccounts = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `social_accounts_${talentUUID}`;

    // Check cache first
    const cachedAccounts = getCachedData<SocialAccount[]>(
      cacheKey,
      CACHE_DURATIONS.PROFILE_DATA,
    );
    if (cachedAccounts) {
      setSocialAccounts(cachedAccounts);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accounts = await getSocialAccountsForTalentId(talentUUID);
      setSocialAccounts(accounts);

      // Cache the social accounts data
      setCachedData(cacheKey, accounts);
    } catch (err) {
      console.error("Error fetching social accounts:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch social accounts",
      );
      setSocialAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [talentUUID]); // Only depend on talentUUID

  useEffect(() => {
    fetchSocialAccounts();
  }, [fetchSocialAccounts]); // Only depend on the memoized function

  return { socialAccounts, loading, error };
}
