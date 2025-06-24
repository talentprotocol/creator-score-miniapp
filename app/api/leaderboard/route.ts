import { NextRequest, NextResponse } from "next/server";

interface TalentProfile {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  creator_score?: { points?: number };
  talent_protocol_id?: string;
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
  const perPage = parseInt(searchParams.get("perPage") || "25", 10); // Use max allowed 25

  const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
  const data = {
    sort: {
      score: { order: "desc", scorer: "Creator Score" },
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

  // TEMP: Log the first 10 creator scores for inspection
  if (Array.isArray(json.profiles)) {
    const creatorScores = json.profiles.slice(0, 10).map((profile: any) => {
      const creatorScoreObj = Array.isArray(profile.scores)
        ? profile.scores.find((s: any) => s.slug === "creator_score")
        : null;
      return {
        name: profile.display_name || profile.name,
        creator_score: creatorScoreObj?.points ?? 0,
      };
    });
    console.log("First 10 creator scores:", creatorScores);
  }

  console.log("Talent Protocol API response:", JSON.stringify(json, null, 2)); // TEMP DEBUG

  // Step 1: Map each profile to its highest Creator Score
  const mapped = (json.profiles || []).map((profile: any) => {
    const creatorScores = Array.isArray(profile.scores)
      ? profile.scores
          .filter((s: any) => s.slug === "creator_score")
          .map((s: any) => s.points ?? 0)
      : [];
    const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;
    return {
      name: profile.display_name || profile.name || "Unknown",
      pfp: profile.image_url || undefined,
      score,
      rewards: "-", // To be calculated later
      id: profile.id,
    };
  });

  // Step 2: Sort by score descending
  mapped.sort((a: any, b: any) => b.score - a.score);

  // Step 3: Assign ranks
  let lastScore: number | null = null;
  let lastRank = 0;
  let ties = 0;
  const ranked = mapped.map((entry: any, idx: number) => {
    let rank;
    if (entry.score === lastScore) {
      rank = lastRank;
      ties++;
    } else {
      rank = idx + 1;
      if (ties > 0) rank = lastRank + ties;
      lastScore = entry.score;
      lastRank = rank;
      ties = 1;
    }
    return {
      ...entry,
      rank,
    };
  });

  return NextResponse.json({ entries: ranked });
}
