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

    // Fetch notification tokens from Neynar
    // Using the correct endpoint from Neynar docs
    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/frame/notification_tokens",
      {
        headers: {
          "api_key": neynarApiKey,
        },
      },
    );

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
    console.log("Neynar API response:", JSON.stringify(data, null, 2));
    
    // Handle different possible response structures from Neynar
    let tokens = [];
    if (data.tokens) {
      tokens = data.tokens;
    } else if (data.notification_tokens) {
      tokens = data.notification_tokens;
    } else if (Array.isArray(data)) {
      tokens = data;
    }
    
    // Extract FIDs from the tokens
    interface NeynarToken {
      fid: number;
      token?: string;
      enabled?: boolean;
    }
    
    const fids = tokens.map((token: NeynarToken) => token.fid) || [];
    
    return NextResponse.json({
      count: fids.length,
      fids: fids,
      tokens: tokens,
    });
  } catch (error) {
    console.error("Error fetching notification users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
