import { NextRequest, NextResponse } from "next/server";
import { OptoutService } from "@/app/services/optoutService";
import { validateTalentUUID } from "@/lib/validation";

export async function POST(
  req: NextRequest,
): Promise<
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing opt-out request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
): Promise<
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
