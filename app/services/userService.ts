import { talentApiClient } from "@/lib/talent-api-client";
import { getAccountSource } from "@/lib/user-resolver";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";

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

  const fetchFn = unstable_cache(
    async () => {
      try {
        const account_source = getAccountSource(identifier);
        const params =
          account_source === null
            ? { talent_protocol_id: identifier }
            : { id: identifier, account_source };

        const response = await talentApiClient.getProfile(params);

        if (!response.ok) {
          return null;
        }

        const user = await response.json();

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
    },
    [`${CACHE_KEYS.TALENT_PROFILES}-${identifier}`],
    {
      revalidate: CACHE_DURATION_10_MINUTES,
      tags: [CACHE_KEYS.TALENT_PROFILES],
    },
  );

  return fetchFn();
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
