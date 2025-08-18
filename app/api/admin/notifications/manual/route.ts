import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized("Missing Bearer token");
  }
  
  const token = authHeader.slice("Bearer ".length).trim();
  
  // Check if it's the old admin token (temporary backward compatibility)
  if (token === process.env.ADMIN_API_TOKEN) {
    // Legacy admin token access - allow but log for security
    console.warn("Admin access via legacy token - consider upgrading to proper auth");
  } else {
    // Check if it's a Talent UUID for proper admin verification
    if (!ADMIN_UUIDS.includes(token)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const {
    title,
    body: message,
    targetUrl,
    fids,
    dryRun = true,
    limit,
  } = body;

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
        // Fetch user count from the users API
        const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/admin/notifications/users`, {
          headers: {
            'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '') || ''}`,
          },
        });
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          audienceSize = usersData.count || 0;
          fidsPreview = (usersData.fids || []).slice(0, 20);
        }
      } catch (error) {
        console.error('Error fetching user count for dry run:', error);
        // Fallback to 0 if we can't fetch the count
        audienceSize = 0;
        fidsPreview = [];
      }
    }
    
    return NextResponse.json({
      state: "dry_run",
      audienceSize,
      fidsPreview,
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
          },
        });
        ph.shutdown();

        await supabase.from("notification_runs").insert({
          campaign: "screen_studio",
          title,
          body: message,
          target_url: absoluteTarget,
          audience_size: -1, // -1 indicates "all users"
          success_count: -1,
          failed_count: 0,
          failed_fids: [],
          dry_run: false,
        });
      } catch (auditError) {
        console.error("Failed to log notification audit:", auditError);
      }

      return NextResponse.json({
        state: "sent_to_all",
        message: "Notification sent to all users with notifications enabled",
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
