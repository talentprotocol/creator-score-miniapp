import { LEVEL_RANGES } from "@/lib/constants";

export interface BuilderScore {
  score: number;
  level: number;
  levelName: string;
  lastCalculatedAt: string | null;
  walletAddress: string | null;
  error?: string;
}

export type CreatorScore = BuilderScore; // They share the same structure

// Scorer slugs from Talent Protocol API
export const SCORER_SLUGS = {
  BUILDER: "builder_score", // default scorer
  CREATOR: "creator_score",
} as const;

/**
 * Generic function to fetch a score for a single wallet address
 */
async function getScoreForAddress(
  address: string,
  scorerSlug: string = SCORER_SLUGS.BUILDER,
): Promise<BuilderScore> {
  try {
    // Use relative path for local development to avoid CORS issues
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
    }
    const params = new URLSearchParams({ address });
    if (scorerSlug) params.append("scorer_slug", scorerSlug);
    params.append("account_source", "wallet");
    const response = await fetch(
      `${baseUrl}/api/talent-score?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();

    if (data.error) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: data.error,
      };
    }

    // Extract points and last_calculated_at from the nested score object
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;

    const levelInfo =
      LEVEL_RANGES.find(
        (range) => points >= range.min && points <= range.max,
      ) || LEVEL_RANGES[0];
    const level = LEVEL_RANGES.indexOf(levelInfo) + 1;

    return {
      score: points,
      level,
      levelName: levelInfo.name,
      lastCalculatedAt,
      walletAddress: address,
    };
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: error instanceof Error ? error.message : "Failed to fetch score",
    };
  }
}

/**
 * Generic function to fetch the highest score from all wallet addresses
 */
async function getHighestScore(
  addresses: string[],
  scorerSlug: string = SCORER_SLUGS.BUILDER,
): Promise<BuilderScore> {
  if (!addresses.length) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: "No wallet addresses provided",
    };
  }
  try {
    // Lowercase all addresses before querying
    const scores = await Promise.all(
      addresses.map((addr) =>
        getScoreForAddress(addr.toLowerCase(), scorerSlug),
      ),
    );
    // Filter out errors and find the highest score
    const validScores = scores.filter((s) => !s.error);
    if (validScores.length === 0) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: "No valid scores found",
      };
    }
    // Return the score with the highest value
    return validScores.reduce((highest, current) =>
      current.score > highest.score ? current : highest,
    );
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: error instanceof Error ? error.message : "Failed to fetch scores",
    };
  }
}

/**
 * Fetches the highest Builder Score from all wallet addresses
 */
export async function getBuilderScore(
  addresses: string[],
  scorerSlug?: string,
): Promise<BuilderScore> {
  return getHighestScore(addresses, scorerSlug || SCORER_SLUGS.BUILDER);
}

/**
 * Fetches the highest Creator Score from all wallet addresses
 */
export async function getCreatorScore(
  addresses: string[],
  scorerSlug?: string,
): Promise<CreatorScore> {
  return getHighestScore(addresses, scorerSlug || SCORER_SLUGS.CREATOR);
}

/**
 * Generic function to fetch a score for a Farcaster ID
 */
async function getScoreForFarcaster(
  fid: string,
  scorerSlug: string = SCORER_SLUGS.BUILDER,
): Promise<BuilderScore> {
  try {
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
    }

    const params = new URLSearchParams({
      fid,
      scorer_slug: scorerSlug,
      account_source: "farcaster",
    });

    const response = await fetch(
      `${baseUrl}/api/talent-score?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();

    if (data.error) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: data.error,
      };
    }

    // Extract points and last_calculated_at from the nested score object
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;

    const levelInfo =
      LEVEL_RANGES.find(
        (range) => points >= range.min && points <= range.max,
      ) || LEVEL_RANGES[0];
    const level = LEVEL_RANGES.indexOf(levelInfo) + 1;

    return {
      score: points,
      level,
      levelName: levelInfo.name,
      lastCalculatedAt,
      walletAddress: null, // No wallet address for Farcaster scores
    };
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Farcaster score",
    };
  }
}

