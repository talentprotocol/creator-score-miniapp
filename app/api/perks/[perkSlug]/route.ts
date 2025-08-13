import { NextRequest, NextResponse } from "next/server";
import { getPerkEntryStatus, enterPerkDraw } from "@/app/services/perksService";
import { resolveTalentUser } from "@/lib/user-resolver";

export async function GET(
  req: NextRequest,
  { params }: { params: { perkSlug: string } },
) {
  const { searchParams } = req.nextUrl;
  const talentUUID = searchParams.get("talent_uuid");
  const perkSlug = params.perkSlug;

  if (!talentUUID) {
    return NextResponse.json({ error: "Missing talent_uuid" }, { status: 400 });
  }

  try {
    const data = await getPerkEntryStatus({ perkSlug, talentUUID });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { perkSlug: string } },
) {
  const perkSlug = params.perkSlug;

  try {
    const body = await req.json().catch(() => ({}));
    let talentUUID: string | null = body?.talent_uuid ?? null;

    // If not provided, try resolving from identifier query param for flexibility
    if (!talentUUID) {
      const identifier = req.nextUrl.searchParams.get("id");
      if (identifier) {
        const user = await resolveTalentUser(identifier);
        talentUUID = user?.id ?? null;
      }
    }

    if (!talentUUID) {
      return NextResponse.json(
        { error: "Missing talent_uuid" },
        { status: 400 },
      );
    }

    const data = await enterPerkDraw({ perkSlug, talentUUID });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to enter" }, { status: 500 });
  }
}
