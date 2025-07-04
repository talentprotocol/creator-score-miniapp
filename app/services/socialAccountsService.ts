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
  return source.charAt(0).toUpperCase() + source.slice(1);
}

/**
 * Fetches social accounts for a Talent Protocol ID from the API
 */
export async function getSocialAccountsForTalentId(
  talentId: string | number,
): Promise<SocialAccount[]> {
  try {
    const baseUrl = "/api/talent-socials";
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
    });
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) throw new Error(`Talent API error: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.socials)) return [];

    // Process social accounts similar to the original function
    // 1. Filter EFPs, keep only the one with the highest follower count
    const efpAccounts = data.socials.filter(
      (s: TalentSocialAccount) => s.source === "efp",
    );
    let mainEfp: TalentSocialAccount | null = null;
    if (efpAccounts.length > 0) {
      mainEfp = efpAccounts.reduce(
        (max: TalentSocialAccount, curr: TalentSocialAccount) =>
          (curr.followers_count ?? 0) > (max.followers_count ?? 0) ? curr : max,
        efpAccounts[0],
      );
    }

    // 2. Find ENS account
    const ensAccount = data.socials.find(
      (s: TalentSocialAccount) => s.source === "ens",
    );

    // 3. Merge EFP and ENS into 'Ethereum' if either exists
    let ethereumAccount: SocialAccount | null = null;
    if (mainEfp || ensAccount) {
      ethereumAccount = {
        source: "ethereum",
        handle: ensAccount?.handle || null,
        followerCount: mainEfp?.followers_count ?? null,
        accountAge: getAccountAge(ensAccount?.owned_since ?? null),
        profileUrl: ensAccount?.profile_url ?? mainEfp?.profile_url ?? null,
        imageUrl: ensAccount?.image_url ?? mainEfp?.image_url ?? null,
        displayName: "Ethereum",
      };
    }

    // 4. Map and filter other accounts
    const socials: SocialAccount[] = data.socials
      .filter((s: TalentSocialAccount) => {
        const src = s.source;
        return (
          src !== "efp" &&
          src !== "ens" &&
          src !== "linkedin" &&
          src !== "ethereum"
        );
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

        return {
          source: src,
          handle,
          followerCount: s.followers_count ?? null,
          accountAge: getAccountAge(s.owned_since ?? null),
          profileUrl: s.profile_url ?? null,
          imageUrl: s.image_url ?? null,
          displayName,
        };
      });

    // 5. Add merged Ethereum account if present
    if (ethereumAccount) {
      socials.unshift(ethereumAccount);
    }

    return socials;
  } catch {
    return [];
  }
}
