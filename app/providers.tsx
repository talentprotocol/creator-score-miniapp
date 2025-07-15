"use client";

import { type ReactNode } from "react";
import { base } from "wagmi/chains";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import { getMiniKitConfig } from "@/lib/app-metadata";

export function Providers(props: { children: ReactNode }) {
  const miniKitConfig = getMiniKitConfig();

  // Ensure API key is defined to prevent runtime errors
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY;
  if (!apiKey) {
    console.error("NEXT_PUBLIC_ONCHAINKIT_API_KEY is not defined");
  }

  return (
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
      {props.children}
    </MiniKitProvider>
  );
}
