import { detectClient } from "./utils";

/**
 * Farcaster notification utilities
 * Handles checking notification preferences and triggering the enable notifications modal
 */

export interface FarcasterNotificationState {
  isEnabled: boolean;
  isSupported: boolean;
}

/**
 * Check if Farcaster notifications are currently enabled
 * This checks the browser's notification permission state
 */
export function checkFarcasterNotificationState(): FarcasterNotificationState {
  const client = detectClient();

  if (client !== "farcaster") {
    return {
      isEnabled: false,
      isSupported: false,
    };
  }

  // Check if notifications are supported
  if (!("Notification" in window)) {
    return {
      isEnabled: false,
      isSupported: false,
    };
  }

  // Check current permission state
  const permission = Notification.permission;

  return {
    isEnabled: permission === "granted",
    isSupported: true,
  };
}

/**
 * Trigger the Farcaster enable notifications modal
 * This sends a postMessage to the parent frame to show the native modal
 */
export async function triggerFarcasterNotificationModal(): Promise<boolean> {
  const client = detectClient();

  if (client !== "farcaster") {
    console.log("Not in Farcaster environment, skipping notification modal");
    return false;
  }

  try {
    // Send postMessage to trigger the native Farcaster notification modal
    window.parent.postMessage(
      {
        type: "enableNotifications",
      },
      "*",
    );

    console.log("Farcaster notification modal triggered");
    return true;
  } catch (error) {
    console.error("Error triggering Farcaster notification modal:", error);
    return false;
  }
}

/**
 * Listen for notification permission changes
 * Returns a cleanup function to remove the listener
 */
export function listenForNotificationChanges(
  callback: (state: FarcasterNotificationState) => void,
): () => void {
  const handlePermissionChange = () => {
    const state = checkFarcasterNotificationState();
    callback(state);
  };

  // Listen for permission changes using window events
  window.addEventListener("focus", handlePermissionChange);

  // Also check on visibility change
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      handlePermissionChange();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Return cleanup function
  return () => {
    window.removeEventListener("focus", handlePermissionChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
