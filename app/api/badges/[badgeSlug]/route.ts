import { NextResponse } from "next/server";
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
 * Returns detailed information for a specific dynamic badge, including its current state,
 * progress, levelLabel, description, and artwork URL for the current user.
 *
 * Path Parameters:
 * - badgeSlug: The badge family identifier (e.g., "creator-score", "total-earnings")
 *
 * Authentication: Same as /api/badges (Farcaster context with development fallback)
 *
 * Response: Single DynamicBadge object with computed state and progress
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

    // For now, just get the first badge from the main badges response
    const badgesData = await import("@/app/services/badgesService").then((m) =>
      m.getBadgesForUser(talentUuid)(),
    );

    // Find the badge by slug
    let badge = null;
    if (badgesData.sections) {
      // Search in sections
      for (const section of badgesData.sections) {
        badge = section.badges.find((b) => b.badgeSlug === badgeSlug);
        if (badge) break;
      }
    } else if (badgesData.badges) {
      // Search in flat badge array
      badge = badgesData.badges.find((b) => b.badgeSlug === badgeSlug);
    }

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
