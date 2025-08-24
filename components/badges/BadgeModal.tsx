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
import { Medal } from "lucide-react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";

interface BadgeModalProps {
  badge: BadgeState | null;
  onClose: () => void;
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
export function BadgeModal({ badge, onClose }: BadgeModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [imageError, setImageError] = useState(false);

  // Reset image error when badge changes
  useEffect(() => {
    setImageError(false);
  }, [badge]);

  if (!badge) return null;

  const isLocked = badge.currentLevel === 0;
  const badgeContent = getBadgeContent(badge.badgeSlug);
  const isStreakBadge = badgeContent?.isStreakBadge || false;

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
    return "bg-brand-green";
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

      <div className="flex justify-center">
        <Button onClick={onClose} className="w-full" variant="brand-purple">
          {badge.currentLevel > 0 ? "Share Badge" : "Let's do this!"}
        </Button>
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
    </>
  );
}
