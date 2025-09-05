import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

import { validateAdminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  // Validate admin authentication
  const authError = await validateAdminAuth(request);
  if (authError) {
    return authError;
  }

  try {
    // Get notification history, excluding dry runs and testing mode
    // We filter by dry_run = false and exclude entries that were testing mode
    const { data, error } = await supabase
      .from("notification_runs")
      .select("*")
      .eq("dry_run", false)
      .order("sent_at", { ascending: false })
      .limit(50); // Show last 50 real notifications

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notification history" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      history: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching notification history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
