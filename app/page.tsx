import { Metadata } from "next";
import { getPageMetadata, getFrameMetadata } from "@/lib/app-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMetadata = getPageMetadata();
  const frameMetadata = getFrameMetadata();
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.creatorscore.app";

  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    other: {
      "fc:miniapp": "true",
      "fc:miniapp:image": frameMetadata.ogImageUrl,
      "fc:miniapp:button:1": "Open App",
      "fc:miniapp:post_url": baseUrl,
      "fc:miniapp:image:aspect_ratio": "1.91:1",
      "og:title": frameMetadata.ogTitle,
      "og:description": frameMetadata.ogDescription,
      "og:image": frameMetadata.ogImageUrl,
      "og:url": baseUrl,
      "og:type": "website",
      "twitter:card": "summary_large_image",
      "twitter:title": frameMetadata.ogTitle,
      "twitter:description": frameMetadata.ogDescription,
      "twitter:image": frameMetadata.ogImageUrl,
    },
  };
}

export default function Home() {
  // For embed compatibility, we need this page to render content
  // But we'll redirect users to leaderboard using client-side navigation
  return (
    <div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              window.location.replace('/leaderboard');
            }
          `,
        }}
      />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/leaderboard" />
        <p>
          Redirecting to <a href="/leaderboard">leaderboard</a>...
        </p>
      </noscript>
    </div>
  );
}
