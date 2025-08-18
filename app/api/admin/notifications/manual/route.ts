import { NextRequest, NextResponse } from "next/server";

// Define the Neynar token interface
interface NeynarToken {
  fid: number;
  token?: string;
  enabled?: boolean;
  object?: string;
  url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Admin UUIDs - hardcoded for security
const ADMIN_UUIDS = ["bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"];

type RequestBody = {
  title: string;
  body: string;
  targetUrl: string; // may be relative (e.g., /home?perk=screen-studio)
  fids: number[];
  dryRun?: boolean;
  limit?: number;
  testingMode?: boolean; // when true, restrict to only FID 8446
};

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized("Missing Bearer token");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  // Check if it's a Talent UUID for admin verification
  if (!ADMIN_UUIDS.includes(token)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { title, body: message, targetUrl, fids, dryRun = true, limit } = body;

  if (!title || !message || !targetUrl || !Array.isArray(fids)) {
    return badRequest("Required fields: title, body, targetUrl, fids[]");
  }
  if (title.length > 32) {
    return badRequest("Title must be <= 32 characters");
  }
  if (message.length > 128) {
    return badRequest("Body must be <= 128 characters");
  }

  // Validate target URL: allow relative paths, or absolute matching the PROD base.
  // Use NOTIFICATION_BASE_URL if provided; otherwise default to prod domain to avoid localhost in previews.
  const notifBaseUrl =
    process.env.NOTIFICATION_BASE_URL || "https://www.creatorscore.app";
  let isValidTarget = false;
  try {
    if (targetUrl.startsWith("/")) {
      isValidTarget = true;
    } else {
      const u = new URL(targetUrl);
      const b = new URL(notifBaseUrl);
      isValidTarget = u.host === b.host && u.protocol === b.protocol;
    }
  } catch {
    // If parsing fails and it's not a relative path
    isValidTarget = targetUrl.startsWith("/");
  }
  if (!isValidTarget) {
    return badRequest(
      "targetUrl must be a relative path or an absolute URL on the app's domain",
    );
  }

  // Handle "all" FIDs case
  let targetFids = fids;
  if (fids.length === 0) {
    // Empty array means send to all users with notifications enabled
    targetFids = [];
  }

  const filteredFids = targetFids.filter((n) => Number.isInteger(n) && n > 0);

  const limitedFids =
    typeof limit === "number" && limit > 0
      ? filteredFids.slice(0, limit)
      : filteredFids;

  // Construct absolute target URL for preview
  const absoluteTarget = targetUrl.startsWith("/")
    ? new URL(targetUrl, notifBaseUrl).toString()
    : targetUrl;

  // Dry-run: return preview and audience only; DO NOT SEND
  if (dryRun) {
    let audienceSize = limitedFids.length;
    let fidsPreview = limitedFids.slice(0, 20);

    // If sending to all users, fetch the actual count
    if (fids.length === 0) {
      try {
        // Use the same Neynar API call as the live send for consistency
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        if (!neynarApiKey) {
          throw new Error("NEYNAR_API_KEY not set");
        }

        // Fetch the actual count of users with notifications enabled
        let allTokens: NeynarToken[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
          const url = new URL(
            "https://api.neynar.com/v2/farcaster/frame/notification_tokens",
          );
          if (cursor) {
            url.searchParams.set("cursor", cursor);
          }

          const response = await fetch(url.toString(), {
            headers: {
              api_key: neynarApiKey,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch notification tokens: ${response.statusText}`,
            );
          }

          const data = await response.json();

          let tokens: NeynarToken[] = [];
          if (data.tokens) {
            tokens = data.tokens;
          } else if (data.notification_tokens) {
            tokens = data.notification_tokens;
          } else if (Array.isArray(data)) {
            tokens = data;
          }

          allTokens = allTokens.concat(tokens);

          if (data.next && data.next.cursor) {
            cursor = data.next.cursor;
          } else {
            hasMore = false;
          }

          if (allTokens.length > 1000) {
            // Safety check
            console.warn("Reached 1000 users limit, stopping pagination");
            break;
          }
        }

        audienceSize = allTokens.length;
        fidsPreview = allTokens
          .slice(0, 20)
          .map((token: NeynarToken) => token.fid);
        console.log(
          `Dry run: Actual users with notifications enabled: ${audienceSize}`,
        );
      } catch (error) {
        console.error("Error fetching user count for dry run:", error);
        // Fallback to 0 if we can't fetch the count
        audienceSize = 0;
        fidsPreview = [];
      }
    }

    return NextResponse.json({
      state: "dry_run",
      audienceSize,
      fidsPreview,
      message:
        fids.length === 0
          ? `Preview: Would send to ${audienceSize} users with notifications enabled (showing first 20 FIDs)`
          : `Preview: Would send to ${audienceSize} specific users (showing first 20 FIDs)`,
      payloadPreview: {
        title,
        body: message,
        targetUrl: absoluteTarget,
      },
    });
  }

  // Live send via Neynar
  try {
    const { NeynarAPIClient } = await import("@neynar/nodejs-sdk");
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not set" },
        { status: 500 },
      );

    const client = new NeynarAPIClient({ apiKey });

    // If sending to all users, use empty targetFids
    if (targetFids.length === 0) {
      // First, get the actual count of users with notifications enabled
      let actualUserCount = 0;
      try {
        const neynarApiKey = process.env.NEYNAR_API_KEY;
        if (!neynarApiKey) {
          throw new Error("NEYNAR_API_KEY not set");
        }

        // Fetch the actual count of users with notifications enabled
        let allTokens: NeynarToken[] = [];
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
          const url = new URL(
            "https://api.neynar.com/v2/farcaster/frame/notification_tokens",
          );
          if (cursor) {
            url.searchParams.set("cursor", cursor);
          }

          const response = await fetch(url.toString(), {
            headers: {
              api_key: neynarApiKey,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch notification tokens: ${response.statusText}`,
            );
          }

          const data = await response.json();

          let tokens: NeynarToken[] = [];
          if (data.tokens) {
            tokens = data.tokens;
          } else if (data.notification_tokens) {
            tokens = data.notification_tokens;
          } else if (Array.isArray(data)) {
            tokens = data;
          }

          allTokens = allTokens.concat(tokens);

          if (data.next && data.next.cursor) {
            cursor = data.next.cursor;
          } else {
            hasMore = false;
          }

          if (allTokens.length > 1000) {
            // Safety check
            console.warn("Reached 1000 users limit, stopping pagination");
            break;
          }
        }

        actualUserCount = allTokens.length;
        console.log(
          `Actual users with notifications enabled: ${actualUserCount}`,
        );
      } catch (countError) {
        console.error("Failed to get actual user count:", countError);
        // Fallback to -1 if we can't get the count
        actualUserCount = -1;
      }

      const response = await client.publishFrameNotifications({
        targetFids: [], // This sends to ALL users with notifications enabled
        notification: {
          title,
          body: message,
          target_url: absoluteTarget,
        },
      });

      // Log success
      try {
        const { supabase } = await import("@/lib/supabase-client");
        const { default: PostHogClient } = await import("@/lib/posthog");
        const ph = PostHogClient();
        ph.capture({
          distinctId: "admin",
          event: "notifications_sent_to_all",
          properties: {
            campaign: "screen_studio",
            title,
            body: message,
            target_url: absoluteTarget,
            actual_user_count: actualUserCount,
          },
        });
        ph.shutdown();

        await supabase.from("notification_runs").insert({
          campaign: "screen_studio",
          title,
          body: message,
          target_url: absoluteTarget,
          audience_size: actualUserCount, // Use actual count instead of -1
          success_count: actualUserCount, // Use actual count instead of -1
          failed_count: 0,
          failed_fids: [],
          dry_run: false,
        });
      } catch (auditError) {
        console.error("Failed to log notification audit:", auditError);
      }

      return NextResponse.json({
        state: "sent_to_all",
        message: `Notification sent to ${actualUserCount} users with notifications enabled`,
        actualUserCount,
        response,
      });
    }

    const batches: number[][] = [];
    for (let i = 0; i < limitedFids.length; i += 100) {
      batches.push(limitedFids.slice(i, i + 100));
    }

    const results = [] as Array<{
      batchSize: number;
      ok: boolean;
      error?: string;
    }>;
    // Note: Neynar expects a valid UUID if provided. We'll omit it to avoid format issues.

    for (let idx = 0; idx < batches.length; idx++) {
      const batch = batches[idx];
      try {
        await client.publishFrameNotifications({
          targetFids: batch,
          notification: {
            title,
            body: message,
            target_url: absoluteTarget,
          },
        });
        results.push({ batchSize: batch.length, ok: true });
        // Small delay to avoid potential rate limits
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        const err = e as unknown as { response?: { data?: unknown } };
        const details = err?.response?.data;
        const message = e instanceof Error ? e.message : String(e);
        results.push({
          batchSize: batch.length,
          ok: false,
          error: details ? JSON.stringify(details) : message,
        });
      }
    }

    const successCount = results
      .filter((r) => r.ok)
      .reduce((s, r) => s + r.batchSize, 0);
    const failedCount = limitedFids.length - successCount;
    // PostHog + Supabase audit (best-effort)
    try {
      const { supabase } = await import("@/lib/supabase-client");
      const { default: PostHogClient } = await import("@/lib/posthog");
      const ph = PostHogClient();
      ph.capture({
        distinctId: "admin",
        event: "notifications_sent",
        properties: {
          campaign: "screen_studio",
          audience_size: limitedFids.length,
          success_count: successCount,
          failed_count: failedCount,
          batches: results.length,
        },
      });
      ph.shutdown();
      await supabase.from("notification_runs").insert({
        campaign: "screen_studio",
        title,
        body: message,
        target_url: absoluteTarget,
        audience_size: limitedFids.length,
        success_count: successCount,
        failed_count: failedCount,
        failed_fids: results.filter((r) => !r.ok),
        dry_run: false,
      });
    } catch {}

    return NextResponse.json({
      state: "sent",
      batches: results.length,
      successCount,
      failedCount,
      results,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
