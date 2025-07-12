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

  // Development mode: return hardcoded user data for courinha (FID 374478)
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[getUserContext] Development mode - returning hardcoded courinha user",
    );
    return {
      fid: 374478,
      username: "courinha",
      displayName: "João Courinha",
      pfpUrl:
        "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/98db301a-ca0f-41bc-bc34-449270d9eb00/original",
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
