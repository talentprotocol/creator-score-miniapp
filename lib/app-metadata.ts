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
  imageUrl: "https://www.base200.com/hero.png",
  button: {
    title: "Check Your Score",
    action: {
      type: "launch_frame",
      name: "BASE200",
      url: "https://www.base200.com",
      splashImageUrl: "https://www.base200.com/splash.png",
      splashBackgroundColor: "#C79AF6",
    },
  },
};

// Static metadata configuration (version controlled)
export const APP_METADATA = {
  name: "BASE200",
  subtitle: "Reputation-Backed Talent Index",
  description:
    "BASE200 makes it super easy to track and trade top talent at BaseCamp. A reputation-backed talent index for the Base ecosystem.",
  tagline: "Reputation-Backed Talent Index",

  splashBackgroundColor: "#C79AF6",

  primaryCategory: "social",
  tags: ["talent", "base", "reputation", "index", "basecamp"],

  ogTitle: "BASE200 Talent Index",
  ogDescription:
    "Track and trade top talent at BaseCamp with BASE200's reputation-backed talent index.",
};

export function getAppMetadata(): AppMetadata {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.base200.com";

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
