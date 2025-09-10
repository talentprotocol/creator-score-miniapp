/**
 * COOLDOWN UTILS
 *
 * Shared utility functions for calculating refresh cooldowns based on lastCalculatedAt.
 * Replaces localStorage-based cooldown with API-based cooldown for consistency.
 */

/**
 * Calculate remaining cooldown minutes from lastCalculatedAt timestamp
 * Returns null if no cooldown is active
 */
export function calculateCooldownMinutes(
  lastCalculatedAt: string | null,
): number | null {
  if (!lastCalculatedAt) return null;

  const lastRefreshTime = new Date(lastCalculatedAt).getTime();
  const currentTime = new Date().getTime();
  const oneHourInMs = 60 * 60 * 1000; // 1 hour in milliseconds
  const cooldownEndTime = lastRefreshTime + oneHourInMs;

  if (currentTime < cooldownEndTime) {
    const remainingMs = cooldownEndTime - currentTime;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return remainingMinutes;
  }

  return null;
}

/**
 * Check if a user is currently in cooldown
 */
export function isInCooldown(lastCalculatedAt: string | null): boolean {
  return calculateCooldownMinutes(lastCalculatedAt) !== null;
}

/**
 * Get button text based on cooldown state
 */
export function getRefreshButtonText(
  lastCalculatedAt: string | null,
  cooldownMinutes: number | null,
): string {
  const hasNeverCalculated = lastCalculatedAt === null;
  const isInCooldown = cooldownMinutes !== null && cooldownMinutes > 0;

  if (hasNeverCalculated) {
    return "Calculate Score";
  } else if (isInCooldown) {
    return `Refresh in ${cooldownMinutes}min`;
  } else {
    return "Refresh Score";
  }
}
