import "./theme.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Providers } from "./providers";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SwipeWrapper } from "@/components/common/SwipeWrapper";
import { getAppMetadata, getPageMetadata } from "@/lib/app-metadata";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  const appMetadata = getAppMetadata();
  const pageMetadata = getPageMetadata();

  let frameMetadata;
  try {
    frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: appMetadata.heroImageUrl,
      button: {
        title: `Launch ${appMetadata.name}`,
        action: {
          type: "launch_frame",
          name: appMetadata.name,
          url: URL,
          splashImageUrl: appMetadata.splashImageUrl,
          splashBackgroundColor: appMetadata.splashBackgroundColor,
        },
      },
    });
  } catch (error) {
    console.error("Error generating frame metadata:", error);
    // Fallback to a minimal valid frame metadata
    frameMetadata = JSON.stringify({
      version: "next",
      imageUrl: appMetadata.heroImageUrl || "",
      button: {
        title: "Check Score",
        action: {
          type: "launch_frame",
          name: "Creator Score",
          url: URL || "https://www.creatorscore.app",
          splashImageUrl: appMetadata.splashImageUrl || "",
          splashBackgroundColor: appMetadata.splashBackgroundColor || "#C79AF6",
        },
      },
    });
  }

  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    icons: {
      icon: "/favicon-64.png",
      shortcut: "/favicon-64.png",
      apple: "/favicon-64.png",
    },
    other: {
      "fc:frame": frameMetadata,
      "og:title": pageMetadata.ogTitle,
      "og:description": pageMetadata.ogDescription,
      "og:image": pageMetadata.ogImage,
      "twitter:card": "summary_large_image",
      "twitter:title": pageMetadata.twitterTitle,
      "twitter:description": pageMetadata.twitterDescription,
      "twitter:image": pageMetadata.twitterImage,
    },
  };
}

// Global error handling script
const globalErrorHandlingScript = `
  window.addEventListener('error', function(event) {
    // Filter out Next.js redirects which are normal behavior
    if (event.error && event.error.message && event.error.message.includes('NEXT_REDIRECT')) {
      return;
    }
    console.error('Global error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', function(event) {
    // Filter out Next.js redirects which are normal behavior
    if (event.reason && event.reason.message && event.reason.message.includes('NEXT_REDIRECT')) {
      return;
    }
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
  });
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white flex flex-col">
        <script
          dangerouslySetInnerHTML={{ __html: globalErrorHandlingScript }}
        />
        <div className="relative flex flex-col w-full bg-background my-0 md:my-0 md:bg-white md:shadow-none md:rounded-none md:overflow-hidden">
          <Providers>
            <ErrorBoundary>
              <Header />
              <SwipeWrapper className="flex-1 flex flex-col w-full relative overflow-y-auto">
                <main className="flex-1 flex flex-col w-full relative">
                  <ErrorBoundary>{children}</ErrorBoundary>
                </main>
              </SwipeWrapper>
              <BottomNav />
            </ErrorBoundary>
          </Providers>
        </div>
      </body>
    </html>
  );
}
