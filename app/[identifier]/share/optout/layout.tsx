import { Metadata } from "next";
import { validateIdentifier } from "@/lib/validation";
import { RESERVED_WORDS, getPublicBaseUrl } from "@/lib/constants";

// Dynamic route for opt-out sharing
// This route will handle /[identifier]/share/optout URLs
export async function generateMetadata({
  params,
}: {
  params: { identifier: string };
}): Promise<Metadata> {
  // Validate identifier format to prevent injection attacks
  if (!validateIdentifier(params.identifier)) {
    return {
      title: "Creator Not Found - Creator Score",
      description: "This creator could not be found.",
    };
  }

  if (RESERVED_WORDS.includes(params.identifier)) {
    return {
      title: "Creator Not Found - Creator Score",
      description: "This creator could not be found.",
    };
  }

  try {
    // Resolve user via API route for compliance
    const base = getPublicBaseUrl();
    const response = await fetch(`${base}/api/talent-user?id=${encodeURIComponent(params.identifier)}`);
    if (!response.ok) {
      return {
        title: "Creator Not Found - Creator Score",
        description: "This creator could not be found.",
      };
    }
    const user = await response.json();

    if (!user || !user.id) {
      return {
        title: "Creator Not Found - Creator Score",
        description: "This creator could not be found.",
      };
    }

    // Determine canonical identifier
    const canonical = user.fname || user.wallet || user.id;

    // For opt-out metadata, we only need the display name
    const displayName = user.display_name || user.name || "Creator";

    // Always use canonical URL for Open Graph metadata (not localhost)
    const canonicalUrl = "https://creatorscore.app";

    // This is the opt-out sharing route, so always use opt-out metadata
    const dynamicImageUrl = `${canonicalUrl}/api/share-image-optout/${user.id}`;

    const title = `${displayName} - Paid It Forward`;

    const description = `${displayName} paid forward 100% of their Creator Score rewards to support onchain creators.`;

    const altText = `${displayName} Paid It Forward`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: dynamicImageUrl,
            width: 1600,
            height: 900,
            alt: altText,
          },
        ],
        type: "website",
        url: `${canonicalUrl}/${canonical}/share/optout`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [dynamicImageUrl],
      },
      // Add Farcaster frame metadata for profile pages
      other: {
        "fc:frame": JSON.stringify({
          version: "next",
          imageUrl: dynamicImageUrl, // Use the custom card!
          button: {
            title: "Check Your Score",
            action: {
              type: "launch_frame",
              name: "Creator Score App",
              url: canonicalUrl,
              splashImageUrl: `${canonicalUrl}/splash.png`,
              splashBackgroundColor: "#C79AF6",
            },
          },
        }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Creator Score",
      description: "Track your creator score and earnings onchain.",
    };
  }
}

// Default layout component
export default function OptoutShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
