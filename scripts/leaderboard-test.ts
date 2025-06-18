import "dotenv/config";

(async () => {
  try {
    const apiKey = process.env.TALENT_API_KEY;
    if (!apiKey) throw new Error("Missing Talent API key");
    const baseUrl = "https://api.talentprotocol.com/search/advanced/profiles";
    const data = {
      sort: {
        score: { order: "desc", scorer: "Creator Score" },
        id: { order: "desc" },
      },
      page: 1,
      per_page: 3,
    };
    const queryString = [
      `sort=${encodeURIComponent(JSON.stringify(data.sort))}`,
      `page=1`,
      `per_page=3`,
    ].join("&");
    const res = await fetch(`${baseUrl}?${queryString}`, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
      } as Record<string, string>,
    });
    const json = await res.json();
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
  }
})();
