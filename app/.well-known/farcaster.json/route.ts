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
  const URL = process.env.NEXT_PUBLIC_URL;
  const frameMetadata = getFrameMetadata();

  // Ensure environment variables are defined
  const farcasterHeader = process.env.FARCASTER_HEADER;
  const farcasterPayload = process.env.FARCASTER_PAYLOAD;
  const farcasterSignature = process.env.FARCASTER_SIGNATURE;

  if (!farcasterHeader || !farcasterPayload || !farcasterSignature) {
    console.error("Missing Farcaster environment variables");
  }

  return Response.json({
    accountAssociation: {
      header: farcasterHeader || "",
      payload: farcasterPayload || "",
      signature: farcasterSignature || "",
    },
    frame: withValidProperties({
      version: "1",
      name: frameMetadata.name,
      subtitle: frameMetadata.subtitle,
      description: frameMetadata.description,
      screenshotUrls: [],
      iconUrl: frameMetadata.iconUrl,
      splashImageUrl: frameMetadata.splashImageUrl,
      splashBackgroundColor: frameMetadata.splashBackgroundColor,
      homeUrl: URL || "",
      webhookUrl: URL ? `${URL}/api/webhook` : "",
      primaryCategory: frameMetadata.primaryCategory,
      tags: frameMetadata.tags,
      heroImageUrl: frameMetadata.heroImageUrl,
      tagline: frameMetadata.tagline,
      ogTitle: frameMetadata.ogTitle,
      ogDescription: frameMetadata.ogDescription,
      ogImageUrl: frameMetadata.ogImageUrl,
      // imageUrl: process.env.NEXT_PUBLIC_APP_IMAGE_URL,
      // buttonTitle: process.env.NEXT_PUBLIC_APP_BUTTON_TITLE,
    }),
  });
}
