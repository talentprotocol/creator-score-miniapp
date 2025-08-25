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
import { useShare } from "@/hooks/useShare";
import { generateAltText, resolveImageUrl } from "@/lib/sharing";
import type {
  ShareContent,
  ShareContext,
  ShareAnalytics,
  ShareModalOptions,
} from "@/lib/sharing";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ShareContent;
  context: ShareContext;
  analytics: ShareAnalytics;
  options?: ShareModalOptions;
}

/**
 * UNIVERSAL SHARE MODAL
 *
 * Responsive modal/drawer component for all sharing scenarios.
 * Uses the consolidated sharing system for consistent behavior across
 * badges, profiles, and other share types.
 *
 * Features:
 * - Responsive layout (Dialog on desktop, Drawer on mobile)
 * - Universal sharing hook integration
 * - Platform-specific sharing (Farcaster, Twitter, clipboard, download)
 * - Consistent analytics tracking
 * - Customizable options per use case
 * - Dynamic alt text generation
 * - Error handling and loading states
 */
export function ShareModal({
  open,
  onOpenChange,
  content,
  context,
  analytics,
  options = {},
}: ShareModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Initialize sharing hook with context and analytics
  const {
    shareToFarcaster,
    shareToTwitter,
    copyLink,
    downloadImage,
    trackModalOpen,
    resetStates,
    copied,
    downloading,
    error,
  } = useShare(context, analytics);

  // Track modal open when it opens
  React.useEffect(() => {
    if (open) {
      trackModalOpen({
        content_type: content.type,
        title: content.title,
      });
    }
  }, [open, trackModalOpen, content.type, content.title]);

  // Reset states when modal closes
  React.useEffect(() => {
    if (!open) {
      resetStates();
    }
  }, [open, resetStates]);

  // Generate dynamic alt text for the share image
  const altText = generateAltText(content.type, {
    badge_title: analytics.metadata.badge_title,
    badge_level: analytics.metadata.badge_level,
  });

  // Resolve relative image URLs to absolute URLs for Next.js Image component
  const resolvedImageUrl = resolveImageUrl(content.imageUrl);

  // Handle platform sharing actions
  const handleFarcasterShare = () => shareToFarcaster(content);
  const handleTwitterShare = () => shareToTwitter(content);
  const handleCopyLink = () => copyLink(content);
  const handleDownload = () => downloadImage(content);

  const modalContent = (
    <div className="space-y-6">
      {/* Share Image Preview */}
      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-muted">
        <Image
          src={resolvedImageUrl}
          alt={altText}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Share Actions Row */}
      <div className="flex justify-between gap-2">
        {/* Farcaster Button */}
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

        {/* Twitter Button */}
        <Button
          onClick={handleTwitterShare}
          variant="default"
          size="icon"
          className="flex-1"
          aria-label="Share on X"
          disabled={options.disableTwitter}
        >
          <Image src="/logos/twitter.svg" alt="X" width={20} height={20} />
        </Button>

        {/* Copy Link Button */}
        <Button
          onClick={handleCopyLink}
          variant="default"
          size="icon"
          className="flex-1"
          aria-label={copied ? "Link copied!" : "Copy link"}
        >
          <Link className="w-5 h-5" />
        </Button>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          variant="default"
          size="icon"
          className="flex-1"
          disabled={
            downloading ||
            options.disableDownload ||
            context.appClient !== "browser"
          }
          aria-label={downloading ? "Downloading..." : "Download image"}
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>

      {/* Custom Actions */}
      {options.customActions && (
        <div className="pt-2 border-t">{options.customActions}</div>
      )}

      {/* Status Messages */}
      {copied && (
        <div className="text-sm text-center text-muted-foreground">
          Link copied to clipboard!
        </div>
      )}

      {downloading && (
        <div className="text-sm text-center text-muted-foreground">
          Downloading image...
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{content.title}</DialogTitle>
            <DialogDescription>{content.description}</DialogDescription>
          </DialogHeader>
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-2 pb-8 mx-2 rounded-t-2xl">
        <DrawerHeader>
          <DrawerTitle>{content.title}</DrawerTitle>
          <DrawerDescription>{content.description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-2">{modalContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
