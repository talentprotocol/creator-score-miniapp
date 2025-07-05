import { useState, useEffect } from "react";
import type { SocialAccount } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";

// Utility function to format account age from ISO string
function formatAccountAge(ownedSince: string): string {
  try {
    const date = new Date(ownedSince);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInYears = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 365));

    if (diffInYears >= 1) {
      return `${diffInYears} year${diffInYears > 1 ? "s" : ""}`;
    }

    const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
    if (diffInMonths >= 1) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""}`;
    }

    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
  } catch {
    return "—";
  }
}

// Utility function to get display name for social platforms
function getDisplayName(source: string): string | undefined {
  const displayNames: Record<string, string> = {
    farcaster: "Farcaster",
    github: "GitHub",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    efp: "EFP",
    lens: "Lens",
    base: "Base",
    ethereum: "Ethereum",
  };
  return displayNames[source];
}

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

        const response = await fetch(`/api/talent-socials?uuid=${talentUUID}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();

        // Extract the socials array from the response object and transform to SocialAccount format
        const rawAccounts = responseData.socials || [];
        const transformedAccounts = rawAccounts.map((account: any) => ({
          source: account.source,
          handle: account.handle,
          followerCount: account.followers_count,
          accountAge: account.owned_since
            ? formatAccountAge(account.owned_since)
            : null,
          profileUrl: account.profile_url,
          imageUrl: account.profile_image_url,
          displayName: getDisplayName(account.source),
        }));
        setSocialAccounts(transformedAccounts);

        // Cache the social accounts data (the transformed array)
        setCachedData(cacheKey, transformedAccounts);
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
