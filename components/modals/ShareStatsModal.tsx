"use client";

import * as React from "react";
import Image from "next/image";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { Link, Download } from "lucide-react";

interface ShareStatsModalProps {
  appClient: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentUUID: string;
  handle: string; // Add handle prop for URL and filename
  onShareFarcaster: () => void;
  onShareTwitter: () => void;
}

export function ShareStatsModal({
  appClient,
  open,
  onOpenChange,
  talentUUID,
  handle,
  onShareFarcaster,
  onShareTwitter,
}: ShareStatsModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  // Reset states when modal closes
  React.useEffect(() => {
    if (!open) {
      setCopied(false);
      setDownloading(false);
    }
  }, [open]);

  const handleCopyLink = async () => {
    try {
      // Always use canonical public URL for copying, regardless of environment
      const profileUrl = `https://creatorscore.app/${handle}`;
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://creatorscore.app";
      const response = await fetch(`${baseUrl}/api/share-image/${talentUUID}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${handle}-creator-score.png`; // Updated filename
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      setDownloading(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Share Image Preview */}
      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted">
        <Image
          src={`/api/share-image/${talentUUID}`}
          alt="Share preview"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Share Actions Row */}
      <div className="flex justify-between gap-2">
        <Button
          onClick={onShareFarcaster}
          variant="default"
          size="icon"
          className="flex-1"
          aria-label="Share on Farcaster"
        >
          <Image
            src="/logos/farcaster.svg"
            alt="Farcaster"
            width={20}
            height={20}
          />
        </Button>

        <Button
          onClick={onShareTwitter}
          variant="default"
          size="icon"
          className="flex-1"
          aria-label="Share on X"
          disabled={appClient !== "browser"}
        >
          <Image src="/logos/twitter.svg" alt="X" width={20} height={20} />
        </Button>

        <Button
          onClick={handleCopyLink}
          variant="default"
          size="icon"
          className="flex-1"
          aria-label={copied ? "Link copied!" : "Copy link"}
        >
          <Link className="w-5 h-5" />
        </Button>

        <Button
          onClick={handleDownload}
          variant="default"
          size="icon"
          className="flex-1"
          disabled={downloading || appClient !== "browser"}
          aria-label={downloading ? "Downloading..." : "Download image"}
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Creator Score</DialogTitle>
            <DialogDescription>
              Share your creator stats with the community
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-2 pb-8 mx-2 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>Share Creator Score</DrawerTitle>
          <DrawerDescription>
            Share your creator stats with the community
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-2">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
