import { type IssuerCredentialGroup } from "@/app/services/types";

export function mergeCredentialsWithComingSoon(
  credentials: IssuerCredentialGroup[],
  comingSoonCredentials: IssuerCredentialGroup[],
): IssuerCredentialGroup[] {
  // Filter out coming soon credentials if they already exist in the API response (by slug)
  const apiCredentialSlugs = new Set(
    credentials.flatMap((c) => c.points.map((pt) => pt.slug).filter(Boolean)),
  );

  const filteredComingSoon = comingSoonCredentials
    .map((issuer) => ({
      ...issuer,
      points: issuer.points.filter(
        (pt) => !pt.slug || !apiCredentialSlugs.has(pt.slug),
      ),
    }))
    .filter((issuer) => issuer.points.length > 0);

  // Merge real credentials with coming soon ones, combining data points for existing issuers
  const existingIssuers = new Map(credentials.map((c) => [c.issuer, c]));
  const comingSoonMap = new Map(filteredComingSoon.map((c) => [c.issuer, c]));

  // Combine existing and coming soon credentials
  const allCredentials = Array.from(
    new Set([
      ...credentials.map((c) => c.issuer),
      ...filteredComingSoon.map((c) => c.issuer),
    ]),
  )
    .map((issuer) => {
      const existing = existingIssuers.get(issuer);
      const comingSoon = comingSoonMap.get(issuer);

      if (existing && comingSoon) {
        // Merge points: real credentials first, then coming soon points not already present
        const realLabels = new Set(existing.points.map((pt) => pt.label));
        const mergedPoints = [
          ...existing.points,
          ...comingSoon.points.filter((pt) => !realLabels.has(pt.label)),
        ];

        return {
          ...existing,
          points: mergedPoints,
        };
      }

      return existing || comingSoon;
    })
    .filter((issuer): issuer is IssuerCredentialGroup => issuer !== undefined);

  return allCredentials;
}

export function sortCredentialsByTotal(
  credentials: IssuerCredentialGroup[],
): IssuerCredentialGroup[] {
  return [
    ...credentials.filter((c) => c.total > 0),
    ...credentials
      .filter((c) => c.total === 0)
      .sort((a, b) => a.issuer.localeCompare(b.issuer)),
  ];
}

// Category mapping based on credential slugs
export const CREDENTIAL_CATEGORIES = {
  // Artist
  base_nft_collections_total_created: ["Artist"],
  base_nft_collections_unique_holders: ["Artist"],
  base_nft_collections_market_cap: ["Artist"],
  phi_artist_score: ["Artist"],
  zora_coin_earnings: ["Artist", "Social"],
  zora_unique_holders: ["Artist", "Social"],
  zora_creator_rewards: ["Artist", "Social"],

  // Writer
  mirror_unique_collectors: ["Writer"],
  mirror_total_posts: ["Writer"],
  mirror_creator_rewards: ["Writer"],
  paragraph_creator_rewards: ["Writer"],
  paragraph_unique_collectors: ["Writer"],
  paragraph_total_posts: ["Writer"],

  // Social
  bonsai_airdrop: ["Social"],
  efp_followers: ["Social"],
  farcaster_followers: ["Social"],
  farcaster_account_age: ["Social"],
  neynar_score: ["Social"],
  warpcast_rewards_usdc: ["Social"],
  flaunch_earnings: ["Social"],
  kaito_airdrop_one: ["Social"],
  lens_followers: ["Social"],
  lens_account_age: ["Social"],
  lens_total_earnings: ["Social"],
  linkedin_followers: ["Social"],
  noice_tips_earnings: ["Social"],
  stack_score: ["Social"],
  twitter_followers: ["Social"],
  twitter_account_age: ["Social"],

  // Music
  coop_records_holders: ["Music"],
  coop_records_earnings: ["Music"],

  // Podcast
  pods_creator_rewards: ["Podcast"],

  // Curator
  mirror_referral_rewards: ["Curator"],
  zora_referral_rewards: ["Curator"],
} as const;

// Credentials to filter out
export const EXCLUDED_CREDENTIAL_SLUGS = [
  "zora_followers",
  "zora_total_volume",
  "zora_market_cap",
  "zora_posts_coins",
  "zora_airdrop_one",
  "mirror_total_mints",
  "talent_protocol_human_checkmark",
  "onchain_account_age",
  "onchain_eth_balance",
  "onchain_out_transactions",
  "ens_account_age",
] as const;

