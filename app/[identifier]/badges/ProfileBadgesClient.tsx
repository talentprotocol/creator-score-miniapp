"use client";

import { useState } from "react";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeModal } from "@/components/badges/BadgeModal";
import { Callout } from "@/components/common/Callout";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import type { BadgeState } from "@/app/services/badgesService";

interface ProfileBadgesClientProps {
  badges: BadgeState[];
  identifier: string;
}

export function ProfileBadgesClient({
  badges,
  identifier,
}: ProfileBadgesClientProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeState | null>(null);
  
  // Safely use the auth hook with error handling
  let talentId: string | null = null;
  let isOwnProfile = false;
 
  try {
    const auth = usePrivyAuth({});
    talentId = auth.talentId;
    isOwnProfile = talentId === identifier;
  } catch (error) {
    console.error("[ProfileBadgesClient] Auth error:", error);
    // Don't throw - just treat as not own profile
    isOwnProfile = false;
  }

  const handleBadgeClick = (badge: BadgeState) => {
    // Open badge modal
    setSelectedBadge(badge);
  };

  const handleCloseModal = () => {
    setSelectedBadge(null);
  };

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
          <Callout
            variant="brand-purple"
            title="Check Your Own Badges"
            description="See what badges you've earned and track your progress."
            href="/badges"
          />
        )}
      </div>

      {/* Badge Modal */}
      <BadgeModal
        badge={selectedBadge}
        onClose={handleCloseModal}
        talentUUID={talentId || undefined}
        handle={identifier}
      />
    </>
  );
}
