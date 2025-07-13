import type {
  ConnectedAccount,
  GroupedConnectedAccounts,
  ConnectedAccountsResponse,
  UserSettings,
  AccountManagementAction,
  HumanityCredentialsResponse,
} from "./types";
import { getLocalBaseUrl } from "@/lib/constants";

/**
 * Fetches connected accounts for a given Talent Protocol ID and groups them for settings management
 */
export async function getConnectedAccountsForTalentId(
  talentId: string | number,
): Promise<GroupedConnectedAccounts> {
  try {
    let baseUrl = "";
    if (typeof window === "undefined") {
      baseUrl = process.env.NEXT_PUBLIC_URL || getLocalBaseUrl();
    }

    const response = await fetch(
      `${baseUrl}/api/talent-accounts?id=${talentId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ConnectedAccountsResponse = await response.json();

    // Group accounts by type for settings management
    const socialAccounts = data.accounts.filter(
      (account: ConnectedAccount) =>
        account.source === "github" ||
        account.source === "twitter" ||
        account.source === "x_twitter",
    );

    const walletAccounts = data.accounts.filter(
      (account: ConnectedAccount) => account.source === "wallet",
    );

    return {
      social: socialAccounts,
      wallet: walletAccounts,
    };
  } catch (error) {
    console.error("Error fetching connected accounts:", error);
    return {
      social: [],
      wallet: [],
    };
  }
}

/**
 * Get user settings (notifications, preferences, etc.)
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
 * Performs account management action - Placeholder for now
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
 * Updates notification settings - Placeholder integrating with webhook system
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

export async function fetchHumanityCredentials(
  talentUuid: string,
): Promise<HumanityCredentialsResponse> {
  try {
    let baseUrl = "";
    if (typeof window === "undefined") {
      baseUrl = process.env.NEXT_PUBLIC_URL || getLocalBaseUrl();
    }

    const response = await fetch(
      `${baseUrl}/api/talent-humanity?id=${talentUuid}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: HumanityCredentialsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching humanity credentials:", error);
    throw error;
  }
}
