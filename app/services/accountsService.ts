import type {
  SocialAccount,
  WalletAccount,
  GroupedWalletAccounts,
  ConnectedAccountsResponse,
  ProfileResponse,
  UserSettings,
  AccountManagementAction,
  HumanityCredentialsResponse,
} from "@/lib/types";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";

// Helper functions from socialAccountsService
function getAccountAge(ownedSince: string | null): string | null {
  if (!ownedSince) return null;
  const ownedDate = new Date(ownedSince);
  const now = new Date();
  const diffMs = now.getTime() - ownedDate.getTime();
  const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  return "<1 month";
}

function getDisplayName(source: string): string {
  if (source === "github") return "GitHub";
  if (source === "base") return "Base";
  if (source === "ethereum") return "Ethereum";
  if (source === "farcaster") return "Farcaster";
  if (source === "lens") return "Lens";
  if (source === "twitter") return "Twitter";
  if (source === "linkedin") return "LinkedIn";
  if (source === "efp") return "EFP";
  if (source === "ens") return "ENS";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export interface UnifiedAccountsData {
  social: SocialAccount[];
  wallet: GroupedWalletAccounts;
  primaryWalletInfo: {
    main_wallet_address: string | null;
    farcaster_primary_wallet_address: string | null;
  };
}

/**
 * SERVER-SIDE ONLY: Internal function to fetch all accounts for a given Talent Protocol ID
 * Consolidates logic from connectedAccountsService, walletAccountsService, and socialAccountsService
 */
async function getAccountsForTalentIdInternal(
  talentId: string | number,
): Promise<UnifiedAccountsData> {
  try {
    const { talentApiClient } = await import("@/lib/talent-api-client");

    const [accountsResponse, profileResponse] = await Promise.all([
      talentApiClient.getAccounts({ id: String(talentId) }),
      talentApiClient.getProfile({ talent_protocol_id: String(talentId) }),
    ]);

    if (!accountsResponse.ok) {
      throw new Error(`Talent API error: ${accountsResponse.status}`);
    }

    const accountsData: ConnectedAccountsResponse =
      await accountsResponse.json();
    let profileData: ProfileResponse | null = null;

    // Get profile data for primary wallet information
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Primary wallet info will be included in the response

    // Process social accounts (from socialAccountsService logic)
    const rawSocialAccounts = accountsData.accounts.filter(
      (account) => account.source !== "wallet" && account.source !== "ethereum",
    );

    const socialAccounts: SocialAccount[] = rawSocialAccounts
      .filter((s) => {
        const src = s.source;
        // Only exclude linkedin and duplicate ethereum accounts
        return src !== "linkedin" && src !== "ethereum";
      })
      .map((s) => {
        let handle = s.handle || s.username || null;
        const src = s.source;

        if (
          src === "lens" &&
          handle &&
          typeof handle === "string" &&
          handle.startsWith("lens/")
        ) {
          handle = handle.replace(/^lens\//, "");
        }

        if (
          (src === "farcaster" || src === "twitter") &&
          handle &&
          typeof handle === "string" &&
          !handle.startsWith("@")
        ) {
          handle = `@${handle}`;
        }

        const displayName = getDisplayName(src);

        if (src === "basename") {
          return {
            source: "base",
            handle,
            followerCount: null,
            accountAge: getAccountAge(s.owned_since ?? null),
            profileUrl: s.profile_url ?? null,
            imageUrl: s.image_url ?? null,
            displayName: "Base",
          };
        }

        // Special handling for EFP fallback URL
        let profileUrl = s.profile_url ?? null;
        if (src === "efp" && !profileUrl && handle) {
          profileUrl = `https://ethfollow.xyz/${handle}`;
        }

        return {
          source: src,
          handle,
          followerCount: null, // Social accounts from /accounts don't have follower count
          accountAge: getAccountAge(s.owned_since ?? null),
          profileUrl,
          imageUrl: s.image_url ?? null,
          displayName,
        };
      });

    // Process wallet accounts (from walletAccountsService logic)
    const walletAccounts = accountsData.accounts.filter(
      (account: WalletAccount) => account.source === "wallet",
    );

    const farcasterVerified = walletAccounts.filter(
      (account: WalletAccount) => account.imported_from === "farcaster",
    );

    const talentVerified = walletAccounts.filter(
      (account: WalletAccount) => account.imported_from === null,
    );

    return {
      social: socialAccounts,
      wallet: {
        farcasterVerified,
        talentVerified,
      },
      primaryWalletInfo: {
        main_wallet_address: profileData?.main_wallet_address || null,
        farcaster_primary_wallet_address:
          profileData?.farcaster_primary_wallet_address || null,
      },
    };
  } catch (error) {
    console.error("Error fetching accounts:", error);
    throw error; // Don't return empty data silently - let the error bubble up
  }
}

/**
 * SERVER-SIDE ONLY: Cached version of getAccountsForTalentId
 * This function should only be called from server-side code (layouts, API routes)
 * Uses proper caching as required by coding principles
 */
export function getAccountsForTalentId(talentId: string | number) {
  return unstable_cache(
    async () => getAccountsForTalentIdInternal(talentId),
    [`${CACHE_KEYS.CONNECTED_ACCOUNTS}-${talentId}`],
    {
      tags: [
        `${CACHE_KEYS.CONNECTED_ACCOUNTS}-${talentId}`,
        CACHE_KEYS.CONNECTED_ACCOUNTS,
      ],
      revalidate: CACHE_DURATION_5_MINUTES,
    },
  );
}

/**
 * SERVER-SIDE ONLY: Get user settings (notifications, preferences, etc.)
 * Kept from connectedAccountsService for compatibility
 */
export async function getUserSettings(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _talentId: string | number,
): Promise<UserSettings> {
  try {
    // TODO: Implement actual API call to get user settings
    // For now, return placeholder data
    return {
      email: null, // Will be fetched from Talent Protocol database
      notifications: {
        farcaster: true, // Default enabled
        email: false, // Default disabled until email functionality is ready
      },
    };
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return {
      email: null,
      notifications: {
        farcaster: false,
        email: false,
      },
    };
  }
}

/**
 * SERVER-SIDE ONLY: Performs account management action - Placeholder for now
 * Kept from connectedAccountsService for compatibility
 */
export async function performAccountAction(
  talentId: string | number,
  action: AccountManagementAction,
): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Implement actual API calls for account management
    console.log("Performing account action:", action);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    switch (action.action) {
      case "connect":
        return {
          success: true,
          message: `${action.account_type} account connection initiated`,
        };
      case "disconnect":
        return {
          success: true,
          message: `${action.account_type} account disconnected`,
        };
      case "set_primary":
        return {
          success: true,
          message: "Primary wallet updated",
        };
      case "update_email":
        return {
          success: true,
          message: "Email updated successfully",
        };
      case "delete_account":
        return {
          success: true,
          message: "Account deletion initiated",
        };
      default:
        return {
          success: false,
          message: "Unknown action",
        };
    }
  } catch (error) {
    console.error("Error performing account action:", error);
    return {
      success: false,
      message: "Action failed. Please try again.",
    };
  }
}

