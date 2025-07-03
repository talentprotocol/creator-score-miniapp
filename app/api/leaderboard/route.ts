import { NextRequest, NextResponse } from "next/server";

type Profile = {
  id: string;
  display_name?: string;
  name?: string;
  image_url?: string;
  scores?: { slug: string; points?: number }[];
};

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
  // if (Array.isArray(json.profiles)) {
  //   const creatorScores = json.profiles.slice(0, 10).map((profile: Profile) => {
  //     const p = profile;
  //     const creatorScoreObj = Array.isArray(p.scores)
  //       ? p.scores.find((s) => s.slug === "creator_score")
  //       : null;
  //     return {
  //       name: p.display_name || p.name,
  //       creator_score: creatorScoreObj?.points ?? 0,
  //     };
  //   });
  //   console.log("First 10 creator scores:", creatorScores);
  // }

  // Step 1: Map each profile to its highest Creator Score
  const mapped = (json.profiles || []).map((profile: Profile) => {
    const p = profile;
    const creatorScores = Array.isArray(p.scores)
      ? p.scores
          .filter((s) => s.slug === "creator_score")
          .map((s) => s.points ?? 0)
      : [];
    const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;
    return {
      name: p.display_name || p.name || "Unknown",
      pfp: p.image_url || undefined,
      score,
      rewards: "-", // To be calculated later
      id: p.id,
    };
  });

  // Step 2: Sort by score descending
  mapped.sort(
    (a: { score: number }, b: { score: number }) => b.score - a.score,
  );

  // Step 3: Assign ranks
  let lastScore: number | null = null;
  let lastRank = 0;
  let ties = 0;
  const ranked = mapped.map((entry: { score: number }, idx: number) => {
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

  // New: Calculate minScore (100th creator) and totalCreators
  let minScore = null;
  if (ranked.length >= 100) {
    minScore = ranked[99].score;
  } else if (ranked.length > 0) {
    minScore = ranked[ranked.length - 1].score;
  }
  // Use json.total if available, otherwise fallback to ranked.length
  const totalCreators =
    typeof json.total === "number" ? json.total : ranked.length;

  return NextResponse.json({ entries: ranked, minScore, totalCreators });
}
