"use client";

import { useState, useCallback } from "react";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeModal } from "@/components/badges/BadgeModal";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { useFidToTalentUuid } from "@/hooks/useUserResolution";
import { useBadges } from "@/hooks/useBadges";
import { LoadingState, ErrorState } from "@/components/badges";
import type { BadgeState } from "@/lib/types/badges";
import { Award } from "lucide-react";

interface ProfileBadgesClientProps {
  identifier: string;
}

export function ProfileBadgesClient({ identifier }: ProfileBadgesClientProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);

  // Get current user's talent UUID for comparison
  const { talentUuid: currentUserTalentId } = useFidToTalentUuid();

  // Fetch badge data for the profile owner
  const { data, loading, error } = useBadges(undefined, identifier);

  // Determine if current user is viewing their own profile
  const isOwnProfile = currentUserTalentId === data?.user?.id;

  const handleBadgeClick = useCallback((badge: BadgeState) => {
    setSelectedBadge(badge);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
  }, []);

  // Show loading state while fetching data
  if (loading) {
    return <LoadingState />;
  }

  // Show error state if fetch failed
  if (error) {
    return <ErrorState error={error} />;
  }

  // Show error if no badge data
  if (!data?.badges) {
    return <ErrorState error="No badges found" />;
  }

  // Show all badges when viewing own profile, only earned badges for others
  const publicBadges = isOwnProfile
    ? data.badges // Show all badges (earned + locked) for own profile
    : data.badges.filter((badge) => badge.currentLevel > 0); // Show only earned for others

  return (
    <>
      <div className="space-y-6">
        {/* Badge Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {publicBadges.map((badge) => (
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
        handle={identifier}
        profileOwnerTalentUUID={data?.user?.id}
      />
    </>
  );
}
