import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Check authorization
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  if (token !== process.env.ADMIN_API_TOKEN) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEYNAR_API_KEY not set" },
        { status: 500 },
      );
    }

    const appFid = process.env.NEYNAR_APP_FID;
    const baseUrl = "https://api.neynar.com/v2/farcaster/frame/notification_tokens/";

    const allTokens: Array<{ fid: number; token?: string; enabled?: boolean }> = [];
    let cursor: string | undefined = undefined;

    // Paginate defensively: support different possible pagination keys
    for (let page = 0; page < 50; page++) {
      const url = new URL(baseUrl);
      if (appFid) url.searchParams.set("app_fid", appFid);
      if (cursor) url.searchParams.set("cursor", cursor);
      // Use max allowed limit per Neynar docs
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        // In case edge runtimes differ, keep it simple
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { error: "Failed to fetch users", details: text || res.statusText },
          { status: 500 },
        );
      }

      const json = (await res.json()) as unknown as {
        notification_tokens?: Array<{ fid: number; token?: string; enabled?: boolean }>;
        next?: string | { cursor?: string };
        cursor?: string;
      };

      const tokens = json.notification_tokens || [];
      allTokens.push(...tokens);

      // Extract next cursor from any of the common fields
      const nextVal = (json as { next?: string | { cursor?: string } })?.next;
      if (typeof nextVal === "string") {
        cursor = nextVal;
      } else if (nextVal && typeof nextVal === "object" && "cursor" in nextVal) {
        cursor = (nextVal as { cursor?: string }).cursor;
      } else if (typeof json.cursor === "string") {
        cursor = json.cursor;
      } else {
        cursor = undefined;
      }

      if (!cursor) break;
    }

    return NextResponse.json({
      count: allTokens.length,
      fids: allTokens.map((t) => t.fid),
      tokens: allTokens,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch notification users:", error);
    const errorDetails =
      error && typeof error === "object" && "message" in error
        ? (error as { message?: string }).message
        : String(error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: errorDetails,
      },
      { status: 500 },
    );
  }
}
