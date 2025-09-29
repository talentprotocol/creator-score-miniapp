"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { getMiniKitConfig } from "@/lib/app-metadata";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PrivyProvider } from "@privy-io/react-auth";
import { AddMiniAppOnLoad } from "@/components/common/AddMiniAppOnLoad";
import { TalentAuthFetchInterceptor } from "@/components/common/TalentAuthFetchInterceptor";
import { AuthTokenUrlHandler } from "@/components/common/AuthTokenUrlHandler";
import { GoogleAnalytics } from "@next/third-parties/google";

export function Providers(props: { children: ReactNode }) {
  const miniKitConfig = getMiniKitConfig();

  // Ensure API key is defined to prevent runtime errors
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  if (!apiKey) {
    console.error("NEXT_PUBLIC_ONCHAINKIT_API_KEY is not defined");
  }

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;
  const privyClientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!;

  if (!privyAppId || !privyClientId) {
    console.error(
      "NEXT_PUBLIC_PRIVY_APP_ID or NEXT_PUBLIC_PRIVY_CLIENT_ID is not defined",
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
          <AuthTokenUrlHandler />
          <TalentAuthFetchInterceptor />
          {props.children}
        </MiniKitProvider>
      </PrivyProvider>
      <GoogleAnalytics gaId="G-39823STXKX" />
    </PostHogProvider>
  );
}
