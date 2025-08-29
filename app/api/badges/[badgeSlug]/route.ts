import { NextResponse } from "next/server";
import { getBadgesForUser } from "@/app/services/badgesService";

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
 * Query Parameters:
 * - talentUuid: The Talent Protocol UUID of the user (required)
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

    // Parse URL to get query parameters
    const url = new URL(request.url);
    const talentUuid = url.searchParams.get("talentUuid");

    // Validate required query parameter
    if (!talentUuid) {
      return NextResponse.json(
        { error: "talentUuid parameter is required" },
        { status: 400 },
      );
    }

    // Validate UUID format for security
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        talentUuid,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 },
      );
    }

    // Get badge data using existing service
    const badgesData = await getBadgesForUser(talentUuid)();

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
