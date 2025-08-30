import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    // Get total users with rewards decision
    const { data: totalUsers, error: totalError } = await supabase
      .from("user_preferences")
      .select("rewards_decision")
      .not("rewards_decision", "is", null);

    if (totalError) {
      console.error("Error fetching total users:", totalError);
      return NextResponse.json({ percentage: 58 }, { status: 500 });
    }

    // Get opted-out users
    const { data: optedOutUsers, error: optedOutError } = await supabase
      .from("user_preferences")
      .select("rewards_decision")
      .eq("rewards_decision", "opted_out");

    if (optedOutError) {
      console.error("Error fetching opted-out users:", optedOutError);
      return NextResponse.json({ percentage: 58 }, { status: 500 });
    }

    const total = totalUsers?.length || 0;
    const optedOut = optedOutUsers?.length || 0;
    const percentage = total > 0 ? Math.round((optedOut / total) * 100) : 58;

    return NextResponse.json({ percentage });
  } catch (error) {
    console.error("Error calculating opted-out percentage:", error);
    return NextResponse.json({ percentage: 58 }, { status: 500 });
  }
}
