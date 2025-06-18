import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const talentId =
    searchParams.get("talent_protocol_id") || searchParams.get("id");
  const isTalentId = !!searchParams.get("talent_protocol_id");
  const account_source = searchParams.get("account_source") || "farcaster";
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not set" }, { status: 500 });
  }
  if (!talentId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const url = isTalentId
    ? `https://api.talentprotocol.com/socials?id=${talentId}`
    : `https://api.talentprotocol.com/socials?id=${talentId}&account_source=${account_source}`;
  const apiRes = await fetch(url, {
    headers: { "X-API-KEY": apiKey },
  });
  const data = await apiRes.json();
  if (apiRes.status === 404) {
    return NextResponse.json(
      { error: "Talent API returned 404", data },
      { status: 502 },
    );
  }
  return NextResponse.json(data, { status: apiRes.status });
}