// Category definitions with emojis
export const CREATOR_CATEGORIES = {
  Artist: "🎨",
  Video: "🎬",
  Writer: "✍️",
  Social: "💬",
  Music: "🎵",
  Podcast: "🎙️",
  Curator: "🔍",
} as const;

export type CreatorCategoryType = keyof typeof CREATOR_CATEGORIES;

export interface CreatorCategoryData {
  name: CreatorCategoryType;
  emoji: string;
  points: number;
  maxPoints: number;
  completionPercentage: number;
}

export interface CreatorCategoryBreakdown {
  primaryCategory: CreatorCategoryData;
  categories: CreatorCategoryData[];
  totalPoints: number;
  totalMaxPoints: number;
}

// 5-level color intensity based on completion percentage
export function getCompletionColorClass(completionPercentage: number): string {
  if (completionPercentage >= 80) return "bg-blue-600"; // Darkest
  if (completionPercentage >= 60) return "bg-blue-500";
  if (completionPercentage >= 40) return "bg-blue-400";
  if (completionPercentage >= 20) return "bg-blue-300";
  return "bg-blue-200"; // Lightest
}

// Process credentials into category breakdown
export function processCreatorCategories(
  credentialGroups: Array<{
    points: Array<{
      slug?: string;
      value: number;
      max_score: number | null;
    }>;
  }>,
): CreatorCategoryBreakdown {
  // Initialize category totals
  const categoryTotals: Record<
    CreatorCategoryType,
    {
      currentPoints: number;
      maxPoints: number;
    }
  > = {
    Artist: { currentPoints: 0, maxPoints: 0 },
    Video: { currentPoints: 0, maxPoints: 0 },
    Writer: { currentPoints: 0, maxPoints: 0 },
    Social: { currentPoints: 0, maxPoints: 0 },
    Music: { currentPoints: 0, maxPoints: 0 },
    Podcast: { currentPoints: 0, maxPoints: 0 },
    Curator: { currentPoints: 0, maxPoints: 0 },
  };

  // Process all credentials
  credentialGroups.forEach((group) => {
    group.points.forEach((credential) => {
      const slug = credential.slug;
      const points = credential.value;
      const maxScore = credential.max_score || 0;

      // Skip excluded credentials
      if (
        !slug ||
        EXCLUDED_CREDENTIAL_SLUGS.includes(
          slug as (typeof EXCLUDED_CREDENTIAL_SLUGS)[number],
        )
      ) {
        return;
      }

      // Add points to matching categories
      const categories =
        CREDENTIAL_CATEGORIES[slug as keyof typeof CREDENTIAL_CATEGORIES];
      if (categories) {
        categories.forEach((category) => {
          categoryTotals[category].currentPoints += points;
          categoryTotals[category].maxPoints += maxScore;
        });
      }
    });
  });

  // Calculate total points across all categories
  const totalPoints = Object.values(categoryTotals).reduce(
    (sum, data) => sum + data.currentPoints,
    0,
  );
  const totalMaxPoints = Object.values(categoryTotals).reduce(
    (sum, data) => sum + data.maxPoints,
    0,
  );

  // Create category data with completion percentages
  const categories: CreatorCategoryData[] = Object.entries(categoryTotals).map(
    ([name, data]) => ({
      name: name as CreatorCategoryType,
      emoji: CREATOR_CATEGORIES[name as CreatorCategoryType],
      points: data.currentPoints,
      maxPoints: data.maxPoints,
      completionPercentage:
        data.maxPoints > 0 ? (data.currentPoints / data.maxPoints) * 100 : 0,
    }),
  );

  // Sort categories by completion percentage (descending)
  categories.sort((a, b) => b.completionPercentage - a.completionPercentage);

  // Primary category is the one with the highest completion percentage
  const primaryCategory = categories[0] || {
    name: "Artist" as CreatorCategoryType,
    emoji: "🎨",
    points: 0,
    maxPoints: 0,
    completionPercentage: 0,
  };

  return {
    primaryCategory,
    categories,
    totalPoints,
    totalMaxPoints,
  };
}
