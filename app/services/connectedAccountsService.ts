import type {
  ConnectedAccount,
  GroupedConnectedAccounts,
  ConnectedAccountsResponse,
  UserSettings,
  AccountManagementAction,
  HumanityCredentialsResponse,
  ProfileResponse,
} from "@/lib/types";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_5_MINUTES } from "@/lib/cache-keys";

/**
 * SERVER-SIDE ONLY: Internal function to fetch connected accounts for a given Talent Protocol ID
 * This function should only be called from server-side code (layouts, API routes)
 */
async function getConnectedAccountsForTalentIdInternal(
  talentId: string | number,
): Promise<GroupedConnectedAccounts> {
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

    // Determine the primary wallet address (Farcaster first, then Talent)
    const primaryWalletAddress =
      profileData?.farcaster_primary_wallet_address ||
      profileData?.main_wallet_address ||
      null;

    // Group accounts by type for settings management
    const socialAccounts = accountsData.accounts.filter(
      (account: ConnectedAccount) =>
        account.source === "github" ||
        account.source === "twitter" ||
        account.source === "linkedin" ||
        account.source === "x_twitter",
    );

    const walletAccounts = accountsData.accounts
      .filter((account: ConnectedAccount) => account.source === "wallet")
      .map((account: ConnectedAccount) => ({
        ...account,
        is_primary: account.identifier === primaryWalletAddress,
      }));

    return {
      social: socialAccounts,
      wallet: walletAccounts,
      primaryWalletInfo: {
        main_wallet_address: profileData?.main_wallet_address || null,
        farcaster_primary_wallet_address:
          profileData?.farcaster_primary_wallet_address || null,
      },
    };
  } catch (error) {
    console.error("Error fetching connected accounts:", error);
    throw error; // Don't return empty data silently - let the error bubble up
  }
}

/**
 * SERVER-SIDE ONLY: Cached version of getConnectedAccountsForTalentId
 * This function should only be called from server-side code (layouts, API routes)
 * Uses proper caching as required by coding principles
 */
export function getConnectedAccountsForTalentId(talentId: string | number) {
  return unstable_cache(
    async () => getConnectedAccountsForTalentIdInternal(talentId),
    [`${CACHE_KEYS.CONNECTED_ACCOUNTS}-${talentId}`],
    {
      tags: [
        `${CACHE_KEYS.CONNECTED_ACCOUNTS}-${talentId}`,
        CACHE_KEYS.CONNECTED_ACCOUNTS,
      ],
      revalidate: 1, // Align with client-side cache duration
    },
  );
}

/**
 * SERVER-SIDE ONLY: Get user settings (notifications, preferences, etc.)
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
