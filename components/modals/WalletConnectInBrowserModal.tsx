"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { openExternalUrl } from "@/lib/utils";
import { getPublicBaseUrl } from "@/lib/constants";
import { isFarcasterMiniApp } from "@/lib/client/miniapp";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener?.("change", onChange);
    // Fallback for older browsers
    const legacyMedia = media as MediaQueryList & {
      addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
    };
    legacyMedia.addListener?.(onChange);
    return () => {
      media.removeEventListener?.("change", onChange);
      legacyMedia.removeListener?.(onChange);
    };
  }, [matches, query]);

  return matches;
}

interface WalletConnectInBrowserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authToken: string | null;
  expiresAt: number | null;
}

export function WalletConnectInBrowserModal({
  open,
  onOpenChange,
  authToken,
  expiresAt,
}: WalletConnectInBrowserModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isMiniApp, setIsMiniApp] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await isFarcasterMiniApp(150);
      if (mounted) setIsMiniApp(v);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const browserLink = React.useMemo(() => {
    try {
      const base = getPublicBaseUrl();
      const url = new URL("/settings", base);
      // Always include auth token params in the URL (not shown in UI)
      if (authToken) url.searchParams.set("auth_token", authToken);
      if (typeof expiresAt === "number") {
        url.searchParams.set("expires_at", String(expiresAt));
      }
      url.searchParams.set("section", "connected-wallets");
      return url.toString();
    } catch {
      return "/settings";
    }
  }, [authToken, expiresAt]);

  const handleOpenInBrowser = () => {
    openExternalUrl(browserLink).finally(() => onOpenChange(false));
  };

  const Title = isDesktop ? DialogTitle : DrawerTitle;
  const Description = isDesktop ? DialogDescription : DrawerDescription;

  const Content = (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleOpenInBrowser}
        className="w-full"
        variant="brand-purple"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        Open Settings in Browser
      </Button>
      {(() => {
        try {
          const link = new URL(browserLink);
          // Hide sensitive params in displayed text
          link.searchParams.delete("auth_token");
          link.searchParams.delete("expires_at");
          const display = link.toString();
          return (
            <a
              href={browserLink}
              className="text-xs text-muted-foreground underline text-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="inline-flex items-center"><LinkIcon className="w-3 h-3 mr-1" />{display}</span>
            </a>
          );
        } catch {
          return null;
        }
      })()}
      <Button variant="default" onClick={() => onOpenChange(false)} className="w-full">
        Cancel
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <Title>Connect Wallet in Browser</Title>
            <Description>
              {isMiniApp
                ? "To connect a new wallet, please open the browser app."
                : "To connect a new wallet, please open the browser app. We will pass your authentication token so you don’t need to sign again."}
            </Description>
          </DialogHeader>
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
        <DrawerHeader>
          <Title>Connect Wallet in Browser</Title>
          <Description>
            {isMiniApp
              ? "To connect a new wallet, please open the browser app."
              : "To connect a new wallet, please open the browser app. We will pass your authentication token so you don’t need to sign again."}
          </Description>
        </DrawerHeader>
        <div className="mt-4">
          {Content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}


