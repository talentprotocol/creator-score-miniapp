import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { RequireFarcasterUser } from "@/components/navigation/RequireFarcasterUser";

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
  } catch (error) {
    console.error("Error stringifying frame metadata:", error);
    // Fallback to a minimal valid frame metadata
    frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: "",
      button: {
        title: "Check Score",
        action: {
          type: "launch_frame",
          name: "Builder Score",
          url: URL || "http://localhost:3000",
          splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE,
          splashBackgroundColor:
            process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#0052FF",
        },
      },
    });
  }

  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "Builder Score",
    description:
      "Check your Builder Score and track your onchain activity across Base and other networks",
    other: {
      "fc:frame": frameMetadata,
      "og:title": (process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ||
        "Builder Score") as string,
      "og:description":
        "Check your Builder Score and track your onchain activity across Base and other networks",
      "og:image": (process.env.NEXT_PUBLIC_APP_HERO_IMAGE || "") as string,
      "twitter:card": "summary_large_image",
      "twitter:title": (process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME ||
        "Builder Score") as string,
      "twitter:description":
        "Check your Builder Score and track your onchain activity across Base and other networks",
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
      <body className="min-h-full bg-muted md:bg-white flex flex-col">
        <div className="relative flex flex-col w-full max-w-lg mx-auto bg-background overflow-hidden my-0 md:my-0 md:max-w-none md:mx-0 md:bg-white md:shadow-none md:rounded-none">
          <Providers>
            <RequireFarcasterUser>
              <Header />
              <main className="flex-1 flex flex-col w-full relative pb-32 overflow-y-auto">
                {children}
              </main>
              <BottomNav />
            </RequireFarcasterUser>
          </Providers>
        </div>
      </body>
    </html>
  );
}
