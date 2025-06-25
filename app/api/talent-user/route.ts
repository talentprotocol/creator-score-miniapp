import { NextRequest, NextResponse } from "next/server";

const TALENT_API_URL = "https://api.talentprotocol.com/profile";

function getAccountSource(id: string): "wallet" | "farcaster" {
  if (id.startsWith("0x") && id.length === 42) return "wallet";
  // FID or username (Farcaster)
  return "farcaster";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "No identifier provided" },
      { status: 400 },
    );
  }
  const account_source = getAccountSource(id);

  try {
    const talentApiUrl = `${TALENT_API_URL}?id=${encodeURIComponent(id)}&account_source=${account_source}`;
    console.log("Calling Talent Protocol API:", talentApiUrl);
    const res = await fetch(talentApiUrl, {
      headers: {
        "X-API-KEY": process.env.TALENT_API_KEY || "",
        Accept: "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok || !data.profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Extract identifiers
    const accounts = Array.isArray(data.profile.accounts)
      ? data.profile.accounts
      : [];
    const farcasterAccount = accounts.find(
      (acc: { identifier: string; source: string }) =>
        acc.source === "farcaster" && /^\d+$/.test(acc.identifier),
    );
    const fid = farcasterAccount ? Number(farcasterAccount.identifier) : null;
    const walletAccount = accounts.find(
      (acc: { identifier: string; source: string }) =>
        acc.source === "wallet" &&
        acc.identifier &&
        acc.identifier.startsWith("0x"),
    );
    const wallet = walletAccount
      ? walletAccount.identifier
      : data.profile.user?.main_wallet || null;
    const githubAccount = accounts.find(
      (acc: { username?: string; source: string }) =>
        acc.source === "github" && acc.username,
    );
    const github = githubAccount ? githubAccount.username : null;
    // Return a normalized user object
    return NextResponse.json({
      fid,
      wallet,
      github,
      fname: data.profile.username || null,
      display_name: data.profile.display_name || data.profile.name || null,
      image_url: data.profile.image_url || null,
      ...data.profile,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 },
    );
  }
}
