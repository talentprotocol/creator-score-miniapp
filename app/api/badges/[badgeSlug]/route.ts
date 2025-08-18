import { NextResponse } from "next/server";
import { getBadgeDetail } from "@/app/services/badgesService";
import { resolveTalentUser } from "@/lib/user-resolver";
import { getUserContext } from "@/lib/user-context";

interface RouteParams {
  params: {
    badgeSlug: string;
  };
}

/**
 * GET /api/badges/[badgeSlug]
 *
 * Returns detailed information for a specific badge, including its state,
 * progress, value label, description, and artwork URLs for the current user.
 *
 * Path Parameters:
 * - badgeSlug: The unique identifier for the badge (e.g., "creator-score-level-3")
 *
 * Authentication: Same as /api/badges (Farcaster context with development fallback)
 *
 * Response: Single BadgeState object with computed state and progress
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { badgeSlug } = params;

    // Validate required path parameter
    if (!badgeSlug) {
      return NextResponse.json(
        { error: "Badge slug is required" },
        { status: 400 },
      );
    }

    // Get Farcaster context from headers (for MiniApp) or Privy or fallback
    const context = getUserContext(null); // In real usage, this would get actual context

    // Parse URL to check for development parameters
    const url = new URL(request.url);
    const talentUuidParam = url.searchParams.get("talentUuid");

    let talentUuid: string | null = null;

    if (talentUuidParam) {
      // Direct UUID provided for development/testing
      talentUuid = talentUuidParam;
    } else if (context?.fid) {
      // Resolve from Farcaster context
      const user = await resolveTalentUser(String(context.fid));
      talentUuid = user?.id || null;
    } else if (process.env.NODE_ENV === "development") {
      // Development fallback: use a default user for testing
      talentUuid = "bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"; // @macedo
    }

    if (!talentUuid) {
      return NextResponse.json(
        { error: "User not found or not authenticated" },
        { status: 404 },
      );
    }

    const badge = await getBadgeDetail(talentUuid, badgeSlug);

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json(badge);
  } catch (error) {
    console.error(`[GET /api/badges/${params.badgeSlug}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch badge details" },
      { status: 500 },
    );
  }
}
