import { SocialAccount, TalentSocialAccount } from "./types";

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
 * Fetches social accounts for a Talent Protocol ID from the API
 */
export async function getSocialAccountsForTalentId(
  talentId: string | number,
): Promise<SocialAccount[]> {
  try {
    let data;

    if (typeof window !== "undefined") {
      // Client-side: use API route
      const params = new URLSearchParams({
        talent_protocol_id: String(talentId),
      });
      const response = await fetch(`/api/talent-socials?${params.toString()}`);
      if (!response.ok) throw new Error(`Talent API error: ${response.status}`);
      data = await response.json();
    } else {
      // Server-side: call Talent API directly
      const { talentApiClient } = await import("@/lib/talent-api-client");
      const params = {
        talent_protocol_id: String(talentId),
      };
      const response = await talentApiClient.getSocials(params);
      if (!response.ok) throw new Error(`Talent API error: ${response.status}`);
      data = await response.json();
    }
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
          profileUrl = `https://efp.app/${handle}`;
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
  } catch {
    return [];
  }
}
