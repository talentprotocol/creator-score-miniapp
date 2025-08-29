export interface AppMetadata {
  // Core app info
  name: string;
  subtitle: string;
  description: string;
  tagline: string;

  // Images
  iconUrl: string;
  splashImageUrl: string;
  heroImageUrl: string;

  // Colors and styling
  splashBackgroundColor: string;

  // Categories and tags
  primaryCategory: string;
  tags: string[];

  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
}

// Frame object for fc:frame meta tag
export const creatorScoreFrame = {
  version: "next",
  imageUrl: "https://www.creatorscore.app/hero.png",
  button: {
    title: "Check Your Score",
    action: {
      type: "launch_frame",
      name: "Creator Score",
      url: "https://www.creatorscore.app",
      splashImageUrl: "https://www.creatorscore.app/splash.png",
      splashBackgroundColor: "#C79AF6",
    },
  },
};

// Static metadata configuration (version controlled)
export const APP_METADATA = {
  name: "Creator Score App",
  subtitle: "Create Onchain. Earn Rewards.",
  description:
    "Track your creator reputation across onchain platforms like Zora, Farcaster, Mirror or Lens, and start earning rewards in USDC.",
  tagline: "Create Onchain. Earn Rewards.",

  splashBackgroundColor: "#C79AF6",

  primaryCategory: "social",
  tags: ["creator", "onchain", "reputation", "base", "rewards"],

  ogTitle: "Creator Score App",
  ogDescription:
    "Track your creator reputation across onchain platforms like Zora, Farcaster, Mirror or Lens.",
};

export function getAppMetadata(): AppMetadata {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.creatorscore.app";

  return {
    ...APP_METADATA,
    // All URLs are now absolute and environment-aware
    iconUrl: `${baseUrl}/icon.png`,
    splashImageUrl: `${baseUrl}/splash.png`,
    heroImageUrl: `${baseUrl}/hero.png`,
    ogImageUrl: `${baseUrl}/hero.png`,
  };
}

// Alias for clarity - returns the same data
export const getFrameMetadata = getAppMetadata;

/**
 * Get MiniKit provider configuration
 */
export function getMiniKitConfig() {
  const metadata = getAppMetadata();
  return {
    name: metadata.name,
    logo: metadata.iconUrl,
  };
}

/**
 * Get page metadata for Next.js layout
 */
export function getPageMetadata() {
  const metadata = getAppMetadata();
  return {
    title: metadata.name,
    description: metadata.description,
    ogTitle: metadata.ogTitle,
    ogDescription: metadata.ogDescription,
    ogImage: metadata.ogImageUrl,
    twitterTitle: metadata.name,
    twitterDescription: metadata.description,
    twitterImage: metadata.ogImageUrl,
  };
}
