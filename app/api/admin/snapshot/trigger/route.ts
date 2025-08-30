import { NextRequest, NextResponse } from "next/server";
import { LeaderboardSnapshotService } from "@/app/services/leaderboardSnapshotService";
import { getTop200LeaderboardEntries } from "@/app/services/leaderboardService";

export async function POST(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.SNAPSHOT_ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Admin Snapshot Trigger] Starting manual snapshot creation");

    // Check if snapshot already exists
    const snapshotExists = await LeaderboardSnapshotService.snapshotExists();
    if (snapshotExists) {
      return NextResponse.json(
        {
          error: "Snapshot already exists",
          message:
            "A snapshot has already been created. Delete existing snapshot first if you want to create a new one.",
        },
        { status: 409 },
      );
    }

    // Get current leaderboard data
    console.log("[Admin Snapshot Trigger] Fetching current leaderboard data");
    const leaderboardData = await getTop200LeaderboardEntries();

    if (!leaderboardData.entries || leaderboardData.entries.length === 0) {
      return NextResponse.json(
        { error: "No leaderboard data available" },
        { status: 500 },
      );
    }

    // Transform leaderboard entries to snapshot format
    const snapshotEntries = leaderboardData.entries.filter(
      (entry) => entry.rank <= 200,
    ); // Only top 200, keep full LeaderboardEntry objects

    console.log(
      `[Admin Snapshot Trigger] Creating snapshot with ${snapshotEntries.length} entries`,
    );

    // Create snapshot
    const result =
      await LeaderboardSnapshotService.createSnapshot(snapshotEntries);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to create snapshot" },
        { status: 500 },
      );
    }

    console.log("[Admin Snapshot Trigger] Snapshot created successfully");

    return NextResponse.json({
      success: true,
      message: "Snapshot created successfully",
      entriesCount: snapshotEntries.length,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Admin Snapshot Trigger] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.SNAPSHOT_ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Admin Snapshot Trigger] Deleting existing snapshot");

    // Check if snapshot exists
    const snapshotExists = await LeaderboardSnapshotService.snapshotExists();
    if (!snapshotExists) {
      return NextResponse.json(
        { error: "No snapshot exists to delete" },
        { status: 404 },
      );
    }

    // Delete snapshot (we'll need to add this method)
    // For now, we'll return an error since we removed the delete method
    return NextResponse.json(
      { error: "Delete functionality not implemented" },
      { status: 501 },
    );
  } catch (error) {
    console.error("[Admin Snapshot Trigger] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
