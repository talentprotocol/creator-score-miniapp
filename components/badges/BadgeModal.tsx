import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { BadgeState } from "@/app/services/badgesService";
import { getBadgeContent } from "@/lib/badge-content";
import { formatCompactNumber } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { Medal, Loader2 } from "lucide-react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ShareModal } from "@/components/modals/ShareModal";
import { ShareContentGenerators } from "@/lib/sharing";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { detectClient } from "@/lib/utils";
import { useBadgeVerify } from "@/hooks/useBadgeVerify";
import { Confetti } from "@/components/ui/confetti";

interface BadgeModalProps {
  badge: BadgeState | null;
  onClose: () => void;
  /** User's Talent Protocol UUID for sharing */
  talentUUID?: string;
  /** Public handle/identifier for share URLs */
  handle?: string;
  /** Function to refetch badge data after verification */
  onBadgeRefetch?: () => Promise<void>;
}

/**
 * BADGE MODAL COMPONENT
 *
 * Responsive modal/drawer that displays detailed badge information.
 * Uses Dialog for desktop and Drawer for mobile (following project patterns).
 *
 * Features:
 * - Responsive layout (Dialog on desktop, Drawer on mobile)
 * - Large badge artwork with fallback to Medal icon
 * - Progress bar for locked badges showing completion percentage
 * - Typography component for consistent text styling
 * - Dynamic button text/variant based on badge state
 * - Graceful image error handling with icon fallback
 */
