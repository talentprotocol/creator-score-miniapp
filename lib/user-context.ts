// Define the type locally since it's not exported from the SDK
type UserContext = {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
};

/**
 * Get user context from Farcaster MiniApp
 * Returns the user context if available, otherwise undefined
 */
export function getUserContext(
  context: { user?: UserContext } | null,
): UserContext | undefined {
  // Development mode: return hardcoded user data for FID 8446
  if (process.env.NODE_ENV === "development") {
    return {
      fid: 8446,
      username: "macedo",
      displayName: "Filipe Macedo",
      pfpUrl: "https://i.imgur.com/YgNTMUI.jpg",
    };
  }

  // Return the actual Farcaster context if available
  if (context?.user) {
    return context.user;
  }

  // Production: return undefined when no Farcaster context
  return undefined;
}
