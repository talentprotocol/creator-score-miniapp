import { getNeynarClient } from "@/lib/neynar-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid") ?? undefined;
  const wallet = searchParams.get("wallet") ?? undefined;

  const neynarClient = getNeynarClient();
  return neynarClient.getWalletAddresses({ fid, wallet });
}
