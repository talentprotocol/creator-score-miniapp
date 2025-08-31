import { NextResponse } from "next/server";
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
