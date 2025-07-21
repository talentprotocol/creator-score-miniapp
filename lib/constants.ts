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
