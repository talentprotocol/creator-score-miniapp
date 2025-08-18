import { NextResponse } from "next/server";
import { getBadgesForUser } from "@/app/services/badgesService";
import { resolveTalentUser } from "@/lib/user-resolver";
import { getUserContext } from "@/lib/user-context";

/**
 * GET /api/badges
 *
 * Returns all badge sections with computed badge states for the current user.
 * Each badge includes its current state (earned/locked), progress percentage,
 * value labels, and artwork URLs.
 *
 * Authentication:
 * - Production: Uses Farcaster context from MiniApp headers
 * - Development: Falls back to default Talent Protocol user for testing
 * - Optional: Accepts ?userId query param for development/testing
 *
 * Response format:
 * {
 *   sections: [{ id, title, badges: [...] }],
 *   summary: { totalCount, earnedCount, completionPct }
 * }
 */
export async function GET(request: Request) {
  try {
    console.log("[GET /api/badges] Request received");
    
    // Get Farcaster context from headers (for MiniApp) or fallback
    const context = getUserContext(null); // In real usage, this would get actual context
    console.log("[GET /api/badges] Context:", context);

    // Parse URL to check for development parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");
    console.log("[GET /api/badges] userIdParam:", userIdParam);

    let talentUuid: string | null = null;

    // User resolution priority order:
    if (userIdParam) {
      // 1. Direct UUID provided for development/testing via ?userId=<uuid>
      talentUuid = userIdParam;
      console.log("[GET /api/badges] Using userIdParam:", talentUuid);
    } else if (context?.fid) {
      // 2. Resolve from Farcaster context (production MiniApp usage)
      console.log("[GET /api/badges] Resolving from Farcaster context:", context.fid);
      const user = await resolveTalentUser(String(context.fid));
      talentUuid = user?.id || null;
      console.log("[GET /api/badges] Resolved user:", user);
    } else if (process.env.NODE_ENV === "development") {
      // 3. Development fallback: use Talent Protocol default user for local testing
      talentUuid = "bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"; // @macedo
      console.log("[GET /api/badges] Using development fallback:", talentUuid);
    }

    console.log("[GET /api/badges] Final talentUuid:", talentUuid);

    // Ensure we have a valid user to fetch badges for
    if (!talentUuid) {
      console.log("[GET /api/badges] No talentUuid found, returning 404");
      return NextResponse.json(
        { error: "User not found or not authenticated" },
        { status: 404 },
      );
    }

    console.log("[GET /api/badges] Calling getBadgesForUser with:", talentUuid);
    
    // Fetch computed badge data from service layer
    // This includes all badge states, progress calculations, and artwork URLs
    const badges = await getBadgesForUser(talentUuid);
    
    console.log("[GET /api/badges] Badges fetched successfully, count:", badges.sections.length);

    return NextResponse.json(badges);
  } catch (error) {
    console.error("[GET /api/badges] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 },
    );
  }
}
