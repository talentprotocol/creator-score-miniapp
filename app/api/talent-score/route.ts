import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  const apiKey = process.env.TALENT_API_KEY;
  const params = new URLSearchParams({
    id: address,
    account_source: "wallet",
  });
  const fullUrl = `https://api.talentprotocol.com/score?${params.toString()}`;

  if (!apiKey) {
    return NextResponse.json({ error: "API key not set" }, { status: 500 });
  }

  const response = await fetch(fullUrl, {
    method: "GET",
    headers: {
      "X-API-KEY": apiKey,
      Accept: "application/json",
    },
  });

  let data;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = { error: await response.text() };
  }

  return NextResponse.json(data, { status: response.status });
}
