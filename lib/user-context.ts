// Define the type locally since it's not exported from the SDK
type UserContext = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

/**
 * DEVELOPMENT ONLY: Fallback user for testing outside of Farcaster
 * TODO: REMOVE THIS BEFORE PRODUCTION RELEASE
 * This is temporary code to facilitate development and testing.
 * Must be removed before going to production.
 */
const DEV_USER: UserContext = {
  fid: 8446,
  username: "macedo",
  displayName: "Filipe Macedo",
  pfpUrl: "https://i.imgur.com/YgNTMUI.jpg",
};

/**
 * Get user context with development fallback
 * In production, this will only return the real Farcaster context
 * In development, it will return a fallback user when outside Farcaster
 */
export function getUserContext(
  context: { user?: UserContext } | null,
): UserContext | undefined {
  // If we're in Farcaster (context exists and has user), use that
  if (context?.user) {
    return context.user;
  }

  // DEVELOPMENT ONLY: Return fallback user when outside Farcaster
  // TODO: REMOVE THIS BEFORE PRODUCTION RELEASE
  if (process.env.NODE_ENV === "development") {
    return DEV_USER;
  }

  return undefined;
}