/**
 * SERVER-SIDE ONLY: Updates notification settings - Placeholder integrating with webhook system
 * Kept from connectedAccountsService for compatibility
 */
export async function updateNotificationSettings(
  talentId: string | number,
  notifications: { farcaster: boolean; email: boolean },
): Promise<{ success: boolean; message: string }> {
  try {
    // TODO: Integrate with existing webhook system in /api/webhook/route.ts
    console.log("Updating notification settings:", notifications);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      message: "Notification settings updated",
    };
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return {
      success: false,
      message: "Failed to update notification settings",
    };
  }
}

/**
 * SERVER-SIDE ONLY: Internal function to fetch humanity credentials
 * Kept from connectedAccountsService for compatibility
 */
async function fetchHumanityCredentialsInternal(
  talentUuid: string,
): Promise<HumanityCredentialsResponse> {
  try {
    const { talentApiClient } = await import("@/lib/talent-api-client");

    // Use the talent API client directly for server-side calls
    const response = await talentApiClient.getHumanityCredentials({
      id: talentUuid,
    });

    if (!response.ok) {
      throw new Error(`Talent API error: ${response.status}`);
    }

    const data: HumanityCredentialsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching humanity credentials:", error);
    throw error;
  }
}

/**
 * SERVER-SIDE ONLY: Cached version of fetchHumanityCredentials
 * This function should only be called from server-side code (layouts, API routes)
 * Kept from connectedAccountsService for compatibility
 */
export function fetchHumanityCredentials(talentUuid: string) {
  return unstable_cache(
    async () => fetchHumanityCredentialsInternal(talentUuid),
    [`${CACHE_KEYS.HUMANITY_CREDENTIALS}-${talentUuid}`],
    {
      tags: [
        `${CACHE_KEYS.HUMANITY_CREDENTIALS}-${talentUuid}`,
        CACHE_KEYS.HUMANITY_CREDENTIALS,
      ],
      revalidate: CACHE_DURATION_5_MINUTES,
    },
  );
}
