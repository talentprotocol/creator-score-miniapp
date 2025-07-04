import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;

  let frameMetadata;
  try {
    frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE,
      button: {
        title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME}`,
        action: {
          type: "launch_frame",
          name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
          url: URL,
          splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
          splashBackgroundColor:
            process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
        },
      },
    });
  } catch {
    // Fallback to a minimal valid frame metadata
    frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: "",
      button: {
        title: "Check Score",
        action: {
          type: "launch_frame",
          name: "Creator Score",
          url: URL || "http://localhost:3000",
          splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
          splashBackgroundColor:
            process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#0052FF",
        },
      },
    });
  }

  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Creator Score",
    description:
      "Check your Creator Score and track your onchain content across Base and other networks",
    other: {
      "fc:frame": frameMetadata,
      "og:title": (process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ||
        "Creator Score") as string,
      "og:description":
        "Check your Creator Score and track your onchain content across Base and other networks",
      "og:image": (process.env.NEXT_PUBLIC_APP_HERO_IMAGE || "") as string,
      "twitter:card": "summary_large_image",
      "twitter:title": (process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ||
        "Creator Score") as string,
      "twitter:description":
        "Check your Creator Score and track your onchain content across Base and other networks",
      "twitter:image": (process.env.NEXT_PUBLIC_APP_HERO_IMAGE || "") as string,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white flex flex-col">
        <div className="relative flex flex-col w-full max-w-lg mx-auto bg-background overflow-hidden my-0 md:my-0 md:max-w-none md:mx-0 md:bg-white md:shadow-none md:rounded-none">
          <Providers>
            <Header />
            <main className="flex-1 flex flex-col w-full relative pb-32 overflow-y-auto">
              {children}
            </main>
            <BottomNav />
          </Providers>
        </div>
      </body>
    </html>
  );
}
