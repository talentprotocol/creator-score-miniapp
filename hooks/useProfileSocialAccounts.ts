import { useState, useEffect, useCallback } from "react";
import type { SocialAccount, TalentSocialAccount } from "@/app/services/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { CACHE_KEYS } from "@/lib/cache-keys";

function getAccountAge(ownedSince: string | null): string | null {
  if (!ownedSince) return null;
  const ownedDate = new Date(ownedSince);
  const now = new Date();
  const diffMs = now.getTime() - ownedDate.getTime();
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  return "<1 month";
}

function getDisplayName(source: string): string {
  if (source === "github") return "GitHub";
  if (source === "base") return "Base";
  if (source === "ethereum") return "Ethereum";
  if (source === "farcaster") return "Farcaster";
  if (source === "lens") return "Lens";
  if (source === "twitter") return "Twitter";
  if (source === "linkedin") return "LinkedIn";
  if (source === "efp") return "EFP";
  if (source === "ens") return "ENS";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/**
 * CLIENT-SIDE ONLY: Fetches social accounts via API routes (follows coding principles)
 */
async function getSocialAccountsForTalentId(
  talentId: string | number,
): Promise<SocialAccount[]> {
  try {
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
    });
    const response = await fetch(`/api/talent-socials?${params.toString()}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data.socials)) return [];

    // Process social accounts without merging EFP and ENS
    const socials: SocialAccount[] = data.socials
      .filter((s: TalentSocialAccount) => {
        const src = s.source;
        // Only exclude linkedin and duplicate ethereum accounts
        return src !== "linkedin" && src !== "ethereum";
      })
      .map((s: TalentSocialAccount) => {
        let handle = s.handle || null;
        const src = s.source;

        if (
          src === "lens" &&
          handle &&
          typeof handle === "string" &&
          handle.startsWith("lens/")
        ) {
          handle = handle.replace(/^lens\//, "");
        }

        if (
          (src === "farcaster" || src === "twitter") &&
          handle &&
          typeof handle === "string" &&
          !handle.startsWith("@")
        ) {
          handle = `@${handle}`;
        }

        const displayName = getDisplayName(src);

        if (src === "basename") {
          return {
            source: "base",
            handle,
            followerCount: null,
            accountAge: getAccountAge(s.owned_since ?? null),
            profileUrl: s.profile_url ?? null,
            imageUrl: s.image_url ?? null,
            displayName: "Base",
          };
        }

        // Special handling for EFP fallback URL
        let profileUrl = s.profile_url ?? null;
        if (src === "efp" && !profileUrl && handle) {
          profileUrl = `https://ethfollow.xyz/${handle}`;
        }

        return {
          source: src,
          handle,
          followerCount: s.followers_count ?? null,
          accountAge: getAccountAge(s.owned_since ?? null),
          profileUrl,
          imageUrl: s.image_url ?? null,
          displayName,
        };
      });

    return socials;
  } catch (error) {
    console.error(
      "[useProfileSocialAccounts] Error fetching social accounts:",
      error,
    );
    return [];
  }
}

export function useProfileSocialAccounts(talentUUID: string) {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSocialAccounts = useCallback(async () => {
    if (!talentUUID) return;

    const cacheKey = `${CACHE_KEYS.PROFILE_SOCIAL_ACCOUNTS}_${talentUUID}`;

    // Check cache first
    const cachedAccounts = getCachedData<SocialAccount[]>(
      cacheKey,
      CACHE_DURATIONS.SOCIAL_ACCOUNTS, // Use correct cache duration (1 hour)
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
