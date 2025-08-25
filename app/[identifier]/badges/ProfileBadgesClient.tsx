"use client";

import { useState } from "react";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BadgeModal } from "@/components/badges/BadgeModal";
import { ButtonFullWidth } from "@/components/ui/button-full-width";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import type { BadgeState } from "@/app/services/badgesService";
import { Medal } from "lucide-react";

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
          <div className="mt-4">
            <ButtonFullWidth
              variant="brand-purple"
              icon={<Medal className="h-4 w-4" />}
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
        talentUUID={talentId || undefined}
        handle={identifier}
      />
    </>
  );
}
