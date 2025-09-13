"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { getMiniKitConfig } from "@/lib/app-metadata";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PrivyProvider } from "@privy-io/react-auth";
import { AddMiniAppOnLoad } from "@/components/common/AddMiniAppOnLoad";

export function Providers(props: { children: ReactNode }) {
  const miniKitConfig = getMiniKitConfig();

  // Ensure API key is defined to prevent runtime errors
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  if (!apiKey) {
    console.error("NEXT_PUBLIC_ONCHAINKIT_API_KEY is not defined");
  }

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const privyClientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!privyAppId || !privyClientId) {
    console.error(
      "NEXT_PUBLIC_PRIVY_APP_ID or NEXT_PUBLIC_PRIVY_CLIENT_ID is not defined",
    );
    // Return a fallback provider that doesn't require Privy
    return (
      <PostHogProvider>
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto p-8">
            <h1 className="text-2xl font-bold mb-4">App Configuration Required</h1>
            <p className="text-muted-foreground mb-4">
              Please configure the required environment variables to use this app.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <h2 className="font-semibold mb-2">Required Environment Variables:</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>NEXT_PUBLIC_PRIVY_APP_ID</li>
                <li>NEXT_PUBLIC_PRIVY_CLIENT_ID</li>
                <li>NEXT_PUBLIC_ONCHAINKIT_API_KEY</li>
                <li>TALENT_API_KEY</li>
              </ul>
            </div>
          </div>
        </div>
      </PostHogProvider>
    );
  }

  return (
    <PostHogProvider>
      <PrivyProvider appId={privyAppId} clientId={privyClientId}>
        <MiniKitProvider
          apiKey={apiKey || ""}
          chain={base}
          config={{
            appearance: {
              mode: "auto",
              theme: "mini-app-theme",
              name: miniKitConfig.name,
              logo: miniKitConfig.logo,
            },
          }}
        >
          <AddMiniAppOnLoad />
          {props.children}
        </MiniKitProvider>
      </PrivyProvider>
    </PostHogProvider>
  );
}