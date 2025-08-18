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

// Admin UUIDs - hardcoded for security
const ADMIN_UUIDS = ["bd9d2b22-1b5b-43d3-b559-c53cbf1b7891"];

export async function GET(request: NextRequest) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  // Check if it's a Talent UUID for admin verification
  if (!ADMIN_UUIDS.includes(token)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
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
