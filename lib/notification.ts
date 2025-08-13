import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { getCachedData, setCachedData } from "./utils";

const notificationServiceKey =
  process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ?? "minikit";

function getUserNotificationDetailsKey(fid: number): string {
  return `cache:${notificationServiceKey}:user:${fid}`;
}

export async function getUserNotificationDetails(
  fid: number,
): Promise<FrameNotificationDetails | null> {
  return getCachedData<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid),
    60 * 60 * 1000, // 1 hour TTL to match previous behavior
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails,
): Promise<void> {
  setCachedData(getUserNotificationDetailsKey(fid), notificationDetails);
}

export async function deleteUserNotificationDetails(
  fid: number,
): Promise<void> {
  const key = getUserNotificationDetailsKey(fid);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // no-op
    }
  }
}
