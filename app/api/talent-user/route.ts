import { NextRequest, NextResponse } from "next/server";
import { getTalentUserService } from "@/app/services/userService";
import { dlog, dtimer } from "@/lib/debug";

export async function GET(req: NextRequest) {
  const routeTimer = dtimer("API", "talent-user-get");
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const username = searchParams.get("username");

  dlog("API", "talent-user-get", {
    id,
    url: req.url,
    method: req.method,
    headers_user_agent: req.headers.get("user-agent") || null,
  });

  if (!id && !username) {
    dlog("API", "talent-user-get-missing-id");
    routeTimer.end();
    return NextResponse.json({ error: "Missing id or username" }, { status: 400 });
  }

  try {
    dlog("API", "talent-user-get-calling-service", { id, username });
    const user = username
      ? await getTalentUserService(username, { username: true, account_source: "farcaster" })
      : await getTalentUserService(id!);

    if (!user) {
      dlog("API", "talent-user-get-user-not-found", { id });
      routeTimer.end();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    dlog("API", "talent-user-get-success", {
      id,
      user_id: user.id,
      user_fname: user.fname,
      status: 200,
    });

    routeTimer.end();
    return NextResponse.json(user);
  } catch (error) {
    dlog("API", "talent-user-get-error", {
      id,
      error: error instanceof Error ? error.message : String(error),
      error_type:
        error instanceof Error ? error.constructor.name : typeof error,
    });

    routeTimer.end();
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
