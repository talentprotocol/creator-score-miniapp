"use client";

import { BadgeCard } from "@/components/badges/BadgeCard";
import { Callout } from "@/components/common/Callout";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import type { BadgeState } from "@/app/services/badgesService";

interface ProfileBadgesClientProps {
  badges: BadgeState[];
  identifier: string;
}

export function ProfileBadgesClient({ badges, identifier }: ProfileBadgesClientProps) {
  const { talentId } = usePrivyAuth({});
  const isOwnProfile = talentId === identifier;

  const handleBadgeClick = (badge: BadgeState) => {
    // Open badge modal - this will be handled by the parent component
    // For now, we'll just log the click
    console.log("Badge clicked:", badge);
  };

  return (
    <div className="space-y-6">
      {/* Badge Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {badges.map((badge) => (
          <BadgeCard
            key={badge.badgeSlug}
            badge={badge}
            onBadgeClick={handleBadgeClick}
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
  );
}
