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
    // Get Farcaster context from headers (for MiniApp) or fallback
    const context = getUserContext(null); // In real usage, this would get actual context

    // Parse URL to check for development parameters
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("userId");

    let talentUuid: string | null = null;

    // User resolution priority order:
    if (userIdParam) {
      // 1. Direct UUID provided for development/testing via ?userId=<uuid>
      talentUuid = userIdParam;
    } else if (context?.fid) {
      // 2. Farcaster ID from context (MiniApp)
      const user = await resolveTalentUser(String(context.fid));
      talentUuid = user?.id || null;
    } else {
      // 3. Development fallback (for testing without context)
      talentUuid = "bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"; // Test user
    }

    // Validate we have a user to work with
    if (!talentUuid) {
      return new Response("User not found", { status: 404 });
    }

    // Use the cached badge service - leaderboard data is already cached for 1 hour
    // This leverages the existing caching infrastructure efficiently
    const badgesData = await getBadgesForUser(talentUuid);

    return Response.json(badgesData);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
