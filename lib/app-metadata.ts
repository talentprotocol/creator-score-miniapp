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

// Static metadata configuration (version controlled)
export const APP_METADATA: AppMetadata = {
  name: "Creator Score Mini App",
  subtitle: "Create Onchain. Earn Rewards.",
  description:
    "Track your creator reputation across onchain platforms like Zora, Farcaster, Mirror or Lens, and start earning rewards in USDC.",
  tagline: "Create Onchain. Earn Rewards.",

  iconUrl: "/favicon-64.png",
  splashImageUrl: "https://www.creatorscore.app/splash.png",
  heroImageUrl: "https://www.creatorscore.app/hero.png",

  splashBackgroundColor: "#C79AF6",

  primaryCategory: "social",
  tags: ["creator", "onchain", "reputation", "base", "rewards"],

  ogTitle: "Creator Score Mini App",
  ogDescription:
    "Track your creator reputation across onchain platforms like Zora, Farcaster, Mirror or Lens.",
  ogImageUrl: "https://www.creatorscore.app/hero.png",
};

/**
 * Get app metadata with environment-specific overrides
 * Only uses env vars for values that might differ between environments
 */
export function getAppMetadata(): AppMetadata {
  return {
    ...APP_METADATA,
    // Override with env vars only for environment-specific values
    iconUrl: process.env.NEXT_PUBLIC_APP_ICON || APP_METADATA.iconUrl,
    splashImageUrl:
      process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || APP_METADATA.splashImageUrl,
    heroImageUrl:
      process.env.NEXT_PUBLIC_APP_HERO_IMAGE || APP_METADATA.heroImageUrl,
    ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || APP_METADATA.ogImageUrl,
  };
}

/**
 * Get frame metadata for Farcaster frame configuration
 */
export function getFrameMetadata() {
  const metadata = getAppMetadata();
  return {
    name: metadata.name,
    subtitle: metadata.subtitle,
    description: metadata.description,
    iconUrl: metadata.iconUrl,
    splashImageUrl: metadata.splashImageUrl,
    splashBackgroundColor: metadata.splashBackgroundColor,
    primaryCategory: metadata.primaryCategory,
    tags: metadata.tags,
    heroImageUrl: metadata.heroImageUrl,
    tagline: metadata.tagline,
    ogTitle: metadata.ogTitle,
    ogDescription: metadata.ogDescription,
    ogImageUrl: metadata.ogImageUrl,
  };
}

/**
 * Get MiniKit provider configuration
 */
export function getMiniKitConfig() {
  const metadata = getAppMetadata();
  return {
    name: metadata.name,
    logo: process.env.NEXT_PUBLIC_ICON_URL || metadata.iconUrl,
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
