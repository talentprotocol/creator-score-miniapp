import { NextRequest, NextResponse } from "next/server";

// Admin UUIDs - hardcoded for security
const ADMIN_UUIDS = ["bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"];

export async function GET(request: NextRequest) {
  // First check Bearer token for backward compatibility
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Check if it's the old admin token (temporary backward compatibility)
  if (token === process.env.ADMIN_API_TOKEN) {
    // Legacy admin token access - allow but log for security
    console.warn(
      "Admin access via legacy token - consider upgrading to proper auth",
    );
  } else {
    // Check if it's a Talent UUID for proper admin verification
    if (!ADMIN_UUIDS.includes(token)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }
  }

  try {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Fetch ALL notification tokens from Neynar with pagination
    let allTokens: any[] = [];
    let cursor: string | null = null;
    let hasMore = true;
    
    while (hasMore) {
      const url = new URL("https://api.neynar.com/v2/farcaster/frame/notification_tokens");
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          api_key: neynarApiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Neynar API error:", response.status, errorData);
        return NextResponse.json(
          {
            error: "Failed to fetch from Neynar",
            details: errorData,
            status: response.status,
          },
          { status: 500 },
        );
      }

      const data = await response.json();
      console.log(`Neynar API response (cursor: ${cursor || 'initial'}):`, JSON.stringify(data, null, 2));
      
      // Handle different possible response structures from Neynar
      let tokens = [];
      if (data.tokens) {
        tokens = data.tokens;
      } else if (data.notification_tokens) {
        tokens = data.notification_tokens;
      } else if (Array.isArray(data)) {
        tokens = data;
      }
      
      allTokens = allTokens.concat(tokens);
      
      // Check if there are more pages
      if (data.next && data.next.cursor) {
        cursor = data.next.cursor;
      } else {
        hasMore = false;
      }
      
      // Safety check to prevent infinite loops
      if (allTokens.length > 1000) {
        console.warn("Reached 1000 users limit, stopping pagination");
        break;
      }
    }
    
    console.log(`Total users fetched: ${allTokens.length}`);
    
    // Extract FIDs from the tokens
    interface NeynarToken {
      fid: number;
      token?: string;
      enabled?: boolean;
    }
    
    const fids = allTokens.map((token: NeynarToken) => token.fid) || [];
    
    return NextResponse.json({
      count: fids.length,
      fids: fids,
      tokens: allTokens,
    });
  } catch (error) {
    console.error("Error fetching notification users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
