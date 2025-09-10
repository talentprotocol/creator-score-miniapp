import "server-only";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_30_MINUTES } from "@/lib/cache-keys";
import { SCORER_SLUGS } from "@/lib/types";
import type { IssuerCredentialGroup, CredentialsResponse } from "@/lib/types";
import { groupCredentialsByIssuer } from "@/lib/credential-utils";

/**
 * SERVER-SIDE ONLY: Internal function to fetch credentials for a Talent Protocol ID
 * This function should only be called from server-side code (layouts, API routes)
 */
async function getCredentialsForTalentIdInternal(
  talentId: string | number,
): Promise<IssuerCredentialGroup[]> {
  try {
    // Server-side: call Talent API directly
    const { talentApiClient } = await import("@/lib/talent-api-client");
    const params = {
      talent_protocol_id: String(talentId),
      scorer_slug: SCORER_SLUGS.CREATOR,
    };
    const response = await talentApiClient.getCredentials(params);
    if (!response.ok) return [];

    const data: CredentialsResponse | { error: string } = await response.json();

    if ("error" in data) {
      return [];
    }

    if (!Array.isArray(data.credentials)) {
      return [];
    }

    // Use shared grouping logic
    return groupCredentialsByIssuer(data.credentials);
  } catch {
    return [];
  }
}

/**
 * SERVER-SIDE ONLY: Cached version of getCredentialsForTalentId
 * This function should only be called from server-side code (layouts, API routes)
 * Uses proper caching as required by coding principles
 */
export function getCredentialsForTalentId(talentId: string | number) {
  return unstable_cache(
    async () => getCredentialsForTalentIdInternal(talentId),
    [`${CACHE_KEYS.CREDENTIALS}-${talentId}`],
    {
      tags: [`${CACHE_KEYS.CREDENTIALS}-${talentId}`, CACHE_KEYS.CREDENTIALS],
      revalidate: CACHE_DURATION_30_MINUTES,
    },
  );
}