/**
 * Fetches the Builder Score for a Farcaster account
 */
export async function getBuilderScoreForFarcaster(
  fid: string,
): Promise<BuilderScore> {
  return getScoreForFarcaster(fid, SCORER_SLUGS.BUILDER);
}

/**
 * Fetches the Creator Score for a Farcaster account
 */
export async function getCreatorScoreForFarcaster(
  fid: string,
): Promise<CreatorScore> {
  return getScoreForFarcaster(fid, SCORER_SLUGS.CREATOR);
}

export interface SocialAccount {
  source: string;
  handle: string | null;
  followerCount: number | null;
  accountAge: string | null;
  profileUrl?: string | null;
  imageUrl?: string | null;
  displayName?: string | null; // For UI display (e.g., 'GitHub')
}

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

interface TalentSocialAccount {
  source: string;
  handle: string | null;
  followers_count: number | null;
  owned_since: string | null;
  profile_url: string | null;
  image_url: string | null;
}

/**
 * Fetches social accounts for a Farcaster user (by FID) from the Talent Protocol API
 */
export async function getSocialAccountsForFarcaster(
  fid: string,
): Promise<SocialAccount[]> {
  try {
    const baseUrl = "/api/talent-socials";
    const params = new URLSearchParams({
      id: fid,
      account_source: "farcaster",
    });
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) throw new Error(`Talent API error: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.socials)) return [];

    // 1. Filter EFPs, keep only the one with the highest follower count
    const efpAccounts = data.socials.filter(
      (s: TalentSocialAccount) => (s as TalentSocialAccount).source === "efp",
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
      (s: TalentSocialAccount) => (s as TalentSocialAccount).source === "ens",
    );
    // 3. Merge EFP and ENS into 'Ethereum' if either exists
    let ethereumAccount: SocialAccount | null = null;
    if (mainEfp || ensAccount) {
      ethereumAccount = {
        source: "ethereum",
        handle: ensAccount
          ? (ensAccount as TalentSocialAccount).handle || null
          : null,
        followerCount: mainEfp
          ? ((mainEfp as TalentSocialAccount).followers_count ?? null)
          : null,
        accountAge: getAccountAge(
          ensAccount
            ? ((ensAccount as TalentSocialAccount).owned_since ?? null)
            : null,
        ),
        profileUrl: ensAccount
          ? (ensAccount as TalentSocialAccount).profile_url
          : mainEfp
            ? (mainEfp as TalentSocialAccount).profile_url
            : null,
        imageUrl: ensAccount
          ? (ensAccount as TalentSocialAccount).image_url
          : mainEfp
            ? (mainEfp as TalentSocialAccount).image_url
            : null,
        displayName: "Ethereum",
      };
    }
    // 4. Map and filter other accounts
    const socials: SocialAccount[] = data.socials
      .filter((s: TalentSocialAccount) => {
        const src = (s as TalentSocialAccount).source;
        return (
          src !== "efp" &&
          src !== "ens" &&
          src !== "linkedin" &&
          src !== "ethereum"
        );
      })
      .map((s: TalentSocialAccount) => {
        let handle = (s as TalentSocialAccount).handle || null;
        const src = (s as TalentSocialAccount).source;
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
        const displayName = getDisplayName(src as string);
        if (src === "basename") {
          return {
            source: "base",
            handle,
            followerCount: null,
            accountAge: getAccountAge(
              (s as TalentSocialAccount).owned_since ?? null,
            ),
            profileUrl: (s as TalentSocialAccount).profile_url ?? null,
            imageUrl: (s as TalentSocialAccount).image_url ?? null,
            displayName: "Base",
          };
        }
        return {
          source: src as string,
          handle,
          followerCount: (s as TalentSocialAccount).followers_count ?? null,
          accountAge: getAccountAge(
            (s as TalentSocialAccount).owned_since ?? null,
          ),
          profileUrl: (s as TalentSocialAccount).profile_url ?? null,
          imageUrl: (s as TalentSocialAccount).image_url ?? null,
          displayName,
        };
      });
    // 6. Add merged Ethereum account if present
    if (ethereumAccount) {
      socials.unshift(ethereumAccount);
    }
    return socials;
  } catch {
    return [];
  }
}

export interface Credential {
  data_issuer_name: string;
  name: string;
  points: number;
  max_score: number;
  description: string;
  external_url: string | null;
  last_calculated_at: string | null;
  category: string;
  data_issuer_slug: string;
  slug: string;
  uom: string;
  readable_value: string | null;
  points_calculation_logic?: {
    data_points?: Array<{
      is_maximum: boolean;
      readable_value: string | null;
      uom: string | null;
    }>;
    max_points: number | null;
  };
}

export interface CredentialsResponse {
  credentials: Credential[];
}

/**
 * Groups credentials by issuer and calculates total points per issuer
 */
export interface IssuerCredentialGroup {
  issuer: string;
  total: number;
  max_total: number;
  points: Array<{
    label: string;
    value: number;
    max_score: number | null;
    readable_value: string | null;
    uom: string | null;
    external_url: string | null;
  }>;
}

/**
 * Fetches credentials for a Farcaster user (by FID) from the Talent Protocol API
 * and groups them by issuer for display in the UI
 */
export async function getCredentialsForFarcaster(
  fid: string,
): Promise<IssuerCredentialGroup[]> {
  try {
    // console.log("[getCredentialsForFarcaster] Called with fid:", fid);
    const data = await fetchCredentials(fid);
    // console.log("[getCredentialsForFarcaster] API response:", data);
    if (!data?.credentials) {
      return [];
    }

    const issuerGroups = new Map<string, IssuerCredentialGroup>();

    data.credentials.forEach((cred: Credential) => {
      if (cred.points === 0) return;
      // Move Kaito credential under X/Twitter and rename
      let issuer = cred.data_issuer_name;
      let name = cred.name;
      if (issuer.toLowerCase().includes("kaito")) {
        issuer = "X/Twitter";
        name = "Kaito Yaps Airdrop";
      }
      if (typeof issuer !== "string") return;
      const existingGroup = issuerGroups.get(issuer);
      let readableValue = null;
      let uom = null;
      if (cred.points_calculation_logic?.data_points) {
        const maxDataPoint = cred.points_calculation_logic.data_points.find(
          (dp) => dp.is_maximum,
        );
        readableValue = maxDataPoint?.readable_value ?? null;
        uom = maxDataPoint?.uom ?? cred.uom ?? null;
      } else {
        uom = cred.uom ?? null;
      }
      const maxScore = cred.points_calculation_logic?.max_points ?? null;
      if (existingGroup) {
        existingGroup.total += cred.points;
        existingGroup.max_total =
          (existingGroup.max_total ?? 0) + (maxScore ?? 0);
        existingGroup.points.push({
          label: name,
          value: cred.points,
          max_score: maxScore,
          readable_value: readableValue,
          uom: uom,
          external_url: cred.external_url,
        });
      } else {
        issuerGroups.set(issuer, {
          issuer,
          total: cred.points,
          max_total: maxScore ?? 0,
          points: [
            {
              label: name,
              value: cred.points,
              max_score: maxScore,
              readable_value: readableValue,
              uom: uom,
              external_url: cred.external_url,
            },
          ],
        });
      }
    });

    return Array.from(issuerGroups.values()).sort((a, b) => b.total - a.total);
  } catch (err) {
    // console.error("[getCredentialsForFarcaster] Error:", err);
    return [];
  }
}

async function fetchCredentials(fid: string) {
  let baseUrl = "";
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost") {
      baseUrl = ""; // relative path
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
    }
  } else {
    baseUrl = process.env.NEXT_PUBLIC_URL || "";
  }

  const params = new URLSearchParams({
    fid,
    account_source: "farcaster",
    scorer_slug: SCORER_SLUGS.CREATOR,
  });

  // console.log("[fetchCredentials] Fetching /api/talent-credentials with params:", params.toString());
  const response = await fetch(
    `${baseUrl}/api/talent-credentials?${params.toString()}`,
    { method: "GET" },
  );
  const data = await response.json();
  // console.log("[fetchCredentials] Response:", data);

  if (data.error) {
    throw new Error(data.error);
  }

  if (!Array.isArray(data.credentials)) {
    throw new Error("Invalid response format from Talent API");
  }

  return data;
}

/**
 * Fetches leaderboard data (top creators by Creator Score) from Talent Protocol API
 */
export async function getLeaderboardCreators({
  page = 1,
  perPage = 10,
}: { page?: number; perPage?: number } = {}): Promise<
  Array<{
    rank: number;
    name: string;
    pfp?: string;
    score: number;
    rewards: string;
    id: string;
    talent_protocol_id: string | number;
  }>
> {
  const res = await fetch(`/api/leaderboard?page=${page}&perPage=${perPage}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to fetch leaderboard data");
  }
  const json = await res.json();
  return json.entries || [];
}

