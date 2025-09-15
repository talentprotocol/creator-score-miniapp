import "./theme.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { Providers } from "./providers";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SwipeWrapper } from "@/components/common/SwipeWrapper";
import {
  getPageMetadata,
  getFrameMetadata,
  creatorScoreFrame,
} from "@/lib/app-metadata";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const pageMetadata = await getPageMetadata();
  const frameMetadata = await getFrameMetadata();
  return {
    title: pageMetadata.title,
    description: pageMetadata.description,
    icons: {
      icon: "/favicon-64.png",
      shortcut: "/favicon-64.png",
      apple: "/favicon-64.png",
    },
    other: {
      "fc:frame": JSON.stringify(creatorScoreFrame),
      "og:title": frameMetadata.ogTitle,
      "og:description": frameMetadata.ogDescription,
      "og:image": frameMetadata.ogImageUrl,
      "twitter:card": "summary_large_image",
      "twitter:title": frameMetadata.ogTitle,
      "twitter:description": frameMetadata.ogDescription,
      "twitter:image": frameMetadata.ogImageUrl,
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

// Cy font configuration - Next.js localFont automatically preloads all weights
// This may cause browser warnings about unused preloaded resources, which is normal
// and expected behavior for font optimization
const cyFont = localFont({
  src: [
    { path: "../public/fonts/Cy Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Cy SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Cy Bold.ttf", weight: "700", style: "normal" },
    {
      path: "../public/fonts/Cy ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-cy",
  display: "swap",
});

// Geist font configuration with proper CSS variable
const geistSans = GeistSans;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${cyFont.variable}`}>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/wip1dbu.css" />
      </head>
      <body className="min-h-full bg-background flex flex-col">
        <script
          dangerouslySetInnerHTML={{ __html: globalErrorHandlingScript }}
        />
        <div className="relative flex flex-col w-full bg-background my-0 md:my-0 md:bg-background md:shadow-none md:rounded-none md:overflow-hidden">
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
