import { useState, useEffect } from "react";
import { getSocialAccountsForTalentId } from "@/app/services/socialAccountsService";
import type { SocialAccount } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

export function useProfileSocialAccounts(talentUUID: string) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSocialAccounts() {
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
          err instanceof Error
            ? err.message
            : "Failed to fetch social accounts",
        );
        setSocialAccounts([]);
      } finally {
        setLoading(false);
      }
    }

    if (talentUUID) {
      fetchSocialAccounts();
    }
  }, [talentUUID]);

  return { socialAccounts, loading, error };
}
