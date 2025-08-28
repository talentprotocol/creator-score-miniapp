import { getBadgesForUser } from "@/app/services/badgesService";
import { resolveTalentUser } from "@/lib/user-resolver";
import { getUserContext } from "@/lib/user-context";
import { getTalentUserService } from "@/app/services/userService";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

/**
 * GET /api/badges
 *
 * Returns all badge sections with computed badge states for a user.
 * Supports both current user (via Farcaster context) and profile badges (via identifier).
 *
 * Query Parameters:
 * - ?userId=<uuid> - Direct UUID for development/testing
 * - ?identifier=<handle> - Profile identifier (e.g., "jessepollak") for viewing other users' badges
 *
 * Authentication:
 * - Production: Uses Farcaster context from MiniApp headers
 * - Development: Falls back to default Talent Protocol user for testing
 * - Profile badges: Resolves identifier to Talent UUID
 *
 * Response format:
 * {
 *   sections: [{ id, title, badges: [...] }],
 *   summary: { totalCount, earnedCount, completionPct }
 * }
 */
export async function GET(request: Request) {
  try {
    // Parse URL to check for parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");
    const identifierParam = url.searchParams.get("identifier");

    let talentUuid: string | null = null;

    // User resolution priority order:
    if (identifierParam) {
      // 1. Profile badges: Resolve identifier to Talent UUID
      const user = await getTalentUserService(identifierParam);
      talentUuid = user?.id || null;
    } else if (userIdParam) {
      // 2. Direct UUID provided for development/testing via ?userId=<uuid>
      // Validate UUID format for security
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          userIdParam,
        )
      ) {
        return new Response("Invalid UUID format", { status: 400 });
      }
      talentUuid = userIdParam;
    } else {
      // 3. Farcaster context (MiniApp) or development fallback
      const context = getUserContext(null);

      if (context?.fid) {
        const user = await resolveTalentUser(String(context.fid));
        talentUuid = user?.id || null;
      } else {
        // Development fallback (for testing without context)
        talentUuid = "bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"; // Test user
      }
    }

    // Validate we have a user to work with
    if (!talentUuid) {
      return new Response("User not found", { status: 404 });
    }

    // Use the cached badge service - leaderboard data is already cached for 1 hour
    // This leverages the existing caching infrastructure efficiently
    const badgesData = await getBadgesForUser(talentUuid)();

    // Add user information to the response for profile badges
    const responseData = {
      ...badgesData,
      user: {
        id: talentUuid,
        identifier: identifierParam || null,
      },
    };

    return Response.json(responseData);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
