import { neynarClient } from "@/lib/neynar-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid") ?? undefined;
  const wallet = searchParams.get("wallet") ?? undefined;

  return neynarClient.getWalletAddresses({ fid, wallet });
}
