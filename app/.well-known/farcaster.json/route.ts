import { getFrameMetadata } from "../../../lib/app-metadata";

function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const frameMetadata = getFrameMetadata();
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.creatorscore.app";

  // Ensure environment variables are defined
  const farcasterHeader = process.env.FARCASTER_HEADER;
  const farcasterPayload = process.env.FARCASTER_PAYLOAD;
  const farcasterSignature = process.env.FARCASTER_SIGNATURE;

  if (!farcasterHeader || !farcasterPayload || !farcasterSignature) {
    console.error("Missing Farcaster environment variables");
    return Response.json(
      { error: "Missing Farcaster account association data" },
      { status: 500 },
    );
  }

  return Response.json({
    accountAssociation: {
      header: farcasterHeader,
      payload: farcasterPayload,
      signature: farcasterSignature,
    },
    frame: withValidProperties({
      version: "1",
      name: frameMetadata.name,
      iconUrl: frameMetadata.iconUrl, // Now guaranteed to be absolute
      homeUrl: baseUrl,
      webhookUrl: `${baseUrl}/api/webhook`,
    }),
  });
}
