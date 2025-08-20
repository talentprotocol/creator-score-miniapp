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
import { usePostHog } from "posthog-js/react";
import { openExternalUrl } from "@/lib/utils";

interface ShareStatsModalProps {
  appClient: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentUUID: string;
  handle: string; // Add handle prop for URL and filename
  onShareFarcaster: () => void;
  onShareTwitter: () => void;
  disableTwitter?: boolean; // New prop to control Twitter button
  imageUrl?: string; // New prop for custom image URL
  title?: string; // Optional custom title
  description?: string; // Optional custom description
}

export function ShareStatsModal({
  appClient,
  open,
  onOpenChange,
  talentUUID,
  handle,
  onShareFarcaster,
  onShareTwitter,
  disableTwitter = false, // Default to false
  imageUrl, // New prop for custom image URL
  title = "Share Your Creator Score", // Default title
  description = "Share your creator stats with your audience.", // Default description
}: ShareStatsModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [copied, setCopied] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const posthog = usePostHog();

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

      // Track copy link success
      posthog?.capture("profile_share_link_copied", {
        talent_uuid: talentUUID,
        handle,
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://creatorscore.app";
      const imageURL = imageUrl
        ? `${baseUrl}${imageUrl}`
        : `${baseUrl}/api/share-image/${talentUUID}`;
      // Track download success
      posthog?.capture("profile_share_image_downloaded", {
        talent_uuid: talentUUID,
        handle,
      });
      if (appClient === "browser") {
        const response = await fetch(imageURL);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${handle}-creator-score.png`; // Updated filename
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        openExternalUrl(imageURL, null, appClient);
      }
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      setDownloading(false);
    }
  };

  // Handle Farcaster share with tracking
  const handleFarcasterShare = () => {
    posthog?.capture("profile_share_farcaster_clicked", {
      talent_uuid: talentUUID,
      handle,
    });
    onShareFarcaster();
  };

  // Handle Twitter share with tracking
  const handleTwitterShare = () => {
    posthog?.capture("profile_share_twitter_clicked", {
      talent_uuid: talentUUID,
      handle,
    });
    onShareTwitter();
  };

  const content = (
    <div className="space-y-6">
      {/* Share Image Preview */}
      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted">
        <Image
          src={imageUrl || `/api/share-image/${talentUUID}`}
          alt="Share preview"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Share Actions Row */}
      <div className="flex justify-between gap-2">
        <Button
          onClick={handleFarcasterShare}
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
          onClick={handleTwitterShare}
          variant="default"
          size="icon"
          className="flex-1"
          aria-label="Share on X"
          disabled={disableTwitter}
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
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-2">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
