// Development configuration
// NOTE: This port must match the --port value in package.json's "dev" script
// When changing this port, also update package.json's dev script
export const DEV_PORT = 3000;

/**
 * Get the local development URL, respecting the configured port
 * @returns The base URL for local development
 */
export function getLocalBaseUrl(): string {
  return `http://localhost:${DEV_PORT}`;
}

export const LEVEL_RANGES = [
  { min: 0, max: 39, name: "Level 1" },
  { min: 40, max: 79, name: "Level 2" },
  { min: 80, max: 119, name: "Level 3" },
  { min: 120, max: 169, name: "Level 4" },
  { min: 170, max: 249, name: "Level 5" },
  { min: 250, max: Infinity, name: "Level 6" },
] as const;

export type LevelRange = (typeof LEVEL_RANGES)[number];

// Platform display name mappings
export const PLATFORM_NAMES: Record<string, string> = {
  base: "Base",
  ethereum: "Ethereum",
  farcaster: "Farcaster",
  lens: "Lens",
  twitter: "Twitter",
  x: "X", // Legacy support
  linkedin: "LinkedIn",
  github: "GitHub",
  discord: "Discord",
  telegram: "Telegram",
} as const;

// List of reserved words that cannot be used as profile identifiers
export const RESERVED_WORDS = [
  "api",
  "settings",
  "leaderboard",
  "profile",
  "services",
  ".well-known",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  // Recommended additions
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "auth",
  "admin",
  "dashboard",
  "home",
  "explore",
  "notifications",
  "messages",
  "search",
  "help",
  "support",
  "terms",
  "privacy",
  "about",
  "contact",
  "static",
  "public",
  "assets",
  // Add more as needed
];

/**
 * Project accounts to exclude from leaderboard rankings
 */
export const PROJECT_ACCOUNTS_TO_EXCLUDE = [
  "cf0a0516-b68c-49a5-b17e-4bf9361535b7", // moonwell
  "20d5bcc9-88c2-40ae-965d-9c857b9ce9d7", // talent
  "887c2f4e-2d15-4f0d-ba69-fcef946a7002", // base.base.eth
  "4217c910-9179-4d77-b4c6-eff8be5d8c02", // cooprecs
  "aa08b53c-622f-49f0-ba70-46bb1dabcfc1", // matchaxyz
  "09b20fc9-a28d-4477-8103-f9f195ec76b1", // rainbow
  "1b04461c-0160-487e-8022-d2b59d4a05ec", // walletconnect
  "e6892c35-0c8c-4b91-9e57-b894345bedbd", // dune.eth
  "f3cba5f4-6eb8-485d-815b-5775619a22bb", // drakula
  "1e8eec23-d32d-4f64-bdc4-4a46a0ff8fa4", // daylightenergy
  "b4405975-e209-4f3c-b5b4-7f83a1a652c3", // interface
  "a2609b4d-1b19-4d50-87b2-f415d85535a9", // doodles
];

// Environment variable validation
export function validateEnvironmentVariables() {
  const requiredVars = [
    "NEXT_PUBLIC_URL",
    "NEXT_PUBLIC_ONCHAINKIT_API_KEY",
    "TALENT_API_KEY",
  ];

  const optional = [
    "NEYNAR_API_KEY",
    "FARCASTER_HEADER",
    "FARCASTER_PAYLOAD",
    "FARCASTER_SIGNATURE",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);
  const missingOptional = optional.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️ Missing optional environment variables: ${missingOptional.join(", ")}`,
    );
  }

  return {
    hasAllRequired: missing.length === 0,
    missing,
    missingOptional,
  };
}

// Validate on module load (server-side only)
if (typeof window === "undefined") {
  validateEnvironmentVariables();
}

// Active sponsors data
export const ACTIVE_SPONSORS = [
  {
    id: "purple",
    name: "Purple",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fi.imgur.com%2FDWjfq34.jpg",
    amount: 4538,
    handle: "@purple",
    rank: 1,
    farcasterUrl: "https://farcaster.xyz/purple",
  },
  {
    id: "base",
    name: "Base",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/ce5460f6-40a2-4486-47c1-7801e4033e00/anim=false,fit=contain,f=auto,w=576",
    amount: 2500,
    handle: "@base",
    rank: 2,
    farcasterUrl: "https://farcaster.xyz/base",
  },
  {
    id: "talent",
    name: "Talent Protocol",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/002f0efe-2513-41e7-3d89-d38875d76800/anim=false,f=auto,w=288",
    amount: 2500,
    handle: "@talent",
    rank: 3,
    farcasterUrl: "https://farcaster.xyz/talent",
  },
  {
    id: "efp",
    name: "EFP",
    avatar:
      "https://pbs.twimg.com/profile_images/1899112167468638208/H7XicSUE_400x400.png",
    amount: 1350,
    handle: "@efp",
    rank: 4,
    farcasterUrl: "https://x.com/efp",
  },
  {
    id: "phi",
    name: "Phi",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/9b5ad594-f3e9-4160-9c33-4e0eeaf28500/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    handle: "@phi",
    rank: 5,
    farcasterUrl: "https://farcaster.xyz/phi",
  },
  {
    id: "noice",
    name: "Noice",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/96aabcca-a8ce-47d6-b6f6-d2b6d1272500/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    handle: "@noiceapp",
    rank: 6,
    farcasterUrl: "https://farcaster.xyz/noiceapp",
  },
  {
    id: "web3bio",
    name: "Web3.bio",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/d984e36e-e040-4118-9122-b2027955de00/anim=false,fit=contain,f=auto,w=576",
    amount: 1200,
    handle: "@web3bio",
    rank: 7,
    farcasterUrl: "https://farcaster.xyz/web3bio",
  },
  {
    id: "fireflyapp",
    name: "Firefly App",
    avatar:
      "https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=576/https%3A%2F%2Fmedia.firefly.land%2Ffarcaster%2F8b064ce5-dffa-4260-9f8c-1c8c48e9eac0.png",
    amount: 1200,
    handle: "@fireflyapp",
    rank: 8,
    farcasterUrl: "https://farcaster.xyz/fireflyapp",
  },
];

// Calculate total active sponsors pool
export const TOTAL_SPONSORS_POOL = ACTIVE_SPONSORS.reduce(
  (sum, sponsor) => sum + sponsor.amount,
  0,
);

export const ROUND_ENDS_AT = new Date(Date.UTC(2025, 7, 31, 23, 59, 59)); // August is month 7 (0-indexed)

// Creator Perk (Draw) timeline - DISABLED: Perk system is currently inactive
// Entries close on Aug 22nd 14:59 UTC, winners drawn on Aug 22nd 15:00 UTC
// TODO: Update dates when perk system is re-enabled
export const PERK_DRAW_DEADLINE_UTC = new Date(
  Date.UTC(2025, 7, 22, 14, 59, 59),
);
export const PERK_DRAW_DATE_UTC = new Date(Date.UTC(2025, 7, 26, 15, 0, 0));

// Boost configuration
export const BOOST_CONFIG = {
  TOKEN_THRESHOLD: 100, // Minimum tokens required for boost status
} as const;

// Global per-callout flags (applied across all carousels)
export const CALLOUT_FLAGS = {
  // Enable Opt-out callout
  optout: true,
  // Keep Boost callout enabled
  boost: true,
  // Keep Perk callout enabled
  perk_screen_studio: true,
} as const;
