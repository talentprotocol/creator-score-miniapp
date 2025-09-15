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
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.base200.com";

  // Signed Farcaster account association data
  const accountAssociation = {
    header: "eyJmaWQiOjIwNDQyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4NDQ1Nzc2QzU4RDZmZkI0NWQ5YjlmNkQ2ODI0NkU5ODVFMTgzMDI2NSJ9",
    payload: "eyJkb21haW4iOiJiYXNlMjAwLmNvbSJ9",
    signature: "MHg0MWY5ZmMxYjE0Yzg3MTBhN2I0OWQ0YThiYTIwYzRkMzk3OGM5N2NhN2Y4Y2Q5ZmY4YjM4MmM5ODZlYjU0ODEzNDE0Y2Q0YzQ4MTc0ZDU1NWRlYjg0YWE4Y2Q2OGIyYzQ0NzE2YzJhNDNjYTQ0MTUxMGI2MTQxZmE5NjFiYjIwOTFj"
  };

  return Response.json({
    accountAssociation,
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
      allowedAddresses: ["0xa50f0aAa4B5444911d29ee17493327836aCABBa6"],
    },
  });
}
