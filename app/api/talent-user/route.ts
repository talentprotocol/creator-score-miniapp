import { NextRequest, NextResponse } from "next/server";
import { getTalentUserService } from "@/app/services/userService";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const user = await getTalentUserService(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("[talent-user] error", error);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
