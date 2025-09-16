import fetch from "node-fetch";

async function testSearchAPI() {
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) {
    console.error("Missing TALENT_API_KEY environment variable");
    return;
  }

  console.log("🔍 Testing Talent Protocol Search API...\n");

  // Same query as used in getCreatorScoreLeaderboard
  const data = {
    query: {
      score: {
        min: 1,
        scorer: "Creator Score",
      },
    },
    sort: {
      score: { order: "desc", scorer: "Creator Score" },
      id: { order: "desc" },
    },
    page: 1,
    per_page: 50,
  };

  const queryString = [
    `query=${encodeURIComponent(JSON.stringify(data.query))}`,
    `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
    `page=${data.page}`,
    `per_page=${data.per_page}`,
    `view=scores_minimal`,
  ].join("&");

  const url = `https://api.talentprotocol.com/search/advanced/profiles?${queryString}`;

  console.log("📡 Making request to:", url);
  console.log("🔑 Using API key:", apiKey.substring(0, 8) + "...");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
    });

    console.log("\n📊 Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      return;
    }

    const json = await response.json();
    const profiles = json.profiles || [];

    console.log(`\n📋 Found ${profiles.length} profiles`);
    console.log("🔍 Looking for poet.base.eth...\n");

    // Find poet.base.eth
    const poetProfile = profiles.find(
      (p) =>
        p.display_name?.toLowerCase().includes("poet") ||
        p.display_name?.toLowerCase().includes("poet.base.eth"),
    );

    if (poetProfile) {
      const poetIndex = profiles.findIndex((p) => p.id === poetProfile.id);
      console.log("✅ FOUND poet.base.eth!");
      console.log(`📍 Position in search results: ${poetIndex + 1}`);
      console.log(`👤 Display name: "${poetProfile.display_name}"`);
      console.log(`🆔 ID: ${poetProfile.id}`);
      console.log(`📊 Scores:`, poetProfile.scores);

      // Extract Creator Score
      const creatorScores = Array.isArray(poetProfile.scores)
        ? poetProfile.scores
            .filter((s) => s.slug === "creator_score")
            .map((s) => s.points ?? 0)
        : [];
      const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

      console.log(`🎯 Creator Score: ${score}`);
      console.log(`🏆 Rank field: ${poetProfile.rank || "NOT SET"}`);
      console.log(
        `📈 Rank position field: ${poetProfile.rank_position || "NOT SET"}`,
      );

      console.log("\n📝 Full profile data:");
      console.log(JSON.stringify(poetProfile, null, 2));
    } else {
      console.log("❌ poet.base.eth NOT FOUND in search results");
      console.log("\n📋 First 10 profiles:");
      profiles.slice(0, 10).forEach((p, i) => {
        console.log(`[${i + 1}] ${p.display_name} - ID: ${p.id}`);
      });
    }

    // Also check first 20 profiles to see rank patterns
    console.log("\n🔍 First 20 profiles with their rank data:");
    profiles.slice(0, 20).forEach((p, i) => {
      const creatorScores = Array.isArray(p.scores)
        ? p.scores
            .filter((s) => s.slug === "creator_score")
            .map((s) => s.points ?? 0)
        : [];
      const score = creatorScores.length > 0 ? Math.max(...creatorScores) : 0;

      console.log(
        `[${i + 1}] ${p.display_name}: score=${score}, rank=${p.rank || "N/A"}, rank_position=${p.rank_position || "N/A"}`,
      );
    });
  } catch (error) {
    console.error("💥 Error making API call:", error);
  }
}

testSearchAPI();
