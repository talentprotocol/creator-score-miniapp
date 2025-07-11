"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  feature: string;
}

export function FarcasterAccessModal({
  open,
  onOpenChange,
  feature,
}: FarcasterAccessModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const content = (
    <>
      <div className="text-center space-y-4">
        <div className="text-4xl">📱</div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Open in Farcaster</h3>
          <p className="text-sm text-muted-foreground">
            To access {feature} and other features, please open this app within
            Farcaster.
          </p>
        </div>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Farcaster Access Required</DialogTitle>
            <DialogDescription>
              This feature requires accessing the app through Farcaster.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-sm mx-auto w-full p-6 rounded-t-2xl">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Farcaster Access Required</DrawerTitle>
          <DrawerDescription>
            This feature requires accessing the app through Farcaster.
          </DrawerDescription>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
