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

  const handleFarcasterClick = () => {
    window.open(
      "https://warpcast.com/~/composer-action?url=https://creator-score.vercel.app",
      "_blank",
    );
  };

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
            <Button onClick={handleFarcasterClick} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Farcaster
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Continue Browsing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-sm mx-auto w-full p-4 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>Access {feature} in Farcaster</DrawerTitle>
          <DrawerDescription>
            To view your {feature.toLowerCase()} and access all features, please
            open this app in Farcaster.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-2 pb-4">
          <div className="flex flex-col gap-2">
            <Button onClick={handleFarcasterClick} className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Farcaster
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Continue Browsing
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
