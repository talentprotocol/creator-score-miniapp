import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CACHE_KEYS } from "@/lib/cache-keys";
import { updateUserPreferencesAtomic } from "@/app/services/userPreferencesService";
import { validateTalentUUID } from "@/lib/validation";

/**
 * POST /api/user-preferences/optout
 *
 * Allows creators to opt in or opt out of receiving rewards.
 * Opt-out users' rewards go to a separate future pool instead of being redistributed.
 *
 * This endpoint processes the rewards decision request and immediately updates the user's
 * preferences. The decision is irreversible and cannot be undone.
 *
 * @param req.body.talent_uuid - User's Talent Protocol UUID (required)
 * @param req.body.decision - Must be 'opted_in' or 'opted_out' (required)
 * @param req.body.confirm_decision - Must be true to confirm the irreversible decision (required)
 * @returns Success/error response with updated rewards decision status
 *
 * @example
 * ```typescript
 * const response = await fetch("/api/user-preferences/optout", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     talent_uuid: "user-uuid-here",
 *     decision: "opted_out",
 *     confirm_decision: true
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
 * @throws {400} Missing or invalid decision
 * @throws {400} Missing confirm_decision confirmation
 * @throws {400} Decision processing failed
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
    const { talent_uuid, decision, confirm_decision } = await req.json();

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

    if (!decision || !["opted_in", "opted_out"].includes(decision)) {
      return NextResponse.json(
        { success: false, error: "Decision must be 'opted_in' or 'opted_out'" },
        { status: 400 },
      );
    }

    if (confirm_decision !== true) {
      return NextResponse.json(
        { success: false, error: "Must confirm decision" },
        { status: 400 },
      );
    }

    // Process decision request using userPreferencesService
    try {
      const result = await updateUserPreferencesAtomic({
        talent_uuid,
        rewards_decision: decision as "opted_in" | "opted_out",
      });

      // Predictable server cache refresh for leaderboard data (optional, safe no-op if tags unused)
      try {
        // Only revalidate basic leaderboard dependencies; Top 200 doesn't change on decision
        revalidateTag(CACHE_KEYS.LEADERBOARD_BASIC);
        console.log(
          "[Rewards Decision API] Revalidated tag:",
          CACHE_KEYS.LEADERBOARD_BASIC,
        );
      } catch {}

      return NextResponse.json({
        success: true,
        data: {
          rewards_decision: result.rewards_decision,
          decision_made_at: result.decision_made_at,
        },
      });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update rewards decision" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error processing rewards decision request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/user-preferences/optout?talent_uuid=<uuid>
 *
 * Check a user's current rewards decision status.
 *
 * This endpoint is used to query the current rewards decision status of a user,
 * typically for UI state management and leaderboard display.
 *
 * @param req.searchParams.talent_uuid - User's Talent Protocol UUID (required)
 * @returns Current rewards decision status
 *
 * @example
 * ```typescript
 * const response = await fetch("/api/user-preferences/optout?talent_uuid=user-uuid-here");
 * const result = await response.json();
 * if (result.success) {
 *   const decision = result.data?.rewards_decision;
 *   console.log("User decision:", decision);
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

    // Check rewards decision status using userPreferencesService
    try {
      const { getUserPreferencesByTalentUuid } = await import(
        "@/app/services/userPreferencesService"
      );
      const prefs = await getUserPreferencesByTalentUuid(talent_uuid);

      return NextResponse.json({
        success: true,
        data: { rewards_decision: prefs.rewards_decision },
      });
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch rewards decision" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error checking rewards decision status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
