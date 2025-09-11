// Shared user/account resolver logic for Talent Protocol users
import { getPublicBaseUrl } from "./constants";
import { getCachedData, setCachedData, CACHE_DURATIONS } from "./utils";
import { validateTalentUUID } from "./validation";

// In-flight request tracking to prevent duplicate concurrent calls
const inFlightRequests = new Map<number, Promise<string | null>>();
const inFlightTalentUserRequests = new Map<
  string,
  Promise<{
    id: string | null;
    fid: number | null;
    wallet: string | null;
    github: string | null;
    fname: string | null;
    display_name: string | null;
    image_url: string | null;
    [key: string]: unknown;
  } | null>
>();

export function getAccountSource(id: string): "wallet" | "farcaster" | null {
  if (id.startsWith("0x") && id.length === 42) return "wallet";
  // Farcaster usernames: 1-32 chars, lowercase, alphanumeric, may include . or -
  if (/^[a-z0-9][a-z0-9\-\.]{0,31}$/.test(id)) return "farcaster";
  // UUID or unknown: return null to omit account_source
  return null;
}

/**
 * Resolves a Farcaster FID to a Talent Protocol UUID
 * This is used for navigation to ensure we always use the canonical Talent UUID
 */
export async function resolveFidToTalentUuid(
  fid: number,
): Promise<string | null> {
  const cacheKey = `fid_to_talent_uuid_${fid}`;

  // Check cache first
  const cachedUuid = getCachedData<string>(
    cacheKey,
    CACHE_DURATIONS.PROFILE_DATA,
  );
  if (cachedUuid !== null) {
    return cachedUuid;
  }

  // Check if there's already a request in flight for this FID
  if (inFlightRequests.has(fid)) {
    return inFlightRequests.get(fid)!;
  }

  // Create the request promise
  const requestPromise = performFidRequest(fid, cacheKey);

  // Store it in the in-flight map
  inFlightRequests.set(fid, requestPromise);

  // Clean up when done
  requestPromise.finally(() => {
    inFlightRequests.delete(fid);
  });

  return requestPromise;
}

async function performFidRequest(
  fid: number,
  cacheKey: string,
): Promise<string | null> {
  let baseUrl = "";
  if (typeof window === "undefined") {
    baseUrl = getPublicBaseUrl();
  }

  try {
    const apiUrl = `${baseUrl}/api/talent-user?id=${fid}`;
    const res = await fetch(apiUrl);

    if (res.ok) {
      const user = await res.json();
      if (user && user.id) {
        // Cache the result
        setCachedData(cacheKey, user.id);
        return user.id;
      }
    }
  } catch (error) {
    console.error("[resolveFidToTalentUuid] Error:", error);
  }

  // Cache null result to prevent repeated failed requests
  setCachedData(cacheKey, null);
  return null;
}

/**
 * Resolves a Talent Protocol user identifier (Farcaster username, wallet address, or UUID) to a user object.
 * Always calls /api/talent-user?id=identifier and lets the API route determine account_source.
 * Returns { id, fid, fname, github, wallet, ... } or null if not found.
 */
export async function resolveTalentUser(identifier: string): Promise<{
  id: string | null;
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  [key: string]: unknown;
} | null> {
  if (!validateTalentUUID(identifier)) {
    return null;
  }

  // Check if there's already a request in flight for this identifier
  if (inFlightTalentUserRequests.has(identifier)) {
    return inFlightTalentUserRequests.get(identifier)!;
  }

  // Create the request promise
  const requestPromise = performTalentUserRequest(identifier);

  // Store it in the in-flight map
  inFlightTalentUserRequests.set(identifier, requestPromise);

  // Clean up when done
  requestPromise.finally(() => {
    inFlightTalentUserRequests.delete(identifier);
  });

  return requestPromise;
}

async function performTalentUserRequest(identifier: string): Promise<{
  id: string | null;
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  [key: string]: unknown;
} | null> {
  let baseUrl = "";
  if (typeof window === "undefined") {
    baseUrl = getPublicBaseUrl();
  }

  // Add retry logic for server-side calls
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const apiUrl = `${baseUrl}/api/talent-user?id=${identifier}`;
      const res = await fetch(apiUrl);

      if (res.ok) {
        const user = await res.json();

        // Accept if any identifier is present
        if (user && (user.fid || user.wallet || user.github || user.id)) {
          return {
            id: user.id || null,
            fid: user.fid ?? null,
            wallet: user.wallet ?? null,
            github: user.github ?? null,
            fname: user.fname ?? null,
            display_name: user.display_name ?? null,
            image_url: user.image_url ?? null,
            ...user,
          };
        }
      }

      // If we get here, the response was not ok or user data was invalid
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 100));
      }
    }
  }

  console.error(
    `[resolveTalentUser] All attempts failed for identifier "${identifier}":`,
    lastError?.message,
  );
  return null;
}
