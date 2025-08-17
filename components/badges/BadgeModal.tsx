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
import { Typography } from "@/components/ui/typography";
import { Medal } from "lucide-react";

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
  const [isDesktop, setIsDesktop] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if it's desktop on mount and resize
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    // Check on mount
    checkIsDesktop();

    // Add resize listener
    window.addEventListener("resize", checkIsDesktop);

    // Cleanup
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  // Reset image error when badge changes
  useEffect(() => {
    setImageError(false);
  }, [badge]);

  if (!badge) return null;

  const isEarned = badge.state === "earned";

  const ModalContent = () => (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* Large Badge Artwork */}
        <div className="w-24 h-24 relative">
          {imageError ? (
            // Fallback icon when image fails to load
            <div
              className={`w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed ${
                !isEarned
                  ? "border-muted-foreground/30 text-muted-foreground/30"
                  : "border-muted-foreground/50 text-muted-foreground/50"
              }`}
            >
              <Medal className="w-12 h-12" />
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

        <div className="space-y-1">
          <Typography as="h3" size="lg" weight="bold">
            {badge.title}
          </Typography>
          <Typography size="sm" color="muted">
            {badge.valueLabel}
          </Typography>
        </div>
      </div>

      <Typography size="sm" color="muted">
        {badge.description}
      </Typography>

      {/* Progress bar for locked badges */}
      {!isEarned && badge.progressPct > 0 && (
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-muted-foreground h-2 rounded-full transition-all"
              style={{ width: `${Math.min(badge.progressPct, 100)}%` }}
            />
          </div>
          <Typography size="xs" color="muted">
            {Math.round(badge.progressPct)}% complete
          </Typography>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          onClick={onClose}
          className="w-full"
          variant={isEarned ? "default" : "ghost"}
        >
          {isEarned ? "Share Badge" : "Let's do this!"}
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
              <DialogTitle>Badge Details</DialogTitle>
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
              <DrawerTitle>Badge Details</DrawerTitle>
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
