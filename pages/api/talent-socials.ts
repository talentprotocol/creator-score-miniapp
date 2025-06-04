import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id, account_source } = req.query;
  const apiKey = process.env.TALENT_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not set" });
  if (!id) return res.status(400).json({ error: "Missing id" });

  const url = `https://api.talentprotocol.com/socials?id=${id}&account_source=${account_source || "farcaster"}`;
  const apiRes = await fetch(url, {
    headers: { "X-API-KEY": apiKey },
  });
  const data = await apiRes.json();
  res.status(apiRes.status).json(data);
}
