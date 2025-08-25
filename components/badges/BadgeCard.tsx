import type { BadgeState } from "@/app/services/badgesService";
import { getBadgeContent } from "@/lib/badge-content";
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
  const isLocked = badge.currentLevel === 0;
  const badgeContent = getBadgeContent(badge.badgeSlug);
  const isStreakBadge = badgeContent?.isStreakBadge || false;
  const [imageError, setImageError] = useState(false);

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

  // Reset image error when badge changes
  useEffect(() => {
    setImageError(false);
  }, [badge.badgeSlug, badge.currentLevel]);

  return (
    <div
      className="flex flex-col items-center cursor-pointer transition-all active:scale-95"
      onClick={() => onBadgeClick(badge)}
    >
      {/* Badge Artwork */}
      <div className="w-28 h-28 relative">
        {imageError ? (
          // Fallback icon when image fails to load
          <div
            className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed ${
              isLocked
                ? "border-muted-foreground/30 text-muted-foreground/30"
                : "border-muted-foreground/50 text-muted-foreground/50"
            }`}
          >
            <Medal className="w-16 h-16" />
          </div>
        ) : (
          <>
            <Image
              src={badge.artworkUrl}
              alt={badge.levelLabel}
              width={128}
              height={128}
              quality={85}
              className={`w-full h-full object-contain ${
                isLocked ? "opacity-80 blur-[0.5px]" : ""
              }`}
              onError={() => setImageError(true)}
              priority={priority}
            />
          </>
        )}
      </div>

      {/* Badge Info */}
      <div className="text-center w-full">
        {/* Primary: Level Label */}
        <Typography size="sm" weight="normal">
          {badge.levelLabel}
        </Typography>

        {/* Progress bar: Only show for non-streak badges, w-28 width */}
        {!isStreakBadge && (
          <div className="w-28 mx-auto bg-muted-foreground/30 rounded-full h-1 mt-1">
            <div
              className={`h-1 rounded-full transition-all ${getBadgeProgressColor(badge.currentLevel, badge.maxLevel)}`}
              style={{
                width: isLocked
                  ? "0%"
                  : badge.isMaxLevel
                    ? "100%"
                    : `${Math.max(badge.progressPct, 1)}%`,
              }}
            />
          </div>
        )}

        {/* Secondary: Subtitle - Different logic for streak vs regular badges */}
        <Typography size="xs" color="muted" className="mt-0.5">
          {isStreakBadge
            ? // Streak badges: Show "Earned X times" or "Locked"
              isLocked
              ? "Locked"
              : `Earned ${badge.timesEarned || 0} times`
            : // Regular badges: Show "Level X", "Max Level", or "Locked"
              isLocked
              ? "Locked"
              : badge.isMaxLevel
                ? "Max Level"
                : `Level ${badge.currentLevel}`}
        </Typography>
      </div>
    </div>
  );
}
