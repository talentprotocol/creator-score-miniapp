import { talentApiClient } from "@/lib/talent-api-client";
import { getAccountSource } from "@/lib/user-resolver";
import { unstable_cache } from "next/cache";
import { CACHE_KEYS, CACHE_DURATION_10_MINUTES } from "@/lib/cache-keys";
import { dlog, dtimer } from "@/lib/debug";

/**
 * Direct service function for resolving Talent Protocol users
 * Used by server components - no HTTP requests to own API routes
 */
export async function getTalentUserService(
  identifier: string,
  options?: { username?: boolean; account_source?: "farcaster" | "wallet" },
): Promise<{
  id: string;
  fid: number | null;
  wallet: string | null;
  github: string | null;
  fname: string | null;
  display_name: string | null;
  image_url: string | null;
  [key: string]: unknown;
} | null> {
  const serviceTimer = dtimer("UserService", "getTalentUserService");

  dlog("UserService", "getTalentUserService_start", {
    identifier,
    identifier_length: identifier.length,
    identifier_type: typeof identifier,
  });

  if (!identifier) {
    dlog("UserService", "getTalentUserService_no_identifier");
    serviceTimer.end();
    return null;
  }

  const fetchFn = unstable_cache(
    async () => {
      const cacheTimer = dtimer("UserService", "cache_fetch");

      try {
        // If explicitly provided as username, prefer that path
        const explicitAccountSource = options?.account_source;
        if (options?.username) {
          const params = {
            username: identifier,
            account_source: explicitAccountSource || "farcaster",
          } as const;

          dlog("UserService", "getProfile_params", {
            identifier,
            account_source: params.account_source,
            param_kind: "username",
            derived_params: params,
            params_username: params.username,
            params_id: undefined,
            params_account_source: params.account_source,
          });

          const response = await talentApiClient.getProfile(params);

          dlog("UserService", "getProfile_response", {
            identifier,
            response_ok: response.ok,
            response_status: response.status,
            response_statusText: response.statusText,
          });

          // Log the raw response body to understand what Talent API is returning
          if (!response.ok) {
            const responseText = await response.text();
            dlog("UserService", "getProfile_error_response_body", {
              identifier,
              status: response.status,
              response_body: responseText,
            });
          }

          if (!response.ok) {
            dlog("UserService", "getProfile_non_ok_response", {
              identifier,
              status: response.status,
              statusText: response.statusText,
            });
            cacheTimer.end();
            return null;
          }

          const user = await response.json();

          dlog("UserService", "getProfile_user_data", {
            identifier,
            has_user: !!user,
            user_id: user?.id || null,
            user_fid: user?.fid || null,
            user_wallet: user?.wallet || null,
            user_fname: user?.fname || null,
            user_github: user?.github || null,
            has_required_fields: !!(
              user &&
              (user.fid || user.wallet || user.github || user.id)
            ),
          });

          // Log the full response to understand what Talent API returns
          dlog("UserService", "getProfile_full_response", {
            identifier,
            response_data: user,
            response_keys: user ? Object.keys(user) : [],
          });

          if (user && (user.fid || user.wallet || user.github || user.id)) {
            const result = {
              id: user.id || null,
              fid: user.fid ?? null,
              wallet: user.wallet ?? null,
              github: user.github ?? null,
              fname: user.fname ?? null,
              display_name: user.display_name ?? null,
              image_url: user.image_url ?? null,
              ...user,
            };

            dlog("UserService", "getProfile_success", {
              identifier,
              result_id: result.id,
              result_fname: result.fname,
              result_wallet: result.wallet,
            });

            cacheTimer.end();
            return result;
          }

          dlog("UserService", "getProfile_no_valid_user_data", {
            identifier,
            user_exists: !!user,
            user_keys: user ? Object.keys(user) : [],
          });

          cacheTimer.end();
          return null;
        }

        const account_source = getAccountSource(identifier);
        const params =
          account_source === null
            ? { talent_protocol_id: identifier }
            : account_source === "farcaster"
              ? { username: identifier, account_source }
              : { id: identifier, account_source };

        dlog("UserService", "getProfile_params", {
          identifier,
          account_source,
          param_kind:
            account_source === null
              ? "talent_protocol_id"
              : account_source === "farcaster"
                ? "username"
                : "id",
          derived_params: params,
          params_username: params.username,
          params_id: params.id,
          params_account_source: params.account_source,
        });

        const response = await talentApiClient.getProfile(params);

        dlog("UserService", "getProfile_response", {
          identifier,
          response_ok: response.ok,
          response_status: response.status,
          response_statusText: response.statusText,
        });

        // Log the raw response body to understand what Talent API is returning
        if (!response.ok) {
          const responseText = await response.text();
          dlog("UserService", "getProfile_error_response_body", {
            identifier,
            status: response.status,
            response_body: responseText,
          });
        }

        if (!response.ok) {
          dlog("UserService", "getProfile_non_ok_response", {
            identifier,
            status: response.status,
            statusText: response.statusText,
          });
          cacheTimer.end();
          return null;
        }

        const user = await response.json();

        dlog("UserService", "getProfile_user_data", {
          identifier,
          has_user: !!user,
          user_id: user?.id || null,
          user_fid: user?.fid || null,
          user_wallet: user?.wallet || null,
          user_fname: user?.fname || null,
          user_github: user?.github || null,
          has_required_fields: !!(
            user &&
            (user.fid || user.wallet || user.github || user.id)
          ),
        });

        // Log the full response to understand what Talent API returns
        dlog("UserService", "getProfile_full_response", {
          identifier,
          response_data: user,
          response_keys: user ? Object.keys(user) : [],
        });

        if (user && (user.fid || user.wallet || user.github || user.id)) {
          const result = {
            id: user.id || null,
            fid: user.fid ?? null,
            wallet: user.wallet ?? null,
            github: user.github ?? null,
            fname: user.fname ?? null,
            display_name: user.display_name ?? null,
            image_url: user.image_url ?? null,
            ...user,
          };

          dlog("UserService", "getProfile_success", {
            identifier,
            result_id: result.id,
            result_fname: result.fname,
            result_wallet: result.wallet,
          });

          cacheTimer.end();
          return result;
        }

        dlog("UserService", "getProfile_no_valid_user_data", {
          identifier,
          user_exists: !!user,
          user_keys: user ? Object.keys(user) : [],
        });

        cacheTimer.end();
        return null;
      } catch (error) {
        dlog("UserService", "getProfile_error", {
          identifier,
          error: error instanceof Error ? error.message : String(error),
          error_type:
            error instanceof Error ? error.constructor.name : typeof error,
        });
        cacheTimer.end();
        return null;
      }
    },
    [`${CACHE_KEYS.TALENT_PROFILES}-${identifier}`],
    {
      revalidate: CACHE_DURATION_10_MINUTES,
      tags: [CACHE_KEYS.TALENT_PROFILES],
    },
  );

  const result = await fetchFn();

  dlog("UserService", "getTalentUserService_result", {
    identifier,
    result_found: !!result,
    result_id: result?.id || null,
    result_fname: result?.fname || null,
  });

  serviceTimer.end();
  return result;
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
