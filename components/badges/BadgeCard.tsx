import type { BadgeState } from "@/app/services/badgesService";
import { Typography } from "@/components/ui/typography";
import { Medal } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

interface BadgeCardProps {
  badge: BadgeState;
  onBadgeClick: (badge: BadgeState) => void;
  priority?: boolean;
}

/**
 * BADGE CARD COMPONENT
 *
 * Displays an individual badge in the grid with its artwork, title, and progress.
 * Handles image loading errors with a graceful fallback to a Lucide icon.
 *
 * Features:
 * - Displays badge artwork (earned/locked states with visual styling)
 * - Shows lock icon overlay for locked badges
 * - Shows progress bar for locked badges
 * - Graceful fallback to Medal icon if artwork fails to load
 * - Typography component for consistent text styling
 * - Active scale animation for mobile-first interaction
 */
export function BadgeCard({
  badge,
  onBadgeClick,
  priority = false,
}: BadgeCardProps) {
  const isEarned = badge.state === "earned";
  const [imageError, setImageError] = useState(false);

  // Reset image error when badge changes
  useEffect(() => {
    setImageError(false);
  }, [badge.badgeSlug, badge.badgeLevel]);

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95"
      onClick={() => onBadgeClick(badge)}
    >
      {/* Badge Artwork */}
      <div className="w-32 h-32 relative">
        {imageError ? (
          // Fallback icon when image fails to load
          <div
            className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed ${
              !isEarned
                ? "border-muted-foreground/30 text-muted-foreground/30"
                : "border-muted-foreground/50 text-muted-foreground/50"
            }`}
          >
            <Medal className="w-16 h-16" />
          </div>
        ) : (
          <>
            <Image
              src={
                isEarned
                  ? badge.levelArtwork.earnedUrl
                  : badge.levelArtwork.lockedUrl
              }
              alt={badge.title}
              width={128}
              height={128}
              quality={85}
              className={`w-full h-full object-contain ${
                !isEarned ? "opacity-80 blur-[0.5px]" : ""
              }`}
              onError={() => setImageError(true)}
              priority={priority}
            />
            {/* Lock icon overlay for locked badges */}
            {/* {!isEarned && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
            )} */}
          </>
        )}
      </div>

      {/* Badge Title - no progressLabel text */}
      <div className="text-center">
        <Typography size="sm" weight="normal">
          {badge.title}
        </Typography>

        {/* Progress bar for locked badges */}
        {!isEarned && (
          <div className="w-full bg-muted-foreground/30 rounded-full h-1 mt-1">
            <div
              className="bg-brand-green h-1 rounded-full transition-all"
              style={{ width: `${Math.max(badge.progressPct, 1)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
