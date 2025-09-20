import { NextResponse } from "next/server";
import { TalentApiClient } from "@/lib/talent-api-client";

export async function GET() {
  const client = new TalentApiClient();
  const resp = await client.getTags();
  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: text || "Failed to fetch tags" }, { status: resp.status });
  }
  const json = await resp.json();
  return NextResponse.json(json, { status: 200 });
}


