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
 * @param req.body.talent_uuid - User's Talent Protocol UUID
 * @param req.body.confirm_optout - Must be true to confirm the irreversible decision
 * @returns Success/error response with updated opt-out status
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
 * @param req.searchParams.talent_uuid - User's Talent Protocol UUID
 * @returns Current opt-out status
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
