import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_KEYS } from "@/lib/cache-keys";
import { OptoutService } from "@/app/services/optoutService";
import { validateTalentUUID } from "@/lib/validation";

/**
 * POST /api/user-preferences/optout
 *
 * Allows creators to opt out of receiving rewards (Pay It Forward feature).
 * Their rewards are redistributed proportionally among remaining eligible creators.
 *
 * This endpoint processes the opt-out request and immediately updates the user's
 * preferences. The decision is irreversible and cannot be undone.
 *
 * @param req.body.talent_uuid - User's Talent Protocol UUID (required)
 * @param req.body.confirm_optout - Must be true to confirm the irreversible decision (required)
 * @returns Success/error response with updated opt-out status
 *
 * @example
 * ```typescript
 * const response = await fetch("/api/user-preferences/optout", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     talent_uuid: "user-uuid-here",
 *     confirm_optout: true
 *   })
 * });
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log("Successfully opted out");
 * }
 * ```
 *
 * @throws {400} Missing or invalid talent_uuid
 * @throws {400} Missing confirm_optout confirmation
 * @throws {400} Opt-out processing failed
 * @throws {500} Internal server error
 */
export async function POST(req: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }>
> {
  try {
    const { talent_uuid, confirm_optout } = await req.json();

    // Validate required fields
    if (!talent_uuid) {
      return NextResponse.json(
        { success: false, error: "Missing talent_uuid" },
        { status: 400 },
      );
    }

    if (!validateTalentUUID(talent_uuid)) {
      return NextResponse.json(
        { success: false, error: "Invalid talent_uuid format" },
        { status: 400 },
      );
    }

    if (confirm_optout !== true) {
      return NextResponse.json(
        { success: false, error: "Must confirm opt-out decision" },
        { status: 400 },
      );
    }

    // Process opt-out request
    const result = await OptoutService.optOut(talent_uuid);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    // Predictable server cache refresh for leaderboard data (optional, safe no-op if tags unused)
    try {
      // Only revalidate basic leaderboard dependencies; Top 200 doesn't change on opt-out
      revalidateTag(CACHE_KEYS.LEADERBOARD_BASIC);
      console.log(
        "[OptOut API] Revalidated tag:",
        CACHE_KEYS.LEADERBOARD_BASIC,
      );
    } catch {}

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing opt-out request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/user-preferences/optout?talent_uuid=<uuid>
 *
 * Check if a user has opted out of rewards.
 *
 * This endpoint is used to query the current opt-out status of a user,
 * typically for UI state management and leaderboard display.
 *
 * @param req.searchParams.talent_uuid - User's Talent Protocol UUID (required)
 * @returns Current opt-out status
 *
 * @example
 * ```typescript
 * const response = await fetch("/api/user-preferences/optout?talent_uuid=user-uuid-here");
 * const result = await response.json();
 * if (result.success) {
 *   const isOptedOut = result.data?.rewards_optout;
 *   console.log("User opted out:", isOptedOut);
 * }
 * ```
 *
 * @throws {400} Missing talent_uuid parameter
 * @throws {400} Invalid talent_uuid format
 * @throws {500} Internal server error
 */
export async function GET(req: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }>
> {
  try {
    const { searchParams } = req.nextUrl;
    const talent_uuid = searchParams.get("talent_uuid");

    if (!talent_uuid) {
      return NextResponse.json(
        { success: false, error: "Missing talent_uuid parameter" },
        { status: 400 },
      );
    }

    if (!validateTalentUUID(talent_uuid)) {
      return NextResponse.json(
        { success: false, error: "Invalid talent_uuid format" },
        { status: 400 },
      );
    }

    // Check opt-out status
    const isOptedOut = await OptoutService.isOptedOut(talent_uuid);

    return NextResponse.json({
      success: true,
      data: { rewards_optout: isOptedOut },
    });
  } catch (error) {
    console.error("Error checking opt-out status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
