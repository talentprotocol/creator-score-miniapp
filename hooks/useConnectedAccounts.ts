import { useState, useEffect } from "react";
import type {
  GroupedConnectedAccounts,
  UserSettings,
  AccountManagementAction,
  HumanityCredential,
} from "@/lib/types";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "@/lib/utils";
import { CACHE_KEYS } from "@/lib/cache-keys";

/**
 * CLIENT-SIDE ONLY: Fetches connected accounts via API routes (follows coding principles)
 */
async function getConnectedAccountsForTalentId(
  talentId: string | number,
): Promise<GroupedConnectedAccounts> {
  try {
    const response = await fetch(`/api/connected-accounts?id=${talentId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[useConnectedAccounts] Error fetching connected accounts:",
      error,
    );
    throw error;
  }
}

/**
 * CLIENT-SIDE ONLY: Get user settings via API routes
 */
async function getUserSettings(
  talentId: string | number,
): Promise<UserSettings> {
  try {
    const response = await fetch(`/api/user-settings?uuid=${talentId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: UserSettings = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[useConnectedAccounts] Error fetching user settings:",
      error,
    );
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
 * CLIENT-SIDE ONLY: Performs account management action via API routes
 */
async function performAccountAction(
  talentId: string | number,
  action: AccountManagementAction,
): Promise<{ success: boolean; message: string }> {
  try {
    switch (action.action) {
      case "connect":
        return {
          success: true,
          message: `${action.account_type} account connection initiated`,
        };
      case "disconnect":
        try {
          if (
            action.account_type === "github" ||
            action.account_type === "twitter" ||
            action.account_type === "linkedin"
          ) {
            const res = await fetch(`/api/connected-accounts`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ platform: action.account_type }),
            });
            if (!res.ok) {
              const errText = await res.text();
              throw new Error(errText || `HTTP ${res.status}`);
            }
          }
          return {
            success: true,
            message: `${action.account_type} account disconnected`,
          };
        } catch (e) {
          return {
            success: false,
            message:
              e instanceof Error ? e.message : "Failed to disconnect account",
          };
        }
      case "set_primary":
        return {
          success: true,
          message: "Primary wallet updated",
        };
      case "update_email":
        try {
          const res = await fetch(`/api/user-settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: String(action.data?.email || "") }),
          });
          if (!res.ok) {
            const err = await res.text();
            throw new Error(err || `HTTP ${res.status}`);
          }
          return { success: true, message: "Email updated successfully. Click on the link in the email to verify your email." };
        } catch (e) {
          return {
            success: false,
            message:
              e instanceof Error ? e.message : "Failed to update email",
          };
        }
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
    console.error(
      "[useConnectedAccounts] Error performing account action:",
      error,
    );
    return {
      success: false,
      message: "Action failed. Please try again.",
    };
  }
}

/**
 * CLIENT-SIDE ONLY: Updates notification settings via API routes
 */
async function updateNotificationSettings(
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
    console.error(
      "[useConnectedAccounts] Error updating notification settings:",
      error,
    );
    return {
      success: false,
      message: "Failed to update notification settings",
    };
  }
}

/**
 * CLIENT-SIDE ONLY: Fetches humanity credentials via API routes
 */
async function fetchHumanityCredentials(
  talentUuid: string,
): Promise<{ credentials: HumanityCredential[] }> {
  try {
    const response = await fetch(`/api/talent-humanity?id=${talentUuid}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[useConnectedAccounts] Error fetching humanity credentials:",
      error,
    );
    throw error;
  }
}

export function useConnectedAccounts(talentUUID: string | undefined) {
  const [accounts, setAccounts] = useState<GroupedConnectedAccounts | null>(
    null,
  );
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [humanityCredentials, setHumanityCredentials] = useState<
    HumanityCredential[] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchData = async () => {
    if (!talentUUID) {
      setLoading(false);
      return;
    }

    const accountsCacheKey = `${CACHE_KEYS.CONNECTED_ACCOUNTS}_${talentUUID}`;
    const settingsCacheKey = `${CACHE_KEYS.USER_SETTINGS}_${talentUUID}`;
    const humanityCacheKey = `${CACHE_KEYS.HUMANITY_CREDENTIALS}_${talentUUID}`;

    // Check cache first
    const authJustIssued =
      typeof window !== "undefined" &&
      sessionStorage.getItem("tpAuthJustIssued") === "1";
    const cachedAccounts = getCachedData<GroupedConnectedAccounts>(
      accountsCacheKey,
      CACHE_DURATIONS.PROFILE_DATA,
    );
    const cachedSettings = authJustIssued
      ? null
      : getCachedData<UserSettings>(
          settingsCacheKey,
          CACHE_DURATIONS.PROFILE_DATA,
        );
    const cachedHumanity = getCachedData<HumanityCredential[]>(
      humanityCacheKey,
      CACHE_DURATIONS.PROFILE_DATA,
    );

    if (cachedAccounts && cachedSettings && cachedHumanity) {
      setAccounts(cachedAccounts);
      setSettings(cachedSettings);
      setHumanityCredentials(cachedHumanity);
      setError(undefined);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const [accountsData, settingsData] = await Promise.all([
        getConnectedAccountsForTalentId(talentUUID),
        getUserSettings(talentUUID),
      ]);

      // Fetch humanity credentials separately and handle errors gracefully
      let humanityData: HumanityCredential[] = [];
      try {
        const response = await fetchHumanityCredentials(talentUUID);
        humanityData = response.credentials;
      } catch (humanityError) {
        console.warn(
          "Failed to fetch humanity credentials, using empty array:",
          humanityError,
        );
      }

      setAccounts(accountsData);
      setSettings(settingsData);
      setHumanityCredentials(humanityData);

      // Cache the results
      setCachedData(accountsCacheKey, accountsData);
      setCachedData(settingsCacheKey, settingsData);
      setCachedData(humanityCacheKey, humanityData);

      // If auth token was just issued, clear the flag and ensure old settings cache is dropped
      if (authJustIssued && typeof window !== "undefined") {
        sessionStorage.removeItem("tpAuthJustIssued");
        // Remove any stale settings cache that may have been persisted elsewhere
        localStorage.removeItem(settingsCacheKey);
        localStorage.removeItem(`cache:${settingsCacheKey}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Account management actions
  const performAction = async (
    action: AccountManagementAction,
  ): Promise<{ success: boolean; message: string }> => {
    if (!talentUUID) {
      return { success: false, message: "No talent UUID provided" };
    }

    try {
      const result = await performAccountAction(talentUUID, action);

      if (result.success) {
        // For email updates, avoid full page refetch; update local state and cache only
        if (action.action === "update_email") {
          const settingsCacheKey = `${CACHE_KEYS.USER_SETTINGS}_${talentUUID}`;
          const updated: UserSettings = {
            email: String(action.data?.email || ""),
            notifications: settings?.notifications || { farcaster: false, email: false },
          };

          setSettings(updated);
          setCachedData(settingsCacheKey, updated);
        } else {
          await fetchData();
        }
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  // Notification management
  const updateNotifications = async (notifications: {
    farcaster: boolean;
    email: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    if (!talentUUID) {
      return { success: false, message: "No talent UUID provided" };
    }

    try {
      const result = await updateNotificationSettings(
        talentUUID,
        notifications,
      );

      if (result.success) {
        setSettings((prevSettings) =>
          prevSettings
            ? { ...prevSettings, notifications }
            : { email: null, notifications },
        );
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "An error occurred",
      };
    }
  };

  useEffect(() => {
    fetchData();
  }, [talentUUID]);

  return {
    accounts,
    settings,
    humanityCredentials,
    loading,
    error,
    performAction,
    updateNotifications,
    refetch: fetchData,
  };
}
