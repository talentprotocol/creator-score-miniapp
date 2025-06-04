import {
  setUserNotificationDetails,
  deleteUserNotificationDetails,
} from "@/lib/notification";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "frame_removed":
        await deleteUserNotificationDetails(data.fid);
        break;

      case "notifications_enabled":
        await setUserNotificationDetails(data.fid, data.notificationDetails);
        break;

      case "notifications_disabled":
        await deleteUserNotificationDetails(data.fid);
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported event type" },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 },
    );
  }
}
