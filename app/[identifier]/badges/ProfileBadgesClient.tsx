"use client";

import { useState, useEffect, useCallback } from "react";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeModal } from "@/components/badges/BadgeModal";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import type { BadgeState } from "@/app/services/badgesService";
import { Award } from "lucide-react";

interface ProfileBadgesClientProps {
  badges: BadgeState[];
  talentUUID: string;
  handle: string; // Add handle prop for BadgeModal
}

export function ProfileBadgesClient({
  badges,
  talentUUID, // Profile owner's talent UUID
  handle, // Profile owner's handle
}: ProfileBadgesClientProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Use the general user context hook - must be called unconditionally
  const { talentUuid: currentUserTalentId } = useFidToTalentUuid();
  
  // Determine if current user is viewing their own profile
  const isOwnProfile = currentUserTalentId === talentUUID;

  // Prevent state updates on unmounted component
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleBadgeClick = useCallback(
    (badge: BadgeState) => {
      if (isMounted) {
        setSelectedBadge(badge);
      }
    },
    [isMounted],
  );

  const handleCloseModal = useCallback(() => {
    if (isMounted) {
      setSelectedBadge(null);
    }
  }, [isMounted]);

  // Don't render if component is unmounting
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Badge Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((badge) => (
            <BadgeCard
              key={badge.badgeSlug}
              badge={badge}
              onBadgeClick={handleBadgeClick}
              priority={false}
            />
          ))}
        </div>

        {/* Call to action for visitors (only show if not own profile) */}
        {!isOwnProfile && (
          <div className="mt-4">
            <ButtonFullWidth
              variant="brand-purple"
              icon={<Award className="h-4 w-4" />}
              align="left"
              href="/badges"
            >
              Check Your Own Badges
            </ButtonFullWidth>
          </div>
        )}
      </div>

      {/* Badge Modal */}
      <BadgeModal
        badge={selectedBadge}
        onClose={handleCloseModal}
        talentUUID={currentUserTalentId || undefined}
        handle={handle} // Pass the handle (like "jessepollak") instead of UUID
        profileOwnerTalentUUID={talentUUID} // Add profile owner's talentUUID for comparison
      />
    </>
  );
}
