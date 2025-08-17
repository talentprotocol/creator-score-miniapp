import type { BadgeState } from "@/app/services/badgesService";
import { Typography } from "@/components/ui/typography";
import { Medal } from "lucide-react";
import { useState, useEffect } from "react";

interface BadgeCardProps {
  badge: BadgeState;
  onBadgeClick: (badge: BadgeState) => void;
}

/**
 * BADGE CARD COMPONENT
 *
 * Displays an individual badge in the grid with its artwork, title, and value.
 * Handles image loading errors with a graceful fallback to a Lucide icon.
 *
 * Features:
 * - Displays badge artwork (earned/locked states with visual styling)
 * - Shows progress bar for locked badges
 * - Graceful fallback to Medal icon if artwork fails to load
 * - Typography component for consistent text styling
 * - Active scale animation for mobile-first interaction
 */
export function BadgeCard({ badge, onBadgeClick }: BadgeCardProps) {
  const isEarned = badge.state === "earned";
  const [imageError, setImageError] = useState(false);

  // Reset image error when badge changes
  useEffect(() => {
    setImageError(false);
  }, [badge.slug]);

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95"
      onClick={() => onBadgeClick(badge)}
    >
      {/* Badge Artwork */}
      <div className="w-16 h-16 relative">
        {imageError ? (
          // Fallback icon when image fails to load
          <div
            className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed ${
              !isEarned
                ? "border-muted-foreground/30 text-muted-foreground/30"
                : "border-muted-foreground/50 text-muted-foreground/50"
            }`}
          >
            <Medal className="w-8 h-8" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={isEarned ? badge.artwork.earnedUrl : badge.artwork.lockedUrl}
            alt={badge.title}
            className={`w-full h-full object-contain ${
              !isEarned ? "grayscale opacity-60" : ""
            }`}
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Badge Title */}
      <div className="text-center">
        <Typography
          size="sm"
          weight="medium"
          color={isEarned ? "default" : "muted"}
        >
          {badge.title}
        </Typography>
      </div>

      {/* Badge Value/Progress */}
      <div className="text-center w-full">
        <Typography size="xs" color="muted">
          {badge.valueLabel}
        </Typography>

        {/* Progress bar for locked badges */}
        {!isEarned && badge.progressPct > 0 && (
          <div className="w-full bg-muted rounded-full h-1 mt-1">
            <div
              className="bg-muted-foreground h-1 rounded-full transition-all"
              style={{ width: `${Math.min(badge.progressPct, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
