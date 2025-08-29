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
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCountingAnimation } from "@/hooks/useCountingAnimation";
import { useShareData } from "@/hooks/useShareData";
import { X, Download } from "lucide-react";
import { cn, formatNumberWithSuffix } from "@/lib/utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { detectClient } from "@/lib/utils";
import posthog from "posthog-js";
import { ShareContentGenerators, PlatformSharing } from "@/lib/sharing";

interface ShareCreatorScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareCreatorScoreModal({
  open,
  onOpenChange,
}: ShareCreatorScoreModalProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { context } = useMiniKit();
  const {
    creatorScore: realScore,
    totalEarnings: realEarnings,
    loading,
    talentUuid,
    avatarUrl,
    displayName,
    handle,
    formattedFollowers,
  } = useShareData();
  const [downloading, setDownloading] = React.useState(false);
  const [client, setClient] = React.useState<string | null>(null);

  // Detect client on component mount
  React.useEffect(() => {
    const initClient = async () => {
      const detectedClient = await detectClient(context);
      setClient(detectedClient);
    };
    initClient();
  }, [context]);

  // Prepare sharing data using the new sharing system
  const shareContext = React.useMemo(
    () => ({
      talentUUID: talentUuid || "",
      handle: handle || talentUuid || "creator",
      appClient: client,
    }),
    [talentUuid, handle, client],
  );

  const shareContent = React.useMemo(() => {
    return ShareContentGenerators.profile(shareContext, {
      creatorScore: realScore,
      totalFollowers: parseFloat(formattedFollowers.replace(/[K,M]/g, "")),
      totalEarnings: realEarnings,
      displayName,
    });
  }, [shareContext, realScore, formattedFollowers, realEarnings, displayName]);

  // Track modal open
  React.useEffect(() => {
    if (open && !loading) {
      posthog.capture("share_modal_opened", {
        source: "welcome",
        creator_score: realScore,
        total_earnings: realEarnings,
        total_followers: formattedFollowers,
      });
    }
  }, [open, loading, realScore, realEarnings, formattedFollowers]);

  // Counting animations
  const animatedScore = useCountingAnimation({
    targetValue: realScore,
    duration: 2200, // 2.2 seconds
    delay: 0,
    decimals: 0,
    isActive: open && !loading,
  });

  const animatedEarnings = useCountingAnimation({
    targetValue: realEarnings,
    duration: 2200, // 2.2 seconds
    delay: 300, // Start 0.3s after creator score
    decimals: 1,
    isActive: open && !loading,
  });

  const content = (
    <div className="relative overflow-hidden rounded-lg">
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-4 right-4 p-3 rounded-full z-10"
      >
        <X className="h-5 w-5 text-foreground" />
      </button>
      <Image
        src="/images/share/bg-welcome-modal.png"
        alt="Creator Score Share"
        width={675}
        height={1200}
        className="w-full h-auto"
        priority
      />

      {/* Dynamic Content Overlay - positioned relative to actual rendered image (478x849px) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ height: "100%" }}
      >
        {/* Avatar */}
        <div
          className="absolute rounded-full bg-gray-300 overflow-hidden"
          style={{
            left: "23.0%", // 109.87 / 478 * 100
            top: "26.0%", // 220.68 / 849 * 100
            width: "18.0%", // 86.04 / 478 * 100
            height: "10.1%", // 86.04 / 849 * 100
          }}
        >
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt="Profile"
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Name - using text box dimensions for proper alignment */}
        <div
          className="absolute text-black font-extrabold flex items-center"
          style={{
            left: "44.0%", // 210.49 / 478 * 100
            top: "28.6%", // 243.2 / 849 * 100
            width: "49.65%", // (158.25 * 1.5) / 478 * 100 (increased by 50%)
            height: "3.5%", // Increased from 2.5% to 3.5% to accommodate descenders
            fontSize: "clamp(16px, 4.9vw, 23.7px)",
            fontFamily: "var(--font-cy), sans-serif",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            lineHeight: "1.2", // Added line height to help with vertical alignment
          }}
        >
          {displayName}
        </div>

        {/* Total Followers - using text box dimensions for proper alignment */}
        <div
          className="absolute text-[#6C7587] font-semibold flex items-center"
          style={{
            left: "44.0%", // 210.49 / 478 * 100
            top: "31.8%", // 270.22 / 849 * 100
            width: "38.4%", // (122.5 * 1.5) / 478 * 100 (increased by 50%)
            height: "2.5%", // 21.25 / 849 * 100
            fontSize: "clamp(12px, 2.7vw, 12.93px)",
            fontFamily: "var(--font-cy), sans-serif",
          }}
        >
          {formattedFollowers} total followers
        </div>

        {/* Creator Score - using left coordinate, not center */}
        <div
          className="absolute text-black font-extrabold text-center"
          style={{
            left: "35.9%", // 171.73 / 478 * 100 (using the left coordinate directly)
            top: "44.6%", // 378.55 / 849 * 100
            width: "29.7%", // 142.22 / 478 * 100
            height: "5.9%", // 49.78 / 849 * 100
            fontSize: "clamp(32px, 10.5vw, 50.62px)",
            fontFamily: "var(--font-cy), sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {animatedScore}
        </div>

        {/* Total Earnings - using left coordinate, not center */}
        <div
          className="absolute text-black font-extrabold text-center"
          style={{
            left: "35.9%", // 171.73 / 478 * 100 (using the left coordinate directly)
            top: "58.1%", // 493.04 / 849 * 100
            width: "29.7%", // 142.22 / 478 * 100
            height: "5.9%", // 49.78 / 849 * 100
            fontSize: "clamp(28px, 9.3vw, 44.44px)",
            fontFamily: "var(--font-cy), sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {formatNumberWithSuffix(animatedEarnings)}
        </div>

        {/* Share Buttons */}
        <div
          className="absolute pointer-events-auto z-50"
          style={{
            top: "77.4%" /* 656.89 / 849 * 100 - back to original position */,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          {/* Button #1 - Farcaster */}
          <button
            onClick={async () => {
              // Track click before sharing - preserve legacy event
              posthog.capture("share_button_clicked", {
                platform: "farcaster",
                source: "welcome",
                creator_score: realScore,
                total_earnings: realEarnings,
                total_followers: formattedFollowers,
              });

              try {
                await PlatformSharing.shareToFarcaster(
                  shareContent,
                  shareContext,
                );
              } catch (error) {
                console.error("Failed to share to Farcaster:", error);
              }
            }}
            className="bg-white/80 hover:bg-white/90 active:bg-white/70 transition-all duration-200 flex items-center justify-center"
            style={{
              width: "clamp(60px, 18.3vw, 87.56px)",
              height: "clamp(40px, 7.4vh, 63.11px)",
              borderRadius: "12px",
              boxShadow: "0px 0.86px 0.86px 0px rgba(211, 223, 235, 1)",
            }}
          >
            <Image
              src="/logos/farcaster.svg"
              alt="Share on Farcaster"
              width={28.89}
              height={28.89}
              className="w-[28.89px] h-[28.89px]"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)",
              }}
            />
          </button>
          {/* Button #2 - X/Twitter */}
          <button
            onClick={async () => {
              // Track click before sharing - preserve legacy event
              posthog.capture("share_button_clicked", {
                platform: "twitter",
                source: "welcome",
                creator_score: realScore,
                total_earnings: realEarnings,
                total_followers: formattedFollowers,
              });

              try {
                await PlatformSharing.shareToTwitter(
                  shareContent,
                  shareContext,
                );
              } catch (error) {
                console.error("Failed to share to Twitter:", error);
              }
            }}
            className="bg-white/80 hover:bg-white/90 active:bg-white/70 transition-all duration-200 flex items-center justify-center"
            style={{
              width: "clamp(60px, 18.3vw, 87.56px)",
              height: "clamp(40px, 7.4vh, 63.11px)",
              borderRadius: "12px",
              boxShadow: "0px 0.86px 0.86px 0px rgba(211, 223, 235, 1)",
            }}
          >
            <Image
              src="/logos/twitter.svg"
              alt="Share on X"
              width={28.89}
              height={28.89}
              className="w-[28.89px] h-[28.89px]"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)",
              }}
            />
          </button>
          {/* Button #3 - Download */}
          <button
            onClick={async () => {
              // Track click before downloading - preserve legacy event
              posthog.capture("share_button_clicked", {
                platform: "download",
                source: "welcome",
                creator_score: realScore,
                total_earnings: realEarnings,
                total_followers: formattedFollowers,
              });

              try {
                setDownloading(true);
                await PlatformSharing.downloadImage(shareContent, shareContext);
              } catch (error) {
                console.error("Failed to download image:", error);
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="bg-white/80 hover:bg-white/90 active:bg-white/70 transition-all duration-200 flex items-center justify-center"
            style={{
              width: "clamp(60px, 18.3vw, 87.56px)",
              height: "clamp(40px, 7.4vh, 63.11px)",
              borderRadius: "12px",
              boxShadow: "0px 0.86px 0.86px 0px rgba(211, 223, 235, 1)",
            }}
          >
            <Download
              className={cn("w-[28.89px] h-[28.89px]", {
                "animate-spin": downloading,
              })}
              style={{ color: "#313131" }}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const headerContent = (
    <>
      <div className={cn("sr-only")}>
        {isDesktop ? (
          <>
            <DialogTitle>Creator Score Preview</DialogTitle>
            <DialogDescription>
              Preview of your Creator Score card that you can share with others
            </DialogDescription>
          </>
        ) : (
          <>
            <DrawerTitle>Creator Score Preview</DrawerTitle>
            <DrawerDescription>
              Preview of your Creator Score card that you can share with others
            </DrawerDescription>
          </>
        )}
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[480px] p-0" hideCloseButton>
          <DialogHeader className="sr-only">{headerContent}</DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="p-0 max-w-[480px] mx-auto">
        <DrawerHeader className="sr-only">{headerContent}</DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
