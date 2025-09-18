import { NextRequest, NextResponse } from "next/server";
import { TalentApiClient } from "@/lib/talent-api-client";
import { extractTalentProtocolParams } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  // Accept `uuid` alias and normalize to `talent_protocol_id`
  const uuid = searchParams.get("uuid");
  if (uuid) {
    searchParams.set("talent_protocol_id", uuid);
    searchParams.delete("uuid");
  }

  const params = extractTalentProtocolParams(searchParams);
  if (!params.id && !params.talent_protocol_id) {
    return NextResponse.json(
      { error: "Missing required parameter: id or talent_protocol_id" },
      { status: 400 },
    );
  }

  const client = new TalentApiClient();
  const resp = await client.getProfile(params);
  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: text || "Failed to fetch profile" }, { status: resp.status });
  }
  const json = await resp.json();
  return NextResponse.json(json, { status: 200 });
}

export async function PUT(req: NextRequest) {
  // Requires end-user auth token passthrough
  const userAuthToken = req.headers.get("x-talent-auth-token") || undefined;
  if (!userAuthToken) {
    return NextResponse.json(
      { error: "Missing x-talent-auth-token header" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const client = new TalentApiClient({ userAuthToken });
  const resp = await client.updateProfile(body || {});
  if (!resp.ok) {
    // Forward upstream error and status for better UX
    try {
      const err = await resp.json();
      return NextResponse.json(err, { status: resp.status });
    } catch {
      const text = await resp.text();
      return NextResponse.json({ error: text || "Failed to update profile" }, { status: resp.status });
    }
  }
  const json = await resp.json();
  return NextResponse.json(json, { status: 200 });
}


