import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET() {
  try {
    // Get total users with rewards decision
    const { data: totalUsers, error: totalError } = await supabase
      .from("user_preferences")
      .select("rewards_decision")
      .not("rewards_decision", "is", null);

    if (totalError) {
      console.error("Error fetching total users:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch total users", details: totalError.message },
        { status: 500 },
      );
    }

    // Get opted-out users
    const { data: optedOutUsers, error: optedOutError } = await supabase
      .from("user_preferences")
      .select("rewards_decision")
      .eq("rewards_decision", "opted_out");

    if (optedOutError) {
      console.error("Error fetching opted-out users:", optedOutError);
      return NextResponse.json(
        {
          error: "Failed to fetch opted-out users",
          details: optedOutError.message,
        },
        { status: 500 },
      );
    }

    const total = totalUsers?.length || 0;
    const optedOut = optedOutUsers?.length || 0;
    const percentage = total > 0 ? Math.round((optedOut / total) * 100) : 0;

    return NextResponse.json({ percentage });
  } catch (error) {
    console.error("Error calculating opted-out percentage:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
