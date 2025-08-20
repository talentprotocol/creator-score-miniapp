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
      subtitle: frameMetadata.subtitle,
      description: frameMetadata.description,
      iconUrl: frameMetadata.iconUrl,
      splashImageUrl: frameMetadata.splashImageUrl,
      splashBackgroundColor: frameMetadata.splashBackgroundColor,
      homeUrl: baseUrl,
      webhookUrl:
        process.env.FARCASTER_WEBHOOK_URL || process.env.NEYNAR_WEBHOOKURL,
      primaryCategory: frameMetadata.primaryCategory,
      tags: frameMetadata.tags,
      heroImageUrl: frameMetadata.heroImageUrl,
      tagline: frameMetadata.tagline,
      ogTitle: frameMetadata.ogTitle,
      ogDescription: frameMetadata.ogDescription,
      ogImageUrl: frameMetadata.ogImageUrl,
    }),
    baseBuilder: {
      allowedAddresses: [
        "0xa50f0aAa4B5444911d29ee17493327836aCABBa6",
        "0x891f0d36223Ecd81e768669dEC678c5Cf45E90ab",
      ],
    },
  });
}
