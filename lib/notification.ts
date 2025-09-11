/* eslint-disable @typescript-eslint/no-unused-vars */
import type { FrameNotificationDetails } from "@farcaster/frame-sdk";

export async function getUserNotificationDetails(
  _fid: number,
): Promise<FrameNotificationDetails | null> {
  // Return null - no client-side caching
  return null;
}

export async function setUserNotificationDetails(
  _fid: number,
  _notificationDetails: FrameNotificationDetails,
): Promise<void> {
  // No-op - no client-side caching
}

export async function deleteUserNotificationDetails(
  _fid: number,
): Promise<void> {
  // No-op - no client-side caching
}
