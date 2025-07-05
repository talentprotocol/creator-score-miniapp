import * as React from "react";
import { sdk } from "@farcaster/frame-sdk";
import { ExternalLink } from "lucide-react";

export function CredentialIdeasCallout() {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = "https://farcaster.xyz/juampi";
    try {
      await sdk.actions.openUrl(url + "?_external=true");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="border border-border bg-muted rounded-xl px-6 py-4 my-1 flex items-center text-muted-foreground text-xs">
      <span className="font-semibold mr-0.5">New credential ideas?</span>
      <span className="ml-0.5">Reach out to </span>
      <a
        href="https://farcaster.xyz/juampi"
        onClick={handleClick}
        className="ml-1 text-muted-foreground hover:text-foreground flex items-center font-normal"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none" }}
      >
        @juampi
        <ExternalLink className="w-3 h-3 ml-[2px] stroke-[1.2] opacity-70" />
      </a>
    </div>
  );
}
