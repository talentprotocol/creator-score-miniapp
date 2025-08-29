import { NextRequest, NextResponse } from "next/server";
import { LeaderboardSnapshotService } from "@/app/services/leaderboardSnapshotService";

/**
 * GET /api/leaderboard/snapshot
 * Get snapshot data for a specific round or the current round
 */
export async function GET() {
  try {
    // Check if snapshot exists
    const exists = await LeaderboardSnapshotService.snapshotExists();
    if (!exists) {
      return NextResponse.json({ error: "No snapshot found" }, { status: 404 });
    }

    // Get snapshot data
    const snapshots = await LeaderboardSnapshotService.getSnapshot();
    if (!snapshots) {
      return NextResponse.json(
        { error: "Failed to retrieve snapshot data" },
        { status: 500 },
      );
    }

    // Get metadata
    const metadata = await LeaderboardSnapshotService.getSnapshotMetadata();
    if (!metadata) {
      return NextResponse.json(
        { error: "Failed to retrieve snapshot metadata" },
        { status: 500 },
      );
    }

    const response = {
      snapshots,
      total_count: metadata.total_count,
      created_at: metadata.created_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in snapshot GET endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/leaderboard/snapshot
 * Create a new leaderboard snapshot
 * This should be called at ROUND_ENDS_AT to freeze the leaderboard
 */
export async function POST(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.SNAPSHOT_ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entries } = body;

    // Validate required fields
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "Entries array is required and must not be empty" },
        { status: 400 },
      );
    }

    // Validate entries structure
    const requiredFields = ["rank", "id"];
    const isValidEntry = (entry: Record<string, unknown>) => {
      return requiredFields.every((field) => entry.hasOwnProperty(field));
    };

    if (!entries.every(isValidEntry)) {
      return NextResponse.json(
        {
          error:
            "Invalid entry structure. Required fields: " +
            requiredFields.join(", "),
        },
        { status: 400 },
      );
    }

    // Check if snapshot already exists
    console.log(`[API] Checking if snapshot exists`);
    const exists = await LeaderboardSnapshotService.snapshotExists();
    console.log(`[API] Snapshot exists check result: ${exists}`);
    if (exists) {
      return NextResponse.json(
        { error: "Snapshot already exists" },
        { status: 409 },
      );
    }

    // Create snapshot
    const result = await LeaderboardSnapshotService.createSnapshot(entries);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create snapshot" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      snapshot_id: result.snapshotId,
      entries_count: entries.length,
      message: `Successfully created snapshot with ${entries.length} entries`,
    });
  } catch (error) {
    console.error("Error in snapshot POST endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
