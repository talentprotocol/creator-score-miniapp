import { Metadata } from "next";
import {
  getPageMetadata,
  getFrameMetadata,
  creatorScoreFrame,
} from "@/lib/app-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const pageMetadata = getPageMetadata();
  const frameMetadata = getFrameMetadata();
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.creatorscore.app";

  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    openGraph: {
      title: frameMetadata.ogTitle,
      description: frameMetadata.ogDescription,
      images: [
        {
          url: frameMetadata.ogImageUrl,
          width: 1600,
          height: 900,
          alt: "Creator Score App",
        },
      ],
      type: "website",
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: frameMetadata.ogTitle,
      description: frameMetadata.ogDescription,
      images: [frameMetadata.ogImageUrl],
    },
    other: {
      "fc:frame": JSON.stringify(creatorScoreFrame),
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
