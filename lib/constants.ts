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
    id: "talent",
    name: "Talent",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/002f0efe-2513-41e7-3d89-d38875d76800/anim=false,f=auto,w=288",
    amount: 2500,
    date: "2023-07-23",
    rank: 1,
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "phi",
    name: "Phi",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/9b5ad594-f3e9-4160-9c33-4e0eeaf28500/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    date: "2023-07-23",
    rank: 2,
    txHash: "0x2345678901bcdef12345678901bcdef23456789",
  },
  {
    id: "noice",
    name: "Noice",
    avatar:
      "https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/96aabcca-a8ce-47d6-b6f6-d2b6d1272500/anim=false,fit=contain,f=auto,w=576",
    amount: 1250,
    date: "2023-07-23",
    rank: 3,
    txHash: "0x3456789012cdef123456789012cdef3456789a",
  },
  {
    id: "efp",
    name: "EFP",
    avatar:
      "https://pbs.twimg.com/profile_images/1899112167468638208/H7XicSUE_400x400.png",
    amount: 250,
    date: "2023-07-23",
    rank: 4,
    txHash: "0x456789013def23456789013def456789ab",
  },
];

// Calculate total active sponsors pool
export const TOTAL_SPONSORS_POOL = ACTIVE_SPONSORS.reduce(
  (sum, sponsor) => sum + sponsor.amount,
  0,
);

export const ROUND_ENDS_AT = new Date(Date.UTC(2025, 7, 31, 23, 59, 59)); // August is month 7 (0-indexed)
