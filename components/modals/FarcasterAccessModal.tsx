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
import { ExternalLink } from "lucide-react";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
}

interface FarcasterAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: "Profile" | "Settings";
}

export function FarcasterAccessModal({
  open,
  onOpenChange,
  feature,
}: FarcasterAccessModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const drawerContentRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = React.useRef<HTMLElement | null>(null);
  const { ready } = usePrivy();

  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => {
      router.push("/profile");
      onOpenChange(false);
    },
  });

  const handleFarcasterClick = () => {
    window.open(
      "https://farcaster.xyz/miniapps/WSqcbI1uxFJo/creator-score-mini-app",
      "_blank",
    );
  };

  const handleContinueBrowsing = () => {
    // Just close the modal, keeping user on current page
    onOpenChange(false);
  };

  // Handle focus management for mobile drawer
  React.useEffect(() => {
    if (!isDesktop) {
      if (open) {
        // Store the previously focused element
        previouslyFocusedElement.current =
          document.activeElement as HTMLElement;

        // Move focus to drawer content
        const timer = setTimeout(() => {
          if (drawerContentRef.current) {
            drawerContentRef.current.focus();
          }
        }, 100); // Small delay to ensure drawer is rendered

        return () => clearTimeout(timer);
      } else {
        // Restore focus when drawer closes
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      }
    }
  }, [open, isDesktop]);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access {feature} in Farcaster</DialogTitle>
            <DialogDescription>
              To view your {feature.toLowerCase()} and access all features,
              please open this app in Farcaster.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleFarcasterClick}
              variant="special"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Farcaster
            </Button>
            <Button
              variant="default"
              onClick={handleContinueBrowsing}
              className="w-full"
            >
              Continue Browsing
            </Button>

            <Button
              variant="default"
              onClick={() => login({ walletChainType: "ethereum-only" })}
              className="w-full"
              disabled={!ready}
            >
              Login with Privy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>Access {feature} in Farcaster</DrawerTitle>
          <DrawerDescription>
            To view your {feature.toLowerCase()} and access all features, please
            open this app in Farcaster.
          </DrawerDescription>
        </DrawerHeader>
        <div
          ref={drawerContentRef}
          className="px-2 pb-4 focus:outline-none"
          tabIndex={-1}
        >
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleFarcasterClick}
              variant="special"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Farcaster
            </Button>
            <Button
              variant="default"
              onClick={handleContinueBrowsing}
              className="w-full"
            >
              Continue Browsing
            </Button>
            <Button
              variant="default"
              onClick={() => login({ walletChainType: "ethereum-only" })}
              className="w-full"
              disabled={!ready}
            >
              Login with Privy
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
