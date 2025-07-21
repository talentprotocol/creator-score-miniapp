import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { getCachedData, setCachedData, clearCache } from "./redis";

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
  clearCache(getUserNotificationDetailsKey(fid));
}