export type LeaderboardEntry = {
  rank: number;
  name: string;
  pfp?: string;
  score: number;
  rewards: string;
  id: string;
  talent_protocol_id: string | number;
};

export async function getCreatorScoreForTalentId(
  talentId: string | number,
): Promise<CreatorScore> {
  try {
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
    }
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    });
    const response = await fetch(
      `${baseUrl}/api/talent-score?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();
    if (data.error) {
      return {
        score: 0,
        level: 1,
        levelName: "Level 1",
        lastCalculatedAt: null,
        walletAddress: null,
        error: data.error,
      };
    }
    const points = data.score?.points ?? 0;
    const lastCalculatedAt = data.score?.last_calculated_at ?? null;
    const levelInfo =
      LEVEL_RANGES.find(
        (range) => points >= range.min && points <= range.max,
      ) || LEVEL_RANGES[0];
    const level = LEVEL_RANGES.indexOf(levelInfo) + 1;
    return {
      score: points,
      level,
      levelName: levelInfo.name,
      lastCalculatedAt,
      walletAddress: null,
    };
  } catch (error) {
    return {
      score: 0,
      level: 1,
      levelName: "Level 1",
      lastCalculatedAt: null,
      walletAddress: null,
      error: error instanceof Error ? error.message : "Failed to fetch score",
    };
  }
}

export async function getCredentialsForTalentId(
  talentId: string | number,
): Promise<IssuerCredentialGroup[]> {
  try {
    let baseUrl = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost") {
        baseUrl = ""; // relative path
      } else {
        baseUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      }
    } else {
      baseUrl = process.env.NEXT_PUBLIC_URL || "";
    }
    const params = new URLSearchParams({
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    });
    const response = await fetch(
      `${baseUrl}/api/talent-credentials?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();
    if (data.error || !Array.isArray(data.credentials)) {
      return [];
    }
    // Grouping logic as in getCredentialsForFarcaster
    const issuerGroups = new Map<string, IssuerCredentialGroup>();
    data.credentials.forEach((cred: Credential) => {
      if (cred.points === 0) return;
      // Move Kaito credential under X/Twitter and rename
      let issuer = cred.data_issuer_name;
      let name = cred.name;
      if (issuer.toLowerCase().includes("kaito")) {
        issuer = "X/Twitter";
        name = "Kaito Yaps Airdrop";
      }
      if (typeof issuer !== "string") return;
      const existingGroup = issuerGroups.get(issuer);
      let readableValue = null;
      let uom = null;
      if (cred.points_calculation_logic?.data_points) {
        const maxDataPoint = cred.points_calculation_logic.data_points.find(
          (dp) => dp.is_maximum,
        );
        readableValue = maxDataPoint?.readable_value ?? null;
        uom = maxDataPoint?.uom ?? cred.uom ?? null;
      } else {
        uom = cred.uom ?? null;
      }
      const maxScore = cred.points_calculation_logic?.max_points ?? null;
      if (existingGroup) {
        existingGroup.total += cred.points;
        existingGroup.max_total =
          (existingGroup.max_total ?? 0) + (maxScore ?? 0);
        existingGroup.points.push({
          label: name,
          value: cred.points,
          max_score: maxScore,
          readable_value: readableValue,
          uom: uom,
          external_url: cred.external_url,
        });
      } else {
        issuerGroups.set(issuer, {
          issuer,
          total: cred.points,
          max_total: maxScore ?? 0,
          points: [
            {
              label: name,
              value: cred.points,
              max_score: maxScore,
              readable_value: readableValue,
              uom: uom,
              external_url: cred.external_url,
            },
          ],
        });
      }
    });
    return Array.from(issuerGroups.values()).sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

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
    // Reuse the mapping logic from getSocialAccountsForFarcaster
    const efpAccounts = data.socials.filter(
      (s: TalentSocialAccount) => (s as TalentSocialAccount).source === "efp",
    );
    let mainEfp: TalentSocialAccount | null = null;
    if (efpAccounts.length > 0) {
      mainEfp = efpAccounts.reduce(
        (max: TalentSocialAccount, curr: TalentSocialAccount) =>
          (curr.followers_count ?? 0) > (max.followers_count ?? 0) ? curr : max,
        efpAccounts[0],
      );
    }
    const ensAccount = data.socials.find(
      (s: TalentSocialAccount) => (s as TalentSocialAccount).source === "ens",
    );
    let ethereumAccount: SocialAccount | null = null;
    if (mainEfp || ensAccount) {
      ethereumAccount = {
        source: "ethereum",
        handle: ensAccount
          ? (ensAccount as TalentSocialAccount).handle || null
          : null,
        followerCount: mainEfp
          ? ((mainEfp as TalentSocialAccount).followers_count ?? null)
          : null,
        accountAge: getAccountAge(
          ensAccount
            ? ((ensAccount as TalentSocialAccount).owned_since ?? null)
            : null,
        ),
        profileUrl: ensAccount
          ? (ensAccount as TalentSocialAccount).profile_url
          : mainEfp
            ? (mainEfp as TalentSocialAccount).profile_url
            : null,
        imageUrl: ensAccount
          ? (ensAccount as TalentSocialAccount).image_url
          : mainEfp
            ? (mainEfp as TalentSocialAccount).image_url
            : null,
        displayName: "Ethereum",
      };
    }
    const socials: SocialAccount[] = data.socials
      .filter((s: TalentSocialAccount) => {
        const src = (s as TalentSocialAccount).source;
        return (
          src !== "efp" &&
          src !== "ens" &&
          src !== "linkedin" &&
          src !== "ethereum"
        );
      })
      .map((s: TalentSocialAccount) => {
        let handle = (s as TalentSocialAccount).handle || null;
        const src = (s as TalentSocialAccount).source;
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
        const displayName = getDisplayName(src as string);
        if (src === "basename") {
          return {
            source: "base",
            handle,
            followerCount: null,
            accountAge: getAccountAge(
              (s as TalentSocialAccount).owned_since ?? null,
            ),
            profileUrl: (s as TalentSocialAccount).profile_url ?? null,
            imageUrl: (s as TalentSocialAccount).image_url ?? null,
            displayName: "Base",
          };
        }
        return {
          source: src as string,
          handle,
          followerCount: (s as TalentSocialAccount).followers_count ?? null,
          accountAge: getAccountAge(
            (s as TalentSocialAccount).owned_since ?? null,
          ),
          profileUrl: (s as TalentSocialAccount).profile_url ?? null,
          imageUrl: (s as TalentSocialAccount).image_url ?? null,
          displayName,
        };
      });
    if (ethereumAccount) {
      socials.unshift(ethereumAccount);
    }
    return socials;
  } catch {
    return [];
  }
}
