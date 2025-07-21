import { talentApiClient } from "@/lib/talent-api-client";
import { getAccountSource } from "@/lib/user-resolver";

/**
 * Direct service function for resolving Talent Protocol users
 * Used by server components - no HTTP requests to own API routes
 */
export async function getTalentUserService(identifier: string): Promise<{
  id: string | null;
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  [key: string]: unknown;
} | null> {
  if (!identifier) {
    return null;
  }

  try {
    const account_source = getAccountSource(identifier);

    // Call Talent API directly using the client
    // For UUIDs, use talent_protocol_id to avoid account_source logic
    const params =
      account_source === null
        ? { talent_protocol_id: identifier }
        : { id: identifier, account_source };

    const response = await talentApiClient.getProfile(params);

    if (!response.ok) {
      return null;
    }

    const user = await response.json();

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

    return null;
  } catch (error) {
    console.error(
      `[getTalentUserService] Error resolving identifier "${identifier}":`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Direct service function for resolving Farcaster FID to Talent Protocol UUID
 * Used for navigation to ensure we always use the canonical Talent UUID
 */
export async function resolveFidToTalentUuidService(
  fid: number,
): Promise<string | null> {
  try {
    const user = await getTalentUserService(fid.toString());
    return user?.id || null;
  } catch (error) {
    console.error("[resolveFidToTalentUuidService] Error:", error);
    return null;
  }
}
