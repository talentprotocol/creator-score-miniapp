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
  console.log("[getUserContext] Input context:", context);

  // Development mode: return hardcoded user data for FID 8446
  if (process.env.NODE_ENV === "development") {
    console.log("[getUserContext] Development mode - returning hardcoded user");
    return {
      fid: 8446,
      username: "macedo",
      displayName: "Filipe Macedo",
      pfpUrl: "https://i.imgur.com/YgNTMUI.jpg",
    };
  }

  // Return the actual Farcaster context if available
  if (context?.user) {
    console.log("[getUserContext] Farcaster context found:", context.user);
    return context.user;
  }

  // Production: return undefined when no Farcaster context
  console.log("[getUserContext] No Farcaster context found");
  return undefined;
}
