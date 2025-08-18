import { NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

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

    const client = new NeynarAPIClient({ apiKey });
    // @ts-expect-error - listFrameNotificationTokens exists in Neynar SDK
    const response = await client.listFrameNotificationTokens();

    return NextResponse.json({
      count: response.notification_tokens?.length || 0,
      fids:
        response.notification_tokens?.map(
          (token: { fid: number }) => token.fid,
        ) || [],
      tokens: response.notification_tokens || [],
    });
  } catch (error: unknown) {
    console.error("Failed to fetch notification users:", error);
    const errorDetails =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: unknown } }).response?.data
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
