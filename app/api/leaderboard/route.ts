import { NextRequest, NextResponse } from "next/server";

interface TalentProfile {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  builder_score?: { points?: number };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Talent API key" },
      { status: 500 },
    );
  }
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(searchParams.get("perPage") || "10", 10);

  const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
  const data = {
    sort: {
      score: { order: "desc", scorer: "Builder Score" },
      id: { order: "desc" },
    },
    page,
    per_page: perPage,
  };
  const queryString = [
    `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
    `page=${page}`,
    `per_page=${perPage}`,
  ].join("&");

  const res = await fetch(`${baseUrl}?${queryString}`, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": apiKey,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: errorText }, { status: res.status });
  }
  const json = await res.json();

  // Sort by score desc, then id for stability
  const sorted = (json.profiles || []).sort(
    (a: TalentProfile, b: TalentProfile) => {
      if ((b.builder_score?.points ?? 0) !== (a.builder_score?.points ?? 0)) {
        return (b.builder_score?.points ?? 0) - (a.builder_score?.points ?? 0);
      }
      return (a.id || "").localeCompare(b.id || "");
    },
  );

  // Assign competition ranks
  let lastScore: number | null = null;
  let lastRank = 0;
  let ties = 0;
  const mapped = sorted.map((profile: TalentProfile, idx: number) => {
    const score = profile.builder_score?.points ?? 0;
    let rank;
    if (score === lastScore) {
      rank = lastRank;
      ties++;
    } else {
      rank = idx + 1;
      if (ties > 0) rank = lastRank + ties;
      lastScore = score;
      lastRank = rank;
      ties = 1;
    }
    return {
      rank,
      name: profile.display_name || profile.name || "Unknown",
      pfp: profile.image_url || undefined,
      score,
      rewards: "-", // To be calculated later
      id: profile.id,
    };
  });
  return NextResponse.json({ entries: mapped });
}