export function BadgeModal({
  badge,
  onClose,
  talentUUID,
  handle,
  onBadgeRefetch,
}: BadgeModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [imageError, setImageError] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [client, setClient] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wasJustUnlocked, setWasJustUnlocked] = useState(false);

  // Get MiniKit context for client detection
  const { context } = useMiniKit();

  // Reset image error when badge changes
  useEffect(() => {
    setImageError(false);
  }, [badge]);

  // Detect client type for sharing
  useEffect(() => {
    detectClient(context).then((detectedClient) => {
      setClient(detectedClient);
    });
  }, [context]);

  // Initialize badge verification hook (always called to follow React hooks rules)
  const badgeVerifyResult = useBadgeVerify(
    talentUUID || "",
    badge || {
      badgeSlug: "",
      title: "",
      currentLevel: 0,
      maxLevel: 1,
      isMaxLevel: false,
      levelLabel: "",
      progressLabel: "",
      progressPct: 0,
      artworkUrl: "",
      description: "",
      categoryName: "",
      sectionId: "",
    },
    onBadgeRefetch,
  );

  const {
    isVerifying,
    cooldownMinutes,
    error: verifyError,
    progressMessage,
    verifyBadge,
    clearError,
  } = badgeVerifyResult;

  // Handle successful verification with celebration
  useEffect(() => {
    if (progressMessage && progressMessage.includes("completed")) {
      // Check if badge was just unlocked by comparing with previous state
      if (badge && badge.currentLevel > 0 && !wasJustUnlocked) {
        setWasJustUnlocked(true);
        setShowConfetti(true);

        // Hide confetti after 3 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }
    }
  }, [progressMessage, badge, wasJustUnlocked]);

  // Reset unlock state when badge changes
  useEffect(() => {
    setWasJustUnlocked(false);
    setShowConfetti(false);
    clearError();
  }, [badge?.badgeSlug, clearError]);

  if (!badge) return null;

  const isLocked = badge.currentLevel === 0;
  const badgeContent = getBadgeContent(badge.badgeSlug);
  const isStreakBadge = badgeContent?.isStreakBadge || false;
  const isOwnProfile = !!talentUUID && !!handle; // User is viewing their own badges

  // Generate motivational message based on progress
  const getMotivationalMessage = () => {
    if (!badgeContent || badge.isMaxLevel) return null;

    const progressPct = badge.progressPct;
    const nextThreshold = badgeContent.levelThresholds[badge.currentLevel];

    if (!nextThreshold) return null;

    // Use progress percentage for motivation messages

    // Almost there (90%+ progress)
    if (progressPct >= 90) {
      const messages = [
        "You're almost there! 🎯",
        "So close! Keep it up! ⚡",
        "Almost unlocked! 🔓",
        "Final stretch! 💪",
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    // Good progress (60%+ progress)
    if (progressPct >= 60) {
      const messages = [
        "Great progress! 🚀",
        "You're doing amazing! ⭐",
        "Keep up the momentum! 🔥",
        "Well on your way! 📈",
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    // Some progress (20%+ progress)
    if (progressPct >= 20) {
      const messages = [
        "Keep going! 💪",
        "Every step counts! 👟",
        "You're making progress! 📊",
        "Stay motivated! ✨",
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    // Just started (< 20% progress)
    const messages = [
      "Just getting started! 🌱",
      "Every journey begins with one step! 🚶",
      "Your potential is unlimited! 🌟",
      "The adventure begins! 🗺️",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Get verification button state
  interface ButtonState {
    showVerify: boolean;
    verifyText: string;
    verifyVariant: "brand-green" | "destructive" | "default";
    verifyDisabled: boolean;
  }

  const getVerifyButtonState = (): ButtonState => {
    if (!isOwnProfile || badge.isMaxLevel) {
      return {
        showVerify: false,
        verifyText: "",
        verifyVariant: "brand-green",
        verifyDisabled: true,
      };
    }

    const isInCooldown = cooldownMinutes !== null && cooldownMinutes > 0;

    if (verifyError) {
      return {
        showVerify: true,
        verifyText: "Verification Failed",
        verifyVariant: "destructive",
        verifyDisabled: false,
      };
    }

    if (isVerifying) {
      return {
        showVerify: true,
        verifyText: "Verifying...",
        verifyVariant: "brand-green",
        verifyDisabled: true,
      };
    }

    if (isInCooldown) {
      return {
        showVerify: true,
        verifyText: `Verify in ${cooldownMinutes}min`,
        verifyVariant: "default",
        verifyDisabled: true,
      };
    }

    // Available for verification
    const verifyText = badge.currentLevel === 0 ? "Verify" : "Verify Next";
    return {
      showVerify: true,
      verifyText,
      verifyVariant: "brand-green",
      verifyDisabled: false,
    };
  };

  const verifyButtonState = getVerifyButtonState();

  // Get progress bar color based on current level
  const getBadgeProgressColor = (currentLevel: number, maxLevel: number) => {
    if (currentLevel === 0) return "bg-muted-foreground/30"; // Locked

    if (maxLevel === 6) {
      // 6-level badges: use full progression
      const level = Math.min(currentLevel, 6);
      return `bg-badge-level-${level}`;
    } else if (maxLevel === 3) {
      // 3-level badges: use levels 2, 3, 6
      const levelMap = [2, 3, 6];
      const mappedLevel = levelMap[currentLevel - 1];
      return `bg-badge-level-${mappedLevel}`;
    }

    // Fallback for other badge types
    return "bg-badge-level-6";
  };

  // Calculate progress text for non-max level badges
  const getProgressText = () => {
    if (badge.isMaxLevel || !badgeContent) {
      return "Max Level";
    }

    // Get the next level threshold
    const nextThreshold = badgeContent.levelThresholds[badge.currentLevel];
    if (!nextThreshold) return "Max Level";

    // Calculate how much is missing
    const currentProgress = badge.progressPct / 100;
    const currentThreshold =
      badge.currentLevel === 0
        ? 0
        : badgeContent.levelThresholds[badge.currentLevel - 1];
    const range = nextThreshold - currentThreshold;
    const currentValue = currentThreshold + currentProgress * range;
    const missing = nextThreshold - currentValue;

    // Format the missing amount and add UOM if available
    const formattedMissing = formatCompactNumber(missing);
    const uom = badgeContent.uom;
    const uomText = uom ? ` ${uom}` : "";

    // Check if next level is the final level
    const nextLevel = badge.currentLevel + 1;
    const isReachingMaxLevel = nextLevel === badge.maxLevel;
    const levelText = isReachingMaxLevel ? "Max Level" : `Level ${nextLevel}`;

    return `${formattedMissing}${uomText} left to reach ${levelText}`;
  };

  // Handle badge sharing
  const handleShareBadge = () => {
    if (!talentUUID || !handle) {
      console.warn("Badge sharing requires talentUUID and handle");
      return;
    }
    setIsShareModalOpen(true);
  };

  // Handle badge verification
  const handleVerifyBadge = async () => {
    if (!verifyButtonState.verifyDisabled) {
      clearError(); // Clear any previous errors
      await verifyBadge();
    }
  };

  // Check if sharing is available (only for earned badges with user context)
  const canShare = badge.currentLevel > 0 && isOwnProfile;

  // Prepare sharing data if available
  let shareContent, shareContext, shareAnalytics;

  if (canShare) {
    shareContext = {
      talentUUID,
      handle,
      appClient: client,
    };

    shareAnalytics = {
      eventPrefix: "badge_share",
      metadata: {
        share_type: "badge",
        badge_slug: badge.badgeSlug,
        badge_level: badge.currentLevel,
        badge_category: badge.categoryName,
        badge_title: badge.title,
        is_earned: badge.currentLevel > 0,
      },
    };

    shareContent = ShareContentGenerators.badge(shareContext, badge);
  }

  const ModalContent = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* Large Badge Artwork */}
        <div className="w-64 h-64 relative">
          {imageError ? (
            // Fallback icon when image fails to load
            <div
              className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed ${
                isLocked
                  ? "border-muted-foreground/30 text-muted-foreground/30"
                  : "border-muted-foreground/50 text-muted-foreground/50"
              }`}
            >
              <Medal className="w-32 h-32" />
            </div>
          ) : (
            <Image
              src={badge.artworkUrl}
              alt={badge.levelLabel}
              width={256}
              height={256}
              quality={85}
              className={`w-full h-full object-contain ${
                isLocked ? "grayscale opacity-60" : ""
              }`}
              onError={() => setImageError(true)}
              priority={true}
            />
          )}
        </div>

        <div className="space-y-1">
          <Typography as="h3" size="lg" weight="bold">
            {badge.levelLabel}
          </Typography>
          <Typography size="sm" color="muted">
            {badge.description}
          </Typography>
        </div>
      </div>

      {/* Progress information (only for non-streak badges) */}
      {!isStreakBadge && (
        <div className="space-y-3">
          {/* Progress bar (always show, 100% for max level) */}
          <div className="space-y-2">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getBadgeProgressColor(badge.currentLevel, badge.maxLevel)}`}
                style={{
                  width: badge.isMaxLevel
                    ? "100%"
                    : `${Math.max(badge.progressPct, 1)}%`,
                }}
              />
            </div>
          </div>

          {/* Progress text */}
          <Typography size="sm" color="muted">
            {getProgressText()}
          </Typography>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Progress or Error Message */}
        {(progressMessage || verifyError) && (
          <div className="text-center">
            <Typography size="sm" color={verifyError ? "destructive" : "muted"}>
              {verifyError || progressMessage}
            </Typography>
          </div>
        )}

        {/* Motivational Message for No Progress */}
        {verifyError && !progressMessage && (
          <div className="text-center">
            <Typography size="sm" color="muted">
              {getMotivationalMessage()}
            </Typography>
          </div>
        )}

        {/* Button Layout */}
        {!isOwnProfile ? (
          // No buttons for viewing other profiles
          <div className="text-center">
            <Typography size="sm" color="muted">
              Badge details for {handle || "user"}
            </Typography>
          </div>
        ) : badge.isMaxLevel ? (
          // Max level: Only show Share
          <div className="flex justify-center">
            <Button
              onClick={handleShareBadge}
              className="w-full"
              variant="brand-purple"
            >
              Share Badge
            </Button>
          </div>
        ) : badge.currentLevel > 0 ? (
          // Earned badge: Show both Share and Verify Next
          <div className="flex gap-2">
            <Button
              onClick={handleShareBadge}
              className="flex-1"
              variant="brand-purple"
            >
              Share Badge
            </Button>
            {verifyButtonState.showVerify && (
              <Button
                onClick={handleVerifyBadge}
                className="flex-1"
                variant={verifyButtonState.verifyVariant}
                disabled={verifyButtonState.verifyDisabled}
              >
                {isVerifying && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {verifyButtonState.verifyText}
              </Button>
            )}
          </div>
        ) : (
          // Locked badge: Only show Verify
          <div className="flex justify-center">
            {verifyButtonState.showVerify && (
              <Button
                onClick={handleVerifyBadge}
                className="w-full"
                variant={verifyButtonState.verifyVariant}
                disabled={verifyButtonState.verifyDisabled}
              >
                {isVerifying && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {verifyButtonState.verifyText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Modal */}
      {isDesktop && (
        <Dialog open={!!badge} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{badge.categoryName}</DialogTitle>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Bottom Sheet */}
      {!isDesktop && (
        <Drawer open={!!badge} onOpenChange={onClose}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{badge.categoryName}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <ModalContent />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Share Modal */}
      {canShare && shareContent && shareContext && shareAnalytics && (
        <ShareModal
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          content={shareContent}
          context={shareContext}
          analytics={shareAnalytics}
        />
      )}

      {/* Confetti Celebration */}
      {showConfetti && (
        <Confetti
          options={{
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          }}
          className="fixed inset-0 z-50 pointer-events-none"
        />
      )}
    </>
  );
}
